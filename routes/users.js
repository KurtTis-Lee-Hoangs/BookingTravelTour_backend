import express from "express";
import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";
import {
  updateUser,
  deleteUser,
  getSingleUser,
  getAllUserNoDelete,
  getAllUserDeleted,
  createUser,
  updateFavorites,
  getFavorites,
  forgotPasswordCtrl,
  SignOut,
} from "../controllers/userController.js";

const router = express.Router();

// create new user
router.post('/', createUser);

// update a user
router.put("/:id", verifyUser, updateUser);
// router.put("/:id", updateUser);

// delete a user
router.delete("/:id", verifyAdmin, deleteUser);
// router.delete("/:id", deleteUser);

// get a single user
router.get("/:id", verifyUser, getSingleUser);

// get all users
router.get("/", verifyAdmin, getAllUserNoDelete);
router.get("/delete/getAllUserDeleted", verifyAdmin, getAllUserDeleted);
// router.get("/" , getAllUser);

// Route to handle adding/removing from favorites
router.patch("/:id/favorites", verifyUser, updateFavorites);
router.get("/:userId/favorites", getFavorites);
router.post("/forgot-password", forgotPasswordCtrl)
router.post("/sign-out", SignOut)


export default router;
