import express from "express";
import {
  getAllBookings,
  getHostStats,
  getSalesReport,
} from "../../controllers/web/adminControllers.js";
import authUser from "../../middlewares/web/authUser.js";
const adminRoutes = express.Router();
adminRoutes.get("/getHostStats", getHostStats);
adminRoutes.get("/getAllBookings", getAllBookings);
adminRoutes.get("/getSalesReport", getSalesReport);
export default adminRoutes;
