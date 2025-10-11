const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      unique: true,
      uppercase: true,
      minlength: [3, 'Class name must be at least 3 characters'],
      maxlength: [50, 'Class name cannot exceed 50 characters'],
      match: [
        /^[A-Z0-9\-]+$/,
        'Class name can only contain uppercase letters, numbers, and hyphens'
      ]
    },

    // Cố vấn học tập / Giảng viên chủ nhiệm
    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lecturer is required'],
      validate: {
        validator: async function(value) {
          if (!value) return false;
          
          const User = mongoose.model('User');
          const lecturer = await User.findById(value);
          
          // Phải là giảng viên
          return lecturer && lecturer.role === 'lecturer';
        },
        message: 'Lecturer must have lecturer role'
      }
    },

    // Danh sách sinh viên trong lớp
    studentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: async function(value) {
          const User = mongoose.model('User');
          const student = await User.findById(value);
          
          // Phải là sinh viên
          return student && student.role === 'student';
        },
        message: 'Student ID must reference a user with student role'
      }
    }],

    // Các môn học của lớp
    courseIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    }],

    // Thông tin bổ sung
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },

    academicYear: {
      type: String,
      trim: true,
      match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2023-2024)']
    },

    semester: {
      type: Number,
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12']
    },

    // Khoa/Ngành
    department: {
      type: String,
      trim: true,
      uppercase: true
    },

    major: {
      type: String,
      trim: true
    },

    // Khóa học (K17, K18,...)
    courseYear: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^K\d{2}$/, 'Course year must be in format KXX (e.g., K17, K18)']
    },

    // Trạng thái lớp
    isActive: {
      type: Boolean,
      default: true
    },

    // Sĩ số
    maxStudents: {
      type: Number,
      default: 50,
      min: [1, 'Max students must be at least 1'],
      max: [200, 'Max students cannot exceed 200']
    },

    // Thống kê
    totalSessions: {
      type: Number,
      default: 0,
      min: 0
    },

    completedSessions: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
classSchema.index({ name: 1 }, { unique: true });
classSchema.index({ lecturerId: 1 });
classSchema.index({ studentIds: 1 });
classSchema.index({ courseIds: 1 });
classSchema.index({ isActive: 1 });
classSchema.index({ academicYear: 1, semester: 1 });
classSchema.index({ department: 1 });
classSchema.index({ courseYear: 1 });

// ==================== VIRTUAL FIELDS ====================

// Số lượng sinh viên hiện tại
classSchema.virtual('currentStudents').get(function() {
  return this.studentIds ? this.studentIds.length : 0;
});

// Số lượng môn học
classSchema.virtual('totalCourses').get(function() {
  return this.courseIds ? this.courseIds.length : 0;
});

// Tỷ lệ hoàn thành buổi học
classSchema.virtual('completionRate').get(function() {
  if (this.totalSessions === 0) return 0;
  return Math.round((this.completedSessions / this.totalSessions) * 100);
});

// Kiểm tra lớp đã đầy chưa
classSchema.virtual('isFull').get(function() {
  return this.currentStudents >= this.maxStudents;
});

// ==================== MIDDLEWARE ====================

// Validate số lượng sinh viên trước khi lưu
classSchema.pre('save', function(next) {
  if (this.studentIds && this.studentIds.length > this.maxStudents) {
    return next(new Error(`Class cannot have more than ${this.maxStudents} students`));
  }
  next();
});

// Cập nhật classId của sinh viên khi thêm vào lớp
classSchema.post('save', async function(doc) {
  if (doc.studentIds && doc.studentIds.length > 0) {
    const User = mongoose.model('User');
    
    // Cập nhật classId cho tất cả sinh viên trong lớp
    await User.updateMany(
      { _id: { $in: doc.studentIds }, role: 'student' },
      { $set: { classId: doc._id } }
    );
  }
});

// Xóa tham chiếu khi xóa lớp
classSchema.pre('remove', async function(next) {
  try {
    const User = mongoose.model('User');
    
    // Xóa classId của các sinh viên
    await User.updateMany(
      { classId: this._id },
      { $unset: { classId: 1 } }
    );
    
    next();
  } catch (error) {
    next(error);
  }
});

// ==================== METHODS ====================

// Thêm sinh viên vào lớp
classSchema.methods.addStudent = async function(studentId) {
  // Kiểm tra lớp đã đầy chưa
  if (this.isFull) {
    throw new Error('Class is full');
  }

  // Kiểm tra sinh viên đã có trong lớp chưa
  if (this.studentIds.includes(studentId)) {
    throw new Error('Student already in class');
  }

  // Kiểm tra student có tồn tại không
  const User = mongoose.model('User');
  const student = await User.findById(studentId);
  
  if (!student) {
    throw new Error('Student not found');
  }

  if (student.role !== 'student') {
    throw new Error('User is not a student');
  }

  // Thêm sinh viên
  this.studentIds.push(studentId);
  await this.save();

  // Cập nhật classId cho sinh viên
  student.classId = this._id;
  await student.save();

  return this;
};

// Xóa sinh viên khỏi lớp
classSchema.methods.removeStudent = async function(studentId) {
  // Kiểm tra sinh viên có trong lớp không
  const index = this.studentIds.indexOf(studentId);
  if (index === -1) {
    throw new Error('Student not in class');
  }

  // Xóa sinh viên
  this.studentIds.splice(index, 1);
  await this.save();

  // Xóa classId của sinh viên
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(studentId, { $unset: { classId: 1 } });

  return this;
};

// Thêm nhiều sinh viên
classSchema.methods.addMultipleStudents = async function(studentIds) {
  const errors = [];
  const added = [];

  for (const studentId of studentIds) {
    try {
      await this.addStudent(studentId);
      added.push(studentId);
    } catch (error) {
      errors.push({ studentId, error: error.message });
    }
  }

  return { added, errors };
};

// Xóa nhiều sinh viên
classSchema.methods.removeMultipleStudents = async function(studentIds) {
  const errors = [];
  const removed = [];

  for (const studentId of studentIds) {
    try {
      await this.removeStudent(studentId);
      removed.push(studentId);
    } catch (error) {
      errors.push({ studentId, error: error.message });
    }
  }

  return { removed, errors };
};

// Thêm môn học vào lớp
classSchema.methods.addCourse = async function(courseId) {
  // Kiểm tra môn học đã có chưa
  if (this.courseIds.includes(courseId)) {
    throw new Error('Course already in class');
  }

  // Kiểm tra môn học có tồn tại không
  const Subject = mongoose.model('Subject');
  const course = await Subject.findById(courseId);
  
  if (!course) {
    throw new Error('Course not found');
  }

  this.courseIds.push(courseId);
  return this.save();
};

// Xóa môn học khỏi lớp
classSchema.methods.removeCourse = async function(courseId) {
  const index = this.courseIds.indexOf(courseId);
  if (index === -1) {
    throw new Error('Course not in class');
  }

  this.courseIds.splice(index, 1);
  return this.save();
};

// Cập nhật thống kê buổi học
classSchema.methods.updateSessionStats = async function() {
  const Attendance = mongoose.model('Attendance');
  
  const total = await Attendance.countDocuments({ classId: this._id });
  const completed = await Attendance.countDocuments({ 
    classId: this._id, 
    status: 'completed' 
  });

  this.totalSessions = total;
  this.completedSessions = completed;
  
  return this.save();
};

// Lấy danh sách sinh viên với thông tin đầy đủ
classSchema.methods.getStudentsWithDetails = async function() {
  return this.populate({
    path: 'studentIds',
    select: '-password',
    match: { isActive: true }
  });
};

// Lấy thông tin giảng viên
classSchema.methods.getLecturerDetails = async function() {
  return this.populate({
    path: 'lecturerId',
    select: '-password'
  });
};

// Lấy danh sách môn học
classSchema.methods.getCoursesDetails = async function() {
  return this.populate('courseIds');
};

// ==================== STATIC METHODS ====================

// Tìm lớp theo tên
classSchema.statics.findByName = function(name) {
  return this.findOne({ name: name.toUpperCase() });
};

// Lấy tất cả lớp của giảng viên
classSchema.statics.getClassesByLecturer = function(lecturerId) {
  return this.find({ 
    lecturerId, 
    isActive: true 
  }).sort({ name: 1 });
};

// Tìm lớp có sinh viên cụ thể
classSchema.statics.findClassByStudent = function(studentId) {
  return this.findOne({ 
    studentIds: studentId,
    isActive: true
  });
};

// Lấy lớp theo khóa học
classSchema.statics.getClassesByCourseYear = function(courseYear) {
  return this.find({ 
    courseYear: courseYear.toUpperCase(),
    isActive: true
  }).sort({ name: 1 });
};

// Lấy lớp theo khoa
classSchema.statics.getClassesByDepartment = function(department) {
  return this.find({ 
    department: department.toUpperCase(),
    isActive: true
  }).sort({ name: 1 });
};

// Lấy lớp theo năm học và học kỳ
classSchema.statics.getClassesByAcademicYear = function(academicYear, semester = null) {
  const query = { academicYear, isActive: true };
  if (semester) query.semester = semester;
  
  return this.find(query).sort({ name: 1 });
};

// Thống kê tổng quan
classSchema.statics.getStatistics = async function() {
  const total = await this.countDocuments({ isActive: true });
  const withLecturer = await this.countDocuments({ 
    lecturerId: { $exists: true, $ne: null },
    isActive: true 
  });
  
  const avgStudents = await this.aggregate([
    { $match: { isActive: true } },
    { 
      $project: { 
        studentCount: { $size: { $ifNull: ['$studentIds', []] } }
      }
    },
    {
      $group: {
        _id: null,
        avgStudents: { $avg: '$studentCount' },
        totalStudents: { $sum: '$studentCount' }
      }
    }
  ]);

  return {
    totalClasses: total,
    classesWithLecturer: withLecturer,
    averageStudentsPerClass: avgStudents[0]?.avgStudents || 0,
    totalStudentsEnrolled: avgStudents[0]?.totalStudents || 0
  };
};

// ==================== QUERY HELPERS ====================

// Chỉ lấy lớp active
classSchema.query.active = function() {
  return this.where({ isActive: true });
};

// Lấy lớp có sinh viên
classSchema.query.withStudents = function() {
  return this.where('studentIds').ne([]);
};

// Lấy lớp chưa đầy
classSchema.query.notFull = function() {
  return this.where('$expr').gte([
    '$maxStudents',
    { $size: { $ifNull: ['$studentIds', []] } }
  ]);
};

const Class = mongoose.model('Class', classSchema);

module.exports = Class;