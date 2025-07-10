import express from "express";
import cors from "cors";
import "dotenv/config";
import session from "express-session";
import { connectDB } from "./lib/db.js";
import passport from "./middlewares/app/passport.js";
import { server, app, io, userSocketMap } from "./socket/socket.js";

// Import Admin routes
import adminAuthRoutes from "./routes/admin/auth.js";
import adminPropertyRoutes from "./routes/admin/property.js";
import adminBookingRoutes from "./routes/admin/booking.js";
import adminUserRoutes from "./routes/admin/user.js";
import adminAnalyticsRoutes from "./routes/admin/analytics.js";
import adminNotificationRoutes from "./routes/admin/notification.js";

// Import App routes
import appAuthRoutes from "./routes/app/authRoutes.js";
import appListingRoutes from "./routes/app/listingRoutes.js";
import appBookingRoutes from "./routes/app/bookingRoutes.js";
import appUserRoutes from "./routes/app/userRoutes.js";
import appNotificationRoutes from "./routes/app/notifications.js";

// Import Web routes
import webUserRoutes from "./routes/web/userRoutes.js";
import webListingRoutes from "./routes/web/listingRoutes.js";
import webBookingRoutes from "./routes/web/bookingRoutes.js";
import webAdminRoutes from "./routes/web/adminRoutes.js";

const PORT = process.env.PORT || 3000;

// Configure CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Unified Backend Server is running");
});

// Session setup
app.use(
  session({
    secret: process.env.JWT_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global debug log for all incoming requests
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

// Admin API Routes (prefixed with /api/admin)
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/properties", adminPropertyRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);

// App API Routes (prefixed with /api/app)
app.use("/api/app/auth", appAuthRoutes);
app.use("/api/app/listings", appListingRoutes);
app.use("/api/app/bookings", appBookingRoutes);
app.use("/api/app/user", appUserRoutes);
app.use("/api/app/notifications", appNotificationRoutes);

// Legacy App API Routes (for backward compatibility with existing mobile app)
app.use("/api/auth", appAuthRoutes);
app.use("/api/listings", appListingRoutes);
app.use("/api/bookings", appBookingRoutes);
app.use("/api/user", appUserRoutes);
app.use("/api/notifications", appNotificationRoutes);

// Web API Routes (prefixed with /api/web)
app.use("/api/web/user", webUserRoutes);
app.use("/api/web/listings", webListingRoutes);
app.use("/api/web/bookings", webBookingRoutes);
app.use("/api/web/admin", webAdminRoutes);

// Start server
server.listen(PORT, () => {
  connectDB();
  console.log(`Unified Backend Server is running on port ${PORT}`);
  console.log(`Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`App API: http://localhost:${PORT}/api/app`);
}); 