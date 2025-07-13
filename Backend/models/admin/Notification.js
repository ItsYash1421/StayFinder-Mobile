import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., booking, payment, review, system
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  priority: { type: String, default: 'medium' }, // high, medium, low
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('AdminNotification', notificationSchema, 'notifications'); 