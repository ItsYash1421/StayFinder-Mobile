import Booking from "../models/bookingModel.js";
import Listing from "../models/listingModel.js";
import { io, userSocketMap } from "../socket/socket.js";
import NotificationService from "../services/notificationService.js";

const approveBooking = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    const userId = req.body.userId;

    console.log('🔔 Approve booking request:', { bookingId, status, userId });

    const booking = await Booking.findById(bookingId);

    if (!booking || booking.hostId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const oldStatus = booking.status;
    if (status === "approved") booking.status = "approved";
    else if (status === "rejected") booking.status = "rejected";
    else if (status === "paused") booking.status = "paused";
    else {
      return res.status(400).json({ message: "Invalid status" });
    }

    console.log('📝 Booking status change:', { oldStatus, newStatus: booking.status });

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
    console.log('✅ Booking saved with new status:', booking.status);

    // Send notification to guest and host about status change
    console.log('🔔 Creating notifications...');
    const listing = await Listing.findById(booking.listingId);
    if (listing) {
      console.log('📋 Found listing:', listing.title);
      console.log('👥 Notification recipients:', { guestId: booking.userId, hostId: listing.hostId });
      
      await NotificationService.notifyBookingStatusChange(
        booking,
        oldStatus,
        booking.status,
        booking.userId,
        listing.hostId
      );
      console.log('✅ Notifications sent successfully');
    } else {
      console.log('❌ Listing not found for booking:', booking.listingId);
    }

    return res.json({
      success: true,
      message: `Booking ${status}`,
      updatedBooking: booking,
    });
  } catch (error) {
    console.error('❌ Error in approveBooking:', error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Function to pause a booking
const pauseBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.body.userId;

    console.log('⏸️ Pause booking request:', { bookingId, userId });

    const booking = await Booking.findById(bookingId);

    if (!booking || booking.hostId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const oldStatus = booking.status;
    booking.status = "paused";

    console.log('📝 Booking status change:', { oldStatus, newStatus: booking.status });

    await booking.save();
    console.log('✅ Booking paused successfully');

    // Send notification about pause
    const listing = await Listing.findById(booking.listingId);
    if (listing) {
      await NotificationService.notifyBookingStatusChange(
        booking,
        oldStatus,
        booking.status,
        booking.userId,
        listing.hostId
      );
      console.log('✅ Pause notification sent');
    }

    return res.json({
      success: true,
      message: "Booking paused",
      updatedBooking: booking,
    });
  } catch (error) {
    console.error('❌ Error in pauseBooking:', error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { approveBooking, pauseBooking };
