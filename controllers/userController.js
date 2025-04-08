import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js";

// Create a new User
export const createUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  // Check if the username already exists
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res
      .status(400)
      .json({ success: false, message: "Username already exists!" });
  }

  // Check if the email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res
      .status(400)
      .json({ success: false, message: "Email already exists!" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    role,
  });

  try {
    const savedUser = await newUser.save();
    res.status(200).json({
      success: true,
      message: "Successfully created a new user",
      data: savedUser,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create a new user. Try again",
    });
  }
};

// Update a User
export const updateUser = async (req, res) => {
  const id = req.params.id;
  const userId = req.user

  // Check if password is provided in the request body
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  // Check if there's a new avatar (Cloudinary URL)
  if (req.body.avatar) {
    // Optionally delete old avatar from Cloudinary (if you want)
    // cloudinary.v2.uploader.destroy(old_avatar_public_id);
  }

  const account = await User.findById(userId.id);
  if (!account) {
    return res.status(404).json({success: false, message: "Account not found"});
  }
  if (account.role === "user") {
    delete req.body.role;
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Successfully updated the user",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update user. Try again",
    });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { isDelete: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User has been marked as deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to mark user as deleted. Try again",
    });
  }
};

// Get a User
export const getSingleUser = async (req, res) => {
  const id = req.params.id;

  try {
    // const user = await User.findById(id);
    const user = await User.findById(id).populate("favorites");

    res.status(200).json({
      success: true,
      message: "Sussessfully get single user",
      data: user,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      // message: "Not found the user. Try again",
      message: err.message,
    });
  }
};

// Get all User
export const getAllUserNoDelete = async (req, res) => {
  try {
    // const users = await User.find({});
    const users = await User.find({ isDelete: false });

    res.status(200).json({
      success: true,
      message: "Sussessfully get all users",
      count: users.length,
      data: users,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the users. Try again",
    });
  }
};

export const getAllUserDeleted = async (req, res) => {
  try {
    // const users = await User.find({});
    const users = await User.find({ isDelete: true });

    res.status(200).json({
      success: true,
      message: "Sussessfully get all users",
      count: users.length,
      data: users,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the users. Try again",
    });
  }
};

// Controller function for adding/removing tour from favorites
export const updateFavorites = async (req, res) => {
  const userId = req.params.id;
  const { tourId, action } = req.body; // action is "add" or "remove"

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (action === "add") {
      // Add tourId to favorites if it's not already there
      if (!user.favorites.includes(tourId)) {
        user.favorites.push(tourId);
        await user.save();
        return res.status(200).json({
          success: true,
          message: "Tour added to favorites",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Tour is already in favorites",
        });
      }
    } else if (action === "remove") {
      // Remove tourId from favorites
      const index = user.favorites.indexOf(tourId);
      if (index !== -1) {
        user.favorites.splice(index, 1); // Remove the tourId
        await user.save();
        return res.status(200).json({
          success: true,
          message: "Tour removed from favorites",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Tour not found in favorites",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update favorites. Try again.",
    });
  }
};

// Get all favorites of a user
export const getFavorites = async (req, res) => {
  const id = req.params.userId;

  try {
    // const user = await User.findById(id);
    // const user = await User.findById(id).populate("favorites");
    const user = await User.findById(id).populate({
      path: "favorites",
      match: { isDelete: false }, // Filter by isDelete: false
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully fetched user's favorites",
      data: user.favorites, // Return the list of favorites
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user's favorites. Try again.",
    });
  }
};

export const forgotPasswordCtrl = async (req, res) => {
  const account = await User.findOne({ email: req.body.email });
  if (!account) {
    return res.status(401).json({
      status: "failed",
      message: "Account not found. Please check your email!",
    });
  }
  // Tạo mật khẩu mới ngẫu nhiên
  const newPassword = Math.random().toString(36).slice(-8); // Sinh mật khẩu 8 ký tự ngẫu nhiên
  const hashedPassword = bcrypt.hashSync(newPassword, 10); // Hash mật khẩu mới
  // Cập nhật mật khẩu trong cơ sở dữ liệu
  account.password = hashedPassword;
  await account.save();
  try {
    await sendEmail({
      email: account.email,
      subject: "Your New Password",
      password: newPassword, // Truyền mật khẩu mới vào
    });
    res.status(200).json({
      status: "success",
      message: "A new password has been sent to your email!",
    });
  } catch (err) {
    res.status(500).json({
      status: "failed",
      message: "Failed to send email. Please try again later.",
    });
  }
};

export const SignOut = async (req, res) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true, // Đảm bảo chỉ hoạt động qua HTTPS
      sameSite: "strict", // Bảo vệ chống tấn công CSRF
    });
    res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
