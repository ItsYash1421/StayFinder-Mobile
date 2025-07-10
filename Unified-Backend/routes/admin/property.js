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
router.get('/summary', async (req, res) => {
  try {
    const properties = await AdminListing.find().lean();
    const total = properties.length;
    const live = properties.filter(p => p.status === 'live').length;
    res.json({
      totalProperties: total,
      liveProperties: live,
      percentActive: total ? (live / total) * 100 : 0,
      properties: properties.map(p => ({
        id: p._id,
        title: p.title,
        status: p.status,
        price: p.price,
        location: p.location,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all properties with calculated totalBookings
router.get('/', async (req, res) => {
  try {
    const properties = await AdminListing.find().lean();
    
    // Calculate totalBookings for each property using both propertyId and listingId
    const propertiesWithBookings = await Promise.all(
      properties.map(async (property) => {
        const bookingCount = await AdminBooking.countDocuments({ 
          $or: [
            { propertyId: property._id },
            { listingId: property._id }
          ]
        });
        return {
          ...property,
          id: property._id.toString(),
          _id: undefined,
          __v: undefined,
          totalBookings: bookingCount,
          pricePerNight: property.price,
          thumbnail: property.images && property.images.length > 0 ? property.images[0] : ''
        };
      })
    );
    
    res.json(propertiesWithBookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get top performing properties based on booking count
router.get('/top', async (req, res) => {
  try {
    const listings = await AdminListing.find({ status: 'live' }).lean();

    // Calculate real booking counts for each listing
    const listingsWithCounts = await Promise.all(
      listings.map(async (listing) => {
        const bookingCount = await AdminBooking.countDocuments({ 
          $or: [
            { propertyId: listing._id },
            { listingId: listing._id }
          ]
        });
        
        return {
          ...listing,
          id: listing._id.toString(),
          _id: undefined,
          __v: undefined,
          totalBookings: bookingCount,
          pricePerNight: listing.price,
          thumbnail: listing.images && listing.images.length > 0 ? listing.images[0] : ''
        };
      })
    );

    // Sort by booking count (descending) and take top 5
    const topListings = listingsWithCounts
      .sort((a, b) => b.totalBookings - a.totalBookings)
      .slice(0, 5);

    res.json(topListings);
  } catch (err) {
    console.error('Error in /top route:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get a single property
router.get('/:id', async (req, res) => {
  try {
    const property = await AdminListing.findById(req.params.id).lean();
    if (!property) return res.status(404).json({ error: 'Not found' });
    
    // Increment view count (only if not a preview request)
    if (!req.query.preview) {
      await AdminListing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    }
    
    res.json({ 
      ...property, 
      id: property._id.toString(), 
      _id: undefined, 
      __v: undefined,
      pricePerNight: property.price,
      thumbnail: property.images && property.images.length > 0 ? property.images[0] : ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a property
router.post('/', async (req, res) => {
  try {
    const property = new AdminListing(req.body);
    await property.save();
    
    // Create notification for new property
    await NotificationService.notifyNewProperty({
      title: property.title || 'New Property'
    });
    
    res.status(201).json(mapProperty(property));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a property (full update)
router.put('/:id', async (req, res) => {
  try {
    const property = await AdminListing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!property) return res.status(404).json({ error: 'Not found' });
    
    // Create notification for property update
    await NotificationService.notifyPropertyUpdate({
      title: property.title || 'Property'
    });
    
    res.json(mapProperty(property));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update property status (partial update)
router.patch('/:id/status', async (req, res) => {
  try {
    const property = await AdminListing.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!property) return res.status(404).json({ error: 'Not found' });
    res.json(mapProperty(property));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Increment property views
router.post('/:id/view', async (req, res) => {
  try {
    const property = await AdminListing.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!property) return res.status(404).json({ error: 'Not found' });
    res.json({ views: property.views });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a property
router.delete('/:id', async (req, res) => {
  try {
    const property = await AdminListing.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 