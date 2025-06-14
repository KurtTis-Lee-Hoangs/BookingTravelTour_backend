import Booking from "../models/Booking.js";
import { sendPaymentConfirmationEmail, sendBookingRequestToStaff, sendBookingConfirmedEmail } from "../utils/sendEmail.js";
import { payment } from "./paymentController.js";

// Create new booking
export const createNotification = async (req, res) => {
  // const newBooking = new Booking(req.body);

  // try {
  //   const savedBooking = await newBooking.save();

  //   // const paymentUrl = await payment(savedBooking._id);
  //   const paymentUrl = await payment(savedBooking._id, "tourBooking");
  //   if (!paymentUrl) {
  //     return res.status(503).json({
  //       success: false,
  //       message: "Payment creation failed.",
  //     });
  //   }

  //   // Trả về URL để frontend xử lý việc chuyển hướng
  //   res.status(200).json({
  //     success: true,
  //     message: "Booking created successfully",
  //     tour: savedBooking,
  //     paymentUrl: paymentUrl,
  //   });
  // } catch (err) {
  //   res.status(500).json({
  //     success: false,
  //     // message: err.message,
  //     message: "Thông tin nhập vào đang bị sai",
  //   });
  // }
  const newBooking = new Booking(req.body);
  console.log(newBooking);
  try {
    const savedBooking = await newBooking.save();

    // Send payment confirmation email
    await sendBookingRequestToStaff({
      fullName: newBooking.fullName,
      phone: newBooking.phone,
      travelDate: newBooking.bookAt,
      tourName: newBooking.tourName,
      userEmail: newBooking.userEmail,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: savedBooking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create a new booking. Try again",
      error: err.message,
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

export const confirmBooking = async (req, res) => {
  const bookingId = req.params.id;

  try {
    // Tìm booking theo ID và cập nhật trạng thái thanh toán
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: "Paiding" },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const paymentUrl = await payment(updatedBooking._id, "tourBooking");
    if (!paymentUrl) {
      return res.status(503).json({
        success: false,
        message: "Payment creation failed.",
      });
    }
    await sendBookingConfirmedEmail(updatedBooking, paymentUrl);
    // Trả về URL để frontend xử lý việc chuyển hướng
    res.status(200).json({
      success: true,
      message: "Booking created successfully",
      tour: updatedBooking,
      paymentUrl: paymentUrl,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to confirm booking. Try again",
      error: err.message,
    });
  }
}

export const getBookingCountByTour = async (req, res) => {
  // Lấy tourId từ URL parameters. Tên 'id' phải khớp với tên bạn đặt trong file route
  const tourId = req.params.id;

  try {
    // 1. Tìm tất cả các document booking có tourId tương ứng
    const bookings = await Booking.find({ tourId: tourId, isDelete: false }); 

    if (!bookings) {
      // Trường hợp không tìm thấy booking nào, trả về 0
      return res.status(200).json({
        success: true,
        message: 'No bookings found for this tour.',
        data: { totalGuests: 0 },
      });
    }

    // 2. Tính tổng số khách từ tất cả các booking tìm được
    // Sử dụng hàm reduce để cộng dồn giá trị guestSize
    const totalGuests = bookings.reduce((acc, booking) => acc + booking.guestSize, 0);

    // 3. Trả về kết quả thành công cùng với tổng số khách
    res.status(200).json({
      success: true,
      message: 'Successfully calculated total guests.',
      data: { totalGuests }, // Frontend sẽ nhận được { "data": { "totalGuests": 15 } }
    });

  } catch (err) {
    // Bắt lỗi và trả về thông báo lỗi
    res.status(500).json({
      success: false,
      message: 'Failed to calculate total guests. ' + err.message,
    });
  }
};