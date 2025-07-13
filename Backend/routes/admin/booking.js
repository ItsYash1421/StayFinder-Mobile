import express from 'express';
import AdminBooking from '../../models/admin/Booking.js';
import AdminListing from '../../models/admin/Listing.js';
import AdminUser from '../../models/admin/User.js';
import NotificationService from '../../services/admin/notificationService.js';

const router = express.Router();

// Get bookings summary for admin download (READ-ONLY)
router.get('/download', async (req, res) => {
  try {
    const bookings = await AdminBooking.find().sort({ createdAt: -1 }).lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all bookings for admin (mobile app endpoint)
router.get('/', async (req, res) => {
  try {
    const bookings = await AdminBooking.find()
      .populate('userId', 'name email')
      .populate('hostId', 'name email')
      .populate('listingId', 'title location price')
      .sort({ createdAt: -1 })
      .lean();

    // Transform bookings for mobile app
    const transformedBookings = bookings.map(booking => ({
      _id: booking._id,
      status: booking.status,
      totalPrice: booking.totalPrice,
      guests: booking.guests,
      checkIn: booking.checkIn || booking.startDate,
      checkOut: booking.checkOut || booking.endDate,
      createdAt: booking.createdAt,
      guestName: booking.userId?.name || 'Unknown Guest',
      guestEmail: booking.userId?.email,
      hostName: booking.hostId?.name || 'Unknown Host',
      hostEmail: booking.hostId?.email,
      propertyTitle: booking.listingId?.title || 'Unknown Property',
      propertyLocation: booking.listingId?.location,
      propertyPrice: booking.listingId?.price,
      userId: booking.userId?._id,
      hostId: booking.hostId?._id,
      listingId: booking.listingId?._id,
    }));

    res.json({
      success: true,
      bookings: transformedBookings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get booking details by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await AdminBooking.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('hostId', 'name email phone')
      .populate('listingId', 'title location price images')
      .lean();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      ...booking,
      guestName: booking.userId?.name,
      guestEmail: booking.userId?.email,
      guestPhone: booking.userId?.phone,
      hostName: booking.hostId?.name,
      hostEmail: booking.hostId?.email,
      hostPhone: booking.hostId?.phone,
      propertyTitle: booking.listingId?.title,
      propertyLocation: booking.listingId?.location,
      propertyPrice: booking.listingId?.price,
      propertyImages: booking.listingId?.images,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve booking (mobile app endpoint)
router.put('/:bookingId/approve', async (req, res) => {
  try {
    const booking = await AdminBooking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'confirmed' },
      { new: true }
    ).populate('userId hostId listingId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Send notification to guest
    await NotificationService.createNotification({
      userId: booking.userId._id,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: `Your booking for "${booking.listingId?.title}" has been confirmed by admin.`,
      data: { bookingId: booking._id }
    });

    // Send notification to host
    await NotificationService.createNotification({
      userId: booking.hostId._id,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: `A booking for "${booking.listingId?.title}" has been confirmed by admin.`,
      data: { bookingId: booking._id }
    });

    res.json({
      success: true,
      message: 'Booking approved successfully',
      booking: {
        _id: booking._id,
        status: booking.status,
        guestName: booking.userId?.name,
        propertyTitle: booking.listingId?.title
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject booking (mobile app endpoint)
router.put('/:bookingId/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await AdminBooking.findByIdAndUpdate(
      req.params.bookingId,
      { 
        status: 'rejected',
        rejectionReason: reason || 'Booking rejected by admin'
      },
      { new: true }
    ).populate('userId hostId listingId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Send notification to guest
    await NotificationService.createNotification({
      userId: booking.userId._id,
      type: 'booking_rejected',
      title: 'Booking Rejected',
      message: `Your booking for "${booking.listingId?.title}" has been rejected. Reason: ${booking.rejectionReason}`,
      data: { bookingId: booking._id, reason: booking.rejectionReason }
    });

    // Send notification to host
    await NotificationService.createNotification({
      userId: booking.hostId._id,
      type: 'booking_rejected',
      title: 'Booking Rejected',
      message: `A booking for "${booking.listingId?.title}" has been rejected by admin.`,
      data: { bookingId: booking._id }
    });

    res.json({
      success: true,
      message: 'Booking rejected successfully',
      booking: {
        _id: booking._id,
        status: booking.status,
        rejectionReason: booking.rejectionReason,
        guestName: booking.userId?.name,
        propertyTitle: booking.listingId?.title
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel booking (mobile app endpoint)
router.put('/:bookingId/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await AdminBooking.findByIdAndUpdate(
      req.params.bookingId,
      { 
        status: 'cancelled',
        cancellationReason: reason || 'Booking cancelled by admin'
      },
      { new: true }
    ).populate('userId hostId listingId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Send notification to guest
    await NotificationService.createNotification({
      userId: booking.userId._id,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking for "${booking.listingId?.title}" has been cancelled by admin. Reason: ${booking.cancellationReason}`,
      data: { bookingId: booking._id, reason: booking.cancellationReason }
    });

    // Send notification to host
    await NotificationService.createNotification({
      userId: booking.hostId._id,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `A booking for "${booking.listingId?.title}" has been cancelled by admin.`,
      data: { bookingId: booking._id }
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        _id: booking._id,
        status: booking.status,
        cancellationReason: booking.cancellationReason,
        guestName: booking.userId?.name,
        propertyTitle: booking.listingId?.title
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get booking statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const bookings = await AdminBooking.find().lean();
    
    const stats = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed' || b.status === 'approved').length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookings
        .filter(b => b.status === 'confirmed' || b.status === 'approved')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      averageBookingValue: bookings.length > 0 ? 
        bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0) / bookings.length : 0
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bookings by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const bookings = await AdminBooking.find({ status })
      .populate('userId', 'name email')
      .populate('hostId', 'name email')
      .populate('listingId', 'title location price')
      .sort({ createdAt: -1 })
      .lean();

    const transformedBookings = bookings.map(booking => ({
      _id: booking._id,
      status: booking.status,
      totalPrice: booking.totalPrice,
      guests: booking.guests,
      checkIn: booking.checkIn || booking.startDate,
      checkOut: booking.checkOut || booking.endDate,
      createdAt: booking.createdAt,
      guestName: booking.userId?.name || 'Unknown Guest',
      hostName: booking.hostId?.name || 'Unknown Host',
      propertyTitle: booking.listingId?.title || 'Unknown Property',
    }));

    res.json({
      success: true,
      bookings: transformedBookings,
      count: transformedBookings.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Note: POST, PUT, DELETE operations removed - admin is read-only for bookings

export default router; 