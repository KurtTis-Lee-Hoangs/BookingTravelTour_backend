import Blog from "../models/Blog.js";

// Create new blog or tip
export const createBlog = async (req, res) => {
  const newBlog = new Blog(req.body);

  try {
    const savedBlog = await newBlog.save();
    res.status(200).json({
      success: true,
      message: "Create blog successfully",
      data: savedBlog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Create blog failed",
    });
  }
};

// Update a blog
export const updateBlog = async (req, res) => {
  const id = req.params.id;

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Sussessfully updated the blog",
      data: updatedBlog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed update a blog. Try again",
    });
  }
};

// Delete a blog
export const deleteBlog = async (req, res) => {
  const id = req.params.id;

  try {
    // await Blog.findByIdAndDelete(id);
    const blog = await Blog.findByIdAndUpdate(
      id,
      { isDelete: true }, // Cập nhật thuộc tính isDelete
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sussessfully delete the blog",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed delete a blog. Try again",
    });
  }
};

// Get single blog or tip
export const getSingleBlog = async (req, res) => {
  const id = req.params.id;

  try {
    const blog = await Blog.findById(id);

    res.status(200).json({
      success: true,
      message: "Get blog successfully",
      data: blog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Get blog failed. Not found blog",
    });
  }
};

// Get all blog or tip
export const getAllBlogByUser = async (req, res) => {
  // pagianaion
  const page = parseInt(req.query.page);

  try {
    const blogs = await Blog.find({isDelete: false})
      .skip(page * 8)
      .limit(8);

    res.status(200).json({
      success: true,
      count: blogs.length,
      message: "Sussessfully get all tours",
      data: blogs,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the tours. Try again",
    });
  }
};

// Get all blog by admin
export const getAllBlogByAdminNoDelete = async (req, res) => {
  try {
    const blogs = await Blog.find({isDelete: false})

    res.status(200).json({
      success: true,
      count: blogs.length,
      message: "Sussessfully get all blogs",
      data: blogs,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the blog. Try again",
    });
  }
};

export const getAllBlogByAdminDeleted = async (req, res) => {
  try {
    const blogs = await Blog.find({isDelete: true})

    res.status(200).json({
      success: true,
      count: blogs.length,
      message: "Sussessfully get all blogs",
      data: blogs,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the blog. Try again",
    });
  }
};

// get blog counts
export const getBlogCount = async (req, res) => {
  try {
    // const blogCount = await Blog.estimatedDocumentCount();
    const blogCount = await Blog.countDocuments({ isDelete: false })

    res.status(200).json({
      success: true,
      data: blogCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch",
    });
  }
};

// get blog by search
export const getBlogBySearch = async (req, res) => {
  // Tạo điều kiện tìm kiếm ban đầu là một đối tượng rỗng
  const searchConditions = {isDelete:false};

  // Kiểm tra từng trường và thêm vào điều kiện nếu có giá trị
  if (req.query.title) {
    searchConditions.title = new RegExp(req.query.title, "i");
  }

  try {
    // Thực hiện tìm kiếm với các điều kiện đã xây dựng
    const blogs = await Blog.find(searchConditions);

    res.status(200).json({
      success: true,
      message: "Successfully retrieved blogs",
      data: blogs,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Could not find blogs. Please try again.",
    });
  }
};
