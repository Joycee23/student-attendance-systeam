const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Course is required'],
      validate: {
        validator: async function(value) {
          const Subject = mongoose.model('Subject');
          const course = await Subject.findById(value);
          return course && course.isActive;
        },
        message: 'Course must exist and be active'
      }
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
      validate: {
        validator: async function(value) {
          const Class = mongoose.model('Class');
          const classDoc = await Class.findById(value);
          return classDoc && classDoc.isActive;
        },
        message: 'Class must exist and be active'
      }
    },

    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lecturer is required'],
      validate: {
        validator: async function(value) {
          const User = mongoose.model('User');
          const lecturer = await User.findById(value);
          return lecturer && lecturer.role === 'lecturer' && lecturer.isActive;
        },
        message: 'Lecturer must exist, be active and have lecturer role'
      }
    },

    sessionDate: {
      type: Date,
      required: [true, 'Session date is required'],
      validate: {
        validator: function(value) {
          // Không cho phép tạo buổi học quá xa trong quá khứ (>7 ngày)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return value >= sevenDaysAgo;
        },
        message: 'Session date cannot be more than 7 days in the past'
      }
    },

    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },

    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function(value) {
          return value > this.startTime;
        },
        message: 'End time must be after start time'
      }
    },

    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      uppercase: true,
      maxlength: [100, 'Location cannot exceed 100 characters']
    },

    status: {
      type: String,
      enum: {
        values: ['open', 'closed', 'cancelled'],
        message: '{VALUE} is not a valid status'
      },
      default: 'open'
    },

    // Thông tin bổ sung
    sessionType: {
      type: String,
      enum: ['theory', 'practice', 'exam', 'review', 'other'],
      default: 'theory'
    },

    sessionNumber: {
      type: Number,
      min: [1, 'Session number must be at least 1'],
      required: true
    },

    topic: {
      type: String,
      trim: true,
      maxlength: [200, 'Topic cannot exceed 200 characters']
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },

    // Phương thức điểm danh
    attendanceMethods: {
      manual: {
        type: Boolean,
        default: true
      },
      qrCode: {
        type: Boolean,
        default: false
      },
      faceRecognition: {
        type: Boolean,
        default: false
      },
      gps: {
        type: Boolean,
        default: false
      }
    },

    // QR Code
    qrCode: {
      code: {
        type: String,
        default: null
      },
      generatedAt: {
        type: Date,
        default: null
      },
      expiresAt: {
        type: Date,
        default: null
      },
      isActive: {
        type: Boolean,
        default: false
      }
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
      radius: {
        type: Number,
        default: 100, // mét
        min: 10,
        max: 1000
      }
    },

    // Thống kê điểm danh
    totalStudents: {
      type: Number,
      default: 0,
      min: 0
    },

    presentCount: {
      type: Number,
      default: 0,
      min: 0
    },

    absentCount: {
      type: Number,
      default: 0,
      min: 0
    },

    lateCount: {
      type: Number,
      default: 0,
      min: 0
    },

    excusedCount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Thời gian
    actualStartTime: {
      type: Date,
      default: null
    },

    actualEndTime: {
      type: Date,
      default: null
    },

    // Late threshold (phút)
    lateThreshold: {
      type: Number,
      default: 15,
      min: 0,
      max: 60
    },

    // Auto close
    autoCloseEnabled: {
      type: Boolean,
      default: true
    },

    autoClosedAt: {
      type: Date,
      default: null
    },

    // Notes
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },

    // Metadata
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    closedAt: {
      type: Date,
      default: null
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    cancelledAt: {
      type: Date,
      default: null
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
attendanceSessionSchema.index({ courseId: 1 });
attendanceSessionSchema.index({ classId: 1 });
attendanceSessionSchema.index({ lecturerId: 1 });
attendanceSessionSchema.index({ sessionDate: -1 });
attendanceSessionSchema.index({ status: 1 });
attendanceSessionSchema.index({ 'qrCode.code': 1 }, { sparse: true });
attendanceSessionSchema.index({ classId: 1, courseId: 1, sessionDate: -1 });
attendanceSessionSchema.index({ status: 1, sessionDate: -1 });

// Unique: Không cho phép 2 session cùng lớp, môn, ngày giờ
attendanceSessionSchema.index(
  { classId: 1, courseId: 1, sessionDate: 1, startTime: 1 },
  { unique: true }
);

// ==================== VIRTUAL FIELDS ====================

// Tỷ lệ điểm danh
attendanceSessionSchema.virtual('attendanceRate').get(function() {
  if (this.totalStudents === 0) return 0;
  return Math.round((this.presentCount / this.totalStudents) * 100);
});

// Tỷ lệ vắng
attendanceSessionSchema.virtual('absentRate').get(function() {
  if (this.totalStudents === 0) return 0;
  return Math.round((this.absentCount / this.totalStudents) * 100);
});

// Độ dài buổi học (phút)
attendanceSessionSchema.virtual('duration').get(function() {
  if (!this.startTime || !this.endTime) return 0;
  return Math.round((this.endTime - this.startTime) / (1000 * 60));
});

// Độ dài thực tế (phút)
attendanceSessionSchema.virtual('actualDuration').get(function() {
  if (!this.actualStartTime || !this.actualEndTime) return 0;
  return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60));
});

// Kiểm tra đang diễn ra
attendanceSessionSchema.virtual('isOngoing').get(function() {
  if (this.status !== 'open') return false;
  const now = new Date();
  return now >= this.startTime && now <= this.endTime;
});

// Kiểm tra đã kết thúc
attendanceSessionSchema.virtual('isFinished').get(function() {
  return this.status === 'closed' || new Date() > this.endTime;
});

// Kiểm tra QR code còn hiệu lực
attendanceSessionSchema.virtual('isQRCodeValid').get(function() {
  if (!this.qrCode.isActive) return false;
  if (!this.qrCode.expiresAt) return false;
  return new Date() < this.qrCode.expiresAt;
});

// ==================== MIDDLEWARE ====================

// Validate trước khi lưu
attendanceSessionSchema.pre('save', async function(next) {
  try {
    // Kiểm tra lecturer có dạy lớp này không
    const Class = mongoose.model('Class');
    const Subject = mongoose.model('Subject');
    
    const classDoc = await Class.findById(this.classId);
    const subject = await Subject.findById(this.courseId);
    
    if (!classDoc || !subject) {
      return next(new Error('Class or Subject not found'));
    }

    // Kiểm tra môn học có trong lớp không
    if (!classDoc.courseIds.includes(this.courseId)) {
      return next(new Error('Subject is not assigned to this class'));
    }

    // Kiểm tra giảng viên có phụ trách môn này không
    if (!subject.lecturerIds.includes(this.lecturerId)) {
      return next(new Error('Lecturer does not teach this subject'));
    }

    // Lấy tổng số sinh viên
    if (this.isNew) {
      this.totalStudents = classDoc.studentIds.length;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Auto close session sau endTime
attendanceSessionSchema.pre('save', function(next) {
  if (this.autoCloseEnabled && this.status === 'open' && new Date() > this.endTime) {
    this.status = 'closed';
    this.autoClosedAt = new Date();
    this.actualEndTime = this.endTime;
  }
  next();
});

// Tạo attendance records khi tạo session mới
attendanceSessionSchema.post('save', async function(doc) {
  if (doc.isNew) {
    const Class = mongoose.model('Class');
    const AttendanceRecord = mongoose.model('AttendanceRecord');
    
    const classDoc = await Class.findById(doc.classId).populate('studentIds');
    
    if (classDoc && classDoc.studentIds.length > 0) {
      const records = classDoc.studentIds.map(student => ({
        sessionId: doc._id,
        studentId: student._id,
        status: 'absent' // Mặc định là vắng
      }));
      
      await AttendanceRecord.insertMany(records);
    }
  }
});

// ==================== METHODS ====================

// Mở buổi điểm danh
attendanceSessionSchema.methods.open = async function() {
  if (this.status !== 'closed') {
    throw new Error('Session is already open or cancelled');
  }

  this.status = 'open';
  this.actualStartTime = new Date();
  return this.save();
};

// Đóng buổi điểm danh
attendanceSessionSchema.methods.close = async function(closedBy = null) {
  if (this.status !== 'open') {
    throw new Error('Session is not open');
  }

  this.status = 'closed';
  this.closedBy = closedBy;
  this.closedAt = new Date();
  this.actualEndTime = new Date();

  // Cập nhật thống kê
  await this.updateStatistics();

  return this.save();
};

// Hủy buổi học
attendanceSessionSchema.methods.cancel = async function(cancelledBy, reason) {
  if (this.status === 'cancelled') {
    throw new Error('Session is already cancelled');
  }

  this.status = 'cancelled';
  this.cancelledBy = cancelledBy;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;

  return this.save();
};

// Tạo QR code
attendanceSessionSchema.methods.generateQRCode = function(expiryMinutes = 5) {
  const crypto = require('crypto');
  const code = crypto.randomBytes(32).toString('hex');
  
  this.qrCode.code = code;
  this.qrCode.generatedAt = new Date();
  this.qrCode.expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  this.qrCode.isActive = true;

  return this.save();
};

// Vô hiệu hóa QR code
attendanceSessionSchema.methods.deactivateQRCode = function() {
  this.qrCode.isActive = false;
  return this.save();
};

// Verify QR code
attendanceSessionSchema.methods.verifyQRCode = function(code) {
  if (!this.qrCode.isActive) {
    return { valid: false, message: 'QR code is not active' };
  }

  if (this.qrCode.code !== code) {
    return { valid: false, message: 'Invalid QR code' };
  }

  if (new Date() > this.qrCode.expiresAt) {
    return { valid: false, message: 'QR code has expired' };
  }

  return { valid: true, message: 'QR code is valid' };
};

// Kiểm tra GPS location
attendanceSessionSchema.methods.verifyGPSLocation = function(latitude, longitude) {
  if (!this.gpsLocation.latitude || !this.gpsLocation.longitude) {
    return { valid: false, message: 'GPS location not set for this session' };
  }

  // Tính khoảng cách (Haversine formula)
  const R = 6371e3; // Bán kính trái đất (mét)
  const φ1 = this.gpsLocation.latitude * Math.PI / 180;
  const φ2 = latitude * Math.PI / 180;
  const Δφ = (latitude - this.gpsLocation.latitude) * Math.PI / 180;
  const Δλ = (longitude - this.gpsLocation.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Khoảng cách (mét)

  if (distance <= this.gpsLocation.radius) {
    return { valid: true, distance, message: 'Location is valid' };
  }

  return { valid: false, distance, message: `You are ${Math.round(distance)}m away from class` };
};

// Cập nhật thống kê
attendanceSessionSchema.methods.updateStatistics = async function() {
  const AttendanceRecord = mongoose.model('AttendanceRecord');
  
  const stats = await AttendanceRecord.aggregate([
    { $match: { sessionId: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  this.presentCount = 0;
  this.absentCount = 0;
  this.lateCount = 0;
  this.excusedCount = 0;

  stats.forEach(stat => {
    switch (stat._id) {
      case 'present':
        this.presentCount = stat.count;
        break;
      case 'absent':
        this.absentCount = stat.count;
        break;
      case 'late':
        this.lateCount = stat.count;
        break;
      case 'excused':
        this.excusedCount = stat.count;
        break;
    }
  });

  return this.save();
};

// Lấy danh sách điểm danh
attendanceSessionSchema.methods.getAttendanceRecords = async function() {
  const AttendanceRecord = mongoose.model('AttendanceRecord');
  return AttendanceRecord.find({ sessionId: this._id })
    .populate('studentId', '-password')
    .sort({ 'studentId.fullName': 1 });
};

// Lấy thông tin đầy đủ
attendanceSessionSchema.methods.getFullDetails = async function() {
  return this.populate([
    { path: 'courseId', select: 'code name' },
    { path: 'classId', select: 'name' },
    { path: 'lecturerId', select: 'fullName email lecturerCode' }
  ]);
};

// ==================== STATIC METHODS ====================

// Lấy sessions của lớp
attendanceSessionSchema.statics.getSessionsByClass = function(classId, filters = {}) {
  const query = { classId, ...filters };
  return this.find(query).sort({ sessionDate: -1, startTime: -1 });
};

// Lấy sessions của môn học
attendanceSessionSchema.statics.getSessionsByCourse = function(courseId, filters = {}) {
  const query = { courseId, ...filters };
  return this.find(query).sort({ sessionDate: -1, startTime: -1 });
};

// Lấy sessions của giảng viên
attendanceSessionSchema.statics.getSessionsByLecturer = function(lecturerId, filters = {}) {
  const query = { lecturerId, ...filters };
  return this.find(query).sort({ sessionDate: -1, startTime: -1 });
};

// Lấy sessions đang mở
attendanceSessionSchema.statics.getOpenSessions = function(filters = {}) {
  const query = { status: 'open', ...filters };
  return this.find(query).sort({ startTime: 1 });
};

// Lấy sessions hôm nay
attendanceSessionSchema.statics.getTodaySessions = function(filters = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const query = {
    sessionDate: { $gte: today, $lt: tomorrow },
    ...filters
  };

  return this.find(query).sort({ startTime: 1 });
};

// Tìm session bằng QR code
attendanceSessionSchema.statics.findByQRCode = function(code) {
  return this.findOne({
    'qrCode.code': code,
    'qrCode.isActive': true,
    status: 'open'
  });
};

// Thống kê
attendanceSessionSchema.statics.getStatistics = async function(filters = {}) {
  const total = await this.countDocuments(filters);
  const open = await this.countDocuments({ ...filters, status: 'open' });
  const closed = await this.countDocuments({ ...filters, status: 'closed' });
  const cancelled = await this.countDocuments({ ...filters, status: 'cancelled' });

  const avgAttendance = await this.aggregate([
    { $match: { ...filters, status: 'closed' } },
    {
      $group: {
        _id: null,
        avgRate: {
          $avg: {
            $cond: [
              { $eq: ['$totalStudents', 0] },
              0,
              { $multiply: [{ $divide: ['$presentCount', '$totalStudents'] }, 100] }
            ]
          }
        }
      }
    }
  ]);

  return {
    totalSessions: total,
    openSessions: open,
    closedSessions: closed,
    cancelledSessions: cancelled,
    averageAttendanceRate: avgAttendance[0]?.avgRate || 0
  };
};

// ==================== QUERY HELPERS ====================

attendanceSessionSchema.query.open = function() {
  return this.where({ status: 'open' });
};

attendanceSessionSchema.query.closed = function() {
  return this.where({ status: 'closed' });
};

attendanceSessionSchema.query.today = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.where('sessionDate').gte(today).lt(tomorrow);
};

attendanceSessionSchema.query.upcoming = function() {
  return this.where('startTime').gt(new Date());
};

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);

module.exports = AttendanceSession;