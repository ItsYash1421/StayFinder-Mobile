import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  pricePerNight: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'live', 'paused'], default: 'draft' },
  thumbnail: { type: String },
  bedrooms: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  rating: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  description: { type: String },
  amenities: [{ type: String }],
  images: [{ type: String }],
  owner: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'listings' });

export default mongoose.model('Property', propertySchema); 