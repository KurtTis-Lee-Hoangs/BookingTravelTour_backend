import express from "express";
import {
  createTour,
  updateTour,
  deleteTour,
  getSingleTour,
  getAllTourByUser,
  getAllTourByAdminNoDelete,
  getAllTourByAdminDeleted,
  getTourBySearch,
  getFeaturedTour,
  getTourCount,
  getDomesticTour,
  getForeignToursCount,
  getDomesticToursCount,
} from "../controllers/tourController.js";

import { verifyAdmin, verifyUser } from "../utils/verifyToken.js";

const router = express.Router();

// create a new tour
router.post("/", verifyAdmin, createTour);

// update a tour
router.put("/:id", verifyAdmin, updateTour);

// delete a tour
router.delete("/:id", verifyAdmin, deleteTour);

// get a single tour
router.get("/:id", getSingleTour);

// get all tours user
router.get("/user/getAllTourByUser", getAllTourByUser);

// get all tours admin
router.get("/", verifyAdmin, getAllTourByAdminNoDelete);
router.get("/delete/getAllTourByAdminDeleted", verifyAdmin, getAllTourByAdminDeleted);

// get tour by search
router.get("/search/getTourBySearch", getTourBySearch);

// get featured tour
router.get("/search/getFeaturedTours", getFeaturedTour);
router.get("/search/getDomesticTours", getDomesticTour);

// get tour counts
router.get("/search/getTourCount", getTourCount);
router.get("/search/getForeignToursCount", getForeignToursCount);
router.get("/search/getDomesticToursCount", getDomesticToursCount);

export default router;
