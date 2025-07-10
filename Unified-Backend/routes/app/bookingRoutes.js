import express from "express";
import authUser from "../../middlewares/app/authUser.js";
import {
  approveBooking,
  pauseBooking,
} from "../../services/app/bookingController.js";
import NotificationService from "../../services/app/notificationService.js";
import Booking from "../../models/app/bookingModel.js";
import Listing from "../../models/app/listingModel.js";

const bookingRoutes = express.Router();

// Create new booking
bookingRoutes.post("/", authUser, async (req, res) => {
  try {
    console.log("Incoming booking request body:", req.body); // Debug log
    const {
      propertyId,
      propertyTitle,
      checkIn,
      checkOut,
      amountPaid,
      guestName,
    } = req.body;

    // Get property owner ID first
    const listing = await Listing.findById(propertyId);
    if (!listing) {
      return res
        .status(404)
        .json({ success: false, error: "Listing not found" });
    }

    const booking = new Booking({
      listingId: propertyId,
      userId: req.user.id,
      hostId: listing.hostId, // Set the hostId from the listing
      startDate: checkIn,
      endDate: checkOut,
      totalPrice: amountPaid,
      listing: { title: propertyTitle },
      status: "pending",
    });

    await booking.save();
    console.log("Booking saved:", booking); // Debug log

    // Create notifications
    console.log(
      "Creating notification for booking:",
      booking._id,
      "Owner:",
      listing.hostId,
    ); // Debug log
    await NotificationService.notifyBookingCreated(
      booking,
      req.user.id,
      listing.hostId,
    );
    console.log("Notification creation attempted"); // Debug log

    res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update booking status
bookingRoutes.put("/:id/status", authUser, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, error: "Booking not found" });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Get property owner ID
    const listing = await Listing.findById(booking.listingId);
    if (listing) {
      // Create notifications for status change
      await NotificationService.notifyBookingStatusChange(
        booking,
        oldStatus,
        status,
        booking.userId,
        listing.hostId,
      );
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Approve booking (existing route)
bookingRoutes.post("/approve-booking", authUser, approveBooking);

// Pause booking (new route)
bookingRoutes.post("/pause-booking", authUser, pauseBooking);

export default bookingRoutes;
