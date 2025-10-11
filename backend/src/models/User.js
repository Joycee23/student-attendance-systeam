const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Không trả về password khi query
    },

    role: {
      type: String,
      enum: {
        values: ['admin', 'lecturer', 'student'],
        message: '{VALUE} is not a valid role'
      },
      required: [true, 'Role is required'],
      default: 'student'
    },

    avatarUrl: {
      type: String,
      default: null
    },

    // Chỉ dành cho sinh viên
    studentCode: {
      type: String,
      sparse: true, // Cho phép null nhưng unique nếu có giá trị
      trim: true,
      uppercase: true,
      validate: {
        validator: function(value) {
          // Chỉ bắt buộc nếu role là student
          if (this.role === 'student') {
            return value && value.length > 0;
          }
          return true;
        },
        message: 'Student code is required for student role'
      }
    },

    // Chỉ dành cho giảng viên
    lecturerCode: {
      type: String,
      sparse: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: function(value) {
          // Chỉ bắt buộc nếu role là lecturer
          if (this.role === 'lecturer') {
            return value && value.length > 0;
          }
          return true;
        },
        message: 'Lecturer code is required for lecturer role'
      }
    },

    // Lớp học (chỉ cho sinh viên)
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
      validate: {
        validator: function(value) {
          // Sinh viên nên có classId (không bắt buộc cứng)
          return true;
        }
      }
    },

    // Môn học
    // - Giảng viên: Môn học phụ trách
    // - Sinh viên: Môn học đang theo học
    courseIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }],

    // Thông tin bổ sung
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,11}$/, 'Please provide a valid phone number']
    },

    dateOfBirth: {
      type: Date,
      default: null
    },

    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },

    // Trạng thái tài khoản
    isActive: {
      type: Boolean,
      default: true
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    // Face Recognition
    hasFaceRegistered: {
      type: Boolean,
      default: false
    },

    faceEncodingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FaceEncoding',
      default: null
    },

    // Thông tin đăng nhập
    lastLogin: {
      type: Date,
      default: null
    },

    loginAttempts: {
      type: Number,
      default: 0
    },

    lockUntil: {
      type: Date,
      default: null
    },

    // Reset password
    resetPasswordToken: {
      type: String,
      default: null,
      select: false
    },

    resetPasswordExpire: {
      type: Date,
      default: null,
      select: false
    }
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
userSchema.index({ email: 1 });
userSchema.index({ studentCode: 1 }, { sparse: true });
userSchema.index({ lecturerCode: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ classId: 1 });
userSchema.index({ isActive: 1 });

// ==================== VIRTUAL FIELDS ====================
// Kiểm tra tài khoản có bị khóa không
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ==================== MIDDLEWARE ====================

// Hash password trước khi lưu
userSchema.pre('save', async function(next) {
  // Chỉ hash nếu password được modify
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Validate role-specific fields trước khi lưu
userSchema.pre('save', function(next) {
  // Sinh viên phải có studentCode
  if (this.role === 'student' && !this.studentCode) {
    return next(new Error('Student must have a student code'));
  }

  // Giảng viên phải có lecturerCode
  if (this.role === 'lecturer' && !this.lecturerCode) {
    return next(new Error('Lecturer must have a lecturer code'));
  }

  // Admin không cần code
  if (this.role === 'admin') {
    this.studentCode = undefined;
    this.lecturerCode = undefined;
    this.classId = undefined;
  }

  next();
});

// Xóa password khỏi response
userSchema.post('save', function(doc, next) {
  doc.password = undefined;
  next();
});

// ==================== METHODS ====================

// So sánh password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Tăng số lần đăng nhập thất bại
userSchema.methods.incLoginAttempts = async function() {
  // Nếu đã hết thời gian khóa, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  // Tăng số lần thử
  const updates = { $inc: { loginAttempts: 1 } };

  // Khóa tài khoản sau 5 lần thử sai
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 giờ

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 }
  });
};

// Tạo reset password token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 phút

  return resetToken;
};

// ==================== STATIC METHODS ====================

// Tìm user theo email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Tìm sinh viên theo mã
userSchema.statics.findStudentByCode = function(studentCode) {
  return this.findOne({ 
    studentCode: studentCode.toUpperCase(),
    role: 'student'
  });
};

// Tìm giảng viên theo mã
userSchema.statics.findLecturerByCode = function(lecturerCode) {
  return this.findOne({ 
    lecturerCode: lecturerCode.toUpperCase(),
    role: 'lecturer'
  });
};

// Lấy danh sách sinh viên trong lớp
userSchema.statics.getStudentsByClass = function(classId) {
  return this.find({ 
    classId,
    role: 'student',
    isActive: true
  }).select('-password');
};

// Lấy danh sách giảng viên dạy môn học
userSchema.statics.getLecturersByCourse = function(courseId) {
  return this.find({ 
    courseIds: courseId,
    role: 'lecturer',
    isActive: true
  }).select('-password');
};

// ==================== QUERY HELPERS ====================

// Helper: Chỉ lấy user active
userSchema.query.active = function() {
  return this.where({ isActive: true });
};

// Helper: Lấy theo role
userSchema.query.byRole = function(role) {
  return this.where({ role });
};

const User = mongoose.model('User', userSchema);

module.exports = User;