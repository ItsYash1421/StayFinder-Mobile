import Listing from "../models/listingModel.js";
import { cloudinary } from "../lib/cloudinary.js";
import User from "../models/userModel.js"; // adjust the import path if needed

const getListings = async (req, res) => {
  try {
    // Fetch listings from the database
    const listings = await Listing.find();
    return res.status(200).json({ listings, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getListingById = async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch a single listing by ID
    const listing = await Listing.findById(id);
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

const createListing = async (req, res) => {
  try {
    console.log('=== CREATE LISTING DEBUG ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('User from middleware:', req.user);
    console.log('Files received:', req.files ? req.files.length : 0);
    console.log('Content-Type:', req.headers['content-type']);
    
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
    
    console.log('Extracted hostId from body:', hostId);
    console.log('User ID from middleware:', req.user?.id);
    
    const imageFiles = req.files;
    
    if (!imageFiles || imageFiles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one image is required" 
      });
    }

    const imageUrls = [];

    for (const file of imageFiles) {
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: "StayFinder/Listings",
        resource_type: "image",
      });

      imageUrls.push(uploadResult.secure_url);
    }
    
    const rating = (Math.random() * (5 - 4) + 4).toFixed(1); // gives a float between 4.0 and 5.0
    const review = Math.floor(Math.random() * 50) + 1; // random integer between 1 and 50

    // Get hostId from either req.body.hostId or req.user.id
    const finalHostId = hostId || req.user?.id;
    
    console.log('Final hostId to be used:', finalHostId);
    
    if (!finalHostId) {
      console.log('ERROR: No hostId found!');
      return res.status(400).json({ 
        success: false, 
        message: "Host ID is required" 
      });
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

    console.log('Listing data to create:', JSON.stringify(listingData, null, 2));

    const newListing = await Listing.create(listingData);

    console.log('Listing created successfully:', newListing._id);
    return res
      .status(201)
      .json({ success: true, message: "Listing Added", listing: newListing });
  } catch (error) {
    console.error("Error creating listing:", error);
    return res.status(500).json({ success: false, message: "Server error" });
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
    const listing = await Listing.findById(id);
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
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "StayFinder/Listings",
          resource_type: "image",
        });
        imageUrls.push(result.secure_url);
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

    console.log('Delete listing debug:');
    console.log('Listing ID:', listingId);
    console.log('User ID from middleware:', userId);

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }
    
    console.log('Found listing:', listing._id);
    console.log('Listing hostId:', listing.hostId);

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
