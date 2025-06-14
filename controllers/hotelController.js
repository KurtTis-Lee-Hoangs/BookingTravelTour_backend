import Hotel from "../models/Hotel.js";
import HotelRoom from "../models/HotelRoom.js";
import BookingHotel from "../models/BookingHotel.js";
import { payment } from "./paymentController.js";

// Đặt phòng
export const createHotelBooking = async (req, res) => {
  try {
    const {
      userId,
      fullName,
      phoneNumber,
      hotelRoomId,
      checkInDate,
      checkOutDate,
      paymentMethod,
      totalPrice,
    } = req.body;
    
    // Chuyển đổi ngày tháng sang đối tượng Date để so sánh chính xác
    const newCheckInDate = new Date(checkInDate);
    const newCheckOutDate = new Date(checkOutDate);

    if (newCheckInDate >= newCheckOutDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date.",
      });
    }

    // BƯỚC 1: KIỂM TRA XUNG ĐỘT THỜI GIAN ĐẶT PHÒNG
    // Tìm một booking đã tồn tại cho cùng một phòng, đã thanh toán, chưa bị hủy và có ngày bị trùng.
    const conflictingBooking = await BookingHotel.findOne({
      hotelRoomId: hotelRoomId, // Cho cùng một phòng
      isPayment: true,          // Đã được thanh toán
      isDelete: false,          // Booking đó không bị hủy
      $or: [ // Điều kiện thời gian trùng lặp
        {
          checkInDate: { $lt: newCheckOutDate },
          checkOutDate: { $gt: newCheckInDate }
        }
      ]
    });

    // Nếu tìm thấy một booking bị trùng lặp, trả về lỗi
    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: "Room is booked for this date. Please choose another date.",
      });
    }

    // BƯỚC 2: TẠO BOOKING MỚI (nếu không có xung đột)
    // Đoạn code này chỉ chạy khi không có booking nào bị trùng
    const newBooking = new BookingHotel({
      hotelRoomId,
      userId,
      fullName,
      phoneNumber,
      checkInDate: newCheckInDate,
      checkOutDate: newCheckOutDate,
      totalPrice,
      paymentMethod,
      status: "Pending", // Trạng thái ban đầu
      isPayment: false,  // Mặc định là chưa thanh toán khi mới tạo
      isDelete: false,   // Mặc định là chưa xóa
    });

    await newBooking.save();

    // Xử lý thanh toán ZaloPay
    if (paymentMethod === "ZaloPay") {
      const paymentUrl = await payment(newBooking._id, "roomBooking");
      if (!paymentUrl) {
        return res.status(503).json({
          success: false,
          message: "Tạo thanh toán thất bại.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Booking tạo thành công, đang chờ thanh toán.",
        booking: newBooking,
        paymentUrl: paymentUrl,
      });
    }
    
    // Đối với các phương thức thanh toán khác (ví dụ: thanh toán tại quầy)
    // Bạn sẽ cần một logic khác để cập nhật isPayment = true sau khi khách hàng thanh toán.
    // Ví dụ: một API riêng cho nhân viên xác nhận thanh toán.
    // Khi isPayment được cập nhật thành true, phòng sẽ chính thức bị khóa trong khoảng thời gian đó.

    res.status(200).json({
      success: true,
      message: "Booking được tạo thành công (thanh toán sau).",
      booking: newBooking,
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const getBookedDatesForRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Tìm tất cả các booking cho phòng này đã thanh toán và chưa bị hủy
    const bookings = await BookingHotel.find({
      hotelRoomId: roomId,
      isPayment: true,
      isDelete: false,
    }).select("checkInDate checkOutDate"); // Chỉ lấy 2 trường cần thiết

    if (!bookings || bookings.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Không có ngày nào được đặt cho phòng này.",
        data: [],
      });
    }

    // Tạo một danh sách tất cả các ngày đã bị chiếm
    const bookedDates = [];
    bookings.forEach(booking => {
      let currentDate = new Date(booking.checkInDate);
      const endDate = new Date(booking.checkOutDate);

      // Lặp từ ngày check-in đến TRƯỚC ngày check-out
      // Vì ngày check-out khách đã trả phòng và phòng trống cho người tiếp theo
      while (currentDate < endDate) {
        bookedDates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    res.status(200).json({
      success: true,
      data: bookedDates,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách ngày đã đặt.",
      error: error.message,
    });
  }
};  

// Xem danh sách phòng đã đặt
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy userId từ token

    // Truy vấn danh sách booking theo userId và populate thông tin hotelRoomId
    const bookings = await BookingHotel.find({ userId }).populate(
      "hotelRoomId"
    );

    // Trả về danh sách booking
    res.status(200).json({
      success: true,
      message: "Get booking history successfully",
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const getAllHotelByUser = async (req, res) => {
  // paginstion
  const page = parseInt(req.query.page);
  try {
    const hotels = await Hotel.find({ isActive: true})
      .skip(page * 8)
      .limit(8);
    res.status(200).json({
      success: true,
      count: hotels.length,
      message: "Successfully get all hotels",
      data: hotels,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the hotel. Try again",
    });
  }
};

export const getAllHotelByAdmin = async (req, res) => {
  // pagination
  const page = parseInt(req.query.page);
  try {
    const hotels = await Hotel.find({ isActive: true });
    res.status(200).json({
      success: true,
      count: hotels.length,
      message: "Successfully get all hotels",
      data: hotels,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the hotel. Try again",
    });
  }
};

export const getAllHotelByAdminDelete = async (req, res) => {
  // pagination
  const page = parseInt(req.query.page);
  try {
    const hotels = await Hotel.find({ isActive: false });
    res.status(200).json({
      success: true,
      count: hotels.length,
      message: "Successfully get all hotels",
      data: hotels,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the hotel. Try again",
    });
  }
};

export const getAllHotelRoom = async (req, res) => {
  // pagination
  const page = parseInt(req.query.page);
  const id = req.params.id;
  try {
    const hotelRooms = await HotelRoom.find({ hotelId: id });
    // .skip(page * 6)
    // .limit(6);
    res.status(200).json({
      success: true,
      count: hotelRooms.length,
      message: "Successfully get all hotel rooms",
      data: hotelRooms,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the hotel room. Try again",
    });
  }
};

export const createHotel = async (req, res) => {
  const newHotel = new Hotel(req.body);
  try {
    const savedHotel = await newHotel.save();
    res.status(200).json({
      success: true,
      message: "Successfully created a new hotel",
      data: savedHotel,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed created a new hotel. Try again",
    });
  }
};

export const createHotelRoom = async (req, res) => {
  const newHotelRoom = new HotelRoom(req.body);
  try {
    const savedHotelRoom = await newHotelRoom.save();
    res.status(200).json({
      success: true,
      message: "Successfully created a new hotel room",
      data: savedHotelRoom,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getSingleHotel = async (req, res) => {
  const id = req.params.id;
  try {
    const tour = await Hotel.findById(id);
    res.status(200).json({
      success: true,
      message: "Successfully get single hotel.",
      data: tour,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the hotel. Try again",
    });
  }
};

export const getSingleHotelRoom = async (req, res) => {
  const id = req.params.id;
  try {
    // const tour = await HotelRoom.findOne({ hotelId: id });
    const tour = await HotelRoom.findById(id);
    res.status(200).json({
      success: true,
      message: "Successfully get single hotel room",
      data: tour,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the hotel room. Try again",
    });
  }
};

export const updateHotel = async (req, res) => {
  const id = req.params.id;
  try {
    const updatedHotel = await Hotel.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "Successfully updated the hotel.",
      data: updatedHotel,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed update a hotel. Try again",
    });
  }
};

export const updateHotelRoom = async (req, res) => {
  const id = req.params.id;
  try {
    const updatedHotelRoom = await HotelRoom.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "Successfully updated the hotel room",
      data: updatedHotelRoom,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getHotelCount = async (req, res) => {
  try {
    // const hotelCount = await Hotel.estimatedDocumentCount();
    const hotelCount = await Hotel.countDocuments({isActive: true});
    res.status(200).json({
      success: true,
      data: hotelCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch",
    });
  }
};

export const deleteHotel = async (req, res) => {
  const id = req.params.id;
  try {
    // await Hotel.findByIdAndUpdate(id, {active: false});

    const hotel = await Hotel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully delete the hotel.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed delete a hotel. Try again",
    });
  }
};

export const deleteHotelRoom = async (req, res) => {
  const id = req.params.id;
  try {
    await HotelRoom.findByIdAndUpdate(
      id,
      { status: "Available" },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "Successfully delete the hotel room",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed delete a hotel room. Try again",
    });
  }
};

// Get all bookings
export const getAllBookingHotel = async (req, res) => {
  try {
    const bookHotelAll = await BookingHotel.find().populate("hotelRoomId");

    res.status(200).json({
      success: true,
      message: "Get booking successfully",
      count: bookHotelAll.length,
      data: bookHotelAll,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Get all booking failed. Not found booking",
    });
  }
};

export const getTotalAllBookingHotel = async (req, res) => {
  try {
    const bookHotelAll = await BookingHotel.find({ isPayment: true }).populate("hotelRoomId");

    res.status(200).json({
      success: true,
      message: "Get paid bookings successfully",
      count: bookHotelAll.length,
      data: bookHotelAll,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Get all paid bookings failed. Not found booking",
    });
  }
};

// Update a booking
export const updateBookingHotel = async (req, res) => {
  const bookingId = req.params.id;

  try {
    const updatedBooking = await BookingHotel.findByIdAndUpdate(
      bookingId,
      { $set: req.body },
      { new: true } // return the updated document
    );

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update booking",
    });
  }
};

// Soft delete a booking (update isDelete to true)
export const deleteBookingHotel = async (req, res) => {
  const bookingId = req.params.id;

  try {
    const deletedBooking = await BookingHotel.findByIdAndUpdate(
      bookingId,
      { isDelete: true },
      { new: true }
    );

    if (!deletedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking deleted (soft delete) successfully",
      data: deletedBooking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete booking",
    });
  }
};

export const checkoutBookingHotel = async (req, res) => {
  const bookingId = req.params.id;

  try {
    const checkoutBooking = await BookingHotel.findByIdAndUpdate(
      bookingId,
      { isCheckout: true },
      { new: true }
    );

    if (!checkoutBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Checkout successfully",
      data: checkoutBooking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to Checkout",
    });
  }
};
