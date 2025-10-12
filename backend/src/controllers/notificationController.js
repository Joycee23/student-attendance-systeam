const Notification = require('../models/Notification');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { type, priority, isRead, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (isRead !== undefined) filters.isRead = isRead === 'true';

    const skip = (page - 1) * limit;

    const notifications = await Notification.getForUser(req.user.id, filters)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({
      userIds: req.user.id,
      isDeleted: false,
      ...filters
    });

    return successResponse(res, {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Notifications retrieved successfully');

  } catch (error) {
    console.error('Get notifications error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread/count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countUnreadForUser(req.user.id);

    return successResponse(res, { count }, 'Unread count retrieved successfully');

  } catch (error) {
    console.error('Get unread count error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('senderId', 'fullName role email')
      .populate('relatedEntities.sessionId', 'sessionDate startTime location')
      .populate('relatedEntities.classId', 'name')
      .populate('relatedEntities.courseId', 'code name');

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    // Check if user is recipient
    if (!notification.userIds.includes(req.user.id)) {
      return errorResponse(res, 'Not authorized', 403);
    }

    return successResponse(res, { notification }, 'Notification retrieved successfully');

  } catch (error) {
    console.error('Get notification error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private (Admin/Lecturer)
exports.createNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      userIds,
      type,
      priority,
      icon,
      color,
      action,
      relatedEntities,
      pushNotification,
      emailNotification,
      expiresAt
    } = req.body;

    if (!userIds || userIds.length === 0) {
      return errorResponse(res, 'At least one recipient is required', 400);
    }

    const notification = await Notification.create({
      title,
      message,
      userIds,
      type,
      priority: priority || 'normal',
      icon,
      color,
      action,
      relatedEntities,
      senderId: req.user.id,
      senderType: req.user.role,
      pushNotification: {
        enabled: pushNotification?.enabled || false
      },
      emailNotification: {
        enabled: emailNotification?.enabled || false
      },
      expiresAt
    });

    // Send notification
    if (pushNotification?.enabled || emailNotification?.enabled) {
      await notification.send();
    }

    return successResponse(res, { notification }, 'Notification created successfully', 201);

  } catch (error) {
    console.error('Create notification error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Broadcast notification
// @route   POST /api/notifications/broadcast
// @access  Private (Admin/Lecturer)
exports.broadcast = async (req, res) => {
  try {
    const { title, message, role, classId, type, priority } = req.body;

    const notification = await Notification.broadcast(
      {
        title,
        message,
        type: type || 'announcement',
        priority: priority || 'normal',
        senderId: req.user.id,
        senderType: req.user.role
      },
      role,
      classId
    );

    return successResponse(res, { notification }, 'Broadcast sent successfully', 201);

  } catch (error) {
    console.error('Broadcast error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    if (!notification.userIds.includes(req.user.id)) {
      return errorResponse(res, 'Not authorized', 403);
    }

    await notification.markAsRead(req.user.id);

    return successResponse(res, { notification }, 'Notification marked as read');

  } catch (error) {
    console.error('Mark as read error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const count = await Notification.markAllAsReadForUser(req.user.id);

    return successResponse(res, { count }, `Marked ${count} notifications as read`);

  } catch (error) {
    console.error('Mark all as read error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    // User can only delete if they are recipient or sender/admin
    if (!notification.userIds.includes(req.user.id) && 
        req.user.role !== 'admin' && 
        notification.senderId?.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 403);
    }

    await notification.softDelete();

    return successResponse(res, null, 'Notification deleted successfully');

  } catch (error) {
    console.error('Delete notification error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/statistics
// @access  Private (Admin)
exports.getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filters = {};
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const stats = await Notification.getStatistics(filters);

    return successResponse(res, stats, 'Statistics retrieved successfully');

  } catch (error) {
    console.error('Get notification statistics error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;