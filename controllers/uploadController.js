import cloudinary from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload an avatar image
export const uploadImageAvatar = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" }); // Return error if no file is uploaded
    }

    // Upload file to Cloudinary under the "avatars" folder
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: "avatars",
    });


    fs.unlinkSync(file.path);

    // Return the uploaded image URL
    res.json({
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    res.status(500).json({ message: "Error uploading to Cloudinary" });
  }
};

// Function to upload a general image
export const uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" }); // Return error if no file is uploaded
    }

    // Upload file to Cloudinary under the "images" folder
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: "images",
    });

    // Delete the local file after uploading
    fs.unlinkSync(file.path);

    // Return the uploaded image URL
    res.json({
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    res.status(500).json({ message: "Error uploading to Cloudinary" });
  }
};
