import express from 'express';
import mongoose from 'mongoose';
import AdminListing from '../../models/admin/Listing.js';
import AdminBooking from '../../models/admin/Booking.js';
import NotificationService from '../../services/admin/notificationService.js';

const router = express.Router();

// Helper to map _id to id and ensure all fields
const mapProperty = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

// Get properties summary for admin download
router.get('/download', async (req, res) => {
  try {
    const properties = await AdminListing.find().lean();
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all properties for admin (mobile app endpoint)
router.get('/', async (req, res) => {
  try {
    const properties = await AdminListing.find().lean();
    const bookings = await AdminBooking.find().lean();

    // Transform properties for mobile app
    const transformedProperties = properties.map(property => {
      const propertyBookings = bookings.filter(b => 
        b.listingId?.toString() === property._id.toString() || 
        b.propertyId?.toString() === property._id.toString()
      );
      
      const confirmedBookings = propertyBookings.filter(b => 
        b.status === 'confirmed' || b.status === 'approved'
      );
      
      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const bookingCount = propertyBookings.length;

      return {
        _id: property._id,
        title: property.title,
        location: property.location,
        price: property.price,
        status: property.status,
        category: property.category,
        rating: property.rating,
        views: property.views || 0,
        images: property.images,
        hostId: property.hostId,
        hostName: property.hostName,
        createdAt: property.createdAt,
        totalRevenue,
        bookingCount,
        lastBooking: propertyBookings.length > 0 ? 
          new Date(Math.max(...propertyBookings.map(b => new Date(b.createdAt)))) : null
      };
    });

    res.json({
      success: true,
      properties: transformedProperties
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get live properties summary
router.get('/live', async (req, res) => {
  try {
    const listings = await AdminListing.find({ status: 'live' }).lean();
    const bookingCount = await AdminBooking.countDocuments({
      listingId: { $in: listings.map(l => l._id) }
    });

    res.json({
      totalLive: listings.length,
      totalBookings: bookingCount,
      averageRating: listings.reduce((sum, l) => sum + (l.rating || 0), 0) / listings.length || 0,
      averagePrice: listings.reduce((sum, l) => sum + (l.price || 0), 0) / listings.length || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get property views analytics
router.get('/views', async (req, res) => {
  try {
    const listings = await AdminListing.find().lean();
    
    // Properties with most views
    const topViewedProperties = listings
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10)
      .map(listing => ({
        id: listing._id,
        title: listing.title,
        location: listing.location,
        views: listing.views || 0,
        price: listing.price,
        rating: listing.rating,
        status: listing.status
      }));

    // Views by category
    const viewsByCategory = {};
    listings.forEach(listing => {
      const category = listing.category || 'Other';
      if (!viewsByCategory[category]) {
        viewsByCategory[category] = { totalViews: 0, propertyCount: 0 };
      }
      viewsByCategory[category].totalViews += listing.views || 0;
      viewsByCategory[category].propertyCount += 1;
    });

    // Views by location
    const viewsByLocation = {};
    listings.forEach(listing => {
      const location = listing.location || 'Unknown';
      if (!viewsByLocation[location]) {
        viewsByLocation[location] = { totalViews: 0, propertyCount: 0 };
      }
      viewsByLocation[location].totalViews += listing.views || 0;
      viewsByLocation[location].propertyCount += 1;
    });

    // Average views per property
    const totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);
    const avgViewsPerProperty = listings.length ? totalViews / listings.length : 0;

    // Properties with no views
    const propertiesWithNoViews = listings.filter(listing => !listing.views || listing.views === 0).length;

    res.json({
      totalViews,
      avgViewsPerProperty,
      propertiesWithNoViews,
      topViewedProperties,
      viewsByCategory,
      viewsByLocation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get property details by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await AdminListing.findById(req.params.id).lean();
    if (!property) return res.status(404).json({ error: 'Property not found' });
    
    // Increment view count
    await AdminListing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    
    // Get property bookings
    const bookings = await AdminBooking.find({
      $or: [
        { listingId: property._id },
        { propertyId: property._id }
      ]
    }).lean();

    res.json({
      ...property,
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed' || b.status === 'approved').length,
      totalRevenue: bookings
        .filter(b => b.status === 'confirmed' || b.status === 'approved')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve property (mobile app endpoint)
router.put('/:propertyId/approve', async (req, res) => {
  try {
    const property = await AdminListing.findByIdAndUpdate(
      req.params.propertyId,
      { status: 'live' },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Send notification to host
    await NotificationService.createNotification({
      userId: property.hostId,
      type: 'property_approved',
      title: 'Property Approved',
      message: `Your property "${property.title}" has been approved and is now live.`,
      data: { propertyId: property._id }
    });

    res.json({
      success: true,
      message: 'Property approved successfully',
      property: {
        _id: property._id,
        title: property.title,
        status: property.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject property (mobile app endpoint)
router.put('/:propertyId/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const property = await AdminListing.findByIdAndUpdate(
      req.params.propertyId,
      { 
        status: 'rejected',
        rejectionReason: reason || 'Property does not meet our standards'
      },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Send notification to host
    await NotificationService.createNotification({
      userId: property.hostId,
      type: 'property_rejected',
      title: 'Property Rejected',
      message: `Your property "${property.title}" has been rejected. Reason: ${property.rejectionReason}`,
      data: { propertyId: property._id, reason: property.rejectionReason }
    });

    res.json({
      success: true,
      message: 'Property rejected successfully',
      property: {
        _id: property._id,
        title: property.title,
        status: property.status,
        rejectionReason: property.rejectionReason
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pause property (mobile app endpoint)
router.put('/:propertyId/pause', async (req, res) => {
  try {
    const property = await AdminListing.findByIdAndUpdate(
      req.params.propertyId,
      { status: 'paused' },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Send notification to host
    await NotificationService.createNotification({
      userId: property.hostId,
      type: 'property_paused',
      title: 'Property Paused',
      message: `Your property "${property.title}" has been paused by admin.`,
      data: { propertyId: property._id }
    });

    res.json({
      success: true,
      message: 'Property paused successfully',
      property: {
        _id: property._id,
        title: property.title,
        status: property.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activate property (mobile app endpoint)
router.put('/:propertyId/activate', async (req, res) => {
  try {
    const property = await AdminListing.findByIdAndUpdate(
      req.params.propertyId,
      { status: 'live' },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Send notification to host
    await NotificationService.createNotification({
      userId: property.hostId,
      type: 'property_activated',
      title: 'Property Activated',
      message: `Your property "${property.title}" has been activated and is now live.`,
      data: { propertyId: property._id }
    });

    res.json({
      success: true,
      message: 'Property activated successfully',
      property: {
        _id: property._id,
        title: property.title,
        status: property.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete property (mobile app endpoint)
router.delete('/:propertyId', async (req, res) => {
  try {
    const property = await AdminListing.findByIdAndDelete(req.params.propertyId);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Send notification to host
    await NotificationService.createNotification({
      userId: property.hostId,
      type: 'property_deleted',
      title: 'Property Deleted',
      message: `Your property "${property.title}" has been deleted by admin.`,
      data: { propertyId: property._id }
    });

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 