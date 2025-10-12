const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');
const { lecturerOrAdmin, studentOnly } = require('../middlewares/roleMiddleware');
const { 
  validateCreateSession,
  validateManualCheckIn,
  validateQRCheckIn,
  validateFaceCheckIn,
  validateGPSCheckIn,
  validatePagination,
  validateMongoId
} = require('../middlewares/validation');
const { faceRecognitionLimiter } = require('../middlewares/rateLimitMiddleware');

// ==================== SESSION MANAGEMENT ====================

// @route   GET /api/attendance/sessions
// @desc    Get all attendance sessions
// @access  Private
router.get('/sessions', protect, validatePagination, attendanceController.getAllSessions);

// @route   POST /api/attendance/sessions
// @desc    Create attendance session
// @access  Private (Lecturer)
router.post('/sessions', protect, lecturerOrAdmin, validateCreateSession, attendanceController.createSession);

// @route   GET /api/attendance/sessions/:id
// @desc    Get session by ID
// @access  Private
router.get('/sessions/:id', protect, validateMongoId, attendanceController.getSessionById);

// @route   PUT /api/attendance/sessions/:id
// @desc    Update session
// @access  Private (Lecturer who owns the session)
router.put('/sessions/:id', protect, lecturerOrAdmin, validateMongoId, attendanceController.updateSession);

// @route   PATCH /api/attendance/sessions/:id/close
// @desc    Close session
// @access  Private (Lecturer)
router.patch('/sessions/:id/close', protect, lecturerOrAdmin, validateMongoId, attendanceController.closeSession);

// @route   PATCH /api/attendance/sessions/:id/cancel
// @desc    Cancel session
// @access  Private (Lecturer)
router.patch('/sessions/:id/cancel', protect, lecturerOrAdmin, validateMongoId, attendanceController.cancelSession);

// @route   POST /api/attendance/sessions/:id/qr-code
// @desc    Generate QR code for session
// @access  Private (Lecturer)
router.post('/sessions/:id/qr-code', protect, lecturerOrAdmin, validateMongoId, attendanceController.generateQRCode);

// ==================== CHECK-IN METHODS ====================

// @route   POST /api/attendance/check-in/manual
// @desc    Manual attendance check-in (Lecturer marks student)
// @access  Private (Lecturer)
router.post('/check-in/manual', protect, lecturerOrAdmin, validateManualCheckIn, attendanceController.manualCheckIn);

// @route   POST /api/attendance/check-in/qr
// @desc    QR code check-in (Student scans QR)
// @access  Private (Student)
router.post('/check-in/qr', protect, studentOnly, validateQRCheckIn, attendanceController.qrCodeCheckIn);

// @route   POST /api/attendance/check-in/face
// @desc    Face recognition check-in (Student uses camera)
// @access  Private (Student)
router.post('/check-in/face', protect, studentOnly, faceRecognitionLimiter, validateFaceCheckIn, attendanceController.faceRecognitionCheckIn);

// @route   POST /api/attendance/check-in/gps
// @desc    GPS location check-in (Student uses location)
// @access  Private (Student)
router.post('/check-in/gps', protect, studentOnly, validateGPSCheckIn, attendanceController.gpsCheckIn);

// ==================== ATTENDANCE HISTORY ====================

// @route   GET /api/attendance/history
// @desc    Get attendance history
// @access  Private
router.get('/history', protect, validatePagination, attendanceController.getAttendanceHistory);

// ==================== STATISTICS ====================

// @route   GET /api/attendance/statistics/student/:studentId
// @desc    Get student attendance statistics
// @access  Private (Student themselves or Admin/Lecturer)
router.get('/statistics/student/:studentId', protect, validateMongoId, attendanceController.getStudentStatistics);

// @route   GET /api/attendance/statistics/session/:sessionId
// @desc    Get session statistics
// @access  Private
router.get('/statistics/session/:sessionId', protect, validateMongoId, attendanceController.getSessionStatistics);

module.exports = router;