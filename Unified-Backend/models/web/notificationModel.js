import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true }, // booking, payment, review, system
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  priority: { type: String, default: "medium" }, // high, medium, low
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID of related item (booking, property, etc.)
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);
