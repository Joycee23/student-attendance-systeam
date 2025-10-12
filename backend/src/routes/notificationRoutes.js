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

// @route   GET /api/notifications
// @desc    Get all notifications for user
// @access  Private
router.get('/', protect, validatePagination, notificationController.getNotifications);

// @route   GET /api/notifications/unread/count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread/count', protect, notificationController.getUnreadCount);

// @route   GET /api/notifications/statistics
// @desc    Get notification statistics
// @access  Private (Admin)
router.get('/statistics', protect, lecturerOrAdmin, notificationController.getStatistics);

// @route   POST /api/notifications
// @desc    Create notification
// @access  Private (Admin/Lecturer)
router.post('/', protect, lecturerOrAdmin, validateCreateNotification, notificationController.createNotification);

// @route   POST /api/notifications/broadcast
// @desc    Broadcast notification to role/class
// @access  Private (Admin/Lecturer)
router.post('/broadcast', protect, lecturerOrAdmin, validateBroadcast, notificationController.broadcast);

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch('/read-all', protect, notificationController.markAllAsRead);

// @route   GET /api/notifications/:id
// @desc    Get notification by ID
// @access  Private
router.get('/:id', protect, validateMongoId, notificationController.getNotificationById);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/:id/read', protect, validateMongoId, notificationController.markAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', protect, validateMongoId, notificationController.deleteNotification);

module.exports = router;