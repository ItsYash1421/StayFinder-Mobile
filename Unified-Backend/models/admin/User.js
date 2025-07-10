import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  role: { type: String, default: 'host' },
  joinDate: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  totalProperties: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('AdminUser', userSchema, 'users'); 