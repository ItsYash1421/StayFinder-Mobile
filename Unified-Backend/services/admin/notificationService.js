import Notification from '../../models/admin/Notification.js';

class NotificationService {
  // Create a new notification
  static async createNotification(type, title, message, priority = 'medium') {
    try {
      const notification = new Notification({
        type,
        title,
        message,
        priority,
        timestamp: new Date()
      });
      await notification.save();
      console.log(`Notification created: ${title}`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // New booking notification
  static async notifyNewBooking(booking) {
    await this.createNotification(
      'booking',
      'New Booking Request',
      `New booking request for ${booking.propertyName} from ${booking.guestName}`,
      'high'
    );
  }

  // Booking status change notification
  static async notifyBookingStatusChange(booking, oldStatus, newStatus) {
    await this.createNotification(
      'booking',
      'Booking Status Updated',
      `Booking for ${booking.propertyName} changed from ${oldStatus} to ${newStatus}`,
      'medium'
    );
  }

  // New property notification
  static async notifyNewProperty(property) {
    await this.createNotification(
      'property',
      'New Property Added',
      `New property "${property.title}" has been added to your portfolio`,
      'medium'
    );
  }

  // Property update notification
  static async notifyPropertyUpdate(property) {
    await this.createNotification(
      'property',
      'Property Updated',
      `Property "${property.title}" has been updated`,
      'low'
    );
  }

  // Payment notification
  static async notifyPayment(booking, amount) {
    await this.createNotification(
      'payment',
      'Payment Received',
      `Payment of $${amount} received for booking at ${booking.propertyName}`,
      'high'
    );
  }

  // System notification
  static async notifySystem(message, priority = 'medium') {
    await this.createNotification(
      'system',
      'System Update',
      message,
      priority
    );
  }

  // Get unread count
  static async getUnreadCount() {
    try {
      return await Notification.countDocuments({ isRead: false });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark all as read
  static async markAllAsRead() {
    try {
      await Notification.updateMany({ isRead: false }, { isRead: true });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }
}

export default NotificationService; 