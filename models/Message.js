import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      // Can be 'Admin' or the username
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming you have a User model
      required: true,
    },
    receiverId: {
      // Can be 'Admin' or the username
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming you have a User model
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
