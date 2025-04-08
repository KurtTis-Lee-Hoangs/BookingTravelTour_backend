import Tour from "../models/Tour.js";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";

export const createReview = async (req, res) => {
  // const tourId = req.params.tourId;
  // const newReview = new Review({ ...req.body });

  const tourId = req.params.tourId; // Lấy ID tour từ params
  const userId = req.user.id; 
  const newReview = new Review({ ...req.body, userId: userId, tour: tourId });

  try {
    // const bookingExists = await Booking.findOne({ userId, tourId: tourId });
    const bookingExists = await Booking.findOne({ userId, tourId: tourId, isPayment: true });
    if (!bookingExists) {
      return res.status(403).json({
        success: false,
        message: "You can only review tours that you have booked.",
      });
    }

    const savedReview = await newReview.save();

    // after creating a new review now update the reviews array of the tour
    // Cập nhật danh sách đánh giá của tour
    await Tour.findByIdAndUpdate(tourId, {
      $push: { reviews: savedReview._id },
    });

    res.status(200).json({
      success: true,
      message: "Review submitted successfully",
      data: savedReview,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      // message: "Failed to submitted .Review submitted failed",
      message: "Failed to submit review.",
    });
  }
};
