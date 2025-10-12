const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly, lecturerOrAdmin } = require('../middlewares/roleMiddleware');
const { validateGenerateReport } = require('../middlewares/validation');

// @route   POST /api/reports/class-attendance
// @desc    Generate class attendance report (Excel/PDF)
// @access  Private (Admin/Lecturer)
router.post('/class-attendance', protect, lecturerOrAdmin, validateGenerateReport, reportController.generateClassAttendanceReport);

// @route   POST /api/reports/student-attendance
// @desc    Generate student attendance report (Excel/PDF)
// @access  Private (Student themselves or Admin/Lecturer)
router.post('/student-attendance', protect, validateGenerateReport, reportController.generateStudentAttendanceReport);

// @route   POST /api/reports/course-attendance
// @desc    Generate course attendance report (Excel/PDF)
// @access  Private (Admin/Lecturer)
router.post('/course-attendance', protect, lecturerOrAdmin, validateGenerateReport, reportController.generateCourseAttendanceReport);

// @route   POST /api/reports/attendance-summary
// @desc    Generate attendance summary report (Excel/PDF)
// @access  Private (Admin)
router.post('/attendance-summary', protect, adminOnly, validateGenerateReport, reportController.generateAttendanceSummary);

module.exports = router;