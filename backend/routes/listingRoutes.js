import express from "express";
import {
  createListing,
  getListingById,
  getListings,
  deleteListing,
  editListing,
} from "../controllers/listingController.js";
import authUser from "../middleware/authUser.js";
import upload from "../middleware/multer.js";

const listingRoutes = express.Router();
listingRoutes.get("/", getListings);
listingRoutes.get("/:id", getListingById);
listingRoutes.delete("/delete-listing/:id", authUser, deleteListing);
listingRoutes.post(
  "/create-listing",
  upload.array("images", 5),
  authUser,
  createListing
);
listingRoutes.put(
  "/edit-listing/:id",
  upload.array("images", 5),
  authUser,
  editListing
);
listingRoutes.delete("/delete-listing/:id", authUser, deleteListing);
export default listingRoutes;
