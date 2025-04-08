import mongoose from "mongoose";
const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    photo: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);
export default mongoose.model("Hotel", hotelSchema);