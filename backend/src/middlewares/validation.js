const { validationResult } = require('express-validator');

// Middleware xử lý validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Validation cho file upload
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      status: 'error',
      message: 'Vui lòng upload file'
    });
  }

  const file = req.file || req.files[0];
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({
      status: 'error',
      message: 'Chỉ chấp nhận file ảnh (JPEG, JPG, PNG)'
    });
  }

  if (file.size > maxSize) {
    return res.status(400).json({
      status: 'error',
      message: 'Kích thước file không được vượt quá 5MB'
    });
  }

  next();
};

// Validation cho nhiều file
const validateMultipleFiles = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Vui lòng upload ít nhất 1 file'
    });
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const maxFiles = 10;

  if (req.files.length > maxFiles) {
    return res.status(400).json({
      status: 'error',
      message: `Chỉ được upload tối đa ${maxFiles} file`
    });
  }

  for (const file of req.files) {
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        status: 'error',
        message: 'Chỉ chấp nhận file ảnh (JPEG, JPG, PNG)'
      });
    }

    if (file.size > maxSize) {
      return res.status(400).json({
        status: 'error',
        message: 'Kích thước mỗi file không được vượt quá 5MB'
      });
    }
  }

  next();
};

// Validation cho ObjectId
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        status: 'error',
        message: `${paramName} không hợp lệ`
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  validateFileUpload,
  validateMultipleFiles,
  validateObjectId
};