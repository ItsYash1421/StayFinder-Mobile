import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  // Core booking information
  guestName: { 
    type: String, 
    required: true,
    trim: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AppUser', 
    required: true 
  },
  hostId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AppUser', 
    required: true 
  },
  
  // Property information (primary reference to Listing)
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AppListing",
    required: true
  },
  propertyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AppListing', // Changed to AppListing since properties are named as listings
  },
  propertyTitle: { 
    type: String, 
    required: true,
    trim: true
  },
  propertyLocation: {
    type: String,
    default: "",
    trim: true
  },
  propertyPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Dates (supports both naming conventions)
  checkIn: { 
    type: Date, 
    required: true 
  },
  checkOut: { 
    type: Date, 
    required: true 
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Guest information
  guestAvatar: { 
    type: String,
    default: ""
  },
  adults: {
    type: Number,
    default: 1,
    min: 1,
    max: 20
  },
  children: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  infants: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // Financial information
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // Booking details
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'rejected', 'approved'], 
    default: 'pending' 
  },
  specialRequests: {
    type: String,
    default: "",
    trim: true,
    maxlength: 1000
  },
  
  // Media and additional data
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v) || v === "";
      },
      message: 'Images must be valid URLs'
    }
  }],
  listing: { 
    type: Object,
    required: true
  },
  
  // Timestamps
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total guests
bookingSchema.virtual('totalGuests').get(function() {
  return this.adults + this.children + this.infants;
});

// Virtual for booking duration in days
bookingSchema.virtual('duration').get(function() {
  const checkIn = this.checkIn || this.startDate;
  const checkOut = this.checkOut || this.endDate;
  if (checkIn && checkOut) {
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for remaining balance
bookingSchema.virtual('remainingBalance').get(function() {
  return this.totalPrice - this.amountPaid;
});

// Pre-save middleware to sync dates and references
bookingSchema.pre('save', function(next) {
  // Sync checkIn/checkOut with startDate/endDate if one set is missing
  if (this.checkIn && !this.startDate) {
    this.startDate = this.checkIn;
  }
  if (this.checkOut && !this.endDate) {
    this.endDate = this.checkOut;
  }
  if (this.startDate && !this.checkIn) {
    this.checkIn = this.startDate;
  }
  if (this.endDate && !this.checkOut) {
    this.checkOut = this.endDate;
  }
  
  // Sync listingId with propertyId (both reference Listing model)
  if (this.listingId && !this.propertyId) {
    this.propertyId = this.listingId;
  }
  if (this.propertyId && !this.listingId) {
    this.listingId = this.propertyId;
  }
  
  next();
});

// Indexes for better query performance
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ hostId: 1, createdAt: -1 });
bookingSchema.index({ listingId: 1, checkIn: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });

export default mongoose.model('AdminBooking', bookingSchema, 'bookings'); 