/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: API tạo báo cáo điểm danh và thống kê
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly, lecturerOrAdmin } = require('../middlewares/roleMiddleware');
const { validateGenerateReport } = require('../middlewares/validation');

/**
 * @swagger
 * /api/reports/class-attendance:
 *   post:
 *     summary: Tạo báo cáo điểm danh theo lớp (Excel/PDF)
 *     description: Cho phép Admin hoặc Giảng viên xuất báo cáo điểm danh theo lớp học.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               classId:
 *                 type: string
 *                 example: "66f24abcf9123d00123c9999"
 *               format:
 *                 type: string
 *                 enum: [pdf, excel]
 *                 example: pdf
 *     responses:
 *       200:
 *         description: Trả về file báo cáo đã tạo
 *       400:
 *         description: Thiếu dữ liệu hoặc sai định dạng
 *       401:
 *         description: Không có quyền truy cập
 */
router.post(
  '/class-attendance',
  protect,
  lecturerOrAdmin,
  validateGenerateReport,
  reportController.generateClassAttendanceReport
);

/**
 * @swagger
 * /api/reports/student-attendance:
 *   post:
 *     summary: Tạo báo cáo điểm danh cho sinh viên
 *     description: Sinh viên có thể tạo báo cáo điểm danh cá nhân. Giảng viên/Admin có thể tạo cho bất kỳ sinh viên nào.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *                 example: "66f249def9123d00123c7777"
 *               format:
 *                 type: string
 *                 enum: [pdf, excel]
 *                 example: excel
 *     responses:
 *       200:
 *         description: Trả về file báo cáo sinh viên
 *       400:
 *         description: Thiếu dữ liệu hoặc sai định dạng
 *       401:
 *         description: Không có quyền truy cập
 */
router.post(
  '/student-attendance',
  protect,
  validateGenerateReport,
  reportController.generateStudentAttendanceReport
);

/**
 * @swagger
 * /api/reports/course-attendance:
 *   post:
 *     summary: Tạo báo cáo điểm danh theo môn học
 *     description: Giảng viên hoặc Admin có thể tạo báo cáo tổng hợp theo môn học.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *                 example: "66f248aaf9123d00123c8888"
 *               format:
 *                 type: string
 *                 enum: [pdf, excel]
 *                 example: excel
 *     responses:
 *       200:
 *         description: File báo cáo môn học
 *       400:
 *         description: Thiếu dữ liệu hoặc sai định dạng
 *       401:
 *         description: Không có quyền truy cập
 */
router.post(
  '/course-attendance',
  protect,
  lecturerOrAdmin,
  validateGenerateReport,
  reportController.generateCourseAttendanceReport
);

/**
 * @swagger
 * /api/reports/attendance-summary:
 *   post:
 *     summary: Tạo báo cáo tổng hợp điểm danh toàn hệ thống
 *     description: Chỉ Admin có quyền tạo báo cáo tổng hợp toàn bộ hệ thống.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dateRange:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     example: "2025-01-01"
 *                   end:
 *                     type: string
 *                     example: "2025-12-31"
 *               format:
 *                 type: string
 *                 enum: [pdf, excel]
 *                 example: pdf
 *     responses:
 *       200:
 *         description: File báo cáo tổng hợp toàn hệ thống
 *       400:
 *         description: Thiếu dữ liệu hoặc sai định dạng
 *       401:
 *         description: Không có quyền truy cập
 */
router.post(
  '/attendance-summary',
  protect,
  adminOnly,
  validateGenerateReport,
  reportController.generateAttendanceSummary
);

module.exports = router;
