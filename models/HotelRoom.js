import mongoose from "mongoose";
const hotelRoomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    roomNumber: {
      type: Number,
      required: true
    },
    square: {
      type: String
    },
    roomType: {
      type: String,
      required: true,
      trim: true,
    },
    maxOccupancy: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["Available", "Unavailabe"],
      default: "Available"
    },
  },
  { timestamps: true }
);
export default mongoose.model("HotelRoom", hotelRoomSchema);