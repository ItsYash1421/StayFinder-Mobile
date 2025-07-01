import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

async function testTrendingDestinations() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import the Listing model
    const Listing = (await import('./models/listingModel.js')).default;
    const Booking = (await import('./models/bookingModel.js')).default;

    console.log('\n📊 Testing trending destinations aggregation...');

    // Test the aggregation pipeline
    const trendingDestinations = await Listing.aggregate([
      // Match only live listings (exclude paused)
      { $match: { status: { $ne: 'paused' } } },
      
      // Lookup bookings for each listing
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'listingId',
          as: 'bookings'
        }
      },
      
      // Add booking count field
      {
        $addFields: {
          bookingCount: { $size: '$bookings' }
        }
      },
      
      // Filter out listings with no bookings
      { $match: { bookingCount: { $gt: 0 } } },
      
      // Sort by booking count (descending)
      { $sort: { bookingCount: -1 } },
      
      // Limit to top 5
      { $limit: 5 },
      
      // Project only the fields we need
      {
        $project: {
          _id: 1,
          title: 1,
          location: 1,
          price: 1,
          images: 1,
          category: 1,
          rating: 1,
          views: 1,
          bookingCount: 1
        }
      }
    ]);

    console.log('✅ Trending destinations found:', trendingDestinations.length);
    
    if (trendingDestinations.length > 0) {
      console.log('\n🏆 Top 5 Trending Destinations:');
      trendingDestinations.forEach((dest, index) => {
        console.log(`${index + 1}. ${dest.title}`);
        console.log(`   Location: ${dest.location}`);
        console.log(`   Category: ${dest.category}`);
        console.log(`   Bookings: ${dest.bookingCount}`);
        console.log(`   Rating: ${dest.rating}`);
        console.log(`   Views: ${dest.views}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No trending destinations found with bookings');
      
      // Check if there are any listings at all
      const totalListings = await Listing.countDocuments();
      console.log(`Total listings in database: ${totalListings}`);
      
      // Check if there are any bookings at all
      const totalBookings = await Booking.countDocuments();
      console.log(`Total bookings in database: ${totalBookings}`);
      
      if (totalBookings === 0) {
        console.log('💡 No bookings found. You may need to create some test bookings first.');
      }
    }

  } catch (error) {
    console.error('❌ Error testing trending destinations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testTrendingDestinations(); 