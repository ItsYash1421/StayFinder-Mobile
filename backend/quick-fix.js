import mongoose from "mongoose";
import Booking from "./models/bookingModel.js";
import Listing from "./models/listingModel.js";
import "dotenv/config";

const quickFix = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // The booking that needs fixing
    const bookingId = "68634b9ec141c02b03af6b8d";
    const listingId = "68633c4ebd0a62be017e8968";

    // Get the listing to find hostId
    const listing = await Listing.findById(listingId);
    if (!listing) {
      console.log('Listing not found');
      return;
    }

    console.log('Listing found:', listing.title);
    console.log('Host ID:', listing.hostId);

    // Update the booking
    const result = await Booking.findByIdAndUpdate(
      bookingId,
      { hostId: listing.hostId },
      { new: true }
    );

    if (result) {
      console.log('Booking updated successfully');
      console.log('New booking data:', {
        id: result._id,
        hostId: result.hostId,
        status: result.status
      });
    } else {
      console.log('Booking not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

quickFix(); 