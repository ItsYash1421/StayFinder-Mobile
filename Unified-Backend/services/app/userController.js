import generateToken from "../../lib/generateToken.js";
import Booking from "../../models/app/bookingModel.js";
import Listing from "../../models/app/listingModel.js";
import User from "../../models/app/userModel.js";

import bcrypt from "bcryptjs";
import { io, userSocketMap } from "../../socket/socket.js";
import { uploadToBunnyNet } from "../../lib/bunny.js";
import path from "path";

const login = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  try {
    // Validate input
    if (!emailOrPhone || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    // Find user by email or phone
    let user;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(emailOrPhone)) {
      user = await User.findOne({ email: emailOrPhone });
    } else {
      user = await User.findOne({ phone: emailOrPhone });
    }
    if (!user) {
      return res.json({ message: "Invalid email/phone or password." });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.json({ message: "Invalid email/phone or password." });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const register = async (req, res) => {
  const { name, email, password, gender, role, phone } = req.body;

  try {
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists." });
    }
    // const profileImage =
    //   gender === "male"
    //     ? `https://avatar.iran.liara.run/public/boy?username=${name}`
    //     : `https://avatar.iran.liara.run/public/girl?username=${name}`;
    const profileImage =
      gender === "male"
        ? `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRS633GIo1_mV3D9K08VUN6v5_FJClbCt2WT7piEr2JMd4JPGXDCIJBy8b3EqiSCjRlGks&usqp=CAU`
        : `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWCAIYSZNHw_Ynhq-E1_iSnZQ4yem4hS7H5yxg58SdOvJTiDf255nUwNIdhw4AAEk9sj0&usqp=CAU`;

    // Create new user
    const user = new User({
      name,
      email,
      password,
      profileImage,
      gender,
      role,
      phone,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const addlisting = async (req, res) => {
  try {
    const { listingId, startDate, endDate, adults, specialRequests } = req.body;

    // Fetch listing to calculate price
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    // Calculate nights stayed
    const nights =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24);

    if (nights <= 0)
      return res.status(400).json({ message: "Invalid booking dates" });

    const serviceFee = 85;
    const cleaningFee = 120;
    const totalPrice = listing.price * nights + serviceFee + cleaningFee;

    const newBooking = await Booking.create({
      listingId,
      userId: req.user.id,
      startDate,
      endDate,
      hostId: listing.hostId,
      adults,
      listing,
      images: listing.images,
      specialRequests,
      totalPrice,
    });

    const hostSocketId = userSocketMap[listing.hostId];
    if (hostSocketId) {
      io.to(hostSocketId).emit("booking-added", {
        newBooking,
        userId: req.user.id,
        hostId: listing.hostId,
        message: "You have a new booking request!",
      });
    }
    await newBooking.save();
    res
      .status(201)
      .json({ success: true, newBooking, message: "Booking Confirmed!" });
  } catch (error) {
    console.error("Booking creation failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const myListings = async (req, res) => {
  try {
    console.log("🔍 Fetching user bookings for userId:", req.user.id);

    // Find bookings and populate listing data
    const bookings = await Booking.find({
      userId: req.user.id,
      status: { $ne: "paused" },
    })
      .populate("listingId", "title location images price category rating")
      .sort({ createdAt: -1 }); // Show newest first (latest at top)

    console.log("✅ Found bookings:", bookings.length);
    console.log(
      "📊 Sample booking:",
      bookings[0]
        ? {
            id: bookings[0]._id,
            listingId: bookings[0].listingId,
            status: bookings[0].status,
          }
        : "No bookings"
    );

    // Transform the data to match frontend expectations
    const listings = bookings.map((booking) => ({
      ...booking.toObject(),
      listing: booking.listingId, // Map listingId to listing for frontend compatibility
    }));

    return res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const cancelListing = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find the booking by ID
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    } else if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking already cancelled" });
    } else if (booking.status === "confirmed") {
      return res.status(400).json({
        message: "Cannot cancel a confirmed booking",
      });
    } else if (booking.status === "pending" || booking.status === "approved") {
      // Update booking status to cancelled
      booking.status = "cancelled";
      await booking.save();
      return res.status(200).json({
        message: "Booking cancelled successfully",
        status: booking.status,
      });
    } else {
      return res.status(400).json({ message: "Invalid booking status" });
    }
  } catch (error) {
    console.error("Error cancelling booking:", error);
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getWishList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const toggleWishList = async (req, res) => {
  try {
    const { listingId, userId } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the listing is already in the wishlist
    const isInWishlist = user.wishlist?.includes(listingId);

    if (isInWishlist) {
      // Remove from wishlist
      user.wishlist = user.wishlist.filter((id) => id.toString() !== listingId);
      await user.save();
      return res
        .status(200)
        .json({ success: true, message: "Listing removed from wishlist" });
    } else {
      // Add to wishlist
      user.wishlist?.push(listingId.toString());
      await user.save();
      return res
        .status(200)
        .json({ message: "Listing added to wishlist", success: true, user });
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// const becomeHost = async (req, res) => {
//   try {
//     const { userId } = req.body;
//     const user = await User.findByIdAndUpdate(userId, { role: "host" });
//     await user.save();
//     res.json({ user, success: true, message: "Converted into host" });
//     console.log(userId);
//   } catch (error) {
//     console.error("Error Converting into:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

const updateProfile = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    const { userId, name, email, phone, bio, gender } = req.body;
    const imageFile = req.file;

    // Only require userId, name, email
    if (![userId, name, email].every((val) => val && val.trim() !== "")) {
      return res.json({ success: false, message: "Missing details" });
    }
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and not already taken
    const emailExists = await User.findOne({ email });
    if (emailExists && emailExists._id.toString() !== userId) {
      return res.json({
        success: false,
        message: "Email already in use by another user",
      });
    }

    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    if (bio !== undefined) user.bio = bio;
    if (gender !== undefined && gender !== "") user.gender = gender;
    // Save updated user
    if (imageFile) {
      console.log("Image file received:", imageFile);
      const filename = path.basename(imageFile.path);
      const remotePath = `user/${filename}`;
      console.log("Uploading to Bunny.net:", imageFile.path, "->", remotePath);
      try {
        const bunnyUrl = await uploadToBunnyNet(imageFile.path, remotePath);
        await User.findByIdAndUpdate(userId, { profileImage: bunnyUrl });
      } catch (uploadErr) {
        console.error("Bunny.net upload error:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
          error: uploadErr.message,
        });
      }
    }
    const updatedUser = await user.save();

    // Return user data without password
    const userResponse = {
      name: updatedUser.name,
      email: updatedUser.email,
      profileImage: updatedUser.profileImage,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      gender: updatedUser.gender,
    };
    res.json({
      success: true,
      userResponse,
      message: "Profile Updated Successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.json({ message: "Incorrect Password" });
    }

    user.password = newPassword;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getHostListings = async (req, res) => {
  try {
    const { userId } = req.body;

    const listings = await Listing.find({
      hostId: userId,
      status: { $ne: "paused" },
    });

    if (!listings)
      return res.json({ message: "no listing found", success: false });

    return res.json({ message: "fetched", success: true, listings });
  } catch (error) {
    return res.json({ message: error.message, success: false });
  }
};

const getHostGuestListings = async (req, res) => {
  try {
    // Use req.user.id from auth middleware
    const hostId = req.user.id;
    console.log("🔍 Fetching guest listings for hostId:", hostId);

    // First, let's check if there are any bookings at all
    const allBookings = await Booking.find({});
    console.log("📊 Total bookings in database:", allBookings.length);

    // Check bookings for this specific host (excluding paused status)
    const hostBookings = await Booking.find({
      hostId,
      status: { $ne: "paused" },
    });
    console.log(
      "🏠 Bookings for this host (excluding paused):",
      hostBookings.length
    );
    console.log(
      "🏠 Host bookings data:",
      hostBookings.map((b) => ({
        id: b._id,
        hostId: b.hostId,
        listingId: b.listingId,
        status: b.status,
        createdAt: b.createdAt,
      }))
    );

    // Return all bookings for this host with populated data (excluding paused status)
    const bookings = await Booking.find({ hostId, status: { $ne: "paused" } })
      .populate("listingId", "title location images price category rating")
      .populate("userId", "name email profileImage")
      .sort({ createdAt: -1 }); // Sort by newest first (latest at top)

    console.log("✅ Populated bookings (excluding paused):", bookings.length);
    console.log(
      "✅ Sample booking data:",
      bookings[0]
        ? {
            id: bookings[0]._id,
            listingId: bookings[0].listingId,
            userId: bookings[0].userId,
            status: bookings[0].status,
          }
        : "No bookings found"
    );

    // Transform the data to match frontend expectations
    const listings = bookings.map((booking) => ({
      ...booking.toObject(),
      listing: booking.listingId, // Map listingId to listing for frontend compatibility
      userId: booking.userId, // Keep user details
    }));

    console.log("🎯 Final response data:", {
      success: true,
      listingsCount: listings.length,
      sampleListing: listings[0]
        ? {
            id: listings[0]._id,
            listing: listings[0].listing,
            userId: listings[0].userId,
            status: listings[0].status,
          }
        : "No listings",
    });

    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error("❌ Error fetching host listings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
  login,
  register,
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
};
