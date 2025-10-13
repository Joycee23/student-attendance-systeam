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

/**
 * @swagger
 * /api/attendance/sessions:
 *   get:
 *     summary: Get all attendance sessions with pagination
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of sessions per page
 *     responses:
 *       '200':
 *         description: A list of attendance sessions
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/sessions', protect, validatePagination, attendanceController.getAllSessions);

/**
 * @swagger
 * /api/attendance/sessions:
 *   post:
 *     summary: Create a new attendance session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *               - startTime
 *               - endTime
 *             properties:
 *               classId:
 *                 type: string
 *                 description: The ID of the class
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     default: Point
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [106.660172, 10.762622]
 *     responses:
 *       '201':
 *         description: Session created successfully
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/sessions', protect, lecturerOrAdmin, validateCreateSession, attendanceController.createSession);

/**
 * @swagger
 * /api/attendance/sessions/{id}:
 *   get:
 *     summary: Get a single session by ID
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID
 *     responses:
 *       '200':
 *         description: Session data
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/sessions/:id', protect, validateMongoId, attendanceController.getSessionById);

/**
 * @swagger
 * /api/attendance/sessions/{id}:
 *   put:
 *     summary: Update an attendance session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '200':
 *         description: Session updated successfully
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/sessions/:id', protect, lecturerOrAdmin, validateMongoId, attendanceController.updateSession);

/**
 * @swagger
 * /api/attendance/sessions/{id}/close:
 *   patch:
 *     summary: Close an attendance session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID
 *     responses:
 *       '200':
 *         description: Session closed successfully
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch('/sessions/:id/close', protect, lecturerOrAdmin, validateMongoId, attendanceController.closeSession);

/**
 * @swagger
 * /api/attendance/sessions/{id}/cancel:
 *   patch:
 *     summary: Cancel an attendance session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID
 *     responses:
 *       '200':
 *         description: Session cancelled successfully
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch('/sessions/:id/cancel', protect, lecturerOrAdmin, validateMongoId, attendanceController.cancelSession);

/**
 * @swagger
 * /api/attendance/sessions/{id}/qr-code:
 *   post:
 *     summary: Generate a QR code for a session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID
 *     responses:
 *       '200':
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCodeData:
 *                   type: string
 *                   description: Data to be encoded in the QR code
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/sessions/:id/qr-code', protect, lecturerOrAdmin, validateMongoId, attendanceController.generateQRCode);

// ==================== CHECK-IN METHODS ====================

/**
 * @swagger
 * /api/attendance/check-in/manual:
 *   post:
 *     summary: Manually check-in a student (by lecturer)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - studentId
 *               - status
 *             properties:
 *               sessionId:
 *                 type: string
 *               studentId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [present, absent, late]
 *                 default: present
 *     responses:
 *       '201':
 *         description: Student checked in successfully
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/check-in/manual', protect, lecturerOrAdmin, validateManualCheckIn, attendanceController.manualCheckIn);

/**
 * @swagger
 * /api/attendance/check-in/qr:
 *   post:
 *     summary: Check-in by scanning a QR code (by student)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - qrCodeData
 *             properties:
 *               sessionId:
 *                 type: string
 *               qrCodeData:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Check-in successful
 *       '400':
 *         description: Invalid or expired QR code
 */
router.post('/check-in/qr', protect, studentOnly, validateQRCheckIn, attendanceController.qrCodeCheckIn);

/**
 * @swagger
 * /api/attendance/check-in/face:
 *   post:
 *     summary: Face recognition check-in (by student)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - imageBase64
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               imageBase64:
 *                 type: string
 *                 description: Base64 encoded face image
 *     responses:
 *       '201':
 *         description: Check-in successful
 *       '400':
 *         description: Face not detected in image or other validation error
 *       '403':
 *         description: Face does not match registered user
 */
router.post('/check-in/face', protect, studentOnly, faceRecognitionLimiter, validateFaceCheckIn, attendanceController.faceRecognitionCheckIn);

/**
 * @swagger
 * /api/attendance/check-in/gps:
 *   post:
 *     summary: GPS location check-in (by student)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - latitude
 *               - longitude
 *             properties:
 *               sessionId:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       '201':
 *         description: Check-in successful
 *       '400':
 *         description: You are not within the allowed check-in area
 */
router.post('/check-in/gps', protect, studentOnly, validateGPSCheckIn, attendanceController.gpsCheckIn);

// ==================== ATTENDANCE HISTORY ====================

/**
 * @swagger
 * /api/attendance/history:
 *   get:
 *     summary: Get attendance history for the current user
 *     tags: [Attendance]
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
 *       '200':
 *         description: A list of attendance records
 */
router.get('/history', protect, validatePagination, attendanceController.getAttendanceHistory);

// ==================== STATISTICS ====================

/**
 * @swagger
 * /api/attendance/statistics/student/{studentId}:
 *   get:
 *     summary: Get attendance statistics for a specific student
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Attendance statistics for the student
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/statistics/student/:studentId', protect, validateMongoId, attendanceController.getStudentStatistics);

/**
 * @swagger
 * /api/attendance/statistics/session/{sessionId}:
 *   get:
 *     summary: Get statistics for a specific session (e.g., attendance rate)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Attendance statistics for the session
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/statistics/session/:sessionId', protect, validateMongoId, attendanceController.getSessionStatistics);

module.exports = router;
