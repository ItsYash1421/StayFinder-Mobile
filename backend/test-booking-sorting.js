import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Listing from './models/listingModel.js';

dotenv.config();

console.log('Loaded MONGO_URI:', process.env.MONGO_URI); // Debug line

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Import the Booking model
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

const testBookingSorting = async () => {
  try {
    console.log('🧪 Testing booking sorting...\n');

    // Get all bookings for a specific user (updated user ID)
    const userId = '68608a294a6a8fa1c17f2f2e';
    
    console.log(`📋 Fetching bookings for user: ${userId}`);
    
    // Test the sorting that's used in the API
    const bookings = await Booking.find({ guestId: userId })
      .populate('listingId', 'title location images')
      .sort({ createdAt: -1 }) // Newest first (descending order)
      .limit(10);

    console.log(`📊 Found ${bookings.length} bookings\n`);

    if (bookings.length === 0) {
      console.log('❌ No bookings found for this user');
      console.log('💡 Try creating some test bookings first');
      return;
    }

    console.log('📅 Bookings sorted by creation date (newest first):\n');
    
    bookings.forEach((booking, index) => {
      const listing = booking.listingId;
      const createdAt = new Date(booking.createdAt).toLocaleString();
      const status = booking.status;
      
      console.log(`${index + 1}. ${listing?.title || 'Unknown Listing'}`);
      console.log(`   📍 ${listing?.location || 'Unknown Location'}`);
      console.log(`   📅 Created: ${createdAt}`);
      console.log(`   🏷️  Status: ${status}`);
      console.log(`   💰 Price: $${booking.totalPrice}`);
      console.log(`   👥 Guests: ${booking.guests}`);
      console.log(`   📅 Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`);
      console.log(`   📅 Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`);
      console.log('');
    });

    // Verify sorting is correct
    console.log('🔍 Verifying sorting order...');
    let isCorrectlySorted = true;
    
    for (let i = 0; i < bookings.length - 1; i++) {
      const current = new Date(bookings[i].createdAt);
      const next = new Date(bookings[i + 1].createdAt);
      
      if (current < next) {
        isCorrectlySorted = false;
        console.log(`❌ Sorting error at position ${i + 1}: ${current} should come after ${next}`);
      }
    }
    
    if (isCorrectlySorted) {
      console.log('✅ Bookings are correctly sorted (newest first)');
    } else {
      console.log('❌ Bookings are not correctly sorted');
    }

    // Test the reverse sorting (oldest first)
    console.log('\n🔄 Testing reverse sorting (oldest first)...\n');
    
    const bookingsOldestFirst = await Booking.find({ guestId: userId })
      .populate('listingId', 'title location images')
      .sort({ createdAt: 1 }) // Oldest first (ascending order)
      .limit(5);

    console.log('📅 Bookings sorted by creation date (oldest first):\n');
    
    bookingsOldestFirst.forEach((booking, index) => {
      const listing = booking.listingId;
      const createdAt = new Date(booking.createdAt).toLocaleString();
      
      console.log(`${index + 1}. ${listing?.title || 'Unknown Listing'}`);
      console.log(`   📅 Created: ${createdAt}`);
      console.log(`   🏷️  Status: ${booking.status}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error testing booking sorting:', error);
  }
};

const runTest = async () => {
  await connectDB();
  await testBookingSorting();
  await mongoose.disconnect();
  console.log('\n✅ Test completed');
};

runTest(); 