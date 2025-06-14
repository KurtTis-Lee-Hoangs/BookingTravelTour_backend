import Hotel from "../models/Hotel.js";
import HotelRoom from "../models/HotelRoom.js";
import BookingHotel from "../models/BookingHotel.js";
import { payment } from "./paymentController.js";

// Đặt phòng
export const createHotelBooking = async (req, res) => {
  try {
    const {
      userId,
      hotelRoomId,
      checkInDate,
      checkOutDate,
      paymentMethod,
      totalPrice,
    } = req.body;

    // Check if the room is available
    const room = await HotelRoom.findById(hotelRoomId);
    if (!room || room.status !== "Available") {
      return res.status(400).json({ message: "Room is not available" });
    }

    // Calculate the total nights
    const nights = Math.ceil(
      (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)
    );

    // Create a new booking
    const newBooking = new BookingHotel({
      hotelRoomId,
      userId,
      checkInDate,
      checkOutDate,
      totalPrice,
      paymentMethod,
      status: "Pending",
    });

    await newBooking.save();
    
    // // Update the room status to "Unavailable" immediately after successful booking creation
    // await HotelRoom.findByIdAndUpdate(hotelRoomId, { status: "Unavailable" });

    if (paymentMethod === "ZaloPay") {
      const paymentUrl = await payment(newBooking._id, "roomBooking");
      if (!paymentUrl) {
        return res.status(503).json({
          success: false,
          message: "Payment creation failed.",
        });
      }

      // Return the payment URL for the frontend to handle redirection
      return res.status(200).json({
        success: true,
        message: "Booking created successfully",
        tour: newBooking,
        paymentUrl: paymentUrl,
      });
    }

    // Check if the payment has been made and update the room status accordingly
    if (newBooking.isPayment) {
      await HotelRoom.findByIdAndUpdate(hotelRoomId, { status: "Unavailable" });
    }

    res.status(200).json({
      success: true,
      message: "Booking created successfully without online payment",
      tour: newBooking,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
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
