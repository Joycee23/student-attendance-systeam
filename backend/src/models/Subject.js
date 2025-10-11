const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, 'Subject code must be at least 3 characters'],
      maxlength: [20, 'Subject code cannot exceed 20 characters'],
      match: [
        /^[A-Z0-9]+$/,
        'Subject code can only contain uppercase letters and numbers'
      ]
    },

    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      minlength: [3, 'Subject name must be at least 3 characters'],
      maxlength: [200, 'Subject name cannot exceed 200 characters']
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },

    // Giảng viên phụ trách môn học
    lecturerIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: async function(value) {
          const User = mongoose.model('User');
          const lecturer = await User.findById(value);
          
          // Phải là giảng viên
          return lecturer && lecturer.role === 'lecturer';
        },
        message: 'Lecturer ID must reference a user with lecturer role'
      }
    }],

    // Các lớp học tham gia môn này
    classIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }],

    // Thông tin bổ sung
    credits: {
      type: Number,
      min: [1, 'Credits must be at least 1'],
      max: [10, 'Credits cannot exceed 10'],
      default: 3
    },

    // Số tiết học (lý thuyết + thực hành)
    theoryHours: {
      type: Number,
      min: [0, 'Theory hours cannot be negative'],
      default: 30
    },

    practiceHours: {
      type: Number,
      min: [0, 'Practice hours cannot be negative'],
      default: 0
    },

    // Học kỳ thường mở
    semester: {
      type: Number,
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12']
    },

    // Khoa/bộ môn
    department: {
      type: String,
      trim: true,
      uppercase: true
    },

    // Môn học bắt buộc hay tự chọn
    isRequired: {
      type: Boolean,
      default: true
    },

    // Môn tiên quyết (prerequisite)
    prerequisiteIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }],

    // Trạng thái môn học
    isActive: {
      type: Boolean,
      default: true
    },

    // Năm học áp dụng
    academicYear: {
      type: String,
      trim: true,
      match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
    },

    // Thống kê
    totalClasses: {
      type: Number,
      default: 0,
      min: 0
    },

    totalStudents: {
      type: Number,
      default: 0,
      min: 0
    },

    totalSessions: {
      type: Number,
      default: 0,
      min: 0
    },

    // Điểm danh
    attendanceRequirement: {
      type: Number,
      min: [0, 'Attendance requirement cannot be negative'],
      max: [100, 'Attendance requirement cannot exceed 100'],
      default: 80 // Yêu cầu 80% điểm danh
    },

    // Metadata
    syllabus: {
      type: String, // URL hoặc path đến file đề cương môn học
      default: null
    },

    materials: [{
      name: String,
      url: String,
      type: {
        type: String,
        enum: ['pdf', 'doc', 'ppt', 'video', 'link', 'other']
      }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
subjectSchema.index({ code: 1 }, { unique: true });
subjectSchema.index({ name: 1 });
subjectSchema.index({ lecturerIds: 1 });
subjectSchema.index({ classIds: 1 });
subjectSchema.index({ department: 1 });
subjectSchema.index({ isActive: 1 });
subjectSchema.index({ academicYear: 1, semester: 1 });
subjectSchema.index({ isRequired: 1 });

// ==================== VIRTUAL FIELDS ====================

// Tổng số giờ học
subjectSchema.virtual('totalHours').get(function() {
  return this.theoryHours + this.practiceHours;
});

// Số lượng giảng viên
subjectSchema.virtual('lecturerCount').get(function() {
  return this.lecturerIds ? this.lecturerIds.length : 0;
});

// Số lượng lớp học
subjectSchema.virtual('classCount').get(function() {
  return this.classIds ? this.classIds.length : 0;
});

// Số lượng môn tiên quyết
subjectSchema.virtual('prerequisiteCount').get(function() {
  return this.prerequisiteIds ? this.prerequisiteIds.length : 0;
});

// Trung bình sinh viên mỗi lớp
subjectSchema.virtual('avgStudentsPerClass').get(function() {
  if (this.totalClasses === 0) return 0;
  return Math.round(this.totalStudents / this.totalClasses);
});

// ==================== MIDDLEWARE ====================

// Validate không tự tham chiếu làm môn tiên quyết
subjectSchema.pre('save', function(next) {
  if (this.prerequisiteIds && this.prerequisiteIds.some(id => id.equals(this._id))) {
    return next(new Error('Subject cannot be its own prerequisite'));
  }
  next();
});

// Cập nhật courseIds trong User khi thêm giảng viên
subjectSchema.post('save', async function(doc) {
  if (doc.lecturerIds && doc.lecturerIds.length > 0) {
    const User = mongoose.model('User');
    
    // Thêm subject vào courseIds của giảng viên
    await User.updateMany(
      { 
        _id: { $in: doc.lecturerIds }, 
        role: 'lecturer' 
      },
      { $addToSet: { courseIds: doc._id } }
    );
  }
});

// Xóa tham chiếu khi xóa môn học
subjectSchema.pre('remove', async function(next) {
  try {
    const User = mongoose.model('User');
    const Class = mongoose.model('Class');
    
    // Xóa subject khỏi courseIds của giảng viên
    await User.updateMany(
      { courseIds: this._id },
      { $pull: { courseIds: this._id } }
    );
    
    // Xóa subject khỏi courseIds của lớp học
    await Class.updateMany(
      { courseIds: this._id },
      { $pull: { courseIds: this._id } }
    );
    
    next();
  } catch (error) {
    next(error);
  }
});

// ==================== METHODS ====================

// Thêm giảng viên vào môn học
subjectSchema.methods.addLecturer = async function(lecturerId) {
  // Kiểm tra giảng viên đã có trong môn học chưa
  if (this.lecturerIds.includes(lecturerId)) {
    throw new Error('Lecturer already assigned to this subject');
  }

  // Kiểm tra lecturer có tồn tại không
  const User = mongoose.model('User');
  const lecturer = await User.findById(lecturerId);
  
  if (!lecturer) {
    throw new Error('Lecturer not found');
  }

  if (lecturer.role !== 'lecturer') {
    throw new Error('User is not a lecturer');
  }

  // Thêm giảng viên
  this.lecturerIds.push(lecturerId);
  await this.save();

  // Cập nhật courseIds cho giảng viên
  if (!lecturer.courseIds.includes(this._id)) {
    lecturer.courseIds.push(this._id);
    await lecturer.save();
  }

  return this;
};

// Xóa giảng viên khỏi môn học
subjectSchema.methods.removeLecturer = async function(lecturerId) {
  const index = this.lecturerIds.indexOf(lecturerId);
  if (index === -1) {
    throw new Error('Lecturer not assigned to this subject');
  }

  // Xóa giảng viên
  this.lecturerIds.splice(index, 1);
  await this.save();

  // Xóa subject khỏi courseIds của giảng viên
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(
    lecturerId,
    { $pull: { courseIds: this._id } }
  );

  return this;
};

// Thêm nhiều giảng viên
subjectSchema.methods.addMultipleLecturers = async function(lecturerIds) {
  const errors = [];
  const added = [];

  for (const lecturerId of lecturerIds) {
    try {
      await this.addLecturer(lecturerId);
      added.push(lecturerId);
    } catch (error) {
      errors.push({ lecturerId, error: error.message });
    }
  }

  return { added, errors };
};

// Thêm lớp học vào môn
subjectSchema.methods.addClass = async function(classId) {
  // Kiểm tra lớp đã có chưa
  if (this.classIds.includes(classId)) {
    throw new Error('Class already enrolled in this subject');
  }

  // Kiểm tra class có tồn tại không
  const Class = mongoose.model('Class');
  const classDoc = await Class.findById(classId);
  
  if (!classDoc) {
    throw new Error('Class not found');
  }

  // Thêm lớp
  this.classIds.push(classId);
  await this.save();

  // Cập nhật courseIds cho lớp
  if (!classDoc.courseIds.includes(this._id)) {
    classDoc.courseIds.push(this._id);
    await classDoc.save();
  }

  // Cập nhật thống kê
  await this.updateStatistics();

  return this;
};

// Xóa lớp học khỏi môn
subjectSchema.methods.removeClass = async function(classId) {
  const index = this.classIds.indexOf(classId);
  if (index === -1) {
    throw new Error('Class not enrolled in this subject');
  }

  // Xóa lớp
  this.classIds.splice(index, 1);
  await this.save();

  // Xóa subject khỏi courseIds của lớp
  const Class = mongoose.model('Class');
  await Class.findByIdAndUpdate(
    classId,
    { $pull: { courseIds: this._id } }
  );

  // Cập nhật thống kê
  await this.updateStatistics();

  return this;
};

// Thêm môn tiên quyết
subjectSchema.methods.addPrerequisite = async function(subjectId) {
  // Không được tự tham chiếu
  if (subjectId.equals(this._id)) {
    throw new Error('Subject cannot be its own prerequisite');
  }

  // Kiểm tra đã có chưa
  if (this.prerequisiteIds.includes(subjectId)) {
    throw new Error('Prerequisite already added');
  }

  // Kiểm tra subject có tồn tại không
  const Subject = mongoose.model('Subject');
  const prerequisite = await Subject.findById(subjectId);
  
  if (!prerequisite) {
    throw new Error('Prerequisite subject not found');
  }

  this.prerequisiteIds.push(subjectId);
  return this.save();
};

// Xóa môn tiên quyết
subjectSchema.methods.removePrerequisite = async function(subjectId) {
  const index = this.prerequisiteIds.indexOf(subjectId);
  if (index === -1) {
    throw new Error('Prerequisite not found');
  }

  this.prerequisiteIds.splice(index, 1);
  return this.save();
};

// Cập nhật thống kê
subjectSchema.methods.updateStatistics = async function() {
  const Class = mongoose.model('Class');
  const Attendance = mongoose.model('Attendance');
  
  // Đếm số lớp
  this.totalClasses = this.classIds.length;
  
  // Đếm tổng số sinh viên
  const classes = await Class.find({ _id: { $in: this.classIds } });
  this.totalStudents = classes.reduce((sum, cls) => sum + (cls.studentIds?.length || 0), 0);
  
  // Đếm số buổi học
  this.totalSessions = await Attendance.countDocuments({ 
    subjectId: this._id 
  });
  
  return this.save();
};

// Lấy thông tin giảng viên
subjectSchema.methods.getLecturersDetails = async function() {
  return this.populate({
    path: 'lecturerIds',
    select: '-password'
  });
};

// Lấy thông tin lớp học
subjectSchema.methods.getClassesDetails = async function() {
  return this.populate('classIds');
};

// Lấy môn tiên quyết
subjectSchema.methods.getPrerequisites = async function() {
  return this.populate('prerequisiteIds');
};

// Thêm tài liệu học tập
subjectSchema.methods.addMaterial = async function(material) {
  if (!material.name || !material.url) {
    throw new Error('Material must have name and url');
  }

  this.materials.push(material);
  return this.save();
};

// Xóa tài liệu học tập
subjectSchema.methods.removeMaterial = async function(materialId) {
  const material = this.materials.id(materialId);
  if (!material) {
    throw new Error('Material not found');
  }

  material.remove();
  return this.save();
};

// ==================== STATIC METHODS ====================

// Tìm môn học theo mã
subjectSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

// Lấy môn học của giảng viên
subjectSchema.statics.getSubjectsByLecturer = function(lecturerId) {
  return this.find({ 
    lecturerIds: lecturerId,
    isActive: true
  }).sort({ code: 1 });
};

// Lấy môn học của lớp
subjectSchema.statics.getSubjectsByClass = function(classId) {
  return this.find({ 
    classIds: classId,
    isActive: true
  }).sort({ code: 1 });
};

// Lấy môn học theo khoa
subjectSchema.statics.getSubjectsByDepartment = function(department) {
  return this.find({ 
    department: department.toUpperCase(),
    isActive: true
  }).sort({ code: 1 });
};

// Lấy môn học theo học kỳ
subjectSchema.statics.getSubjectsBySemester = function(academicYear, semester) {
  return this.find({ 
    academicYear,
    semester,
    isActive: true
  }).sort({ code: 1 });
};

// Lấy môn học bắt buộc
subjectSchema.statics.getRequiredSubjects = function() {
  return this.find({ 
    isRequired: true,
    isActive: true
  }).sort({ code: 1 });
};

// Tìm kiếm môn học
subjectSchema.statics.searchSubjects = function(keyword) {
  const regex = new RegExp(keyword, 'i');
  return this.find({
    $or: [
      { code: regex },
      { name: regex },
      { description: regex }
    ],
    isActive: true
  }).sort({ code: 1 });
};

// Thống kê tổng quan
subjectSchema.statics.getStatistics = async function() {
  const total = await this.countDocuments({ isActive: true });
  const required = await this.countDocuments({ isRequired: true, isActive: true });
  const elective = await this.countDocuments({ isRequired: false, isActive: true });
  
  const avgCredits = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        avgCredits: { $avg: '$credits' },
        totalCredits: { $sum: '$credits' },
        avgTheoryHours: { $avg: '$theoryHours' },
        avgPracticeHours: { $avg: '$practiceHours' }
      }
    }
  ]);

  const byDepartment = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return {
    totalSubjects: total,
    requiredSubjects: required,
    electiveSubjects: elective,
    averageCredits: avgCredits[0]?.avgCredits || 0,
    totalCredits: avgCredits[0]?.totalCredits || 0,
    averageTheoryHours: avgCredits[0]?.avgTheoryHours || 0,
    averagePracticeHours: avgCredits[0]?.avgPracticeHours || 0,
    subjectsByDepartment: byDepartment
  };
};

// ==================== QUERY HELPERS ====================

// Chỉ lấy môn học active
subjectSchema.query.active = function() {
  return this.where({ isActive: true });
};

// Lấy môn học có giảng viên
subjectSchema.query.withLecturers = function() {
  return this.where('lecturerIds').ne([]);
};

// Lấy môn học có lớp
subjectSchema.query.withClasses = function() {
  return this.where('classIds').ne([]);
};

// Lấy môn bắt buộc
subjectSchema.query.required = function() {
  return this.where({ isRequired: true });
};

// Lấy môn tự chọn
subjectSchema.query.elective = function() {
  return this.where({ isRequired: false });
};

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;