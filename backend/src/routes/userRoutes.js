const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly, lecturerOrAdmin } = require('../middlewares/roleMiddleware');
const { validateCreateUser, validateUpdateUser, validatePagination, validateMongoId } = require('../middlewares/validation');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', protect, adminOnly, validatePagination, userController.getAllUsers);

// @route   GET /api/users/statistics
// @desc    Get user statistics
// @access  Private (Admin)
router.get('/statistics', protect, adminOnly, userController.getUserStatistics);

// @route   GET /api/users/students/class/:classId
// @desc    Get students by class
// @access  Private
router.get('/students/class/:classId', protect, validateMongoId, userController.getStudentsByClass);

// @route   GET /api/users/lecturers/course/:courseId
// @desc    Get lecturers by course
// @access  Private
router.get('/lecturers/course/:courseId', protect, validateMongoId, userController.getLecturersByCourse);

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin)
router.post('/', protect, adminOnly, validateCreateUser, userController.createUser);

// @route   POST /api/users/bulk
// @desc    Bulk create users
// @access  Private (Admin)
router.post('/bulk', protect, adminOnly, userController.bulkCreateUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, validateMongoId, userController.getUserById);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin or Self)
router.put('/:id', protect, validateMongoId, validateUpdateUser, userController.updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/:id', protect, adminOnly, validateMongoId, userController.deleteUser);

// @route   PATCH /api/users/:id/toggle-status
// @desc    Activate/Deactivate user
// @access  Private (Admin)
router.patch('/:id/toggle-status', protect, adminOnly, validateMongoId, userController.toggleUserStatus);

// @route   PUT /api/users/:id/reset-password
// @desc    Reset user password (Admin)
// @access  Private (Admin)
router.put('/:id/reset-password', protect, adminOnly, validateMongoId, userController.resetUserPassword);

module.exports = router;