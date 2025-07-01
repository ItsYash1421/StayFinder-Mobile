import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const userId = '68608a294a6a8fa1c17f2f2e';
const listingId = '685254a2191dea6103996168';

const Booking = mongoose.model('Booking', new mongoose.Schema({
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled', 'paused'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestBookings = async () => {
  try {
    // Remove previous test bookings for this user/listing
    await Booking.deleteMany({ guestId: userId, listingId });

    const now = new Date();
    const bookings = [
      {
        guestId: userId,
        listingId,
        checkIn: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        checkOut: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
        guests: 2,
        totalPrice: 360,
        status: 'approved',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2)
      },
      {
        guestId: userId,
        listingId,
        checkIn: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4),
        checkOut: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6),
        guests: 3,
        totalPrice: 540,
        status: 'pending',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
        updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1)
      },
      {
        guestId: userId,
        listingId,
        checkIn: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
        checkOut: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 9),
        guests: 1,
        totalPrice: 180,
        status: 'cancelled',
        createdAt: now, // now
        updatedAt: now
      }
    ];

    await Booking.insertMany(bookings);
    console.log('✅ Test bookings created!');
  } catch (error) {
    console.error('❌ Error creating test bookings:', error);
  }
};

const run = async () => {
  await connectDB();
  await createTestBookings();
  await mongoose.disconnect();
  console.log('✅ Done');
};

run(); 