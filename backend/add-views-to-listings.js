 import mongoose from "mongoose";
import Listing from "./models/listingModel.js";
import "dotenv/config";

const addViewsField = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Update all listings that do not have the 'views' field
    const result = await Listing.updateMany(
      { views: { $exists: false } },
      { $set: { views: 0 } }
    );

    console.log(`Listings updated: ${result.modifiedCount}`);
    process.exit(0);
  } catch (error) {
    console.error("Error updating listings:", error);
    process.exit(1);
  }
};

addViewsField();
