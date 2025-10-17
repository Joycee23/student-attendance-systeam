const express = require('express');
const router = express.Router();
const faceEncodingController = require('../controllers/faceEncodingController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/roleMiddleware');
const {
  validateMongoId,
  validatePagination
} = require('../middlewares/validation');

/**
 * @swagger
 * tags:
 *   name: Face Encodings
 *   description: API quản lý dữ liệu nhận dạng khuôn mặt
 */

/**
 * @swagger
 * /api/face-encodings:
 *   get:
 *     summary: Lấy danh sách tất cả dữ liệu face encoding
 *     tags: [Face Encodings]
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
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, mã sinh viên, email
 *     responses:
 *       200:
 *         description: Trả về danh sách face encodings
 */
router.get('/', protect, adminOnly, validatePagination, faceEncodingController.getAllFaceEncodings);

/**
 * @swagger
 * /api/face-encodings/statistics:
 *   get:
 *     summary: Lấy thống kê face encoding
 *     tags: [Face Encodings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê về face encodings
 */
router.get('/statistics', protect, adminOnly, faceEncodingController.getFaceEncodingStatistics);

/**
 * @swagger
 * /api/face-encodings/user/{userId}:
 *   get:
 *     summary: Lấy face encoding theo user ID
 *     tags: [Face Encodings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng
 */
router.get('/user/:userId', protect, validateMongoId, faceEncodingController.getFaceEncodingByUser);

/**
 * @swagger
 * /api/face-encodings:
 *   post:
 *     summary: Đăng ký face encoding mới
 *     tags: [Face Encodings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - imageBase64
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: ID của sinh viên
 *               imageBase64:
 *                 type: string
 *                 description: Ảnh khuôn mặt dạng base64
 *     responses:
 *       201:
 *         description: Đăng ký face encoding thành công
 */
router.post('/', protect, faceEncodingController.registerFaceEncoding);

/**
 * @swagger
 * /api/face-encodings/{id}:
 *   get:
 *     summary: Lấy thông tin face encoding theo ID
 *     tags: [Face Encodings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của face encoding
 */
router.get('/:id', protect, validateMongoId, faceEncodingController.getFaceEncodingById);

/**
 * @swagger
 * /api/face-encodings/{id}:
 *   put:
 *     summary: Cập nhật face encoding
 *     tags: [Face Encodings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageBase64
 *             properties:
 *               imageBase64:
 *                 type: string
 *                 description: Ảnh khuôn mặt mới dạng base64
 *     responses:
 *       200:
 *         description: Cập nhật face encoding thành công
 */
router.put('/:id', protect, validateMongoId, faceEncodingController.updateFaceEncoding);

/**
 * @swagger
 * /api/face-encodings/{id}:
 *   delete:
 *     summary: Xóa face encoding
 *     tags: [Face Encodings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Xóa face encoding thành công
 */
router.delete('/:id', protect, adminOnly, validateMongoId, faceEncodingController.deleteFaceEncoding);

/**
 * @swagger
 * /api/face-encodings/{id}/verify:
 *   patch:
 *     summary: Xác minh face encoding (Admin)
 *     tags: [Face Encodings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 */
router.patch('/:id/verify', protect, adminOnly, validateMongoId, faceEncodingController.verifyFaceEncoding);

/**
 * @swagger
 * /api/face-encodings/{id}/deactivate:
 *   patch:
 *     summary: Vô hiệu hóa face encoding
 *     tags: [Face Encodings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Lý do vô hiệu hóa
 *     responses:
 *       200:
 *         description: Vô hiệu hóa face encoding thành công
 */
router.patch('/:id/deactivate', protect, adminOnly, validateMongoId, faceEncodingController.deactivateFaceEncoding);

/**
 * @swagger
 * /api/face-encodings/{id}/reactivate:
 *   patch:
 *     summary: Kích hoạt lại face encoding
 *     tags: [Face Encodings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 */
router.patch('/:id/reactivate', protect, adminOnly, validateMongoId, faceEncodingController.reactivateFaceEncoding);

/**
 * @swagger
 * /api/face-encodings/{id}/images:
 *   post:
 *     summary: Thêm ảnh vào face encoding
 *     tags: [Face Encodings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageBase64
 *             properties:
 *               imageBase64:
 *                 type: string
 *                 description: Ảnh khuôn mặt dạng base64
 *     responses:
 *       200:
 *         description: Thêm ảnh thành công
 */
router.post('/:id/images', protect, validateMongoId, faceEncodingController.addImageToFaceEncoding);

/**
 * @swagger
 * /api/face-encodings/{id}/images/{imageUrl}:
 *   delete:
 *     summary: Xóa ảnh khỏi face encoding
 *     tags: [Face Encodings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của face encoding
 *       - in: path
 *         name: imageUrl
 *         schema:
 *           type: string
 *         required: true
 *         description: URL của ảnh cần xóa
 */
router.delete('/:id/images/:imageUrl', protect, validateMongoId, faceEncodingController.removeImageFromFaceEncoding);

module.exports = router;