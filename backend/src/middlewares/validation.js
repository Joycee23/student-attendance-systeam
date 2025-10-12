const { body, param, query, validationResult } = require('express-validator');

// @desc    Handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

// ==================== AUTH VALIDATIONS ====================

const validateRegister = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('role')
    .optional()
    .isIn(['admin', 'lecturer', 'student']).withMessage('Invalid role'),
  
  body('studentCode')
    .if(body('role').equals('student'))
    .notEmpty().withMessage('Student code is required for students'),
  
  body('lecturerCode')
    .if(body('role').equals('lecturer'))
    .notEmpty().withMessage('Lecturer code is required for lecturers'),
  
  validate
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  validate
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  validate
];

const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  validate
];

const validateResetPassword = [
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  param('token')
    .notEmpty().withMessage('Reset token is required'),
  
  validate
];

// ==================== USER VALIDATIONS ====================

const validateCreateUser = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'lecturer', 'student']).withMessage('Invalid role'),
  
  validate
];

const validateUpdateUser = [
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  
  validate
];

// ==================== CLASS VALIDATIONS ====================

const validateCreateClass = [
  body('name')
    .trim()
    .notEmpty().withMessage('Class name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Class name must be between 3 and 50 characters')
    .toUpperCase(),
  
  body('lecturerId')
    .notEmpty().withMessage('Lecturer is required')
    .isMongoId().withMessage('Invalid lecturer ID'),
  
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 200 }).withMessage('Max students must be between 1 and 200'),
  
  validate
];

const validateUpdateClass = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Class name must be between 3 and 50 characters')
    .toUpperCase(),
  
  body('lecturerId')
    .optional()
    .isMongoId().withMessage('Invalid lecturer ID'),
  
  validate
];

const validateAddStudent = [
  body('studentId')
    .notEmpty().withMessage('Student ID is required')
    .isMongoId().withMessage('Invalid student ID'),
  
  validate
];

// ==================== SUBJECT VALIDATIONS ====================

const validateCreateSubject = [
  body('code')
    .trim()
    .notEmpty().withMessage('Subject code is required')
    .isLength({ min: 3, max: 20 }).withMessage('Subject code must be between 3 and 20 characters')
    .toUpperCase(),
  
  body('name')
    .trim()
    .notEmpty().withMessage('Subject name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Subject name must be between 3 and 200 characters'),
  
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
  
  validate
];

const validateUpdateSubject = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Subject name must be between 3 and 200 characters'),
  
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
  
  validate
];

// ==================== ATTENDANCE VALIDATIONS ====================

const validateCreateSession = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),
  
  body('classId')
    .notEmpty().withMessage('Class ID is required')
    .isMongoId().withMessage('Invalid class ID'),
  
  body('sessionDate')
    .notEmpty().withMessage('Session date is required')
    .isISO8601().withMessage('Invalid date format')
    .toDate(),
  
  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .isISO8601().withMessage('Invalid start time format')
    .toDate(),
  
  body('endTime')
    .notEmpty().withMessage('End time is required')
    .isISO8601().withMessage('Invalid end time format')
    .toDate()
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required'),
  
  body('sessionNumber')
    .notEmpty().withMessage('Session number is required')
    .isInt({ min: 1 }).withMessage('Session number must be at least 1'),
  
  validate
];

const validateManualCheckIn = [
  body('sessionId')
    .notEmpty().withMessage('Session ID is required')
    .isMongoId().withMessage('Invalid session ID'),
  
  body('studentId')
    .notEmpty().withMessage('Student ID is required')
    .isMongoId().withMessage('Invalid student ID'),
  
  body('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status'),
  
  validate
];

const validateQRCheckIn = [
  body('qrCode')
    .notEmpty().withMessage('QR code is required')
    .isString().withMessage('QR code must be a string'),
  
  validate
];

const validateFaceCheckIn = [
  body('sessionId')
    .notEmpty().withMessage('Session ID is required')
    .isMongoId().withMessage('Invalid session ID'),
  
  body('imageBase64')
    .notEmpty().withMessage('Face image is required')
    .isString().withMessage('Image must be base64 string'),
  
  validate
];

const validateGPSCheckIn = [
  body('sessionId')
    .notEmpty().withMessage('Session ID is required')
    .isMongoId().withMessage('Invalid session ID'),
  
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  
  validate
];

// ==================== NOTIFICATION VALIDATIONS ====================

const validateCreateNotification = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
  
  body('userIds')
    .isArray({ min: 1 }).withMessage('At least one recipient is required')
    .custom((value) => {
      if (!value.every(id => /^[0-9a-fA-F]{24}$/.test(id))) {
        throw new Error('Invalid user ID in recipients');
      }
      return true;
    }),
  
  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['attendance', 'system', 'reminder', 'announcement', 'warning', 'success', 'info', 'session', 'grade', 'absence', 'late', 'excuse'])
    .withMessage('Invalid notification type'),
  
  validate
];

const validateBroadcast = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required'),
  
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required'),
  
  body('role')
    .optional()
    .isIn(['admin', 'lecturer', 'student']).withMessage('Invalid role'),
  
  validate
];

// ==================== SETTINGS VALIDATIONS ====================

const validateUpdateSettings = [
  body('attendanceTimeout')
    .optional()
    .isInt({ min: 5, max: 480 }).withMessage('Attendance timeout must be between 5 and 480 minutes'),
  
  body('minConfidence')
    .optional()
    .isFloat({ min: 0, max: 1 }).withMessage('Min confidence must be between 0 and 1'),
  
  body('lateThreshold')
    .optional()
    .isInt({ min: 0, max: 60 }).withMessage('Late threshold must be between 0 and 60 minutes'),
  
  validate
];

// ==================== REPORT VALIDATIONS ====================

const validateGenerateReport = [
  body('format')
    .optional()
    .isIn(['excel', 'pdf']).withMessage('Format must be excel or pdf'),
  
  body('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format')
    .toDate(),
  
  body('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
    .toDate()
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  validate
];

// ==================== QUERY VALIDATIONS ====================

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be at least 1')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  validate
];

const validateMongoId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  
  validate
];

module.exports = {
  validate,
  
  // Auth
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  
  // User
  validateCreateUser,
  validateUpdateUser,
  
  // Class
  validateCreateClass,
  validateUpdateClass,
  validateAddStudent,
  
  // Subject
  validateCreateSubject,
  validateUpdateSubject,
  
  // Attendance
  validateCreateSession,
  validateManualCheckIn,
  validateQRCheckIn,
  validateFaceCheckIn,
  validateGPSCheckIn,
  
  // Notification
  validateCreateNotification,
  validateBroadcast,
  
  // Settings
  validateUpdateSettings,
  
  // Report
  validateGenerateReport,
  
  // Query
  validatePagination,
  validateMongoId
};