import express from "express";
import {
  register,
  login,
  addlisting,
  myListings,
  cancelListing,
  getUserProfile,
  getWishList,
  toggleWishList,
  updateProfile,
  changePassword,
  getHostListings,
  getHostGuestListings,
} from "../../services/app/userController.js";
import authUser from "../../middlewares/app/authUser.js";
import upload from "../../middlewares/app/multer.js";
import Booking from "../../models/app/bookingModel.js";

const userRoutes = express.Router();

userRoutes.post("/register", register);
userRoutes.post("/login", login);
userRoutes.get("/my-listings", authUser, myListings);
userRoutes.post("/add-listing", authUser, addlisting);
userRoutes.post("/cancel-booking", authUser, cancelListing);
userRoutes.get("/get-profile", authUser, getUserProfile);
userRoutes.get("/get-wishlist", authUser, getWishList);
userRoutes.post("/toggle-wishlist", authUser, toggleWishList);
//userRoutes.post("/become-host", authUser, becomeHost);
userRoutes.post(
  "/update-profile",
  upload.single("profileImage"),
  authUser,
  updateProfile,
);
userRoutes.post("/change-password", authUser, changePassword);

userRoutes.get("/host-listings", authUser, getHostListings);
userRoutes.get("/host-guest-listings", authUser, getHostGuestListings);

// Test endpoint to check all bookings
userRoutes.get("/test-bookings", authUser, async (req, res) => {
  try {
    const allBookings = await Booking.find({ status: { $ne: "paused" } });
    const hostBookings = await Booking.find({
      hostId: req.user.id,
      status: { $ne: "paused" },
    });

    res.json({
      success: true,
      totalBookings: allBookings.length,
      hostBookings: hostBookings.length,
      sampleBooking: allBookings[0] || null,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default userRoutes;
