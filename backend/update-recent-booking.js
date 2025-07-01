import mongoose from "mongoose";
import Booking from "./models/bookingModel.js";
import Listing from "./models/listingModel.js";
import "dotenv/config";

const updateRecentBooking = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the specific booking that's missing hostId
    const booking = await Booking.findById("68634b9ec141c02b03af6b8d");
    
    if (!booking) {
      console.log('Booking not found');
      return;
    }

    console.log('Found booking:', booking._id);
    console.log('Listing ID:', booking.listingId);
    console.log('Current hostId:', booking.hostId);

    // Get the listing to find the hostId
    const listing = await Listing.findById(booking.listingId);
    if (listing) {
      booking.hostId = listing.hostId;
      await booking.save();
      console.log(`Updated booking ${booking._id} with hostId: ${listing.hostId}`);
    } else {
      console.log(`Listing not found for booking ${booking._id}`);
    }

    console.log('Finished updating booking');
    process.exit(0);
  } catch (error) {
    console.error('Error updating booking:', error);
    process.exit(1);
  }
};

updateRecentBooking(); 