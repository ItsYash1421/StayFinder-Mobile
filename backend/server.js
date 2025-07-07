import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { connectDB } from "./lib/db.js";
import session from "express-session";
import passport from "./middleware/passport.js";

import authRoutes from "./routes/userRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import authGoogleRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notifications.js";
import { app, server } from "./socket/socket.js";

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

app.get("/", (req, res) => {
  res.send("Hello, World!");
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

// Routes
app.use("/api/user", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authGoogleRoutes);
app.use("/api/notifications", notificationRoutes);

server.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});
