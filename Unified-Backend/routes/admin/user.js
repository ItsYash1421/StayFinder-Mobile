import express from 'express';
import AdminUser from '../../models/admin/User.js';
import AdminListing from '../../models/admin/Listing.js';
import AdminBooking from '../../models/admin/Booking.js';

const router = express.Router();

const mapUser = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  delete obj.password;
  return obj;
};

// Get current admin profile (READ-ONLY)
router.get('/me', async (req, res) => {
  try {
    const admin = await AdminUser.findOne({ role: 'admin' }).lean();
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json({
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      avatar: admin.avatar,
      role: admin.role,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all hosts with their total revenue (READ-ONLY)
router.get('/earnings', async (req, res) => {
  try {
    const users = await AdminUser.find().lean();
    const listings = await AdminListing.find().lean();
    const bookings = await AdminBooking.find().lean();

    // Build a map of hostId to total revenue
    const hostRevenueMap = {};
    listings.forEach(listing => {
      const listingBookings = bookings.filter(
        b => (String(b.listingId) === String(listing._id) || String(b.propertyId) === String(listing._id)) && 
        (b.status === 'confirmed' || b.status === 'approved')
      );
      const revenue = listingBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      if (listing.hostId) {
        const hostId = String(listing.hostId);
        hostRevenueMap[hostId] = (hostRevenueMap[hostId] || 0) + revenue;
      }
    });

    // Attach revenue to each user
    const hostsWithRevenue = users.map(user => ({
      ...user,
      id: user._id.toString(),
      revenue: hostRevenueMap[user._id.toString()] || 0,
      _id: undefined,
      __v: undefined,
      password: undefined
    }));

    res.json(hostsWithRevenue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Earnings summary for all hosts (READ-ONLY)
router.get('/earnings/summary', async (req, res) => {
  try {
    const bookings = await AdminBooking.find().lean();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // This month - include all bookings in current month (including future ones)
    const startOfThisMonth = new Date(currentYear, currentMonth, 1);
    const startOfNextMonth = new Date(currentYear, currentMonth + 1, 1);

    // Last month
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const startOfThisMonthForLast = new Date(currentYear, currentMonth, 1);

    // Include all confirmed/approved bookings
    const isValid = b =>
      (b.status === 'confirmed' || b.status === 'approved') &&
      b.totalPrice;

    // This month - include all bookings in current month
    const thisMonth = bookings
      .filter(
        b =>
          isValid(b) &&
          new Date(b.startDate || b.checkIn) >= startOfThisMonth &&
          new Date(b.startDate || b.checkIn) < startOfNextMonth
      )
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // Last month - include all bookings in last month
    const lastMonth = bookings
      .filter(
        b =>
          isValid(b) &&
          new Date(b.startDate || b.checkIn) >= startOfLastMonth &&
          new Date(b.startDate || b.checkIn) < startOfThisMonthForLast
      )
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // Total earnings - include all valid bookings
    const totalEarnings = bookings
      .filter(isValid)
      .reduce((sum, b) => sum + b.totalPrice, 0);

    res.json({ thisMonth, lastMonth, totalEarnings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly earnings for all hosts (including current month) (READ-ONLY)
router.get('/earnings/monthly', async (req, res) => {
  try {
    const bookings = await AdminBooking.find().lean();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Include all confirmed/approved bookings
    const validBookings = bookings.filter(b =>
      (b.status === 'confirmed' || b.status === 'approved') &&
      b.totalPrice
    );

    // Group by month for the current year (including current month)
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(currentYear, i, 1);
      const end = new Date(currentYear, i + 1, 1);
      const earnings = validBookings
        .filter(b =>
          new Date(b.startDate || b.checkIn) >= start &&
          new Date(b.startDate || b.checkIn) < end
        )
        .reduce((sum, b) => sum + b.totalPrice, 0);
      return { month: i, earnings };
    });

    res.json(monthly);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user settings (READ-ONLY)
router.get('/settings', async (req, res) => {
  try {
    // For demo, return default settings for the first admin user
    const admin = await AdminUser.findOne({ role: 'admin' }).lean();
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    
    // Return default settings (in a real app, these would be stored in the database)
    res.json({
      notifications: {
        bookingConfirmations: true,
        paymentUpdates: true,
        marketingEmails: false,
        smsNotifications: true,
        pushNotifications: true,
        weeklyReports: true,
      },
      privacy: {
        profileVisibility: true,
        showEarnings: false,
        allowReviews: true,
        shareAnalytics: false,
      },
      appearance: {
        darkMode: false,
        language: 'en',
        timezone: 'America/New_York',
        currency: 'USD',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (READ-ONLY)
router.get('/', async (req, res) => {
  try {
    const users = await AdminUser.find().lean();
    res.json(users.map(u => ({ ...u, id: u._id.toString(), _id: undefined, __v: undefined, password: undefined })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single user (READ-ONLY)
router.get('/:id', async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    const { password, ...rest } = user;
    res.json({ ...rest, id: rest._id.toString(), _id: undefined, __v: undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Note: POST, PUT, DELETE operations removed - admin is read-only for users
// Users should be managed through the app interface

export default router; 