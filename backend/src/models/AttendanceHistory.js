const mongoose = require('mongoose');

const attendanceHistorySchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: [true, 'Session is required'],
      unique: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
      unique: true,
      validate: {
        validator: async function(value) {
          const User = mongoose.model('User');
          const student = await User.findById(value);
          return student && student.role === 'student';
        },
        message: 'Must reference a user with student role'
      }
    },

    status: {
      type: String,
      enum: {
        values: ['present', 'absent', 'late', 'excused'],
        message: '{VALUE} is not a valid status'
      },
      required: [true, 'Status is required'],
      unique: true
    },

    checkInTime: {
      type: Date,
      required: [true, 'Check-in time is required'],
      default: Date.now,
      unique: true
    },

    imageUrl: {
      type: String,
      trim: true,
      default: null
    },

    recognizedBy: {
      type: String,
      enum: {
        values: ['system', 'manual', 'qrCode', 'gps', 'faceRecognition'],
        message: '{VALUE} is not a valid recognition method'
      },
      required: [true, 'Recognition method is required'],
      default: 'manual'
    },

    confidence: {
      type: Number,
      min: [0, 'Confidence cannot be less than 0'],
      max: [1, 'Confidence cannot be greater than 1'],
      default: null,
      validate: {
        validator: function(value) {
          // Confidence bắt buộc nếu recognizedBy là faceRecognition
          if (this.recognizedBy === 'faceRecognition') {
            return value !== null && value >= 0 && value <= 1;
          }
          return true;
        },
        message: 'Confidence is required for face recognition'
      }
    },

    // Thông tin bổ sung chi tiết

    // Thời gian check out (nếu có)
    checkOutTime: {
      type: Date,
      default: null
    },

    // Phương thức điểm danh chi tiết
    method: {
      type: String,
      enum: ['manual', 'qrCode', 'faceRecognition', 'gps', 'auto'],
      default: 'manual'
    },

    // Face Recognition details
    faceRecognitionData: {
      confidence: {
        type: Number,
        min: 0,
        max: 100 // Percentage
      },
      distance: {
        type: Number,
        min: 0,
        max: 1
      },
      processingTime: {
        type: Number, // milliseconds
        min: 0
      },
      aiServiceVersion: String
    },

    // GPS Location
    gpsLocation: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      },
      accuracy: {
        type: Number,
        min: 0
      },
      distance: {
        type: Number, // Distance from class location (meters)
        min: 0
      }
    },

    // QR Code
    qrCodeData: {
      code: String,
      scannedAt: Date,
      isValid: Boolean
    },

    // Delay/Late information
    lateMinutes: {
      type: Number,
      default: 0,
      min: 0
    },

    isLate: {
      type: Boolean,
      default: false
    },

    // IP và Device info
    ipAddress: {
      type: String,
      trim: true,
      default: null
    },

    userAgent: {
      type: String,
      trim: true,
      default: null
    },

    deviceInfo: {
      type: String,
      trim: true,
      default: null
    },

    // Manual override information
    isManualOverride: {
      type: Boolean,
      default: false
    },

    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    overriddenAt: {
      type: Date,
      default: null
    },

    overrideReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Override reason cannot exceed 500 characters'],
      default: null
    },

    // Previous status (trước khi override)
    previousStatus: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: null
    },

    // Notes
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: null
    },

    // Excuse information (nếu status = excused)
    excuseReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Excuse reason cannot exceed 500 characters'],
      default: null
    },

    excuseDocumentUrl: {
      type: String,
      trim: true,
      default: null
    },

    excuseApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    excuseApprovedAt: {
      type: Date,
      default: null
    },

    // Metadata
    isVerified: {
      type: Boolean,
      default: false
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    // Flags
    isSuspicious: {
      type: Boolean,
      default: false
    },

    suspiciousReason: {
      type: String,
      trim: true,
      default: null
    },

    // Session info snapshot (để query nhanh không cần join)
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },

    sessionDate: {
      type: Date,
      required: true,
      unique: true
    },

    sessionStartTime: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Chỉ có createdAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== COMPOUND INDEXES ====================
attendanceHistorySchema.index({ sessionId: 1, studentId: 1 });
attendanceHistorySchema.index({ studentId: 1, sessionDate: -1 });
attendanceHistorySchema.index({ classId: 1, sessionDate: -1 });
attendanceHistorySchema.index({ courseId: 1, sessionDate: -1 });
attendanceHistorySchema.index({ status: 1, sessionDate: -1 });
attendanceHistorySchema.index({ recognizedBy: 1, createdAt: -1 });
attendanceHistorySchema.index({ isVerified: 1 });
attendanceHistorySchema.index({ isSuspicious: 1 });

// ==================== VIRTUAL FIELDS ====================

// Độ tin cậy dạng phần trăm
attendanceHistorySchema.virtual('confidencePercent').get(function() {
  if (this.confidence === null || this.confidence === undefined) return null;
  return Math.round(this.confidence * 100);
});

// Thời gian check-in hiển thị
attendanceHistorySchema.virtual('checkInTimeFormatted').get(function() {
  if (!this.checkInTime) return null;
  return this.checkInTime.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

// Có điểm danh hay không
attendanceHistorySchema.virtual('isCheckedIn').get(function() {
  return this.status === 'present' || this.status === 'late';
});

// Duration in session (nếu có checkout)
attendanceHistorySchema.virtual('durationMinutes').get(function() {
  if (!this.checkInTime || !this.checkOutTime) return null;
  return Math.round((this.checkOutTime - this.checkInTime) / (1000 * 60));
});

// ==================== MIDDLEWARE ====================

// Tự động lấy thông tin session khi tạo mới
attendanceHistorySchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const AttendanceSession = mongoose.model('AttendanceSession');
      const session = await AttendanceSession.findById(this.sessionId);

      if (!session) {
        return next(new Error('Session not found'));
      }

      // Copy session info
      this.courseId = session.courseId;
      this.classId = session.classId;
      this.sessionDate = session.sessionDate;
      this.sessionStartTime = session.startTime;

      // Tính late minutes nếu có checkInTime
      if (this.checkInTime && session.startTime) {
        const diffMs = this.checkInTime - session.startTime;
        this.lateMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
        this.isLate = this.lateMinutes > (session.lateThreshold || 15);
      }

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Validate confidence với recognizedBy
attendanceHistorySchema.pre('save', function(next) {
  if (this.recognizedBy === 'faceRecognition' && !this.confidence) {
    return next(new Error('Confidence is required for face recognition'));
  }
  next();
});

// Log khi có manual override
attendanceHistorySchema.post('save', function(doc) {
  if (doc.isManualOverride && doc.isNew) {
    console.log(`⚠️  Manual override: Student ${doc.studentId} - Session ${doc.sessionId} - ${doc.previousStatus} → ${doc.status}`);
  }
});

// ==================== METHODS ====================

// Cập nhật từ system sang manual
attendanceHistorySchema.methods.overrideStatus = async function(newStatus, overriddenBy, reason) {
  this.previousStatus = this.status;
  this.status = newStatus;
  this.isManualOverride = true;
  this.overriddenBy = overriddenBy;
  this.overriddenAt = new Date();
  this.overrideReason = reason;

  return this.save();
};

// Verify record
attendanceHistorySchema.methods.verify = async function(verifiedBy) {
  this.isVerified = true;
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();

  return this.save();
};

// Mark as suspicious
attendanceHistorySchema.methods.markSuspicious = async function(reason) {
  this.isSuspicious = true;
  this.suspiciousReason = reason;

  return this.save();
};

// Add excuse
attendanceHistorySchema.methods.addExcuse = async function(reason, documentUrl, approvedBy) {
  this.status = 'excused';
  this.excuseReason = reason;
  this.excuseDocumentUrl = documentUrl;
  this.excuseApprovedBy = approvedBy;
  this.excuseApprovedAt = new Date();

  return this.save();
};

// Lấy thông tin đầy đủ
attendanceHistorySchema.methods.getFullDetails = async function() {
  return this.populate([
    { path: 'sessionId', select: 'sessionDate startTime endTime location status' },
    { path: 'studentId', select: 'fullName studentCode email avatarUrl' },
    { path: 'courseId', select: 'code name' },
    { path: 'classId', select: 'name' },
    { path: 'overriddenBy', select: 'fullName role' },
    { path: 'verifiedBy', select: 'fullName role' },
    { path: 'excuseApprovedBy', select: 'fullName role' }
  ]);
};

// ==================== STATIC METHODS ====================

// Lấy lịch sử của sinh viên
attendanceHistorySchema.statics.getStudentHistory = function(studentId, filters = {}) {
  return this.find({ studentId, ...filters })
    .sort({ sessionDate: -1, checkInTime: -1 })
    .populate('sessionId', 'sessionDate startTime endTime location')
    .populate('courseId', 'code name')
    .populate('classId', 'name');
};

// Lấy lịch sử của session
attendanceHistorySchema.statics.getSessionHistory = function(sessionId, filters = {}) {
  return this.find({ sessionId, ...filters })
    .sort({ checkInTime: 1 })
    .populate('studentId', 'fullName studentCode email avatarUrl');
};

// Lấy lịch sử theo lớp
attendanceHistorySchema.statics.getClassHistory = function(classId, filters = {}) {
  return this.find({ classId, ...filters })
    .sort({ sessionDate: -1, checkInTime: -1 })
    .populate('studentId', 'fullName studentCode')
    .populate('courseId', 'code name')
    .populate('sessionId', 'sessionDate startTime');
};

// Lấy lịch sử theo môn học
attendanceHistorySchema.statics.getCourseHistory = function(courseId, filters = {}) {
  return this.find({ courseId, ...filters })
    .sort({ sessionDate: -1, checkInTime: -1 })
    .populate('studentId', 'fullName studentCode')
    .populate('classId', 'name')
    .populate('sessionId', 'sessionDate startTime');
};

// Lấy records cần verify
attendanceHistorySchema.statics.getNeedVerification = function(filters = {}) {
  return this.find({ 
    isVerified: false,
    isSuspicious: true,
    ...filters
  })
    .sort({ createdAt: -1 })
    .populate('studentId', 'fullName studentCode')
    .populate('sessionId', 'sessionDate startTime');
};

// Thống kê sinh viên
attendanceHistorySchema.statics.getStudentStats = async function(studentId, filters = {}) {
  const stats = await this.aggregate([
    { $match: { studentId: mongoose.Types.ObjectId(studentId), ...filters } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await this.countDocuments({ studentId, ...filters });

  const result = {
    total,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
  });

  result.attendanceRate = total > 0 
    ? Math.round(((result.present + result.late) / total) * 100) 
    : 0;

  return result;
};

// Thống kê session
attendanceHistorySchema.statics.getSessionStats = async function(sessionId) {
  const stats = await this.aggregate([
    { $match: { sessionId: mongoose.Types.ObjectId(sessionId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await this.countDocuments({ sessionId });

  const result = {
    total,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
  });

  result.attendanceRate = total > 0 
    ? Math.round(((result.present + result.late) / total) * 100) 
    : 0;

  return result;
};

// Thống kê theo phương thức
attendanceHistorySchema.statics.getMethodStats = async function(filters = {}) {
  return this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$recognizedBy',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Tìm kiếm
attendanceHistorySchema.statics.search = function(keyword, filters = {}) {
  return this.find(filters)
    .populate({
      path: 'studentId',
      match: {
        $or: [
          { fullName: new RegExp(keyword, 'i') },
          { studentCode: new RegExp(keyword, 'i') },
          { email: new RegExp(keyword, 'i') }
        ]
      },
      select: 'fullName studentCode email'
    })
    .then(results => results.filter(r => r.studentId));
};

// ==================== QUERY HELPERS ====================

attendanceHistorySchema.query.present = function() {
  return this.where({ status: 'present' });
};

attendanceHistorySchema.query.absent = function() {
  return this.where({ status: 'absent' });
};

attendanceHistorySchema.query.late = function() {
  return this.where({ status: 'late' });
};

attendanceHistorySchema.query.excused = function() {
  return this.where({ status: 'excused' });
};

attendanceHistorySchema.query.byMethod = function(method) {
  return this.where({ recognizedBy: method });
};

attendanceHistorySchema.query.verified = function() {
  return this.where({ isVerified: true });
};

attendanceHistorySchema.query.suspicious = function() {
  return this.where({ isSuspicious: true });
};

attendanceHistorySchema.query.today = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.where('sessionDate').gte(today).lt(tomorrow);
};

attendanceHistorySchema.query.thisWeek = function() {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  weekStart.setHours(0, 0, 0, 0);
  
  return this.where('sessionDate').gte(weekStart);
};

attendanceHistorySchema.query.thisMonth = function() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return this.where('sessionDate').gte(monthStart);
};

const AttendanceHistory = mongoose.model('AttendanceHistory', attendanceHistorySchema);

module.exports = AttendanceHistory;