import Listing from "../../models/web/listingModel.js";
import { cloudinary } from "../../lib/cloudinary.js";
import { uploadToBunnyNet } from "../../lib/bunny.js";
import Notification from "../../models/web/notificationModel.js";
import { io, userSocketMap } from "../../socket/socket.js";
// const getListings = async (req, res) => {
//   try {
//     // Fetch listings from the database
//     const listings = await Listing.find();
//     return res.status(200).json({ listings, success: true });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

const getListings = async (req, res) => {
  try {
    const { location } = req.query;

    const query = {};

    // Location filter (case-insensitive partial match)
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    const listings = await Listing.find(query);

    return res.status(200).json({ listings, success: true });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getListingById = async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch a single listing by ID
    const listing = await Listing.findById(id).populate(
      "hostId",
      "name profileImage  phone createdAt"
    );
    console.log(listing);
    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    } else {
      return res.status(200).json({ listing, success: true });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
// const getListingById = async (req, res) => {
//   try {
//     const listing = await Listing.findById(req.params.id).populate(
//       "hostId",
//       "name profileImage createdAt"
//     );
//     console.log(listing);
//     if (!listing) {
//       return res.status(404).json({ message: "Listing not found" });
//     }

//     res.json(listing);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
// const createListing = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       location,
//       latitude,
//       longitude,
//       price,
//       category,
//       guests,
//       bedrooms,
//       bathrooms,
//     } = req.body;
//     console.log(title);
//     const imageFiles = req.files;

//     const imageUrls = [];

//     for (const file of imageFiles) {
//       const uploadResult = await cloudinary.uploader.upload(file.path, {
//         folder: "StayFinder/Listings",
//         resource_type: "image",
//       });

//       imageUrls.push(uploadResult.secure_url);
//     }
//     const rating = (Math.random() * (5 - 4) + 4).toFixed(1); // gives a float between 4.0 and 5.0
//     const review = Math.floor(Math.random() * 50) + 1; // random integer between 1 and 50

//     const newListing = await Listing.create({
//       title,
//       description,
//       location,
//       category,
//       latitude,
//       longitude,
//       price,
//       rating,
//       review,
//       guests,
//       bedrooms,
//       bathrooms,
//       images: imageUrls,
//       hostId: req.body.userId, // assuming user is authenticated
//     });

//     return res
//       .status(201)
//       .json({ success: true, message: "Listing Added", listing: newListing });
//   } catch (error) {
//     console.error("Error creating listing:", error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

const createListing = async (req, res) => {
  try {
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
    } = req.body;

    const imageFiles = req.files;
    const imageUrls = [];

    for (const file of imageFiles) {
      const remotePath = `listings/${Date.now()}-${file.originalname}`;
      const uploadedUrl = await uploadToBunnyNet(file.path, remotePath);
      imageUrls.push(uploadedUrl);
    }

    const rating = (Math.random() * (5 - 4) + 4).toFixed(1); // 4.0 to 5.0
    const review = Math.floor(Math.random() * 50) + 1; // 1 to 50

    const newListing = await Listing.create({
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
      hostId: req.body.userId, // assuming user is authenticated
    });

    return res.status(201).json({
      success: true,
      message: "Listing Added",
      listing: newListing,
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// const editListing = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       title,
//       description,
//       location,
//       latitude,
//       longitude,
//       price,
//       guests,
//       bedrooms,
//       bathrooms,
//     } = req.body;
//     console.log(id);
//     const listing = await Listing.findById(id);
//     if (!listing) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Listing not found" });
//     }

//     // Upload new images if any
//     let imageUrls = listing.images; // existing images
//     const newImageFiles = req.files;

//     if (newImageFiles && newImageFiles.length > 0) {
//       imageUrls = [];

//       for (const file of newImageFiles) {
//         const result = await cloudinary.uploader.upload(file.path, {
//           folder: "StayFinder/Listings",
//           resource_type: "image",
//         });
//         imageUrls.push(result.secure_url);
//       }
//     }

//     // Update the listing
//     listing.title = title || listing.title;
//     listing.description = description || listing.description;
//     listing.location = location || listing.location;
//     listing.latitude = latitude || listing.latitude;
//     listing.longitude = longitude || listing.longitude;
//     listing.price = price || listing.price;
//     listing.guests = guests || listing.guests;
//     listing.bedrooms = bedrooms || listing.bedrooms;
//     listing.bathrooms = bathrooms || listing.bathrooms;
//     listing.images = imageUrls;

//     await listing.save();

//     res.status(200).json({
//       success: true,
//       message: "Listing updated successfully",
//       listing,
//     });
//   } catch (error) {
//     console.error("Error updating listing:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

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

    const listing = await Listing.findById(id);
    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    // 🔁 Upload new images if any
    let imageUrls = listing.images; // preserve existing images
    const newImageFiles = req.files;

    if (newImageFiles && newImageFiles.length > 0) {
      imageUrls = [];

      for (const file of newImageFiles) {
        const remotePath = `listings/${id}-${Date.now()}-${file.originalname}`;
        const uploadedUrl = await uploadToBunnyNet(file.path, remotePath);
        imageUrls.push(uploadedUrl);
      }
    }

    // ✅ Update fields
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

// const deleteListing = async (req, res) => {
//   try {
//     const listingId = req.params.id;
//     const userId = req.body.userId; // assuming you have user info from auth middleware
//     const listing = await Listing.findById(listingId);
//     if (!listing) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Listing not found" });
//     }

//     if (listing.hostId.toString() !== userId.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "Not authorized to delete this listing",
//       });
//     }

//     await listing.deleteOne();

//     res
//       .status(200)
//       .json({ success: true, message: "Listing deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting listing:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

import User from "../../models/web/userModel.js"; // adjust the import path if needed

const deleteListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const userId = req.body.userId;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }
    console.log(listing);

    if (listing.hostId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this listing",
      });
    }

    // 1. Delete the listing
    await listing.deleteOne();

    // 2. Remove listingId from all users' wishlist arrays
    await User.updateMany(
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

export {
  getListings,
  getListingById,
  deleteListing,
  createListing,
  editListing,
};
