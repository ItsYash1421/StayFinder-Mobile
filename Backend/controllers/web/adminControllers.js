import Booking from "../../models/web/bookingModel.js";
import Listing from "../../models/web/listingModel.js";
import { io, userSocketMap } from "../../socket/socket.js";

export const getHostStats = async (req, res) => {
  const allListings = await Listing.find();

  const hostMap = {};

  allListings.forEach((listing) => {
    const hostId = listing.hostId.toString();
    if (!hostMap[hostId]) {
      hostMap[hostId] = { total: 0, active: 0 };
    }
    hostMap[hostId].total += 1;
    if (listing.isActive !== false) {
      hostMap[hostId].active += 1;
    }
  });

  const totalHosts = Object.keys(hostMap).length;
  const activeHosts = Object.values(hostMap).filter((h) => h.active > 0).length;
  const inactiveHosts = totalHosts - activeHosts;

  res.json({ totalHosts, activeHosts, inactiveHosts });
};

export const getAllBookings = async (req, res) => {
  const bookings = await Booking.find()
    .populate("userId", "name email")
    .populate("hostId", "name email")
    .sort({ createdAt: -1 });

  res.json(bookings);
};

export const getSalesReport = async (req, res) => {
  const { start, end } = req.query;
  const match = { status: "approved" };

  if (start && end) {
    match.startDate = { $gte: new Date(start) };
    match.endDate = { $lte: new Date(end) };
  }

  const earnings = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$hostId",
        totalSales: { $sum: "$totalPrice" },
        bookingCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "host",
      },
    },
    { $unwind: "$host" },
    {
      $project: {
        hostName: "$host.name",
        hostEmail: "$host.email",
        totalSales: 1,
        bookingCount: 1,
      },
    },
  ]);

  const totalRevenue = earnings.reduce((sum, h) => sum + h.totalSales, 0);

  res.json({ totalRevenue, salesByHost: earnings });
};
