/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: API quản lý cấu hình hệ thống — AI, Attendance, Notifications, Storage, Security, Features, Maintenance, Validation
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, optionalAuth } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/roleMiddleware');
const { validateUpdateSettings } = require('../middlewares/validation');

/**
 * @swagger
 * /api/settings/public:
 *   get:
 *     summary: Lấy thông tin cấu hình công khai
 *     description: Trả về các cấu hình có thể truy cập công khai (không cần đăng nhập).
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 siteName: "Student Attendance System"
 *                 maintenanceMode: false
 */
router.get('/public', optionalAuth, settingsController.getPublicSettings);

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Lấy toàn bộ cấu hình hệ thống
 *     description: Chỉ Admin có quyền xem các thiết lập toàn hệ thống.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách cấu hình hệ thống
 */
router.get('/', protect, adminOnly, settingsController.getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Cập nhật cấu hình hệ thống
 *     description: Chỉ Admin có thể cập nhật cấu hình toàn hệ thống.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteName:
 *                 type: string
 *                 example: "Student Attendance Portal"
 *               timezone:
 *                 type: string
 *                 example: "Asia/Ho_Chi_Minh"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/', protect, adminOnly, validateUpdateSettings, settingsController.updateSettings);

/**
 * @swagger
 * /api/settings/attendance:
 *   put:
 *     summary: Cập nhật cấu hình điểm danh
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             lateThreshold: 15
 *             autoMarkAbsent: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/attendance', protect, adminOnly, settingsController.updateAttendanceSettings);

/**
 * @swagger
 * /api/settings/ai:
 *   put:
 *     summary: Cập nhật cấu hình AI
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             aiProvider: "OpenAI"
 *             apiKey: "sk-xxxxx"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/ai', protect, adminOnly, settingsController.updateAISettings);

/**
 * @swagger
 * /api/settings/storage:
 *   put:
 *     summary: Cập nhật cấu hình lưu trữ
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             provider: "Supabase"
 *             bucket: "attendance-photos"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/storage', protect, adminOnly, settingsController.updateStorageSettings);

/**
 * @swagger
 * /api/settings/notifications:
 *   put:
 *     summary: Cập nhật cấu hình thông báo
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             emailEnabled: true
 *             pushEnabled: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/notifications', protect, adminOnly, settingsController.updateNotificationSettings);

/**
 * @swagger
 * /api/settings/security:
 *   put:
 *     summary: Cập nhật cấu hình bảo mật
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             twoFactorAuth: true
 *             passwordPolicy:
 *               minLength: 8
 *               requireSymbols: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/security', protect, adminOnly, settingsController.updateSecuritySettings);

/**
 * @swagger
 * /api/settings/features:
 *   put:
 *     summary: Cập nhật các feature flags
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             aiEnabled: true
 *             autoSyncEnabled: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/features', protect, adminOnly, settingsController.updateFeatures);

/**
 * @swagger
 * /api/settings/maintenance:
 *   patch:
 *     summary: Bật/tắt chế độ bảo trì hệ thống
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trạng thái bảo trì được cập nhật
 */
router.patch('/maintenance', protect, adminOnly, settingsController.toggleMaintenanceMode);

/**
 * @swagger
 * /api/settings/validate/ai-service:
 *   get:
 *     summary: Kiểm tra kết nối với dịch vụ AI
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kết quả kiểm tra kết nối AI
 */
router.get('/validate/ai-service', protect, adminOnly, settingsController.validateAIService);

/**
 * @swagger
 * /api/settings/validate/storage:
 *   get:
 *     summary: Kiểm tra cấu hình lưu trữ
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kiểm tra cấu hình lưu trữ thành công
 */
router.get('/validate/storage', protect, adminOnly, settingsController.validateStorage);

/**
 * @swagger
 * /api/settings/validate/email:
 *   get:
 *     summary: Kiểm tra cấu hình email
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cấu hình email hợp lệ
 */
router.get('/validate/email', protect, adminOnly, settingsController.validateEmail);

/**
 * @swagger
 * /api/settings/validate/all:
 *   get:
 *     summary: Kiểm tra tất cả các cấu hình hệ thống
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kết quả kiểm tra tổng hợp
 */
router.get('/validate/all', protect, adminOnly, settingsController.validateAllConfigs);

/**
 * @swagger
 * /api/settings/reset:
 *   post:
 *     summary: Đặt lại toàn bộ cấu hình về mặc định
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đặt lại thành công
 */
router.post('/reset', protect, adminOnly, settingsController.resetToDefaults);

/**
 * @swagger
 * /api/settings/history:
 *   get:
 *     summary: Lấy lịch sử thay đổi cấu hình
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch sử thay đổi
 */
router.get('/history', protect, adminOnly, settingsController.getConfigHistory);

module.exports = router;
