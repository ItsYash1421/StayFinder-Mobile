// Passport strategies for Google and Facebook OAuth
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // First try to find a user with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        // If no user found with Google ID, check if email exists
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // If user exists with this email, update their Google ID
          user.googleId = profile.id;
          await user.save();
        } else {
          // Create new user if neither Google ID nor email exists
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            profileImage: profile.photos?.[0]?.value || "", // Add Google profile photo if available
          });
        }
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Error in Google Strategy:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport; 