import express from "express";
import {
  createListing,
  getListingById,
  getListings,
  deleteListing,
  editListing,
} from "../../controllers/web/listingController.js";
import authUser from "../../middlewares/web/authUser.js";
import upload from "../../middlewares/web/multer.js";

const listingRoutes = express.Router();
listingRoutes.get("/", getListings);
listingRoutes.get("/:id", getListingById);
listingRoutes.delete("/delete-listing/:id", authUser, deleteListing);
listingRoutes.post(
  "/create-listing",
  upload.array("images", 40),
  authUser,
  createListing
);
listingRoutes.put(
  "/edit-listing/:id",
  upload.array("images", 40),
  authUser,
  editListing
);
listingRoutes.delete("/delete-listing/:id", authUser, deleteListing);
export default listingRoutes;
