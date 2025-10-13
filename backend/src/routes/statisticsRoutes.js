const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/roleMiddleware');
const { validateMongoId } = require('../middlewares/validation');

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: API thống kê hệ thống (dành cho Admin, Lecturer, Student)
 */

/**
 * @swagger
 * /api/statistics/overview:
 *   get:
 *     summary: Lấy thống kê tổng quan hệ thống (tổng người dùng, lớp học, tỷ lệ điểm danh, ...)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê tổng quan hệ thống
 */
router.get('/overview', protect, adminOnly, statisticsController.getOverview);

/**
 * @swagger
 * /api/statistics/class/{classId}:
 *   get:
 *     summary: Lấy thống kê điểm danh cho một lớp cụ thể
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của lớp học cần lấy thống kê
 *     responses:
 *       200:
 *         description: Trả về thống kê của lớp học
 */
router.get('/class/:classId', protect, validateMongoId, statisticsController.getClassStatistics);

/**
 * @swagger
 * /api/statistics/student/{studentId}:
 *   get:
 *     summary: Lấy thống kê điểm danh của một sinh viên
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sinh viên
 *     responses:
 *       200:
 *         description: Trả về thống kê điểm danh của sinh viên
 */
router.get('/student/:studentId', protect, validateMongoId, statisticsController.getStudentStatistics);

/**
 * @swagger
 * /api/statistics/lecturer/{lecturerId}:
 *   get:
 *     summary: Lấy thống kê điểm danh của một giảng viên
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecturerId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID giảng viên
 *     responses:
 *       200:
 *         description: Trả về thống kê điểm danh của giảng viên
 */
router.get('/lecturer/:lecturerId', protect, validateMongoId, statisticsController.getLecturerStatistics);

/**
 * @swagger
 * /api/statistics/trends:
 *   get:
 *     summary: Lấy xu hướng điểm danh (theo tuần / tháng)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month]
 *           default: month
 *         description: Khoảng thời gian thống kê
 *     responses:
 *       200:
 *         description: Biểu đồ xu hướng điểm danh
 */
router.get('/trends', protect, adminOnly, statisticsController.getAttendanceTrends);

module.exports = router;
