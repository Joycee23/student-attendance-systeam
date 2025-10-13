const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');
const { lecturerOrAdmin } = require('../middlewares/roleMiddleware');
const { 
  validateCreateNotification, 
  validateBroadcast, 
  validatePagination, 
  validateMongoId 
} = require('../middlewares/validation');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API quản lý thông báo
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 652f10a3f23a9d3a6b121d43
 *         title:
 *           type: string
 *           example: "Lịch học thay đổi"
 *         message:
 *           type: string
 *           example: "Buổi học thứ 3 sẽ dời sang thứ 5"
 *         recipient:
 *           type: string
 *           example: "student123"
 *         role:
 *           type: string
 *           enum: [student, lecturer, admin]
 *         classId:
 *           type: string
 *           example: "652f0d94e12a5c28b4a321f1"
 *         read:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - title
 *         - message
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của người dùng
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 */
router.get('/', protect, validatePagination, notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/unread/count:
 *   get:
 *     summary: Đếm số lượng thông báo chưa đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về số lượng chưa đọc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *                   example: 3
 */
router.get('/unread/count', protect, notificationController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/statistics:
 *   get:
 *     summary: Lấy thống kê thông báo (Admin hoặc Giảng viên)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dữ liệu thống kê
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/statistics', protect, lecturerOrAdmin, notificationController.getStatistics);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Tạo thông báo mới (Admin hoặc Giảng viên)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       201:
 *         description: Thông báo được tạo thành công
 */
router.post('/', protect, lecturerOrAdmin, validateCreateNotification, notificationController.createNotification);

/**
 * @swagger
 * /api/notifications/broadcast:
 *   post:
 *     summary: Gửi thông báo broadcast đến vai trò hoặc lớp học
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               target:
 *                 type: string
 *                 example: "class"
 *               targetId:
 *                 type: string
 *                 example: "652f0d94e12a5c28b4a321f1"
 *     responses:
 *       200:
 *         description: Gửi thông báo broadcast thành công
 */
router.post('/broadcast', protect, lecturerOrAdmin, validateBroadcast, notificationController.broadcast);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Đánh dấu tất cả thông báo là đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã đánh dấu tất cả là đã đọc
 */
router.patch('/read-all', protect, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết thông báo
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về chi tiết thông báo
 */
router.get('/:id', protect, validateMongoId, notificationController.getNotificationById);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Đánh dấu một thông báo là đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 */
router.patch('/:id/read', protect, validateMongoId, notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Xóa thông báo
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thông báo thành công
 */
router.delete('/:id', protect, validateMongoId, notificationController.deleteNotification);

module.exports = router;
