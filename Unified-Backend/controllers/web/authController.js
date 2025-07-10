import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../../models/web/userModel.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    // If user exists but no googleId, update it
    if (user && !user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    // If user doesn't exist, create it
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        profileImage: picture,
        role: "user",
        gender: "male", // default or leave null
      });
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Google login successful",
      token: jwtToken,
      user: {
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
};
