import express from "express";
import NotificationService from "../../services/app/notificationService.js";
import authUser from "../../middlewares/app/authUser.js";

const router = express.Router();

// Get user notifications
router.get("/", authUser, async (req, res) => {
  try {
    const notifications = await NotificationService.getUserNotifications(
      req.user.id,
    );
    res.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch notifications" });
  }
});

// Get unread count
router.get("/unread-count", authUser, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);
    res.json({ success: true, count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get unread count" });
  }
});

// Mark notification as read
router.put("/:id/read", authUser, async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(
      req.params.id,
      req.user.id,
    );
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, error: "Notification not found" });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to mark notification as read" });
  }
});

// Mark all as read
router.put("/mark-all-read", authUser, async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to mark all notifications as read",
      });
  }
});

// Delete notification
router.delete("/:id", authUser, async (req, res) => {
  try {
    const notification = await NotificationService.deleteNotification(
      req.params.id,
      req.user.id,
    );
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, error: "Notification not found" });
    }
    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete notification" });
  }
});

// Get notifications by type
router.get("/type/:type", authUser, async (req, res) => {
  try {
    const notifications = await NotificationService.getNotificationsByType(
      req.user.id,
      req.params.type,
    );
    res.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications by type:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch notifications by type" });
  }
});

export default router;
