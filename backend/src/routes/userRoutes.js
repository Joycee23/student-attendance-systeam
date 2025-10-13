const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/roleMiddleware');
const { 
  validateCreateUser, 
  validateUpdateUser, 
  validatePagination, 
  validateMongoId 
} = require('../middlewares/validation');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API quản lý người dùng (Admin / Lecturer / Student)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trả về danh sách người dùng
 */
router.get('/', protect, adminOnly, validatePagination, userController.getAllUsers);

/**
 * @swagger
 * /api/users/statistics:
 *   get:
 *     summary: Lấy thống kê người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê tổng số người dùng, giảng viên, sinh viên, ...
 */
router.get('/statistics', protect, adminOnly, userController.getUserStatistics);

/**
 * @swagger
 * /api/users/students/class/{classId}:
 *   get:
 *     summary: Lấy danh sách sinh viên theo lớp học
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của lớp học
 */
router.get('/students/class/:classId', protect, validateMongoId, userController.getStudentsByClass);

/**
 * @swagger
 * /api/users/lecturers/course/{courseId}:
 *   get:
 *     summary: Lấy danh sách giảng viên theo khóa học
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 */
router.get('/lecturers/course/:courseId', protect, validateMongoId, userController.getLecturersByCourse);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo người dùng mới
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, lecturer, student]
 *     responses:
 *       201:
 *         description: Tạo người dùng thành công
 */
router.post('/', protect, adminOnly, validateCreateUser, userController.createUser);

/**
 * @swagger
 * /api/users/bulk:
 *   post:
 *     summary: Tạo nhiều người dùng cùng lúc
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Tạo nhiều người dùng thành công
 */
router.post('/bulk', protect, adminOnly, userController.bulkCreateUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy thông tin người dùng theo ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', protect, validateMongoId, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', protect, validateMongoId, validateUpdateUser, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa người dùng theo ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', protect, adminOnly, validateMongoId, userController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/toggle-status:
 *   patch:
 *     summary: Kích hoạt / vô hiệu hóa người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/toggle-status', protect, adminOnly, validateMongoId, userController.toggleUserStatus);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   put:
 *     summary: Đặt lại mật khẩu người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/reset-password', protect, adminOnly, validateMongoId, userController.resetUserPassword);

module.exports = router;
