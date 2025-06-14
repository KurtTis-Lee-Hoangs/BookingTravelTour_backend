import mongoose from "mongoose";
const bookingHotelSchema = new mongoose.Schema(
  {
    hotelRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HotelRoom",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
    },
    isPayment: {
      type: Boolean,
      default: false,
    },
    isDelete: { type: Boolean, default: false },
    isCheckout: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export default mongoose.model("BookingHotel", bookingHotelSchema);