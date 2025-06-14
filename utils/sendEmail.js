import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
export const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
  const mailOptions = {
    from: { name: "Reset Password Service", address: process.env.GMAIL_USER },
    to: options.email,
    subject: options.subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4CAF50; text-align: center;">Password Reset</h2>
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">
          Your password has been successfully reset. Below is your new password:
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <p style="display: inline-block; font-size: 18px; font-weight: bold; padding: 10px 20px; background-color: #f2f2f2; border: 1px solid #ccc; border-radius: 5px; color: #333;">${options.password}</p>
        </div>
        <p style="font-size: 16px;">
          Please use this password to log in and change it immediately for your security.
        </p>
        <p style="font-size: 16px;">Thank you!</p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 14px; color: #777; text-align: center;">
          If you did not request this, please ignore this email or contact support.
        </p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

export const sendVerificationEmail = async (email, verificationLink) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // or any other email provider
    auth: {
      user: process.env.GMAIL_USER, // your email user
      pass: process.env.GMAIL_PASS, // your email password
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Account Activation",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #555;">Welcome to Our Service!</h2>
        <p>Thank you for signing up. Please confirm your email address to activate your account.</p>
        <p>
          Click <a href="${verificationLink}" style="color: #1a73e8; text-decoration: none;">here</a> to activate your account.
        </p>
        <p>If the above link doesn't work, please copy and paste the following URL into your browser:</p>
        <p style="word-wrap: break-word; color: #1a73e8;">${verificationLink}</p>
        <hr style="border: 0; height: 1px; background: #ccc;">
        <p style="font-size: 0.9em; color: #666;">If you didn’t request this email, please ignore it.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

export const sendPaymentConfirmationEmail = async (email, bookingDetails) => {
  // const { tourName, fullName, guestSize, bookAt, totalPrice } = bookingDetails;

  const { tourName, fullName, guestSize, totalPrice, bookAt } = bookingDetails;
  // Định dạng ngày
  const formattedBookAt = new Date(bookAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const transporter = nodemailer.createTransport({
    service: "Gmail", // Gmail hoặc email provider khác
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Xác nhận thanh toán thành công",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #4caf50; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="color: #4caf50; margin: 0;">Thanh toán thành công</h1>
          <p style="color: #555; margin: 0;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi</p>
        </div>
        
        <p style="font-size: 16px; margin-bottom: 20px;">Xin chào <strong style="color: #4caf50;">${fullName}</strong>,</p>
        <p style="font-size: 16px;">Chúng tôi rất vui thông báo rằng bạn đã thanh toán thành công cho tour du lịch của mình. Dưới đây là thông tin chi tiết:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold; width: 40%;">Tên tour</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${tourName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Số lượng khách</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${guestSize}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Ngày đi</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${formattedBookAt}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Tổng tiền</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0; color: #4caf50; font-weight: bold;">${totalPrice.toLocaleString()} VNĐ</td>
          </tr>
        </table>
        
        <p style="font-size: 16px; margin-top: 20px;">Chúc bạn có một chuyến đi thật tuyệt vời và đáng nhớ! Nếu bạn cần thêm thông tin, hãy liên hệ với chúng tôi qua email này.</p>
        
        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          <p style="font-size: 14px; color: #777;">Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi:</p>
          <p style="font-size: 14px; margin: 5px 0;"><strong>Email:</strong> minhhoangle031211@gmail.com</p>
          <p style="font-size: 14px; margin: 5px 0;"><strong>Hotline:</strong> 0386343954</p>
        </div>
        
        <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
          <p>© 2024 Tour Company. All rights reserved.</p>
        </footer>
      </div>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log("Payment confirmation email sent successfully!");
  } catch (error) {
    console.error("Failed to send payment confirmation email:", error.message);
    throw new Error("Failed to send email");
  }
};

export const sendHotelBookingConfirmationEmail = async (userEmail, bookingDetails) => {
  // 1. Lấy và chuẩn bị dữ liệu từ bookingDetails
  const {
    bookingId,    // Mã đặt phòng, rất quan trọng
    userFullName, // Tên đầy đủ của người đặt
    hotelName,    // Tên khách sạn
    roomType,     // Loại phòng đã đặt
    checkInDate,  // Ngày nhận phòng
    checkOutDate, // Ngày trả phòng
    totalPrice    // Tổng tiền thanh toán
  } = bookingDetails;

  // 2. Định dạng lại ngày tháng cho dễ đọc
  const formattedCheckIn = new Date(checkInDate).toLocaleDateString("vi-VN", {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  });
  const formattedCheckOut = new Date(checkOutDate).toLocaleDateString("vi-VN", {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  });

  // Tính số đêm ở
  const nights = Math.round((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));

  // 3. Cấu hình Nodemailer (giữ nguyên logic của bạn)
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // Đảm bảo đây là mật khẩu ứng dụng nếu dùng 2FA
    },
  });

  // 4. Tạo nội dung email với template dành cho khách sạn
  const mailOptions = {
    from: `"Travel Company" <${process.env.GMAIL_USER}>`, // Hiển thị tên công ty
    to: userEmail,
    subject: `✅ Xác nhận Đặt phòng Thành công tại ${hotelName} - Mã #${bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        
        <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 15px; margin-bottom: 25px;">
          <h1 style="color: #007bff; margin: 0; font-size: 28px;">Đặt phòng Thành công</h1>
          <p style="color: #555; margin: 5px 0 0;">Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi!</p>
        </div>
        
        <p style="font-size: 16px; margin-bottom: 20px;">Xin chào <strong style="color: #007bff;">${userFullName}</strong>,</p>
        <p style="font-size: 16px;">Yêu cầu đặt phòng của bạn đã được xác nhận thành công. Dưới đây là thông tin chi tiết về đặt phòng của bạn tại <strong>${hotelName}</strong>:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #f8f9fa;">
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; width: 40%;">Mã đặt phòng</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; color: #dc3545;">#${bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Loại phòng</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${roomType}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Nhận phòng (Check-in)</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formattedCheckIn}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Trả phòng (Check-out)</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formattedCheckOut}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Số đêm</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${nights} đêm</td>
          </tr>
          <tr style="background-color: #e9ecef;">
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; font-size: 18px;">Tổng thanh toán</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; color: #007bff; font-weight: bold; font-size: 18px;">${totalPrice.toLocaleString()} VNĐ</td>
          </tr>
        </table>
        
        <p style="font-size: 16px; margin-top: 25px;">Vui lòng xuất trình email này hoặc mã đặt phòng khi bạn làm thủ tục nhận phòng. Chúc bạn có một kỳ nghỉ thật tuyệt vời!</p>
        
        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #6c757d;">
          <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi:</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> minhhoangle031211@gmail.com</p>
          <p style="margin: 5px 0;"><strong>Hotline:</strong> 0386343954</p>
        </div>
        
        <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #adb5bd;">
          <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </footer>
      </div>
    `,
  };
  
  // 5. Gửi email và xử lý lỗi
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email xác nhận đặt phòng #${bookingId} đã được gửi thành công đến ${userEmail}!`);
  } catch (error) {
    console.error("Lỗi khi gửi email xác nhận đặt phòng:", error);
    // Không nên throw lỗi ở đây để tránh làm crash tiến trình chính,
    // trừ khi việc gửi mail là bắt buộc phải thành công.
    // Chỉ ghi log lỗi là đủ trong nhiều trường hợp.
  }
};
