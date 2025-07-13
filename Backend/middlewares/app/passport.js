// Passport strategies for Google and Facebook OAuth
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import AppUser from '../../models/app/userModel.js';

// Configure Google Strategy only if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // First try to find a user with this Google ID
          let user = await AppUser.findOne({ googleId: profile.id });

          if (!user) {
            // If no user found with Google ID, check if email exists
            user = await AppUser.findOne({ email: profile.emails[0].value });

            if (user) {
              // If user exists with this email, update their Google ID
              user.googleId = profile.id;
              await user.save();
            } else {
              // Create new user if neither Google ID nor email exists
              user = await AppUser.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                profileImage: profile.photos?.[0]?.value || "", // Add Google profile photo if available
              });
            }
          }

          return done(null, user);
        } catch (error) {
          console.error("Error in Google Strategy:", error);
          return done(error, null);
        }
      },
    ),
  );
  console.log("✅ Google OAuth strategy configured");
} else {
  console.log(
    "⚠️  Google OAuth credentials not found. Google login will be disabled.",
  );
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await AppUser.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
