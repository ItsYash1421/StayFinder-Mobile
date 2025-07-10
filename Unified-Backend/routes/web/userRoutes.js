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
} from "../../controllers/web/userController.js";
import authUser from "../../middlewares/web/authUser.js";
import upload from "../../middlewares/web/multer.js";
import { googleLogin } from "../../controllers/web/authController.js";

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
  updateProfile
);
userRoutes.post("/change-password", authUser, changePassword);

userRoutes.get("/host-listings", authUser, getHostListings);
userRoutes.get("/host-guest-listings", authUser, getHostGuestListings);
userRoutes.post("/auth/google", googleLogin);
export default userRoutes;
