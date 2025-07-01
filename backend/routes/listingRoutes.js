import express from "express";
import {
  createListing,
  getListingById,
  getListings,
  deleteListing,
  editListing,
  getPopularListings,
  getTrendingDestinations,
} from "../controllers/listingController.js";
import authUser from "../middleware/authUser.js";
import upload from "../middleware/multer.js";
import NotificationService from "../services/notificationService.js";
import Listing from "../models/listingModel.js";

const listingRoutes = express.Router();
listingRoutes.get("/", getListings);
listingRoutes.get("/popular", getPopularListings);
listingRoutes.get("/trending", getTrendingDestinations);
listingRoutes.get("/:id", getListingById);
listingRoutes.delete("/delete-listing/:id", authUser, deleteListing);
listingRoutes.post(
  "/create-listing",
  upload.array("images", 5),
  authUser,
  async (req, res) => {
    try {
      const result = await createListing(req, res);
      
      if (result && result.success) {
        // If listing was created successfully, send notification
        if (result.listing) {
          console.log('📧 Creating notification for new listing:', result.listing._id);
          await NotificationService.notifyListingCreated(result.listing, req.user.id);
          console.log('✅ Notification created successfully');
        }
        
        // Send success response
        res.status(201).json(result);
      } else {
        // Send error response
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in create listing route:', error);
      res.status(500).json({ success: false, error: 'Failed to create listing' });
    }
  }
);
listingRoutes.put(
  "/edit-listing/:id",
  upload.array("images", 5),
  authUser,
  async (req, res) => {
    try {
      const result = await editListing(req, res);
      
      // If listing was updated successfully and status changed, send notification
      if (result && result.listing && req.body.status) {
        const oldStatus = result.oldStatus || 'live';
        if (oldStatus !== req.body.status) {
          await NotificationService.notifyListingStatusChange(result.listing, oldStatus, req.body.status);
        }
      }
    } catch (error) {
      console.error('Error in edit listing route:', error);
      res.status(500).json({ success: false, error: 'Failed to edit listing' });
    }
  }
);
listingRoutes.delete("/delete-listing/:id", authUser, deleteListing);
export default listingRoutes;
