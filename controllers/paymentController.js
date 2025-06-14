import Booking from "../models/Booking.js";
import moment from "moment";
import CryptoJS from "crypto-js";
import configPayment from "../config/configPayment.js";
import axios from "axios";
import {
  sendHotelBookingConfirmationEmail,
  sendPaymentConfirmationEmail,
} from "../utils/sendEmail.js";
import BookingHotel from "../models/BookingHotel.js";

export const payment = async (orderId, type) => {
  const embed_data = {
    redirecturl: "http://localhost:3000/thankyou",
    type: type,
  };
  let orderInfo;
  if (type === "roomBooking") {
    orderInfo = await BookingHotel.findById(orderId);
    if (!orderInfo) {
      throw new Error("Order room not found");
    }
  }

  if (type === "tourBooking") {
    orderInfo = await Booking.findById(orderId);
    if (!orderInfo) {
      throw new Error("Order not found");
    }
  }
  const items = [{}];
  const transID = Math.floor(Math.random() * 1000000);
  const order = {
    app_id: configPayment.app_id,
    app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
    app_user: orderInfo._id,
    app_time: Date.now(),
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount: orderInfo.totalPrice,
    description: `Payment for the order #${transID}`,
    bank_code: "",
    callback_url:
      "https://f4e4-2402-800-62a6-d645-1e0-7009-3179-7139.ngrok-free.app/api/v1/bookings/callback",
  };
  const data =
    configPayment.app_id +
    "|" +
    order.app_trans_id +
    "|" +
    order.app_user +
    "|" +
    order.amount +
    "|" +
    order.app_time +
    "|" +
    order.embed_data +
    "|" +
    order.item;
  order.mac = CryptoJS.HmacSHA256(data, configPayment.key1).toString();
  try {
    const result = await axios.post(configPayment.endpoint, null, {
      params: order,
    });
    if (result.data && result.data.order_url) {
      return result.data.order_url; // Return the payment URL
    } else {
      throw new Error("Payment service did not return an order URL");
    }
  } catch (error) {
    console.error("Payment Error:", error.message);
    throw new Error("Failed to process payment");
  }
};
export const callback = async (req, res) => {
  let result = {};
  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;
    let mac = CryptoJS.HmacSHA256(dataStr, configPayment.key2).toString();
    console.log("mac =", mac);
    // kiểm tra callback hợp lệ (đến từ ZaloPay server)
    if (reqMac !== mac) {
      // callback không hợp lệ
      result.return_cosde = -1;
      result.return_message = "mac not equal";
    } else {
      // thanh toán thành công
      // merchant cập nhật trạng thái cho đơn hàng
      let dataJson = JSON.parse(dataStr, configPayment.key2);
      const { type } = JSON.parse(dataJson.embed_data);
      let booking;
      if (type === "roomBooking") {
        try {
          // BƯỚC 1: Cập nhật trạng thái thanh toán của booking.
          // Chúng ta chỉ cần ID ở đây, không cần lấy lại toàn bộ document ngay.
          const updatedBooking = await BookingHotel.findByIdAndUpdate(
            dataJson["app_user"], // Đây là bookingId
            { isPayment: true, status: "Confirmed" }, // Cập nhật cả status
            { new: true } // new: true để trả về document sau khi đã cập nhật
          );

          // BƯỚC 2: Kiểm tra xem booking có tồn tại và đã được cập nhật chưa.
          if (!updatedBooking) {
            console.error(
              `Không tìm thấy booking với ID: ${dataJson["app_user"]} để cập nhật.`
            );
            // Có thể dừng lại hoặc xử lý lỗi ở đây
            return;
          }

          // BƯỚC 3: Lấy lại booking với đầy đủ thông tin (Quan trọng nhất!).
          // Sử dụng populate để lấy dữ liệu từ các model 'User' và 'HotelRoom' (bao gồm cả 'Hotel').
          const detailedBooking = await BookingHotel.findById(
            updatedBooking._id
          )
            .populate({
              path: "userId",
              select: "username email", // Chỉ lấy các trường cần thiết từ User
            })
            .populate({
              path: "hotelRoomId",
              select: "roomType hotelId", // Lấy các trường từ HotelRoom
              populate: {
                path: "hotelId",
                model: "Hotel", // Giả sử bạn có model 'Hotel'
                select: "name", // Lấy tên khách sạn
              },
            });

          if (!detailedBooking) {
            console.error(
              `Không thể populate booking với ID: ${updatedBooking._id}.`
            );
            return;
          }

          // BƯỚC 4: Tạo đối tượng chi tiết để gửi mail từ dữ liệu đã populate.
          const emailDetails = {
            bookingId: detailedBooking._id.toString(),
            userFullName: detailedBooking.fullName,
            phoneNumber: detailedBooking.phoneNumber,
            hotelName: detailedBooking.hotelRoomId.hotelId.name,
            roomType: detailedBooking.hotelRoomId.roomType,
            checkInDate: detailedBooking.checkInDate,
            checkOutDate: detailedBooking.checkOutDate,
            totalPrice: detailedBooking.totalPrice,
          };

          // BƯỚC 5: Gọi hàm gửi email với dữ liệu đã chuẩn bị.
          // Lấy email từ thông tin user đã populate.
          await sendHotelBookingConfirmationEmail(
            detailedBooking.userId.email,
            emailDetails
          );
        } catch (error) {
          console.error(
            "Đã xảy ra lỗi trong quá trình xác nhận và gửi email đặt phòng:",
            error
          );
          // Xử lý lỗi chung
        }
      } else if (type === "tourBooking") {
        booking = await Booking.findOneAndUpdate(
          { _id: dataJson["app_user"] },
          { isPayment: true },
          { new: true }
        );
        try {
          await sendPaymentConfirmationEmail(booking.userEmail, {
            tourName: booking.tourName,
            fullName: booking.fullName,
            guestSize: booking.guestSize,
            totalPrice: booking.totalPrice,
            bookAt: booking.bookAt,
          });
        } catch (emailError) {
          console.error(
            "Failed to send email confirmation:",
            emailError.message
          );
        }
      }
      console.log(
        "update order's status = success where app_trans_id =",
        dataJson["app_trans_id"]
      );
      result.return_code = 1;
      result.return_message = "success";
    }
  } catch (ex) {
    result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
    result.return_message = ex.message;
  }
  // thông báo kết quả cho ZaloPay server
  res.json(result);
};
