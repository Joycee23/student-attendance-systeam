const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },

    userIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }],

    type: {
      type: String,
      enum: {
        values: [
          'attendance',      // Điểm danh
          'system',          // Hệ thống
          'reminder',        // Nhắc nhở
          'announcement',    // Thông báo chung
          'warning',         // Cảnh báo
          'success',         // Thành công
          'info',            // Thông tin
          'session',         // Buổi học
          'grade',           // Điểm số
          'absence',         // Vắng
          'late',            // Muộn
          'excuse'           // Xin phép
        ],
        message: '{VALUE} is not a valid notification type'
      },
      required: [true, 'Type is required'],
      index: true
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true
    },

    // Thông tin bổ sung

    // Priority
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true
    },

    // Icon/Badge
    icon: {
      type: String,
      enum: ['bell', 'info', 'warning', 'success', 'calendar', 'user', 'check', 'x'],
      default: 'bell'
    },

    // Color cho UI
    color: {
      type: String,
      enum: ['blue', 'green', 'yellow', 'red', 'purple', 'gray'],
      default: 'blue'
    },

    // Action data
    action: {
      type: {
        type: String,
        enum: ['link', 'modal', 'redirect', 'none'],
        default: 'none'
      },
      url: String,
      data: mongoose.Schema.Types.Mixed // Dữ liệu tùy chỉnh
    },

    // Related entities
    relatedEntities: {
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttendanceSession'
      },
      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      },
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      lecturerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },

    // Người gửi
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    senderType: {
      type: String,
      enum: ['system', 'admin', 'lecturer', 'auto'],
      default: 'system'
    },

    // Read tracking (chi tiết từng user)
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],

    // Scheduled notification
    isScheduled: {
      type: Boolean,
      default: false
    },

    scheduledFor: {
      type: Date,
      default: null
    },

    isSent: {
      type: Boolean,
      default: false
    },

    sentAt: {
      type: Date,
      default: null
    },

    // Push notification
    pushNotification: {
      enabled: {
        type: Boolean,
        default: true
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      failedUsers: [mongoose.Schema.Types.ObjectId]
    },

    // Email notification
    emailNotification: {
      enabled: {
        type: Boolean,
        default: false
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      failedUsers: [mongoose.Schema.Types.ObjectId]
    },

    // SMS notification (optional)
    smsNotification: {
      enabled: {
        type: Boolean,
        default: false
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      failedUsers: [mongoose.Schema.Types.ObjectId]
    },

    // Expiry
    expiresAt: {
      type: Date,
      default: null
    },

    isExpired: {
      type: Boolean,
      default: false
    },

    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // Tracking
    totalRecipients: {
      type: Number,
      default: 0,
      min: 0
    },

    readCount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Batch notification
    batchId: {
      type: String,
      default: null,
      index: true
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
notificationSchema.index({ userIds: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userIds: 1, type: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, isRead: 1 });
notificationSchema.index({ isScheduled: 1, scheduledFor: 1 });
notificationSchema.index({ isSent: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ batchId: 1 });
notificationSchema.index({ isDeleted: 1, createdAt: -1 });

// ==================== VIRTUAL FIELDS ====================

// Tỷ lệ đã đọc
notificationSchema.virtual('readRate').get(function() {
  if (this.totalRecipients === 0) return 0;
  return Math.round((this.readCount / this.totalRecipients) * 100);
});

// Số người chưa đọc
notificationSchema.virtual('unreadCount').get(function() {
  return this.totalRecipients - this.readCount;
});

// Kiểm tra đã hết hạn
notificationSchema.virtual('hasExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Thời gian còn lại (phút)
notificationSchema.virtual('timeRemaining').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  if (now > this.expiresAt) return 0;
  return Math.round((this.expiresAt - now) / (1000 * 60));
});

// ==================== MIDDLEWARE ====================

// Set totalRecipients khi tạo mới
notificationSchema.pre('save', function(next) {
  if (this.isNew && this.userIds) {
    this.totalRecipients = this.userIds.length;
  }
  next();
});

// Auto expire
notificationSchema.pre('save', function(next) {
  if (this.expiresAt && new Date() > this.expiresAt && !this.isExpired) {
    this.isExpired = true;
  }
  next();
});

// Mark as sent khi không scheduled
notificationSchema.pre('save', function(next) {
  if (this.isNew && !this.isScheduled && !this.isSent) {
    this.isSent = true;
    this.sentAt = new Date();
  }
  next();
});

// ==================== METHODS ====================

// Mark as read cho một user
notificationSchema.methods.markAsRead = async function(userId) {
  // Kiểm tra user có trong danh sách không
  if (!this.userIds.includes(userId)) {
    throw new Error('User is not a recipient of this notification');
  }

  // Kiểm tra đã đọc chưa
  const alreadyRead = this.readBy.some(r => r.userId.equals(userId));
  if (alreadyRead) {
    return this;
  }

  // Thêm vào readBy
  this.readBy.push({
    userId,
    readAt: new Date()
  });

  // Cập nhật readCount
  this.readCount += 1;

  // Nếu tất cả đã đọc, mark isRead = true
  if (this.readCount >= this.totalRecipients) {
    this.isRead = true;
  }

  return this.save();
};

// Mark as read cho nhiều users
notificationSchema.methods.markAsReadByMultiple = async function(userIds) {
  const results = [];
  for (const userId of userIds) {
    try {
      if (this.userIds.includes(userId) && !this.readBy.some(r => r.userId.equals(userId))) {
        this.readBy.push({ userId, readAt: new Date() });
        this.readCount += 1;
        results.push({ userId, success: true });
      }
    } catch (error) {
      results.push({ userId, success: false, error: error.message });
    }
  }

  if (this.readCount >= this.totalRecipients) {
    this.isRead = true;
  }

  await this.save();
  return results;
};

// Mark as unread cho một user
notificationSchema.methods.markAsUnread = async function(userId) {
  const readIndex = this.readBy.findIndex(r => r.userId.equals(userId));
  if (readIndex === -1) {
    throw new Error('User has not read this notification');
  }

  this.readBy.splice(readIndex, 1);
  this.readCount = Math.max(0, this.readCount - 1);
  this.isRead = false;

  return this.save();
};

// Soft delete
notificationSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Restore
notificationSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

// Send notification
notificationSchema.methods.send = async function() {
  if (this.isSent) {
    throw new Error('Notification already sent');
  }

  this.isSent = true;
  this.sentAt = new Date();

  // TODO: Implement actual push notification logic
  if (this.pushNotification.enabled) {
    // await sendPushNotification(this);
    this.pushNotification.sent = true;
    this.pushNotification.sentAt = new Date();
  }

  // TODO: Implement email notification logic
  if (this.emailNotification.enabled) {
    // await sendEmailNotification(this);
    this.emailNotification.sent = true;
    this.emailNotification.sentAt = new Date();
  }

  // TODO: Implement SMS notification logic
  if (this.smsNotification.enabled) {
    // await sendSMSNotification(this);
    this.smsNotification.sent = true;
    this.smsNotification.sentAt = new Date();
  }

  return this.save();
};

// Add recipients
notificationSchema.methods.addRecipients = async function(userIds) {
  const newUsers = userIds.filter(id => !this.userIds.includes(id));
  
  if (newUsers.length === 0) {
    return this;
  }

  this.userIds.push(...newUsers);
  this.totalRecipients = this.userIds.length;

  return this.save();
};

// Remove recipients
notificationSchema.methods.removeRecipients = async function(userIds) {
  this.userIds = this.userIds.filter(id => !userIds.includes(id.toString()));
  this.totalRecipients = this.userIds.length;

  // Xóa khỏi readBy
  this.readBy = this.readBy.filter(r => !userIds.includes(r.userId.toString()));
  this.readCount = this.readBy.length;

  return this.save();
};

// Check if user has read
notificationSchema.methods.hasUserRead = function(userId) {
  return this.readBy.some(r => r.userId.equals(userId));
};

// Get read time for user
notificationSchema.methods.getReadTimeForUser = function(userId) {
  const readRecord = this.readBy.find(r => r.userId.equals(userId));
  return readRecord ? readRecord.readAt : null;
};

// Lấy thông tin đầy đủ
notificationSchema.methods.getFullDetails = async function() {
  return this.populate([
    { path: 'userIds', select: 'fullName email avatarUrl role' },
    { path: 'senderId', select: 'fullName email role' },
    { path: 'relatedEntities.sessionId', select: 'sessionDate startTime location' },
    { path: 'relatedEntities.classId', select: 'name' },
    { path: 'relatedEntities.courseId', select: 'code name' }
  ]);
};

// ==================== STATIC METHODS ====================

// Lấy notifications của user
notificationSchema.statics.getForUser = function(userId, filters = {}) {
  return this.find({ 
    userIds: userId,
    isDeleted: false,
    ...filters
  })
    .sort({ createdAt: -1 })
    .populate('senderId', 'fullName role');
};

// Lấy unread notifications của user
notificationSchema.statics.getUnreadForUser = function(userId) {
  return this.find({ 
    userIds: userId,
    isDeleted: false,
    $or: [
      { 'readBy.userId': { $ne: userId } },
      { readBy: { $size: 0 } }
    ]
  })
    .sort({ createdAt: -1 });
};

// Đếm unread
notificationSchema.statics.countUnreadForUser = function(userId) {
  return this.countDocuments({ 
    userIds: userId,
    isDeleted: false,
    $or: [
      { 'readBy.userId': { $ne: userId } },
      { readBy: { $size: 0 } }
    ]
  });
};

// Mark all as read cho user
notificationSchema.statics.markAllAsReadForUser = async function(userId) {
  const notifications = await this.find({
    userIds: userId,
    isDeleted: false,
    'readBy.userId': { $ne: userId }
  });

  for (const notification of notifications) {
    await notification.markAsRead(userId);
  }

  return notifications.length;
};

// Tạo notification hàng loạt
notificationSchema.statics.createBulk = async function(data) {
  const batchId = new mongoose.Types.ObjectId().toString();
  
  const notifications = data.map(item => ({
    ...item,
    batchId,
    totalRecipients: item.userIds.length
  }));

  return this.insertMany(notifications);
};

// Gửi notification broadcast
notificationSchema.statics.broadcast = async function(data, role = null, classId = null) {
  const User = mongoose.model('User');
  
  let query = { isActive: true };
  if (role) query.role = role;
  if (classId) query.classId = classId;

  const users = await User.find(query).select('_id');
  const userIds = users.map(u => u._id);

  if (userIds.length === 0) {
    throw new Error('No users found for broadcast');
  }

  return this.create({
    ...data,
    userIds,
    totalRecipients: userIds.length
  });
};

// Lấy scheduled notifications cần gửi
notificationSchema.statics.getPendingScheduled = function() {
  return this.find({
    isScheduled: true,
    isSent: false,
    scheduledFor: { $lte: new Date() }
  });
};

// Clean up expired notifications
notificationSchema.statics.cleanupExpired = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    isExpired: true,
    createdAt: { $lt: cutoffDate }
  });

  return result.deletedCount;
};

// Thống kê
notificationSchema.statics.getStatistics = async function(filters = {}) {
  const total = await this.countDocuments({ isDeleted: false, ...filters });
  const unread = await this.countDocuments({ isRead: false, isDeleted: false, ...filters });
  const sent = await this.countDocuments({ isSent: true, isDeleted: false, ...filters });

  const byType = await this.aggregate([
    { $match: { isDeleted: false, ...filters } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const byPriority = await this.aggregate([
    { $match: { isDeleted: false, ...filters } },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    total,
    unread,
    sent,
    readRate: total > 0 ? Math.round(((total - unread) / total) * 100) : 0,
    byType,
    byPriority
  };
};

// ==================== QUERY HELPERS ====================

notificationSchema.query.unread = function() {
  return this.where({ isRead: false });
};

notificationSchema.query.read = function() {
  return this.where({ isRead: true });
};

notificationSchema.query.byType = function(type) {
  return this.where({ type });
};

notificationSchema.query.byPriority = function(priority) {
  return this.where({ priority });
};

notificationSchema.query.active = function() {
  return this.where({ isDeleted: false });
};

notificationSchema.query.scheduled = function() {
  return this.where({ isScheduled: true, isSent: false });
};

notificationSchema.query.recent = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.where('createdAt').gte(date);
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;