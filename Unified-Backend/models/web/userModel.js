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
    role: {
      type: String,
      enum: ["user", "host"],
      default: "user",
      required: true,
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
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔓 Compare login password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;

// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     password: {
//       type: String,
//       minlength: 6,
//       required: true,
//     },
//     role: {
//       type: String,
//       enum: ["user", "host"],
//       default: "user",
//     },
//     gender: { type: String, enum: ["male", "female"] },
//     profileImage: {
//       type: String,
//       default: "", // You can set a default avatar URL here
//     },
//     phone: {
//       type: String,
//       default: "9XXXXXXXXX",
//     },
//     bio: {
//       type: String,
//       default: "Professional overthinker",
//     },
//     wishlist: { type: Array, default: [] },
//   },
//   { timestamps: true }
// );

// // 🔐 Hash password before saving
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // 🔓 Compare login password
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// const User = mongoose.model("User", userSchema);

// export default User;
