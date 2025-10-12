const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public (hoặc Admin only)
exports.register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      studentCode,
      lecturerCode,
      phoneNumber,
      dateOfBirth,
      address
    } = req.body;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return errorResponse(res, 'Email already exists', 400);
    }

    // Kiểm tra student code đã tồn tại
    if (role === 'student' && studentCode) {
      const existingStudent = await User.findStudentByCode(studentCode);
      if (existingStudent) {
        return errorResponse(res, 'Student code already exists', 400);
      }
    }

    // Kiểm tra lecturer code đã tồn tại
    if (role === 'lecturer' && lecturerCode) {
      const existingLecturer = await User.findLecturerByCode(lecturerCode);
      if (existingLecturer) {
        return errorResponse(res, 'Lecturer code already exists', 400);
      }
    }

    // Tạo user mới
    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'student',
      studentCode: role === 'student' ? studentCode : undefined,
      lecturerCode: role === 'lecturer' ? lecturerCode : undefined,
      phoneNumber,
      dateOfBirth,
      address
    });

    // Generate token
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    return successResponse(res, {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        studentCode: user.studentCode,
        lecturerCode: user.lecturerCode,
        avatarUrl: user.avatarUrl
      },
      token,
      refreshToken
    }, 'User registered successfully', 201);

  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return errorResponse(res, 'Please provide email and password', 400);
    }

    // Find user (include password)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTime = Math.round((user.lockUntil - Date.now()) / 1000 / 60);
      return errorResponse(
        res, 
        `Account is locked. Try again in ${lockTime} minutes`, 
        423
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increase login attempts
      await user.incLoginAttempts();
      
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Reset login attempts
    await user.resetLoginAttempts();

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    return successResponse(res, {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        studentCode: user.studentCode,
        lecturerCode: user.lecturerCode,
        avatarUrl: user.avatarUrl,
        hasFaceRegistered: user.hasFaceRegistered
      },
      token,
      refreshToken
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // TODO: Implement token blacklist if needed
    // For now, just return success (client will remove token)
    
    return successResponse(res, null, 'Logout successful');

  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('classId', 'name')
      .populate('courseIds', 'code name');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { user }, 'User retrieved successfully');

  } catch (error) {
    console.error('GetMe error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, dateOfBirth, address, avatarUrl } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (address) user.address = address;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    await user.save();

    return successResponse(res, { user }, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Please provide current and new password', 400);
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return errorResponse(res, 'Current password is incorrect', 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return successResponse(res, null, 'Password changed successfully');

  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send email with reset token
    // For now, return token in response (NOT RECOMMENDED FOR PRODUCTION)
    
    return successResponse(res, { 
      resetToken,
      message: 'Password reset token generated. Check your email.'
    }, 'Reset token sent');

  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return errorResponse(res, 'Please provide new password', 400);
    }

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return errorResponse(res, 'Invalid or expired token', 400);
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return successResponse(res, null, 'Password reset successfully');

  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    // Generate new tokens
    const newToken = generateToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    return successResponse(res, {
      token: newToken,
      refreshToken: newRefreshToken
    }, 'Token refreshed successfully');

  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse(res, 'Invalid or expired refresh token', 401);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // TODO: Implement email verification logic
    // Hash token and find user
    
    return successResponse(res, null, 'Email verified successfully');

  } catch (error) {
    console.error('Verify email error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.isEmailVerified) {
      return errorResponse(res, 'Email already verified', 400);
    }

    // TODO: Send verification email
    
    return successResponse(res, null, 'Verification email sent');

  } catch (error) {
    console.error('Resend verification error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;