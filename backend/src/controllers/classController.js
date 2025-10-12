const Class = require('../models/Class');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
exports.getAllClasses = async (req, res) => {
  try {
    const { 
      isActive, 
      department, 
      courseYear, 
      academicYear,
      semester,
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    // Build query
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (department) query.department = department.toUpperCase();
    if (courseYear) query.courseYear = courseYear.toUpperCase();
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);

    // Search
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const classes = await Class.find(query)
      .populate('lecturerId', 'fullName lecturerCode email')
      .populate('courseIds', 'code name credits')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Class.countDocuments(query);

    return successResponse(res, {
      classes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Classes retrieved successfully');

  } catch (error) {
    console.error('Get all classes error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get class by ID
// @route   GET /api/classes/:id
// @access  Private
exports.getClassById = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('lecturerId', 'fullName lecturerCode email phoneNumber')
      .populate('studentIds', 'fullName studentCode email avatarUrl hasFaceRegistered')
      .populate('courseIds', 'code name credits theoryHours practiceHours');

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    return successResponse(res, { class: classDoc }, 'Class retrieved successfully');

  } catch (error) {
    console.error('Get class error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Create new class
// @route   POST /api/classes
// @access  Private (Admin/Lecturer)
exports.createClass = async (req, res) => {
  try {
    const {
      name,
      lecturerId,
      description,
      academicYear,
      semester,
      department,
      major,
      courseYear,
      maxStudents
    } = req.body;

    // Check if class name exists
    const existingClass = await Class.findByName(name);
    if (existingClass) {
      return errorResponse(res, 'Class name already exists', 400);
    }

    // Verify lecturer exists
    const lecturer = await User.findById(lecturerId);
    if (!lecturer || lecturer.role !== 'lecturer') {
      return errorResponse(res, 'Invalid lecturer', 400);
    }

    // Create class
    const newClass = await Class.create({
      name,
      lecturerId,
      description,
      academicYear,
      semester,
      department,
      major,
      courseYear,
      maxStudents
    });

    await newClass.populate('lecturerId', 'fullName lecturerCode email');

    return successResponse(res, { class: newClass }, 'Class created successfully', 201);

  } catch (error) {
    console.error('Create class error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private (Admin/Lecturer)
exports.updateClass = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    // Check permission
    if (req.user.role === 'lecturer' && classDoc.lecturerId.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to update this class', 403);
    }

    const {
      name,
      lecturerId,
      description,
      academicYear,
      semester,
      department,
      major,
      courseYear,
      maxStudents,
      isActive
    } = req.body;

    // Update fields
    if (name) classDoc.name = name;
    if (lecturerId) classDoc.lecturerId = lecturerId;
    if (description !== undefined) classDoc.description = description;
    if (academicYear) classDoc.academicYear = academicYear;
    if (semester) classDoc.semester = semester;
    if (department) classDoc.department = department;
    if (major) classDoc.major = major;
    if (courseYear) classDoc.courseYear = courseYear;
    if (maxStudents) classDoc.maxStudents = maxStudents;
    if (isActive !== undefined) classDoc.isActive = isActive;

    await classDoc.save();

    return successResponse(res, { class: classDoc }, 'Class updated successfully');

  } catch (error) {
    console.error('Update class error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin)
exports.deleteClass = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    await classDoc.remove();

    return successResponse(res, null, 'Class deleted successfully');

  } catch (error) {
    console.error('Delete class error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Add student to class
// @route   POST /api/classes/:id/students
// @access  Private (Admin/Lecturer)
exports.addStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    await classDoc.addStudent(studentId);

    return successResponse(res, { class: classDoc }, 'Student added successfully');

  } catch (error) {
    console.error('Add student error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Remove student from class
// @route   DELETE /api/classes/:id/students/:studentId
// @access  Private (Admin/Lecturer)
exports.removeStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    await classDoc.removeStudent(studentId);

    return successResponse(res, { class: classDoc }, 'Student removed successfully');

  } catch (error) {
    console.error('Remove student error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Add multiple students
// @route   POST /api/classes/:id/students/bulk
// @access  Private (Admin/Lecturer)
exports.addMultipleStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return errorResponse(res, 'Student IDs array is required', 400);
    }

    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    const result = await classDoc.addMultipleStudents(studentIds);

    return successResponse(res, {
      class: classDoc,
      added: result.added,
      errors: result.errors,
      summary: {
        total: studentIds.length,
        success: result.added.length,
        failed: result.errors.length
      }
    }, `Added ${result.added.length}/${studentIds.length} students`);

  } catch (error) {
    console.error('Add multiple students error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Add course to class
// @route   POST /api/classes/:id/courses
// @access  Private (Admin/Lecturer)
exports.addCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    await classDoc.addCourse(courseId);

    return successResponse(res, { class: classDoc }, 'Course added successfully');

  } catch (error) {
    console.error('Add course error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Remove course from class
// @route   DELETE /api/classes/:id/courses/:courseId
// @access  Private (Admin/Lecturer)
exports.removeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    await classDoc.removeCourse(courseId);

    return successResponse(res, { class: classDoc }, 'Course removed successfully');

  } catch (error) {
    console.error('Remove course error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get students of class
// @route   GET /api/classes/:id/students
// @access  Private
exports.getClassStudents = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('studentIds', 'fullName studentCode email avatarUrl phoneNumber hasFaceRegistered');

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    return successResponse(res, {
      students: classDoc.studentIds,
      total: classDoc.currentStudents
    }, 'Students retrieved successfully');

  } catch (error) {
    console.error('Get class students error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get classes by lecturer
// @route   GET /api/classes/lecturer/:lecturerId
// @access  Private
exports.getClassesByLecturer = async (req, res) => {
  try {
    const classes = await Class.getClassesByLecturer(req.params.lecturerId);

    return successResponse(res, {
      classes,
      total: classes.length
    }, 'Classes retrieved successfully');

  } catch (error) {
    console.error('Get classes by lecturer error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get classes by course year
// @route   GET /api/classes/course-year/:courseYear
// @access  Private
exports.getClassesByCourseYear = async (req, res) => {
  try {
    const classes = await Class.getClassesByCourseYear(req.params.courseYear);

    return successResponse(res, {
      classes,
      total: classes.length
    }, 'Classes retrieved successfully');

  } catch (error) {
    console.error('Get classes by course year error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get class statistics
// @route   GET /api/classes/statistics
// @access  Private (Admin)
exports.getClassStatistics = async (req, res) => {
  try {
    const stats = await Class.getStatistics();

    return successResponse(res, stats, 'Statistics retrieved successfully');

  } catch (error) {
    console.error('Get class statistics error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;