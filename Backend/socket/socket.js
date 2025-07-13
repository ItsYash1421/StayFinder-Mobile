import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    //origin: "https://stayfinder-frontend-rkk6.onrender.com", // or your frontend domain
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Attach io instance to request (optional, useful in route files)
app.set("io", io);

const userSocketMap = {};
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register", (userId) => {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on("new-booking", (data) => {
    console.log("New booking received:", data);

    const hostSocketId = userSocketMap[data.hostId]; // assuming data.hostId is sent
    if (hostSocketId) {
      io.to(hostSocketId).emit("booking-added", data);
    }
  });

  socket.on("update-booking", (data) => {
    console.log("Booking update", data);

    const userSocketId = userSocketMap[data.userId]; // assuming data.userId is sent
    if (userSocketId) {
      io.to(userSocketId).emit("booking-updated", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    for (const userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }
  });
});

export { server, app, io, userSocketMap }; 