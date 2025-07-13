import Booking from "../../models/web/bookingModel.js";
import Notification from "../../models/web/notificationModel.js";
import { io, userSocketMap } from "../../socket/socket.js";

const approveBooking = async (req, res) => {
  const { bookingId, status } = req.body;
  const userId = req.body.userId;

  const booking = await Booking.findById(bookingId);

  if (!booking || booking.hostId.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }
  if (status === "approved") booking.status = "approved";
  else booking.status = "rejected";
  // io.emit("booking-updated", {
  //   status: booking.status,
  //   bookingId: booking._id,
  //   userId: booking.userId,
  //   hostId: booking.hostId,
  //   message: `Your booking is ${booking.status}`,
  // });
  const bookerSocketId = userSocketMap[booking.userId];
  if (bookerSocketId) {
    io.to(bookerSocketId).emit("booking-updated", {
      status: booking.status,
      bookingId: booking._id,
      userId,
      message: `Your booking has been ${booking.status}`,
    });
  }

  // Optionally emit to host for confirmation (not required but helpful)
  // const hostSocketId = userSocketMap[booking.hostId];
  // if (hostSocketId) {
  //   io.to(hostSocketId).emit("host-booking-status", {
  //     bookingId: booking._id,
  //     status: booking.status,
  //     message: `You have ${status} a booking.`,
  //   });
  // }
  await booking.save();

  return res.json({
    success: true,
    message: `Booking ${status}`,
    updatedBooking: booking,
  });
};

export { approveBooking };
