import express from "express";
import authUser from "../../middlewares/web/authUser.js";
import { approveBooking } from "../../controllers/web/bookingController.js";
const bookingRoutes = express.Router();
bookingRoutes.post("/approve-booking", authUser, approveBooking);
export default bookingRoutes;
