import express from "express";
import {
  updateBooking,
  deleteBooking,
  getBooking,
  getAllBooking,
  getUserBookings,
  getBookingCountByTour,
  createNotification,
  confirmBooking,
} from "../controllers/bookingController.js";
import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";
import { callback } from "../controllers/paymentController.js";
import { getBookedDatesForRoom } from "../controllers/hotelController.js";
const router = express.Router();

router.post("/", confirmBooking);
router.post("/sendNotification", createNotification);
// update a booking
router.put("/:id", verifyAdmin, updateBooking);

// delete a booking
router.delete("/:id", verifyAdmin, deleteBooking);
router.get("/:id", verifyUser, getBooking);
router.get("/", verifyAdmin, getAllBooking);
router.get("/user/history", verifyUser, getUserBookings);
// router.get("/user/history/:id", getUserBookings);
router.post("/callback", callback);

router.get("/room/:roomId/booked-dates", getBookedDatesForRoom);
router.get("/count-by-tour/:id", getBookingCountByTour);

export default router;
