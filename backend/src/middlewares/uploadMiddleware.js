const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = {
  faces: path.join(__dirname, '../../uploads/faces'),
  temp: path.join(__dirname, '../../uploads/temp'),
  avatars: path.join(__dirname, '../../uploads/avatars'),
  documents: path.join(__dirname, '../../uploads/documents')
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type or route
    let dest = uploadDirs.temp;

    if (req.path.includes('face') || req.path.includes('avatar')) {
      dest = uploadDirs.faces;
    } else if (req.path.includes('avatar')) {
      dest = uploadDirs.avatars;
    } else if (req.path.includes('document')) {
      dest = uploadDirs.documents;
    }

    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const allowedTypes = {
    image: /jpeg|jpg|png|gif/,
    document: /pdf|doc|docx|txt/,
    excel: /xlsx|xls|csv/
  };

  const extname = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimetype = file.mimetype;

  // Check if image
  if (mimetype.startsWith('image/')) {
    if (allowedTypes.image.test(extname)) {
      return cb(null, true);
    }
  }

  // Check if document
  if (allowedTypes.document.test(extname)) {
    return cb(null, true);
  }

  // Check if excel
  if (allowedTypes.excel.test(extname)) {
    return cb(null, true);
  }

  cb(new Error(`Invalid file type. Only ${Object.values(allowedTypes).join(', ')} are allowed`));
};

// @desc    General file upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: fileFilter
});

// @desc    Image upload middleware (stricter)
const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB for images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error('Only .jpg, .jpeg, and .png files are allowed for images'));
  }
});

// @desc    Face image upload (very strict)
const uploadFace = multer({
  storage: multer.diskStorage({
    destination: uploadDirs.faces,
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const studentId = req.user?.id || 'unknown';
      cb(null, `face-${studentId}-${uniqueSuffix}.jpg`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error('Only .jpg, .jpeg, and .png files are allowed for face images'));
  }
});

// @desc    Document upload
const uploadDocument = multer({
  storage: multer.diskStorage({
    destination: uploadDirs.documents,
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `doc-${name}-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|xlsx|xls|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
      return cb(null, true);
    }

    cb(new Error('Only PDF, DOC, DOCX, TXT, XLSX, XLS, CSV files are allowed'));
  }
});

// @desc    Multiple files upload
const uploadMultiple = upload.array('files', 10); // Max 10 files

// @desc    Single file upload
const uploadSingle = upload.single('file');

// @desc    Single image upload
const uploadSingleImage = uploadImage.single('image');

// @desc    Multiple images upload
const uploadMultipleImages = uploadImage.array('images', 5); // Max 5 images

// @desc    Face image upload
const uploadSingleFace = uploadFace.single('face');

// @desc    Document upload
const uploadSingleDocument = uploadDocument.single('document');

// @desc    Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files'
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field in file upload'
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next();
};

// @desc    Clean up temp files
const cleanupTempFiles = () => {
  const tempDir = uploadDirs.temp;
  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  files.forEach(file => {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;

    if (age > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old temp file: ${file}`);
    }
  });
};

// Run cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

module.exports = {
  upload,
  uploadImage,
  uploadFace,
  uploadDocument,
  uploadSingle,
  uploadMultiple,
  uploadSingleImage,
  uploadMultipleImages,
  uploadSingleFace,
  uploadSingleDocument,
  handleMulterError,
  uploadDirs
};