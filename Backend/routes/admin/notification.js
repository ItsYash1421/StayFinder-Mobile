import express from 'express';
import AdminNotification from '../../models/admin/Notification.js';
import NotificationService from '../../services/admin/notificationService.js';

const router = express.Router();

// Get all notifications (latest first) (READ-ONLY)
router.get('/', async (req, res) => {
  try {
    const notifications = await AdminNotification.find().sort({ timestamp: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread count (READ-ONLY)
router.get('/unread-count', async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await AdminNotification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    await AdminNotification.updateMany(
      { isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await AdminNotification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 