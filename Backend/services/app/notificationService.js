import AppNotification from '../../models/app/Notification.js';

class NotificationService {
  // Create notification for a specific user
  static async createNotification(
    userId,
    type,
    title,
    message,
    priority = "medium",
    relatedId = null,
  ) {
    try {
      console.log("Saving notification:", {
        userId,
        type,
        title,
        message,
        priority,
        relatedId,
      }); // Debug log
      const notification = new AppNotification({
        userId,
        type,
        title,
        message,
        priority,
        relatedId,
        timestamp: new Date(),
      });
      await notification.save();
      console.log("Notification saved:", notification); // Debug log
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  // Booking notifications
  static async notifyBookingCreated(booking, guestId, propertyOwnerId) {
    const propertyTitle = booking.listing?.title || "your property";

    // Notify property owner about new booking
    await this.createNotification(
      propertyOwnerId,
      "booking",
      "New Booking Request",
      `A new booking request has been made for "${propertyTitle}"`,
      "high",
      booking._id,
    );

    // Notify guest about booking confirmation
    await this.createNotification(
      guestId,
      "booking",
      "Booking Request Sent",
      `Your booking request for "${propertyTitle}" has been sent successfully`,
      "medium",
      booking._id,
    );
  }

  static async notifyBookingStatusChange(
    booking,
    oldStatus,
    newStatus,
    guestId,
    propertyOwnerId,
  ) {
    const propertyTitle = booking.listing?.title || "your property";
    const statusMessages = {
      confirmed: "Your booking has been confirmed!",
      cancelled: "Your booking has been cancelled",
      pending: "Your booking is pending confirmation",
      approved: "Your booking has been approved!",
      rejected: "Your booking has been rejected",
    };

    // Notify guest
    await this.createNotification(
      guestId,
      "booking",
      "Booking Status Updated",
      statusMessages[newStatus] || `Booking status changed to ${newStatus}`,
      "high",
      booking._id,
    );

    // Notify property owner
    await this.createNotification(
      propertyOwnerId,
      "booking",
      "Booking Status Updated",
      `Booking for "${propertyTitle}" status changed to ${newStatus}`,
      "medium",
      booking._id,
    );
  }

  // Payment notifications
  static async notifyPaymentReceived(
    booking,
    amount,
    guestId,
    propertyOwnerId,
  ) {
    const propertyTitle = booking.listing?.title || "your property";

    // Notify guest about payment
    await this.createNotification(
      guestId,
      "payment",
      "Payment Confirmed",
      `Payment of $${amount} has been confirmed for your booking at "${propertyTitle}"`,
      "high",
      booking._id,
    );

    // Notify property owner about payment
    await this.createNotification(
      propertyOwnerId,
      "payment",
      "Payment Received",
      `You received $${amount} for booking at "${propertyTitle}"`,
      "high",
      booking._id,
    );
  }

  // Review notifications
  static async notifyReviewPosted(review, propertyOwnerId, propertyTitle) {
    await this.createNotification(
      propertyOwnerId,
      "review",
      "New Review Posted",
      `A new ${review.rating}-star review has been posted for "${propertyTitle}"`,
      "medium",
      review._id,
    );
  }

  // Property listing notifications
  static async notifyListingCreated(listing, hostId) {
    await this.createNotification(
      hostId,
      "listing",
      "Property Listed Successfully",
      `Your property "${listing.title}" has been successfully listed`,
      "medium",
      listing._id,
    );
  }

  static async notifyListingStatusChange(listing, oldStatus, newStatus) {
    await this.createNotification(
      listing.hostId,
      "listing",
      "Listing Status Updated",
      `Your property "${listing.title}" status changed from ${oldStatus} to ${newStatus}`,
      "medium",
      listing._id,
    );
  }

  // System notifications
  static async notifySystem(userId, message, priority = "medium") {
    await this.createNotification(
      userId,
      "system",
      "System Update",
      message,
      priority,
    );
  }

  // Welcome notification for new users
  static async notifyWelcome(userId, userName) {
    await this.createNotification(
      userId,
      "system",
      "Welcome to StayFinder!",
      `Welcome ${userName}! Start exploring amazing properties or list your own.`,
      "medium",
    );
  }

  // Get user notifications
  static async getUserNotifications(userId, limit = 50) {
    try {
      return await AppNotification.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error("Error getting user notifications:", error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      return await AppNotification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true },
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      return await AppNotification.updateMany(
        { userId, isRead: false },
        { isRead: true },
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  // Get unread count
  static async getUnreadCount(userId) {
    try {
      return await AppNotification.countDocuments({ userId, isRead: false });
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      return await AppNotification.findOneAndDelete({
        _id: notificationId,
        userId,
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }

  // Get notifications by type
  static async getNotificationsByType(userId, type, limit = 20) {
    try {
      return await AppNotification.find({ userId, type })
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error("Error getting notifications by type:", error);
      return [];
    }
  }
}

export default NotificationService;
