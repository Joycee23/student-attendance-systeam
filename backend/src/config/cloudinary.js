const cloudinary = require('cloudinary').v2;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload ảnh lên Cloudinary
const uploadToCloudinary = async (filePath, folder = 'attendance') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format
    };
  } catch (error) {
    throw new Error(`Lỗi upload ảnh: ${error.message}`);
  }
};

// Upload nhiều ảnh
const uploadMultipleToCloudinary = async (filePaths, folder = 'attendance') => {
  try {
    const uploadPromises = filePaths.map(filePath => 
      uploadToCloudinary(filePath, folder)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new Error(`Lỗi upload nhiều ảnh: ${error.message}`);
  }
};

// Xóa ảnh từ Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    throw new Error(`Lỗi xóa ảnh: ${error.message}`);
  }
};

// Xóa nhiều ảnh
const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    await cloudinary.api.delete_resources(publicIds);
    return true;
  } catch (error) {
    throw new Error(`Lỗi xóa nhiều ảnh: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary
};