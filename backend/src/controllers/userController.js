const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20, search } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Search
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { studentCode: new RegExp(search, 'i') },
        { lecturerCode: new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .populate('classId', 'name')
      .populate('courseIds', 'code name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    return successResponse(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Users retrieved successfully');

  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('classId', 'name lecturerId')
      .populate('courseIds', 'code name credits');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { user }, 'User retrieved successfully');

  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      studentCode,
      lecturerCode,
      classId,
      phoneNumber,
      dateOfBirth,
      address,
      avatarUrl
    } = req.body;

    // Check if email exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return errorResponse(res, 'Email already exists', 400);
    }

    // Check codes
    if (role === 'student' && studentCode) {
      const existingStudent = await User.findStudentByCode(studentCode);
      if (existingStudent) {
        return errorResponse(res, 'Student code already exists', 400);
      }
    }

    if (role === 'lecturer' && lecturerCode) {
      const existingLecturer = await User.findLecturerByCode(lecturerCode);
      if (existingLecturer) {
        return errorResponse(res, 'Lecturer code already exists', 400);
      }
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      role,
      studentCode: role === 'student' ? studentCode : undefined,
      lecturerCode: role === 'lecturer' ? lecturerCode : undefined,
      classId: role === 'student' ? classId : undefined,
      phoneNumber,
      dateOfBirth,
      address,
      avatarUrl
    });

    // Add to class if student
    if (role === 'student' && classId) {
      const classDoc = await Class.findById(classId);
      if (classDoc) {
        await classDoc.addStudent(user._id);
      }
    }

    return successResponse(res, { user }, 'User created successfully', 201);

  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin or Self)
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check permission (admin or self)
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return errorResponse(res, 'Not authorized to update this user', 403);
    }

    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const {
      fullName,
      phoneNumber,
      dateOfBirth,
      address,
      avatarUrl,
      classId,
      isActive
    } = req.body;

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (address !== undefined) user.address = address;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    
    // Only admin can change these
    if (req.user.role === 'admin') {
      if (classId !== undefined) user.classId = classId;
      if (isActive !== undefined) user.isActive = isActive;
    }

    await user.save();

    return successResponse(res, { user }, 'User updated successfully');

  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return errorResponse(res, 'Cannot delete your own account', 400);
    }

    // Remove from class if student
    if (user.role === 'student' && user.classId) {
      const classDoc = await Class.findById(user.classId);
      if (classDoc) {
        await classDoc.removeStudent(user._id);
      }
    }

    // Remove from subjects if lecturer
    if (user.role === 'lecturer' && user.courseIds.length > 0) {
      await Subject.updateMany(
        { _id: { $in: user.courseIds } },
        { $pull: { lecturerIds: user._id } }
      );
    }

    await user.remove();

    return successResponse(res, null, 'User deleted successfully');

  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get students by class
// @route   GET /api/users/students/class/:classId
// @access  Private
exports.getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const students = await User.getStudentsByClass(classId);

    return successResponse(res, { 
      students,
      total: students.length
    }, 'Students retrieved successfully');

  } catch (error) {
    console.error('Get students by class error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get lecturers by course
// @route   GET /api/users/lecturers/course/:courseId
// @access  Private
exports.getLecturersByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const lecturers = await User.getLecturersByCourse(courseId);

    return successResponse(res, { 
      lecturers,
      total: lecturers.length
    }, 'Lecturers retrieved successfully');

  } catch (error) {
    console.error('Get lecturers by course error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Bulk create users
// @route   POST /api/users/bulk
// @access  Private (Admin)
exports.bulkCreateUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return errorResponse(res, 'Users array is required', 400);
    }

    const results = [];
    const errors = [];

    for (const userData of users) {
      try {
        // Check if email exists
        const existing = await User.findByEmail(userData.email);
        if (existing) {
          errors.push({
            email: userData.email,
            error: 'Email already exists'
          });
          continue;
        }

        // Create user
        const user = await User.create(userData);
        results.push(user);

      } catch (error) {
        errors.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    return successResponse(res, {
      created: results,
      failed: errors,
      summary: {
        total: users.length,
        success: results.length,
        failed: errors.length
      }
    }, `Bulk create completed: ${results.length}/${users.length} successful`);

  } catch (error) {
    console.error('Bulk create users error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Activate/Deactivate user
// @route   PATCH /api/users/:id/toggle-status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    user.isActive = !user.isActive;
    await user.save();

    return successResponse(res, { user }, 
      `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    );

  } catch (error) {
    console.error('Toggle user status error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Reset user password (Admin)
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin)
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return errorResponse(res, 'New password is required', 400);
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    user.password = newPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return successResponse(res, null, 'Password reset successfully');

  } catch (error) {
    console.error('Reset user password error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/statistics
// @access  Private (Admin)
exports.getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalLecturers = await User.countDocuments({ role: 'lecturer', isActive: true });
    const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });
    
    const withFaceRegistered = await User.countDocuments({ 
      hasFaceRegistered: true, 
      isActive: true 
    });

    const byRole = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    return successResponse(res, {
      total: totalUsers,
      students: totalStudents,
      lecturers: totalLecturers,
      admins: totalAdmins,
      withFaceRegistered,
      byRole
    }, 'Statistics retrieved successfully');

  } catch (error) {
    console.error('Get user statistics error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;