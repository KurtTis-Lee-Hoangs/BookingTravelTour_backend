import Booking from "../models/Booking.js";
import moment from "moment";
import CryptoJS from "crypto-js";
import configPayment from "../config/configPayment.js";
import axios from "axios";
import { sendPaymentConfirmationEmail } from "../utils/sendEmail.js";
import BookingHotel from "../models/BookingHotel.js";
import HotelRoom from "../models/HotelRoom.js";
export const payment = async (orderId, type) => {
  const embed_data = {
    redirecturl: "http://localhost:3000/thankyou",
    type: type
  };
  let orderInfo;
  if (type === "roomBooking") {
    orderInfo = await BookingHotel.findById(orderId)
    if (!orderInfo) {
      throw new Error("Order room not found")
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
      "https://d0b6-14-169-14-104.ngrok-free.app/api/v1/bookings/callback",
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
        booking = await BookingHotel.findOneAndUpdate(
          { _id: dataJson["app_user"] },
          { isPayment: true },
          { new: true }
        );

        await HotelRoom.findByIdAndUpdate(
          booking.hotelRoomId,
          {
            status: "Unavailable",
          },
          { new: true }
        );

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