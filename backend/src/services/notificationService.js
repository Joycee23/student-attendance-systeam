const Notification = require('../models/Notification');
const emailService = require('./emailService');
const Settings = require('../models/Settings');

/**
 * Notification Service
 * Handles push notifications, in-app notifications, and email notifications
 */
class NotificationService {
  constructor() {
    this.enabled = true;
    this.pushEnabled = false;
    this.emailEnabled = false;
  }

  /**
   * Initialize notification service
   */
  async init() {
    try {
      const settings = await Settings.getSettings();
      this.enabled = settings.notificationsEnabled !== false;
      this.pushEnabled = settings.pushNotificationsEnabled === true;
      this.emailEnabled = settings.emailNotificationsEnabled === true;
    } catch (error) {
      console.error('Notification service init error:', error);
    }
  }

  /**
   * Create and send notification
   * @param {Object} options - Notification options
   */
  async createNotification(options) {
    try {
      await this.init();

      if (!this.enabled) {
        console.log('Notifications disabled');
        return { success: false, message: 'Notifications are disabled' };
      }

      const {
        title,
        message,
        userIds,
        type = 'general',
        priority = 'normal',
        senderId,
        senderType = 'system',
        icon,
        color,
        action,
        relatedEntities,
        pushNotification = {},
        emailNotification = {},
        expiresAt
      } = options;

      // Create notification
      const notification = await Notification.create({
        title,
        message,
        userIds: Array.isArray(userIds) ? userIds : [userIds],
        type,
        priority,
        senderId,
        senderType,
        icon,
        color,
        action,
        relatedEntities,
        pushNotification: {
          enabled: pushNotification.enabled || this.pushEnabled,
          ...pushNotification
        },
        emailNotification: {
          enabled: emailNotification.enabled || this.emailEnabled,
          ...emailNotification
        },
        expiresAt
      });

      // Send notification
      if (pushNotification.enabled || emailNotification.enabled) {
        await this.sendNotification(notification);
      }

      return {
        success: true,
        notification,
        message: 'Notification created successfully'
      };

    } catch (error) {
      console.error('Create notification error:', error);
      return {
        success: false,
        message: `Failed to create notification: ${error.message}`
      };
    }
  }

  /**
   * Send notification to recipients
   * @param {Object} notification - Notification object
   */
  async sendNotification(notification) {
    try {
      const results = {
        push: { sent: 0, failed: 0 },
        email: { sent: 0, failed: 0 }
      };

      // Send push notifications
      if (notification.pushNotification?.enabled) {
        const pushResult = await this.sendPushNotification(notification);
        results.push = pushResult;
      }

      // Send email notifications
      if (notification.emailNotification?.enabled) {
        const emailResult = await this.sendEmailNotification(notification);
        results.email = emailResult;
      }

      // Update notification with send results
      notification.sentAt = new Date();
      notification.deliveryStats = results;
      await notification.save();

      return results;

    } catch (error) {
      console.error('Send notification error:', error);
      return {
        push: { sent: 0, failed: 1 },
        email: { sent: 0, failed: 1 },
        error: error.message
      };
    }
  }

  /**
   * Send push notification
   * @param {Object} notification - Notification object
   */
  async sendPushNotification(notification) {
    try {
      // For now, this is a placeholder implementation
      // In production, integrate with FCM, APNs, or similar service

      console.log(`Sending push notification: ${notification.title}`);

      // Mock implementation - simulate sending
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call

      return {
        sent: notification.userIds.length,
        failed: 0,
        message: 'Push notifications sent successfully'
      };

    } catch (error) {
      console.error('Send push notification error:', error);
      return {
        sent: 0,
        failed: notification.userIds.length,
        error: error.message
      };
    }
  }

  /**
   * Send email notification
   * @param {Object} notification - Notification object
   */
  async sendEmailNotification(notification) {
    try {
      const results = {
        sent: 0,
        failed: 0,
        details: []
      };

      for (const userId of notification.userIds) {
        try {
          // Get user email
          const User = require('../models/User');
          const user = await User.findById(userId).select('email fullName');

          if (!user || !user.email) {
            results.failed++;
            results.details.push({
              userId,
              error: 'User not found or no email'
            });
            continue;
          }

          // Send email
          const emailResult = await emailService.sendEmail({
            to: user.email,
            subject: notification.title,
            html: this.generateEmailHTML(notification, user)
          });

          if (emailResult.success) {
            results.sent++;
          } else {
            results.failed++;
            results.details.push({
              userId,
              email: user.email,
              error: emailResult.message
            });
          }

        } catch (error) {
          results.failed++;
          results.details.push({
            userId,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Send email notification error:', error);
      return {
        sent: 0,
        failed: notification.userIds.length,
        error: error.message
      };
    }
  }

  /**
   * Generate HTML email content
   * @param {Object} notification - Notification object
   * @param {Object} user - User object
   */
  generateEmailHTML(notification, user) {
    const colors = {
      low: '#17a2b8',
      normal: '#ffc107',
      high: '#fd7e14',
      urgent: '#dc3545'
    };

    const color = colors[notification.priority] || colors.normal;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: ${color}; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .button { display: inline-block; background: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${notification.title}</h1>
          </div>
          <div class="content">
            <p>Hello ${user.fullName},</p>
            <p>${notification.message}</p>
            ${notification.action ? `<p><a href="${notification.action.url}" class="button">${notification.action.text || 'View Details'}</a></p>` : ''}
            ${notification.relatedEntities ? `<p><strong>Related:</strong> ${this.formatRelatedEntities(notification.relatedEntities)}</p>` : ''}
            <p>Best regards,<br/>Attendance System</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from the Student Attendance System.</p>
            <p>If you no longer wish to receive these notifications, please update your preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Format related entities for email
   */
  formatRelatedEntities(entities) {
    const parts = [];

    if (entities.sessionId) {
      parts.push(`Session: ${entities.sessionId}`);
    }
    if (entities.classId) {
      parts.push(`Class: ${entities.classId}`);
    }
    if (entities.courseId) {
      parts.push(`Course: ${entities.courseId}`);
    }
    if (entities.studentId) {
      parts.push(`Student: ${entities.studentId}`);
    }

    return parts.join(', ');
  }

  /**
   * Send attendance reminder
   * @param {Object} session - Attendance session
   * @param {Array} userIds - User IDs to notify
   */
  async sendAttendanceReminder(session, userIds) {
    try {
      const title = '⏰ Attendance Reminder';
      const message = `Don't forget your attendance session: ${session.courseId?.name || 'N/A'} at ${session.location} starting at ${new Date(session.startTime).toLocaleTimeString()}`;

      return await this.createNotification({
        title,
        message,
        userIds,
        type: 'reminder',
        priority: 'normal',
        relatedEntities: {
          sessionId: session._id,
          courseId: session.courseId?._id,
          classId: session.classId?._id
        },
        action: {
          text: 'Mark Attendance',
          url: `/attendance/session/${session._id}`
        }
      });

    } catch (error) {
      console.error('Send attendance reminder error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send absence warning
   * @param {Object} student - Student object
   * @param {Object} stats - Attendance statistics
   */
  async sendAbsenceWarning(student, stats) {
    try {
      const title = '⚠️ Attendance Warning';
      const message = `Your attendance rate is ${stats.attendanceRate}%. Please improve your attendance to meet the minimum requirement.`;

      return await this.createNotification({
        title,
        message,
        userIds: [student._id],
        type: 'warning',
        priority: 'high',
        relatedEntities: {
          studentId: student._id
        },
        action: {
          text: 'View Details',
          url: `/attendance/student/${student._id}`
        }
      });

    } catch (error) {
      console.error('Send absence warning error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send session status update
   * @param {Object} session - Attendance session
   * @param {string} status - New status
   * @param {Array} userIds - Users to notify
   */
  async sendSessionStatusUpdate(session, status, userIds) {
    try {
      const statusMessages = {
        open: 'has opened',
        closed: 'has been closed',
        cancelled: 'has been cancelled'
      };

      const title = '📢 Session Status Update';
      const message = `The attendance session for ${session.courseId?.name || 'N/A'} ${statusMessages[status] || 'has been updated'}.`;

      return await this.createNotification({
        title,
        message,
        userIds,
        type: 'update',
        priority: status === 'cancelled' ? 'high' : 'normal',
        relatedEntities: {
          sessionId: session._id,
          courseId: session.courseId?._id,
          classId: session.classId?._id
        }
      });

    } catch (error) {
      console.error('Send session status update error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send welcome notification
   * @param {Object} user - New user
   */
  async sendWelcomeNotification(user) {
    try {
      const title = '🎉 Welcome to Student Attendance System!';
      const message = `Hello ${user.fullName}! Your account has been created successfully. You can now start using the attendance system.`;

      return await this.createNotification({
        title,
        message,
        userIds: [user._id],
        type: 'welcome',
        priority: 'normal',
        action: {
          text: 'Get Started',
          url: '/dashboard'
        }
      });

    } catch (error) {
      console.error('Send welcome notification error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Broadcast notification to all users with role
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} role - User role to broadcast to
   * @param {Object} options - Additional options
   */
  async broadcastToRole(title, message, role, options = {}) {
    try {
      const User = require('../models/User');
      const users = await User.find({
        role,
        isActive: true
      }).select('_id');

      const userIds = users.map(user => user._id);

      return await this.createNotification({
        title,
        message,
        userIds,
        type: 'broadcast',
        priority: 'normal',
        ...options
      });

    } catch (error) {
      console.error('Broadcast to role error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Broadcast to class
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} classId - Class ID
   * @param {Object} options - Additional options
   */
  async broadcastToClass(title, message, classId, options = {}) {
    try {
      const Class = require('../models/Class');
      const classDoc = await Class.findById(classId).populate('studentIds', '_id');

      if (!classDoc) {
        return { success: false, message: 'Class not found' };
      }

      const userIds = classDoc.studentIds.map(student => student._id);

      return await this.createNotification({
        title,
        message,
        userIds,
        type: 'broadcast',
        priority: 'normal',
        relatedEntities: { classId },
        ...options
      });

    } catch (error) {
      console.error('Broadcast to class error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get notification statistics
   */
  async getStatistics() {
    try {
      const stats = await Notification.getStatistics();

      return {
        success: true,
        statistics: stats
      };

    } catch (error) {
      console.error('Get notification statistics error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return { success: false, message: 'Notification not found' };
      }

      if (!notification.userIds.includes(userId)) {
        return { success: false, message: 'Not authorized' };
      }

      await notification.markAsRead(userId);

      return { success: true, message: 'Notification marked as read' };

    } catch (error) {
      console.error('Mark as read error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Mark all notifications as read for user
   * @param {string} userId - User ID
   */
  async markAllAsRead(userId) {
    try {
      const count = await Notification.markAllAsReadForUser(userId);

      return {
        success: true,
        message: `Marked ${count} notifications as read`,
        count
      };

    } catch (error) {
      console.error('Mark all as read error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete expired notifications
   */
  async cleanupExpired() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      return {
        success: true,
        deletedCount: result.deletedCount
      };

    } catch (error) {
      console.error('Cleanup expired notifications error:', error);
      return { success: false, message: error.message };
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();