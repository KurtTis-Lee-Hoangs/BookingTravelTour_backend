import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: String,
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      // required: true,
    },

    avatar: {
      type: String,
      default:
        "https://img.freepik.com/free-vector/illustration-user-avatar-icon_53876-5907.jpg?t=st=1730600707~exp=1730604307~hmac=63d2ed023c4a722f90f9c59a0417ca2eba185a3b9323bf93f4a6ff988c6bd6d7&w=740",
    },

    role: {
      type: String,
      default: "user",
      // default: "admin",
    },

    favorites: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Tour", // Bạn có thể tham chiếu đến bảng "Tour" nếu có bảng này
      default: [],
    },

    isActive: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
