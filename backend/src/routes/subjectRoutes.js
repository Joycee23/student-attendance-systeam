const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly, lecturerOrAdmin, lecturerTeachesSubject } = require('../middlewares/roleMiddleware');
const { 
  validateCreateSubject, 
  validateUpdateSubject, 
  validatePagination, 
  validateMongoId 
} = require('../middlewares/validation');

// @route   GET /api/subjects
// @desc    Get all subjects
// @access  Private
router.get('/', protect, validatePagination, subjectController.getAllSubjects);

// @route   GET /api/subjects/statistics
// @desc    Get subject statistics
// @access  Private (Admin)
router.get('/statistics', protect, adminOnly, subjectController.getSubjectStatistics);

// @route   GET /api/subjects/search
// @desc    Search subjects
// @access  Private
router.get('/search', protect, subjectController.searchSubjects);

// @route   GET /api/subjects/lecturer/:lecturerId
// @desc    Get subjects by lecturer
// @access  Private
router.get('/lecturer/:lecturerId', protect, validateMongoId, subjectController.getSubjectsByLecturer);

// @route   GET /api/subjects/class/:classId
// @desc    Get subjects by class
// @access  Private
router.get('/class/:classId', protect, validateMongoId, subjectController.getSubjectsByClass);

// @route   POST /api/subjects
// @desc    Create new subject
// @access  Private (Admin)
router.post('/', protect, adminOnly, validateCreateSubject, subjectController.createSubject);

// @route   GET /api/subjects/:id
// @desc    Get subject by ID
// @access  Private
router.get('/:id', protect, validateMongoId, subjectController.getSubjectById);

// @route   PUT /api/subjects/:id
// @desc    Update subject
// @access  Private (Admin)
router.put('/:id', protect, adminOnly, validateMongoId, validateUpdateSubject, subjectController.updateSubject);

// @route   DELETE /api/subjects/:id
// @desc    Delete subject
// @access  Private (Admin)
router.delete('/:id', protect, adminOnly, validateMongoId, subjectController.deleteSubject);

// @route   POST /api/subjects/:id/lecturers
// @desc    Add lecturer to subject
// @access  Private (Admin)
router.post('/:id/lecturers', protect, adminOnly, validateMongoId, subjectController.addLecturer);

// @route   DELETE /api/subjects/:id/lecturers/:lecturerId
// @desc    Remove lecturer from subject
// @access  Private (Admin)
router.delete('/:id/lecturers/:lecturerId', protect, adminOnly, validateMongoId, subjectController.removeLecturer);

// @route   POST /api/subjects/:id/classes
// @desc    Add class to subject
// @access  Private (Admin)
router.post('/:id/classes', protect, adminOnly, validateMongoId, subjectController.addClass);

// @route   DELETE /api/subjects/:id/classes/:classId
// @desc    Remove class from subject
// @access  Private (Admin)
router.delete('/:id/classes/:classId', protect, adminOnly, validateMongoId, subjectController.removeClass);

// @route   POST /api/subjects/:id/prerequisites
// @desc    Add prerequisite to subject
// @access  Private (Admin)
router.post('/:id/prerequisites', protect, adminOnly, validateMongoId, subjectController.addPrerequisite);

// @route   DELETE /api/subjects/:id/prerequisites/:prerequisiteId
// @desc    Remove prerequisite from subject
// @access  Private (Admin)
router.delete('/:id/prerequisites/:prerequisiteId', protect, adminOnly, validateMongoId, subjectController.removePrerequisite);

// @route   POST /api/subjects/:id/materials
// @desc    Add material to subject
// @access  Private (Lecturer/Admin)
router.post('/:id/materials', protect, lecturerOrAdmin, validateMongoId, subjectController.addMaterial);

// @route   DELETE /api/subjects/:id/materials/:materialId
// @desc    Remove material from subject
// @access  Private (Lecturer/Admin)
router.delete('/:id/materials/:materialId', protect, lecturerOrAdmin, validateMongoId, subjectController.removeMaterial);

module.exports = router;