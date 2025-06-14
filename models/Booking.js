import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
    },
    userEmail: {
      type: String,
    },
    tourId: {
      type: mongoose.Types.ObjectId,
      ref: "Tour",
    },
    tourName: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    guestSize: {
      type: Number,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    bookAt: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
    },
    isPayment: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Waiting", "Paiding", "Cancelled", "Completed"],
      default: "Waiting",
    },
    isDelete: { type: Boolean, default: false },
    typeBooking: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
