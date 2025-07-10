import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      minlength: 6,
      required: function () {
        // Password is required only if it's not a social login
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values to be unique
    },
    gender: { type: String, enum: ["male", "female"] },
    profileImage: {
      type: String,
      default: "", // You can set a default avatar URL here
    },
    phone: {
      type: String,
      default: "9XXXXXXXXX",
    },
    bio: {
      type: String,
      default: "Professional overthinker",
    },
    wishlist: { type: Array, default: [] },
    role: {
      type: String,
      enum: ["user", "host"],
      default: "user",
      required: true,
    },
  },
  { timestamps: true },
);

// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new) and exists
  if (!this.isModified("password") || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔓 Compare login password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const AppUser = mongoose.model("AppUser", userSchema, 'users');

export default AppUser;
