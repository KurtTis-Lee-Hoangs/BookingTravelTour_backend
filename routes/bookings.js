import express from "express";
import { createBooking, updateBooking, deleteBooking, getBooking, getAllBooking, getUserBookings } from "../controllers/bookingController.js";
import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";
import { callback } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", createBooking);
// update a booking
router.put("/:id", verifyAdmin, updateBooking);

// delete a booking
router.delete("/:id", verifyAdmin, deleteBooking);
router.get("/:id", verifyUser, getBooking);
router.get("/", verifyAdmin, getAllBooking);
router.get("/user/history", verifyUser, getUserBookings);
// router.get("/user/history/:id", getUserBookings);
router.post("/callback", callback)

export default router;
