import express from "express";
import multer from "multer";
import { verifyAdmin, verifyUser } from "../utils/verifyToken.js";
import { uploadImageAvatar, uploadImage } from "../controllers/uploadController.js"

// Create a multer instance to handle file uploads, storing files in the "uploads/" directory
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Route for users to upload an avatar image (requires user authentication)
router.post("/", upload.single("file"), verifyUser, uploadImageAvatar);

// Route for admins to upload an image (requires admin authentication)
router.post("/admin", upload.single("file"), verifyAdmin, uploadImage); 

export default router;
