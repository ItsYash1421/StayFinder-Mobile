import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // Set user ID in req.user instead of req.body

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res
      .status(401)
      .json({ success: false, message: "Not authorized, token failed" });
  }
};

export default authUser;
