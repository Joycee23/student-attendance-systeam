const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly, lecturerOrAdmin } = require('../middlewares/roleMiddleware');
const { validateMongoId } = require('../middlewares/validation');

// @route   GET /api/statistics/overview
// @desc    Get overview statistics
// @access  Private (Admin)
router.get('/overview', protect, adminOnly, statisticsController.getOverview);

// @route   GET /api/statistics/class/:classId
// @desc    Get class statistics
// @access  Private
router.get('/class/:classId', protect, validateMongoId, statisticsController.getClassStatistics);

// @route   GET /api/statistics/student/:studentId
// @desc    Get student statistics
// @access  Private (Student themselves or Admin/Lecturer)
router.get('/student/:studentId', protect, validateMongoId, statisticsController.getStudentStatistics);

// @route   GET /api/statistics/lecturer/:lecturerId
// @desc    Get lecturer statistics
// @access  Private
router.get('/lecturer/:lecturerId', protect, validateMongoId, statisticsController.getLecturerStatistics);

// @route   GET /api/statistics/trends
// @desc    Get attendance trends
// @access  Private (Admin)
router.get('/trends', protect, adminOnly, statisticsController.getAttendanceTrends);

module.exports = router;