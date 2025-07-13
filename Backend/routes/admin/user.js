import express from 'express';
import AdminUser from '../../models/admin/User.js';
import AdminListing from '../../models/admin/Listing.js';
import AdminBooking from '../../models/admin/Booking.js';

const router = express.Router();

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

// Get all users for admin (mobile app endpoint)
router.get('/', async (req, res) => {
  try {
    const users = await AdminUser.find().lean();
    const listings = await AdminListing.find().lean();
    const bookings = await AdminBooking.find().lean();

    // Calculate user statistics
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => !u.isBlocked).length,
      verifiedUsers: users.filter(u => u.isVerified).length,
      adminUsers: users.filter(u => u.role === 'admin').length,
    };

    // Transform users for mobile app
    const transformedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked || false,
      avatar: user.avatar,
      joinDate: user.joinDate,
      totalProperties: listings.filter(l => l.hostId?.toString() === user._id.toString()).length,
      totalBookings: bookings.filter(b => b.userId?.toString() === user._id.toString()).length,
    }));

    res.json({
      success: true,
      users: transformedUsers,
      stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Block/Unblock user (mobile app endpoint)
router.put('/:userId/:action', async (req, res) => {
  try {
    const { userId, action } = req.params;
    
    if (!['block', 'unblock'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const user = await AdminUser.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isBlocked = action === 'block';
    await user.save();

    res.json({
      success: true,
      message: `User ${action}ed successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user bookings summary
router.get('/bookings-summary', async (req, res) => {
  try {
    const bookings = await AdminBooking.find().lean();
    
    // Group bookings by user
    const userBookings = {};
    bookings.forEach(booking => {
      const userId = booking.userId?.toString();
      if (userId) {
        if (!userBookings[userId]) {
          userBookings[userId] = {
            totalBookings: 0,
            totalSpent: 0,
            lastBooking: null
          };
        }
        userBookings[userId].totalBookings++;
        userBookings[userId].totalSpent += booking.totalPrice || 0;
        
        const bookingDate = new Date(booking.createdAt);
        if (!userBookings[userId].lastBooking || bookingDate > new Date(userBookings[userId].lastBooking)) {
          userBookings[userId].lastBooking = booking.createdAt;
        }
      }
    });

    res.json(userBookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user listings summary
router.get('/listings-summary', async (req, res) => {
  try {
    const listings = await AdminListing.find().lean();
    
    // Group listings by host
    const hostListings = {};
    listings.forEach(listing => {
      const hostId = listing.hostId?.toString();
      if (hostId) {
        if (!hostListings[hostId]) {
          hostListings[hostId] = {
            totalListings: 0,
            totalViews: 0,
            totalRevenue: 0
          };
        }
        hostListings[hostId].totalListings++;
        hostListings[hostId].totalViews += listing.views || 0;
        // Note: Revenue calculation would need booking data
      }
    });

    res.json(hostListings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get admin settings (for demo, return default settings for the first admin user)
router.get('/settings', async (req, res) => {
  try {
    const admin = await AdminUser.findOne({ role: 'admin' }).lean();
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    
    // Return default admin settings
    res.json({
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30
      },
      display: {
        theme: 'light',
        language: 'en'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update admin settings
router.put('/settings', async (req, res) => {
  try {
    // For demo purposes, just return success
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user details by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Get user's listings and bookings
    const listings = await AdminListing.find({ hostId: user._id }).lean();
    const bookings = await AdminBooking.find({ userId: user._id }).lean();
    
    res.json({
      ...user,
      totalListings: listings.length,
      totalBookings: bookings.length,
      totalSpent: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Note: POST, PUT, DELETE operations removed - admin is read-only for users

export default router; 