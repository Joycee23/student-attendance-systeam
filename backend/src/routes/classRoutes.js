const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly, lecturerOrAdmin, lecturerOwnsClass } = require('../middlewares/roleMiddleware');
const { 
  validateCreateClass, 
  validateUpdateClass, 
  validateAddStudent, 
  validatePagination, 
  validateMongoId 
} = require('../middlewares/validation');

/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: API quản lý lớp học
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Class:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 652f0d94e12a5c28b4a321f1
 *         name:
 *           type: string
 *           example: CNTT K23A
 *         courseYear:
 *           type: string
 *           example: 2023
 *         lecturerId:
 *           type: string
 *           example: 652f0d94e12a5c28b4a321e0
 *         students:
 *           type: array
 *           items:
 *             type: string
 *       required:
 *         - name
 *         - courseYear
 */

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Lấy danh sách tất cả các lớp
 *     tags: [Classes]
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
 *         description: Danh sách lớp học
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, validatePagination, classController.getAllClasses);

/**
 * @swagger
 * /api/classes/statistics:
 *   get:
 *     summary: Lấy thống kê lớp học (chỉ Admin)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dữ liệu thống kê
 *       403:
 *         description: Chỉ Admin được phép
 */
router.get('/statistics', protect, adminOnly, classController.getClassStatistics);

/**
 * @swagger
 * /api/classes/lecturer/{lecturerId}:
 *   get:
 *     summary: Lấy danh sách lớp theo giảng viên
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecturerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID giảng viên
 *     responses:
 *       200:
 *         description: Danh sách lớp của giảng viên
 */
router.get('/lecturer/:lecturerId', protect, validateMongoId, classController.getClassesByLecturer);

/**
 * @swagger
 * /api/classes/course-year/{courseYear}:
 *   get:
 *     summary: Lấy danh sách lớp theo năm học
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseYear
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách lớp theo năm
 */
router.get('/course-year/:courseYear', protect, classController.getClassesByCourseYear);

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Tạo lớp mới (Admin hoặc Giảng viên)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Class'
 *     responses:
 *       201:
 *         description: Lớp được tạo thành công
 */
router.post('/', protect, lecturerOrAdmin, validateCreateClass, classController.createClass);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết lớp học
 *     tags: [Classes]
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
 *         description: Thông tin lớp học
 */
router.get('/:id', protect, validateMongoId, classController.getClassById);

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Cập nhật lớp học (Admin hoặc giảng viên sở hữu lớp)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Class'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', protect, lecturerOrAdmin, validateMongoId, validateUpdateClass, classController.updateClass);

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Xóa lớp học (Admin)
 *     tags: [Classes]
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
 *         description: Xóa lớp thành công
 */
router.delete('/:id', protect, adminOnly, validateMongoId, classController.deleteClass);

/**
 * @swagger
 * /api/classes/{id}/students:
 *   get:
 *     summary: Lấy danh sách sinh viên trong lớp
 *     tags: [Classes]
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
 *         description: Danh sách sinh viên
 */
router.get('/:id/students', protect, validateMongoId, classController.getClassStudents);

/**
 * @swagger
 * /api/classes/{id}/students:
 *   post:
 *     summary: Thêm sinh viên vào lớp (Admin hoặc Giảng viên)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thêm sinh viên thành công
 */
router.post('/:id/students', protect, lecturerOrAdmin, validateMongoId, validateAddStudent, classController.addStudent);

/**
 * @swagger
 * /api/classes/{id}/students/bulk:
 *   post:
 *     summary: Thêm nhiều sinh viên vào lớp
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               students:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Thêm sinh viên thành công
 */
router.post('/:id/students/bulk', protect, lecturerOrAdmin, validateMongoId, classController.addMultipleStudents);

/**
 * @swagger
 * /api/classes/{id}/students/{studentId}:
 *   delete:
 *     summary: Xóa sinh viên khỏi lớp
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: path
 *         name: studentId
 *         required: true
 *     responses:
 *       200:
 *         description: Xóa sinh viên khỏi lớp thành công
 */
router.delete('/:id/students/:studentId', protect, lecturerOrAdmin, validateMongoId, classController.removeStudent);

/**
 * @swagger
 * /api/classes/{id}/courses:
 *   post:
 *     summary: Gán khóa học cho lớp
 *     tags: [Classes]
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
 *     responses:
 *       200:
 *         description: Thêm khóa học thành công
 */
router.post('/:id/courses', protect, lecturerOrAdmin, validateMongoId, classController.addCourse);

/**
 * @swagger
 * /api/classes/{id}/courses/{courseId}:
 *   delete:
 *     summary: Xóa khóa học khỏi lớp
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: path
 *         name: courseId
 *         required: true
 *     responses:
 *       200:
 *         description: Xóa khóa học thành công
 */
router.delete('/:id/courses/:courseId', protect, lecturerOrAdmin, validateMongoId, classController.removeCourse);

module.exports = router;
