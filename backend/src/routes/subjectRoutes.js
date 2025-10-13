const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly, lecturerOrAdmin } = require('../middlewares/roleMiddleware');
const { 
  validateCreateSubject, 
  validateUpdateSubject, 
  validatePagination, 
  validateMongoId 
} = require('../middlewares/validation');

/**
 * @swagger
 * tags:
 *   name: Subjects
 *   description: Subject management APIs
 */

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number
 *         required: false
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         description: Number of items per page
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get('/', protect, validatePagination, subjectController.getAllSubjects);

/**
 * @swagger
 * /api/subjects/statistics:
 *   get:
 *     summary: Get subject statistics
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subject statistics
 */
router.get('/statistics', protect, adminOnly, subjectController.getSubjectStatistics);

/**
 * @swagger
 * /api/subjects/search:
 *   get:
 *     summary: Search subjects
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: keyword
 *         in: query
 *         description: Keyword to search
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matching subjects
 */
router.get('/search', protect, subjectController.searchSubjects);

/**
 * @swagger
 * /api/subjects/lecturer/{lecturerId}:
 *   get:
 *     summary: Get subjects by lecturer ID
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: lecturerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subjects taught by lecturer
 */
router.get('/lecturer/:lecturerId', protect, validateMongoId, subjectController.getSubjectsByLecturer);

/**
 * @swagger
 * /api/subjects/class/{classId}:
 *   get:
 *     summary: Get subjects by class ID
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: classId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subjects assigned to class
 */
router.get('/class/:classId', protect, validateMongoId, subjectController.getSubjectsByClass);

/**
 * @swagger
 * /api/subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subject created successfully
 */
router.post('/', protect, adminOnly, validateCreateSubject, subjectController.createSubject);

/**
 * @swagger
 * /api/subjects/{id}:
 *   get:
 *     summary: Get subject by ID
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject details
 */
router.get('/:id', protect, validateMongoId, subjectController.getSubjectById);

/**
 * @swagger
 * /api/subjects/{id}:
 *   put:
 *     summary: Update subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subject updated successfully
 */
router.put('/:id', protect, adminOnly, validateMongoId, validateUpdateSubject, subjectController.updateSubject);

/**
 * @swagger
 * /api/subjects/{id}:
 *   delete:
 *     summary: Delete subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 */
router.delete('/:id', protect, adminOnly, validateMongoId, subjectController.deleteSubject);

module.exports = router;
