import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true }, // e.g., "Malibu, California"
    latitude: { type: Number },
    longitude: { type: Number },
    price: { type: Number, required: true }, // per night
    images: [String], // array of image URLs
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Beach",
        "Mountain",
        "City",
        "Countryside",
        "Luxury",
        "Budget",
        "Historical",
        "Adventure",
      ],
    },
    guests: { type: Number, required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    status: {
      type: String,
      enum: ["live", "draft", "paused"],
      default: "live",
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },

    amenities: {
      wifi: { type: Boolean, default: false },
      kitchen: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      tv: { type: Boolean, default: false },
      fireplace: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
      heating: { type: Boolean, default: false },
      bbq: { type: Boolean, default: false },
    },

    houseRules: {
      smoking: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
      parties: { type: Boolean, default: false },
      checkInTime: { type: String, default: "15:00" },
      checkOutTime: { type: String, default: "11:00" },
    },
  },
  { timestamps: true }
);

export default mongoose.model('AdminListing', listingSchema, 'listings'); 