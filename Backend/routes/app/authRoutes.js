// OAuth routes for Google and Facebook
import express from "express";
import passport from "../../middlewares/app/passport.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../../models/app/userModel.js";

const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
    } catch (error) {
      console.error("Error in Google callback:", error);
      res.redirect(
        `${process.env.FRONTEND_URL}/login?error=Authentication failed`,
      );
    }
  },
);

router.post("/google/mobile", async (req, res) => {
  const { access_token } = req.body;
  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: access_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error("Invalid Google token");

    // Find or create user
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email: payload.email });
      if (user) {
        user.googleId = payload.sub;
        await user.save();
      } else {
        user = await User.create({
          name: payload.name,
          email: payload.email,
          googleId: payload.sub,
          profileImage: payload.picture,
        });
      }
    }

    // Issue your app's JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ success: true, token });
  } catch (err) {
    console.error("Google mobile auth error:", err);
    res
      .status(401)
      .json({ success: false, message: "Google authentication failed" });
  }
});

export default router;
