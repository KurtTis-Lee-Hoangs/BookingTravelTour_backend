import express from "express";
const router = express.Router();
import {
  createHotel,
  createHotelBooking,
  deleteHotel,
  getAllHotelByUser,
  getAllHotelByAdmin,
  getAllHotelByAdminDelete,
  getHotelCount,
  getSingleHotel,
  updateHotel,
  updateHotelRoom,
  getUserBookings,
  getAllBookingHotel,
  getTotalAllBookingHotel,
  updateBookingHotel,
  deleteBookingHotel,
  checkoutBookingHotel
} from "../controllers/hotelController.js";

import {
  createHotelRoom,
  deleteHotelRoom,
  getAllHotelRoom,
  getSingleHotelRoom,
} from "../controllers/hotelController.js";

import { verifyAdmin, verifyUser } from "../utils/verifyToken.js";

router.get("/getAllHotelByUser", getAllHotelByUser);
router.get("/getAllHotelByAdmin", getAllHotelByAdmin);
router.get("/getAllHotelByAdminDelete", getAllHotelByAdminDelete);
router.get("/:id", getSingleHotel);
router.get("/search/getHotelCount", getHotelCount);
router.post("/", createHotel);
router.put("/:id", updateHotel);
router.delete("/:id", deleteHotel);

router.post("/payment", createHotelBooking)

router.get("/rooms/:id", getAllHotelRoom);
router.get("/room/:id", getSingleHotelRoom);
router.post("/room", createHotelRoom);
router.put("/rooms/:id", verifyAdmin, updateHotelRoom)
router.delete("/rooms/:id", verifyAdmin, deleteHotelRoom);

router.get("/user/getUserBookings", verifyUser, getUserBookings);

router.get("/admin/getAllBookingHotel", verifyAdmin, getAllBookingHotel);
router.get("/admin/getTotalAllBookingHotel", verifyAdmin, getTotalAllBookingHotel);
router.put("/admin/updateBookingHotel/:id", verifyAdmin, updateBookingHotel);
router.delete("/admin/deleteBookingHotel/:id", verifyAdmin, deleteBookingHotel);
router.put("/admin/checkoutBookingHotel/:id", verifyAdmin, checkoutBookingHotel);

export default router;
