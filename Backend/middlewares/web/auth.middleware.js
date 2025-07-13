import jwt from "jsonwebtoken";
import User from "../models/web/userModel.js";
const protectedRoute = async (req, res, next) => {
  try {
    const token = req.headers.Authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    const tokenDecoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!tokenDecoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(tokenDecoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {}
};

export { protectedRoute };
