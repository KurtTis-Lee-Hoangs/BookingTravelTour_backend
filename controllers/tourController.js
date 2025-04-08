import Tour from "../models/Tour.js";

// Create a new tour
export const createTour = async (req, res) => {
  const newTour = new Tour(req.body);

  // const existingTitle = await Tour.findOne({ title });
  // if (existingTitle) {
  //   return res
  //     .status(400)
  //     .json({ success: false, message: "Title already exists!" });
  // }

  try {
    const savedTour = await newTour.save();

    res.status(200).json({
      success: true,
      message: "Sussessfully created a new tour",
      data: savedTour,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed created a new tour. Try again",
    });
  }
};

// Update a tour
export const updateTour = async (req, res) => {
  const id = req.params.id;

  try {
    const updatedTour = await Tour.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Sussessfully updated the tour",
      data: updatedTour,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed update a tour. Try again",
    });
  }
};

// Delete a tour
export const deleteTour = async (req, res) => {
  const id = req.params.id;

  try {
    // await Tour.findByIdAndDelete(id);

    const tour = await Tour.findByIdAndUpdate(
      id,
      { isDelete: true }, // Cập nhật thuộc tính isDelete
      { new: true }
    );

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sussessfully delete the tour",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed delete a tour. Try again",
    });
  }
};

// Get a tours
export const getSingleTour = async (req, res) => {
  const id = req.params.id;

  try {
    const tour = await Tour.findById(id).populate("reviews");

    res.status(200).json({
      success: true,
      message: "Sussessfully get single tour",
      data: tour,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the tour. Try again",
    });
  }
};

// Get all tour by user
export const getAllTourByUser = async (req, res) => {
  // pagianaion
  const page = parseInt(req.query.page);

  try {
    const tours = await Tour.find({isDelete: false})
      .populate("reviews")
      .skip(page * 16)
      .limit(16);

    res.status(200).json({
      success: true,
      count: tours.length,
      message: "Sussessfully get all tours",
      data: tours,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the tours. Try again",
    });
  }
};

// Get all tour by admin
export const getAllTourByAdminNoDelete = async (req, res) => {
  // pagianaion
  const page = parseInt(req.query.page);

  try {
    const tours = await Tour.find({isDelete: false})
      .populate("reviews")

    res.status(200).json({
      success: true,
      count: tours.length,
      message: "Sussessfully get all tours",
      data: tours,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the tours. Try again",
    });
  }
};

export const getAllTourByAdminDeleted = async (req, res) => {
  // pagianaion
  const page = parseInt(req.query.page);

  try {
    const tours = await Tour.find({isDelete: true})
      .populate("reviews")

    res.status(200).json({
      success: true,
      count: tours.length,
      message: "Sussessfully get all tours",
      data: tours,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the tours. Try again",
    });
  }
};

// get tour by search
export const getTourBySearch = async (req, res) => {
  // Tạo điều kiện tìm kiếm ban đầu là một đối tượng rỗng
  const searchConditions = {isDelete: false};

  // Kiểm tra từng trường và thêm vào điều kiện nếu có giá trị
  if (req.query.city) {
    searchConditions.city = new RegExp(req.query.city, "i");
  }
  if (req.query.day) {
    searchConditions.day = { $eq: parseInt(req.query.day) };
  }
  // if (req.query.maxGroupSize) {
  //   searchConditions.maxGroupSize = { $eq: parseInt(req.query.maxGroupSize) };
  // }

  if (req.query.maxGroupSize) {
    searchConditions.maxGroupSize = { $gte: parseInt(req.query.maxGroupSize) }; // Điều kiện lớn hơn hoặc bằng
  }

  try {
    // Thực hiện tìm kiếm với các điều kiện đã xây dựng
    const tours = await Tour.find(searchConditions).populate("reviews");

    res.status(200).json({
      success: true,
      message: "Successfully retrieved tours",
      data: tours,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Could not find tours. Please try again.",
    });
  }
};

// Get featured tour
export const getFeaturedTour = async (req, res) => {

  const page = parseInt(req.query.page);

  try {
    const tours = await Tour.find({ featured: true, isDelete: false })
      .populate("reviews")
      .skip(page * 8)
      .limit(8);

    res.status(200).json({
      success: true,
      message: "Sussessfully get featured tours",
      count: tours.length,
      data: tours,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the tours. Try again",
    });
  }
};

export const getDomesticTour = async (req, res) => {

  const page = parseInt(req.query.page);

  try {
    const tours = await Tour.find({ featured: false, isDelete: false })
      .populate("reviews")
      .skip(page * 8)
      .limit(8);

    res.status(200).json({
      success: true,
      message: "Sussessfully get featured tours",
      count: tours.length,
      data: tours,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not found the tours. Try again",
    });
  }
};

// get tour counts with all
export const getTourCount = async (req, res) => {
  try {
    // const tourCount = await Tour.estimatedDocumentCount();
    const tourCount = await Tour.countDocuments({ isDelete: false });

    res.status(200).json({
      success: true,
      data: tourCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch",
    });
  }
};

// get tour counts with ForeignTours
export const getForeignToursCount = async (req, res) => {
  try {
    const tourCount = await Tour.countDocuments({ featured: true, isDelete: false });

    res.status(200).json({
      success: true,
      data: tourCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch",
    });
  }
};

// get tour counts with DomesticTours
export const getDomesticToursCount = async (req, res) => {
  try {
    const tourCount = await Tour.countDocuments({ featured: false, isDelete: false });

    res.status(200).json({
      success: true,
      data: tourCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch",
    });
  }
};
