import express from 'express';
import AdminBooking from '../../models/admin/Booking.js';
import NotificationService from '../../services/admin/notificationService.js';

const router = express.Router();

const mapBooking = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

// Get bookings summary for admin download (READ-ONLY)
router.get('/summary', async (req, res) => {
  try {
    const bookings = await AdminBooking.find().sort({ createdAt: -1 }).lean();
    const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'approved');
    const pending = bookings.filter(b => b.status === 'pending');
    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    res.json({
      confirmedBookings: confirmed.length,
      pendingBookings: pending.length,
      totalRevenue,
      bookings: bookings.map(b => ({
        id: b._id,
        status: b.status,
        totalPrice: b.totalPrice,
        startDate: b.startDate,
        endDate: b.endDate,
        createdAt: b.createdAt,
        userId: b.userId,
        listingId: b.listingId,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all bookings (READ-ONLY)
router.get('/', async (req, res) => {
  try {
    const bookings = await AdminBooking.find().populate('userId').sort({ createdAt: -1 }).lean();
    // Map DB fields to frontend Booking type
    const mapped = bookings.map(b => ({
      id: b._id.toString(),
      guestName: b.userId?.name || b.guestName || `Guest ${b.userId?._id?.toString().slice(-4) || 'Unknown'}`,
      guestId: b.userId?._id?.toString() || '',
      guestAvatar: b.userId?.profileImage || b.userId?.avatar || b.guestAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.guestName || 'Guest')}`,
      propertyTitle: b.listing?.title || b.propertyTitle || 'Property',
      checkIn: b.startDate ? new Date(b.startDate).toISOString().slice(0, 10) : (b.checkIn ? new Date(b.checkIn).toISOString().slice(0, 10) : ''),
      checkOut: b.endDate ? new Date(b.endDate).toISOString().slice(0, 10) : (b.checkOut ? new Date(b.checkOut).toISOString().slice(0, 10) : ''),
      amountPaid: b.totalPrice || b.amountPaid || 0,
      status: b.status === 'approved' ? 'confirmed' : (b.status || 'pending'),
      bookingDate: b.createdAt ? new Date(b.createdAt).toISOString().slice(0, 10) : '',
      adults: b.adults || 0,
      children: b.children || 0,
      infants: b.infants || 0,
      specialRequests: b.specialRequests || '',
      propertyLocation: b.listing?.location || '',
      propertyPrice: b.listing?.price || b.propertyPrice || 0,
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single booking (READ-ONLY)
router.get('/:id', async (req, res) => {
  try {
    const booking = await AdminBooking.findById(req.params.id).lean();
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json({ ...booking, id: booking._id.toString(), _id: undefined, __v: undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Note: POST, PUT, DELETE operations removed - admin is read-only for bookings
// Bookings should be managed through the app interface

export default router; 