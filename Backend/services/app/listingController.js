import AppListing from "../../models/app/listingModel.js";

import AppUser from "../../models/app/userModel.js"; // adjust the import path if needed
import AppBooking from "../../models/app/bookingModel.js";
import { uploadToBunnyNet } from "../../lib/bunny.js";
import path from "path";

const getListings = async (req, res) => {
  try {
    // Fetch listings and their booking counts using aggregation
    const listingsWithCounts = await AppListing.aggregate([
      { $match: { status: { $ne: "paused" } } },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "listingId",
          as: "bookingsArr",
        },
      },
      {
        $addFields: {
          bookingCount: { $size: "$bookingsArr" },
        },
      },
      {
        $project: {
          bookingsArr: 0, // Exclude the bookings array from the result
        },
      },
    ]);
    return res
      .status(200)
      .json({ listings: listingsWithCounts, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getListingById = async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch a single listing by ID and populate hostId
    const listing = await AppListing.findById(id).populate("hostId");
    console.log(listing);
    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    } else {
      // Increment views
      listing.views = (listing.views || 0) + 1;
      await listing.save();
      console.log(
        `Views incremented for listing ${listing._id}:`,
        listing.views
      );
      return res.status(200).json({ listing, success: true });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const createListing = async (req, res) => {
  try {
    console.log("=== CREATE LISTING DEBUG ===");
    console.log("Full request body:", JSON.stringify(req.body, null, 2));
    console.log("User from middleware:", req.user);
    console.log("Files received:", req.files ? req.files.length : 0);
    console.log("Content-Type:", req.headers["content-type"]);

    const {
      title,
      description,
      location,
      latitude,
      longitude,
      price,
      category,
      guests,
      bedrooms,
      bathrooms,
      hostId,
    } = req.body;

    console.log("Extracted hostId from body:", hostId);
    console.log("User ID from middleware:", req.user?.id);

    const imageFiles = req.files;

    if (!imageFiles || imageFiles.length === 0) {
      return {
        success: false,
        message: "At least one image is required",
      };
    }

    const imageUrls = [];

    for (const file of imageFiles) {
      const filename = path.basename(file.path);
      const remotePath = `listings/${filename}`;
      const bunnyUrl = await uploadToBunnyNet(file.path, remotePath);
      imageUrls.push(bunnyUrl);
    }

    const rating = (Math.random() * (5 - 4) + 4).toFixed(1); // gives a float between 4.0 and 5.0
    const review = Math.floor(Math.random() * 50) + 1; // random integer between 1 and 50

    // Get hostId from either req.body.hostId or req.user.id
    const finalHostId = hostId || req.user?.id;

    console.log("Final hostId to be used:", finalHostId);

    if (!finalHostId) {
      console.log("ERROR: No hostId found!");
      return {
        success: false,
        message: "Host ID is required",
      };
    }

    const listingData = {
      title,
      description,
      location,
      category,
      latitude,
      longitude,
      price,
      rating,
      review,
      guests,
      bedrooms,
      bathrooms,
      images: imageUrls,
      hostId: finalHostId,
    };

    console.log(
      "Listing data to create:",
      JSON.stringify(listingData, null, 2)
    );

    const newListing = await AppListing.create(listingData);

    console.log("Listing created successfully:", newListing._id);

    // Return the result instead of sending response
    return { success: true, message: "Listing Added", listing: newListing };
  } catch (error) {
    console.error("Error creating listing:", error);
    return { success: false, message: "Server error" };
  }
};

const editListing = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      location,
      latitude,
      longitude,
      price,
      guests,
      bedrooms,
      bathrooms,
    } = req.body;
    console.log(id);
    const listing = await AppListing.findById(id);
    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    // Upload new images if any
    let imageUrls = listing.images; // existing images
    const newImageFiles = req.files;

    if (newImageFiles && newImageFiles.length > 0) {
      imageUrls = [];

      for (const file of newImageFiles) {
        const filename = path.basename(file.path);
        const remotePath = `listings/${filename}`;
        const bunnyUrl = await uploadToBunnyNet(file.path, remotePath);
        imageUrls.push(bunnyUrl);
      }
    }

    // Update the listing
    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.location = location || listing.location;
    listing.latitude = latitude || listing.latitude;
    listing.longitude = longitude || listing.longitude;
    listing.price = price || listing.price;
    listing.guests = guests || listing.guests;
    listing.bedrooms = bedrooms || listing.bedrooms;
    listing.bathrooms = bathrooms || listing.bathrooms;
    listing.images = imageUrls;

    await listing.save();

    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      listing,
    });
  } catch (error) {
    console.error("Error updating listing:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const userId = req.user?.id; // Get userId from middleware instead of request body

    console.log("Delete listing debug:");
    console.log("Listing ID:", listingId);
    console.log("User ID from middleware:", userId);

    const listing = await AppListing.findById(listingId);
    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    console.log("Found listing:", listing._id);
    console.log("Listing hostId:", listing.hostId);

    if (listing.hostId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this listing",
      });
    }

    // 1. Delete the listing
    await listing.deleteOne();

    // 2. Remove listingId from all users' wishlist arrays
    await AppUser.updateMany(
      { wishlist: listingId },
      { $pull: { wishlist: listingId } }
    );

    res.status(200).json({
      success: true,
      message: "Listing deleted and removed from all wishlists",
    });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getPopularListings = async (req, res) => {
  try {
    console.log("🔍 Fetching popular listings...");

    // Get top 10 listings by popularity (views + booking count)
    const popularListings = await AppListing.aggregate([
      // Match only live listings (exclude paused)
      { $match: { status: { $ne: "paused" } } },

      // Lookup bookings for each listing
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "listingId",
          as: "bookings",
        },
      },

      // Add fields for popularity calculation
      {
        $addFields: {
          bookingCount: { $size: "$bookings" },
          // Calculate popularity score: views + (booking count * 10) + (rating * 100)
          popularityScore: {
            $add: [
              { $ifNull: ["$views", 0] },
              { $multiply: [{ $size: "$bookings" }, 10] },
              { $multiply: [{ $ifNull: ["$rating", 0] }, 100] },
            ],
          },
        },
      },

      // Sort by popularity score (descending)
      { $sort: { popularityScore: -1 } },

      // Limit to top 10
      { $limit: 10 },

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
          bookingCount: 1,
          popularityScore: 1,
        },
      },
    ]);

    console.log("✅ Popular listings found:", popularListings.length);
    console.log(
      "📊 Sample listing:",
      popularListings[0]
        ? {
            id: popularListings[0]._id,
            title: popularListings[0].title,
            category: popularListings[0].category,
            bookingCount: popularListings[0].bookingCount,
            views: popularListings[0].views,
            popularityScore: popularListings[0].popularityScore,
          }
        : "No listings found"
    );

    return res.status(200).json({
      success: true,
      listings: popularListings,
    });
  } catch (error) {
    console.error("❌ Error fetching popular listings:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getTrendingDestinations = async (req, res) => {
  try {
    console.log("🌍 Fetching trending destinations by booking count...");

    // Get top 5 destinations by booking count
    const trendingDestinations = await AppListing.aggregate([
      // Match only live listings (exclude paused)
      { $match: { status: { $ne: "paused" } } },

      // Lookup bookings for each listing
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "listingId",
          as: "bookings",
        },
      },

      // Add booking count field
      {
        $addFields: {
          bookingCount: { $size: "$bookings" },
        },
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
          bookingCount: 1,
        },
      },
    ]);

    console.log("✅ Trending destinations found:", trendingDestinations.length);
    console.log(
      "📊 Sample destination:",
      trendingDestinations[0]
        ? {
            id: trendingDestinations[0]._id,
            title: trendingDestinations[0].title,
            location: trendingDestinations[0].location,
            category: trendingDestinations[0].category,
            bookingCount: trendingDestinations[0].bookingCount,
          }
        : "No destinations found"
    );

    return res.status(200).json({
      success: true,
      destinations: trendingDestinations,
    });
  } catch (error) {
    console.error("❌ Error fetching trending destinations:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all unique locations
const getUniqueLocations = async (req, res) => {
  try {
    const locations = await AppListing.distinct("location", {
      location: { $exists: true, $ne: null, $ne: "" },
    });
    return res.status(200).json({ success: true, locations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
  getListings,
  getListingById,
  deleteListing,
  createListing,
  editListing,
  getPopularListings,
  getTrendingDestinations,
  getUniqueLocations,
};
