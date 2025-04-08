import express from "express";
import {
  register,
  login,
  googleLogin,
  verifyEmail
} from "../controllers/authController.js";
// import passport from "passport";

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

router.post("/google-login", googleLogin)
router.get("/verify-email/:token", verifyEmail);

export default router;
