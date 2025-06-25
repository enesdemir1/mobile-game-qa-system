const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadDir = 'uploads/';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    'video': ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
    'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    'other': ['application/zip', 'application/x-rar-compressed']
  };

  const maxSizes = {
    'image': 5 * 1024 * 1024, // 5MB
    'video': 50 * 1024 * 1024, // 50MB
    'document': 10 * 1024 * 1024, // 10MB
    'other': 20 * 1024 * 1024 // 20MB
  };

  // Check file type
  let fileType = 'other';
  for (const [type, mimeTypes] of Object.entries(allowedTypes)) {
    if (mimeTypes.includes(file.mimetype)) {
      fileType = type;
      break;
    }
  }

  // Check file size
  if (file.size > maxSizes[fileType]) {
    return cb(new Error(`File size too large. Maximum size for ${fileType} files is ${maxSizes[fileType] / (1024 * 1024)}MB`), false);
  }

  file.fileType = fileType;
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10 // Max 10 files
  }
});

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'qa-system') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // Delete local file after upload
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    logger.error('Error uploading to Cloudinary:', error);
    
    // Delete local file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    throw new Error('File upload failed');
  }
};

// Upload multiple files
const uploadMultipleFiles = async (files, folder = 'qa-system') => {
  const uploadPromises = files.map(file => uploadToCloudinary(file.path, folder));
  
  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    logger.error('Error uploading multiple files:', error);
    throw new Error('Multiple file upload failed');
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error('Error deleting from Cloudinary:', error);
    throw new Error('File deletion failed');
  }
};

// Get file info from Cloudinary
const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
      createdAt: result.created_at
    };
  } catch (error) {
    logger.error('Error getting file info from Cloudinary:', error);
    throw new Error('Failed to get file info');
  }
};

// Generate thumbnail for images
const generateThumbnail = async (publicId, width = 200, height = 200) => {
  try {
    const result = await cloudinary.url(publicId, {
      transformation: [
        { width: width, height: height, crop: 'fill' },
        { quality: 'auto' }
      ]
    });
    return result;
  } catch (error) {
    logger.error('Error generating thumbnail:', error);
    throw new Error('Thumbnail generation failed');
  }
};

// Upload base64 image
const uploadBase64Image = async (base64String, folder = 'qa-system') => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    logger.error('Error uploading base64 image:', error);
    throw new Error('Base64 image upload failed');
  }
};

// Validate file type
const validateFileType = (mimeType) => {
  const allowedTypes = {
    'image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    'video': ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
    'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    'other': ['application/zip', 'application/x-rar-compressed']
  };

  for (const [type, mimeTypes] of Object.entries(allowedTypes)) {
    if (mimeTypes.includes(mimeType)) {
      return type;
    }
  }
  return 'other';
};

module.exports = {
  upload,
  uploadToCloudinary,
  uploadMultipleFiles,
  deleteFromCloudinary,
  getFileInfo,
  generateThumbnail,
  uploadBase64Image,
  validateFileType
}; 