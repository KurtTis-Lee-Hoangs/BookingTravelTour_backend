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

export default router;
