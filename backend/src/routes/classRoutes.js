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

// @route   GET /api/classes
// @desc    Get all classes
// @access  Private
router.get('/', protect, validatePagination, classController.getAllClasses);

// @route   GET /api/classes/statistics
// @desc    Get class statistics
// @access  Private (Admin)
router.get('/statistics', protect, adminOnly, classController.getClassStatistics);

// @route   GET /api/classes/lecturer/:lecturerId
// @desc    Get classes by lecturer
// @access  Private
router.get('/lecturer/:lecturerId', protect, validateMongoId, classController.getClassesByLecturer);

// @route   GET /api/classes/course-year/:courseYear
// @desc    Get classes by course year
// @access  Private
router.get('/course-year/:courseYear', protect, classController.getClassesByCourseYear);

// @route   POST /api/classes
// @desc    Create new class
// @access  Private (Admin/Lecturer)
router.post('/', protect, lecturerOrAdmin, validateCreateClass, classController.createClass);

// @route   GET /api/classes/:id
// @desc    Get class by ID
// @access  Private
router.get('/:id', protect, validateMongoId, classController.getClassById);

// @route   PUT /api/classes/:id
// @desc    Update class
// @access  Private (Admin/Lecturer who owns the class)
router.put('/:id', protect, lecturerOrAdmin, validateMongoId, validateUpdateClass, classController.updateClass);

// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private (Admin)
router.delete('/:id', protect, adminOnly, validateMongoId, classController.deleteClass);

// @route   GET /api/classes/:id/students
// @desc    Get students of class
// @access  Private
router.get('/:id/students', protect, validateMongoId, classController.getClassStudents);

// @route   POST /api/classes/:id/students
// @desc    Add student to class
// @access  Private (Admin/Lecturer)
router.post('/:id/students', protect, lecturerOrAdmin, validateMongoId, validateAddStudent, classController.addStudent);

// @route   POST /api/classes/:id/students/bulk
// @desc    Add multiple students to class
// @access  Private (Admin/Lecturer)
router.post('/:id/students/bulk', protect, lecturerOrAdmin, validateMongoId, classController.addMultipleStudents);

// @route   DELETE /api/classes/:id/students/:studentId
// @desc    Remove student from class
// @access  Private (Admin/Lecturer)
router.delete('/:id/students/:studentId', protect, lecturerOrAdmin, validateMongoId, classController.removeStudent);

// @route   POST /api/classes/:id/courses
// @desc    Add course to class
// @access  Private (Admin/Lecturer)
router.post('/:id/courses', protect, lecturerOrAdmin, validateMongoId, classController.addCourse);

// @route   DELETE /api/classes/:id/courses/:courseId
// @desc    Remove course from class
// @access  Private (Admin/Lecturer)
router.delete('/:id/courses/:courseId', protect, lecturerOrAdmin, validateMongoId, classController.removeCourse);

module.exports = router;