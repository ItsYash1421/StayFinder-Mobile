import AppBooking from "../../models/app/bookingModel.js";
import AppListing from "../../models/app/listingModel.js";
import { io, userSocketMap } from "../../socket/socket.js";
import NotificationService from "../../services/app/notificationService.js";

const approveBooking = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    const userId = req.body.userId;

    console.log("[approveBooking] Incoming payload:", { bookingId, status, userId });

    const booking = await AppBooking.findById(bookingId);
    console.log("[approveBooking] Booking found:", booking);

    if (!booking) {
      console.log("[approveBooking] Booking not found for id:", bookingId);
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.hostId.toString() !== userId.toString()) {
      console.log("[approveBooking] Not authorized. booking.hostId:", booking.hostId, "userId:", userId);
      return res.status(403).json({ message: "Not authorized" });
    }

    const oldStatus = booking.status;
    if (status === "approved") booking.status = "approved";
    else if (status === "rejected") booking.status = "rejected";
    else if (status === "paused") booking.status = "paused";
    else {
      console.log("[approveBooking] Invalid status:", status);
      return res.status(400).json({ message: "Invalid status" });
    }

    console.log("[approveBooking] Booking status change:", { oldStatus, newStatus: booking.status });

    const bookerSocketId = userSocketMap[booking.userId];
    if (bookerSocketId) {
      io.to(bookerSocketId).emit("booking-updated", {
        status: booking.status,
        bookingId: booking._id,
        userId,
        message: `Your booking has been ${booking.status}`,
      });
    }

    await booking.save();
    console.log("[approveBooking] Booking saved with new status:", booking.status);

    // Send notification to guest and host about status change
    console.log("[approveBooking] Creating notifications...");
    const listing = await AppListing.findById(booking.listingId);
    if (listing) {
      console.log("[approveBooking] Found listing:", listing.title);
      console.log("[approveBooking] Notification recipients:", { guestId: booking.userId, hostId: listing.hostId });

      await NotificationService.notifyBookingStatusChange(
        booking,
        oldStatus,
        booking.status,
        booking.userId,
        listing.hostId,
      );
      console.log("[approveBooking] Notifications sent successfully");
    } else {
      console.log("[approveBooking] Listing not found for booking:", booking.listingId);
    }

    return res.json({
      success: true,
      message: `Booking ${status}`,
      updatedBooking: booking,
    });
  } catch (error) {
    console.error("[approveBooking] Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Function to pause a booking
const pauseBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.body.userId;

    console.log("⏸️ Pause booking request:", { bookingId, userId });

    const booking = await AppBooking.findById(bookingId);

    if (!booking || booking.hostId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const oldStatus = booking.status;
    booking.status = "paused";

    console.log("📝 Booking status change:", {
      oldStatus,
      newStatus: booking.status,
    });

    await booking.save();
    console.log("✅ Booking paused successfully");

    // Send notification about pause
    const listing = await AppListing.findById(booking.listingId);
    if (listing) {
      await NotificationService.notifyBookingStatusChange(
        booking,
        oldStatus,
        booking.status,
        booking.userId,
        listing.hostId,
      );
      console.log("✅ Pause notification sent");
    }

    return res.json({
      success: true,
      message: "Booking paused",
      updatedBooking: booking,
    });
  } catch (error) {
    console.error("❌ Error in pauseBooking:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { approveBooking, pauseBooking };
