import express from "express";
import {
    createBlog,
    updateBlog,
    deleteBlog,
    getSingleBlog,
    getAllBlogByUser,
    getBlogCount,
    getAllBlogByAdminNoDelete,
    getAllBlogByAdminDeleted,
    getBlogBySearch,
} from "../controllers/blogController.js";

import { verifyAdmin, verifyUser } from "../utils/verifyToken.js";

const router = express.Router();

// create a new blog
router.post("/", verifyAdmin, createBlog);

// update a blog
router.put("/:id", verifyAdmin, updateBlog);

// delete a blog
router.delete("/:id", verifyAdmin, deleteBlog);

// get a single blog
router.get("/:id", getSingleBlog);

// get all blog
router.get("/user/getAllBlogByUser", getAllBlogByUser);

// get all tours admin
router.get("/", verifyAdmin, getAllBlogByAdminNoDelete);
router.get("/delete/getAllBlogByAdminDeleted", verifyAdmin, getAllBlogByAdminDeleted);

// get blog counts
router.get("/search/getBlogCount", getBlogCount);

// get blog by search
router.get("/search/getBlogBySearch", getBlogBySearch);

export default router;
