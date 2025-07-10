// import mongoose from "mongoose";

// const bookingSchema = new mongoose.Schema(
//   {
//     listingId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Listing",
//       required: true,
//     },
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     hostId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     startDate: {
//       type: Date,
//       required: true,
//     },
//     endDate: {
//       type: Date,
//       required: true,
//     },
//     images: [String],
//     guests: {
//       type: Number,
//       default: 1,
//       min: 1,
//     },
//     //adults: {
//     //   type: Number,
//     //   default: 1,
//     //   min: 1,
//     // },
//     listing: { type: Object, required: true },
//     // children: {
//     //   type: Number,
//     //   default: 0,
//     // },
//     infants: {
//       type: Number,
//       default: 0,
//     },

//     specialRequests: {
//       type: String,
//       default: "",
//     },

//     totalPrice: {
//       type: Number,
//       required: true,
//     },

//     status: {
//       type: String,
//       enum: ["pending", "confirmed", "cancelled", "rejected", "approved"],
//       default: "pending",
//     },
//   },
//   { timestamps: true }
// );

// const Booking = mongoose.model("Booking", bookingSchema);
// export default Booking;

import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    images: [String],
    guests: {
      type: Number,
      default: 1,
      min: 1,
    },
    listing: { type: Object, required: true },
    children: {
      type: Number,
      default: 0,
    },
    infants: {
      type: Number,
      default: 0,
    },

    specialRequests: {
      type: String,
      default: "",
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "rejected", "approved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
