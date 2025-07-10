import generateToken from "../../lib/generateToken.js";
import Booking from "../../models/web/bookingModel.js";
import Listing from "../../models/web/listingModel.js";
import User from "../../models/web/userModel.js";
import Notification from "../../models/web/notificationModel.js";
import { cloudinary } from "../../lib/cloudinary.js";
import bcrypt from "bcryptjs";
import { io, userSocketMap } from "../../socket/socket.js";
import { uploadToBunnyNet } from "../../lib/bunny.js";

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "Invalid email or password." });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.json({ message: "Invalid email or password." });
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

        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const register = async (req, res) => {
  const { name, email, password, gender, role } = req.body;

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
    const profileImage =
      gender === "male"
        ? `https://avatar.iran.liara.run/public/boy?username=${name}`
        : `https://avatar.iran.liara.run/public/girl?username=${name}`;

    // Create new user
    const user = new User({
      name,
      email,
      password,
      profileImage,
      gender,
      role,
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
    const { listingId, startDate, endDate, guests, specialRequests, userId } =
      req.body;

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
      userId: req.body.userId,
      startDate,
      endDate,
      hostId: listing.hostId,
      guests,
      listing,
      images: listing.images,
      specialRequests,
      totalPrice,
    });
    // getIO().emit("booking-added", { booking: newBooking });
    // io.emit("booking-added", {
    //   newBooking,
    //   userId,
    //   hostId: listing.hostId,
    //   message: "You have a new Booking Request",
    // });
    const hostSocketId = userSocketMap[listing.hostId];
    if (hostSocketId) {
      io.to(hostSocketId).emit("booking-added", {
        newBooking,
        userId,
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
    // Fetch listings created by the user

    const listings = await Booking.find({ userId: req.body.userId });
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
    const userId = req.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      return res.status(200).json({ user, success: true });
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getWishList = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("wishlist");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      return res
        .status(200)
        .json({ message: "found", wishlist: user.wishlist, success: true });
    }
  } catch (error) {
    console.error("Error fetching wishlist:", error);
  }
};

const toggleWishList = async (req, res) => {
  try {
    const { listingId } = req.body;
    const userId = req.userId;
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

// const updateProfile = async (req, res) => {
//   try {
//     const { userId, name, email, phone, bio, gender } = req.body;
//     const imageFile = req.file;

//     if (!userId || !name || !gender || !phone || !email || !bio) {
//       return res.json({ success: false, message: "Missing details" });
//     }
//     // Find user
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Check if email is being changed and not already taken

//     const emailExists = await User.findOne({ email });
//     if (emailExists && emailExists._id.toString() !== userId) {
//       return res.json({
//         success: false,
//         message: "Email already in use by another user",
//       });
//     }

//     // Update fields
//     user.name = name || user.name;
//     user.email = email || user.email;
//     user.phone = phone || user.phone;
//     user.bio = bio || user.bio;
//     user.gender = gender || user.gender;
//     // Save updated user
//     if (imageFile) {
//       const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
//         resource_type: "image",
//       });
//       const imageUrl = imageUpload.secure_url;
//       await User.findByIdAndUpdate(userId, { profileImage: imageUrl });
//     }
//     const updatedUser = await user.save();

//     // Return user data without password
//     const userResponse = {
//       name: updatedUser.name,
//       email: updatedUser.email,
//       profileImage: updatedUser.profileImage,
//       phone: updatedUser.phone,
//       bio: updatedUser.bio,
//       gender: updatedUser.gender,
//     };
//     res.json({
//       success: true,
//       userResponse,
//       message: "Profile Updated Successfully",
//     });
//   } catch (error) {
//     console.error("Update profile error:", error.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };

const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, bio, gender } = req.body;
    const userId = req.userId;
    const imageFile = req.file;
    if (!userId || !name || !gender || !phone || !email || !bio) {
      return res.json({ success: false, message: "Missing details" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const emailExists = await User.findOne({ email });
    if (emailExists && emailExists._id.toString() !== userId) {
      return res.json({
        success: false,
        message: "Email already in use by another user",
      });
    }
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.bio = bio || user.bio;
    user.gender = gender || user.gender;
    // ✅ Replace Cloudinary with Bunny
    if (imageFile) {
      const remotePath = `profile-images/${userId}-${Date.now()}-${
        imageFile.originalname
      }`;
      const imageUrl = await uploadToBunnyNet(imageFile.path, remotePath);
      user.profileImage = imageUrl;
    }
    const updatedUser = await user.save();
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
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;
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
    const userId = req.userId;
    const listings = await Listing.find({ hostId: userId });
    if (!listings)
      return res.json({ message: "no listing found", success: false });
    return res.json({ message: "fetched", success: true, listings });
  } catch (error) {
    return res.json({ message: error.message, success: false });
  }
};

const getHostGuestListings = async (req, res) => {
  try {
    const hostId = req.userId;
    const listings = await Booking.find({
      hostId,
      status: { $in: ["pending"] },
    });
    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error("Error fetching host listings:", error);
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
