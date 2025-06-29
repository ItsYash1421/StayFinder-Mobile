import express from "express";
import authUser from "../middleware/authUser.js";
import { approveBooking } from "../controllers/bookingController.js";
const bookingRoutes = express.Router();
bookingRoutes.post("/approve-booking", authUser, approveBooking);
export default bookingRoutes;
