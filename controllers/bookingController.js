import Booking from "../models/Booking.js";
import { sendPaymentConfirmationEmail } from "../utils/sendEmail.js";
import { payment } from "./paymentController.js";

// Create new booking
export const createBooking = async (req, res) => {
  const newBooking = new Booking(req.body);

  try {
    const savedBooking = await newBooking.save();

    // const paymentUrl = await payment(savedBooking._id);
    const paymentUrl = await payment(savedBooking._id, "tourBooking");
    if (!paymentUrl) {
      return res.status(503).json({
        success: false,
        message: "Payment creation failed.",
      });
    }

    // Trả về URL để frontend xử lý việc chuyển hướng
    res.status(200).json({
      success: true,
      message: "Booking created successfully",
      tour: savedBooking,
      paymentUrl: paymentUrl,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      // message: err.message,
      message: "Thông tin nhập vào đang bị sai",
    });
  }
};

// Update a booking
export const updateBooking = async (req, res) => {
  const id = req.params.id;

  try {
    const updateBooking = await Booking.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Sussessfully updated the booking",
      data: updateBooking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed update a booking. Try again",
    });
  }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
  const id = req.params.id;

  try {
    // await Booking.findByIdAndDelete(id);
    const booking = await Booking.findByIdAndUpdate(
      id,
      { isDelete: true },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sussessfully delete the booking",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed delete a booking. Try again",
    });
  }
};

// Get single bookings
export const getBooking = async (req, res) => {
  const id = req.params.id;

  try {
    const book = await Booking.findById(id);

    res.status(200).json({
      success: true,
      message: "Get booking successfully",
      data: book,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Get booking failed. Not found booking",
    });
  }
};

// Get all bookings
export const getAllBooking = async (req, res) => {
  try {
    const bookAll = await Booking.find({isDelete: false});

    res.status(200).json({
      success: true,
      message: "Get booking successfully",
      count: bookAll.length,
      data: bookAll,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Get all booking failed. Not found booking",
    });
  }
};

// Get bookings by userId
export const getUserBookings = async (req, res) => {
  try {
    // Lọc bookings dựa trên userId trùng với _id người dùng đã đăng nhập
    const bookings = await Booking.find({ userId: req.user.id, isDelete: false });

    res.status(200).json({
      success: true,
      message: "Get booking history successfully",
      data: bookings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking history",
      error: err.message,
    });
  }
};
