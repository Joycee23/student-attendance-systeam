const { verifyAccessToken } = require('../config/jwt');
const User = require('../models/User');

// Middleware xác thực token
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Vui lòng đăng nhập để tiếp tục'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Tìm user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Người dùng không tồn tại'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Tài khoản đã bị khóa'
      });
    }

    // Gắn user vào request
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
};

// Middleware phân quyền
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền truy cập'
      });
    }
    next();
  };
};

// Middleware kiểm tra Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Chỉ Admin mới có quyền thực hiện'
    });
  }
  next();
};

// Middleware kiểm tra Giảng viên
const isTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Chỉ Giảng viên mới có quyền thực hiện'
    });
  }
  next();
};

// Middleware kiểm tra Sinh viên
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      status: 'error',
      message: 'Chỉ Sinh viên mới có quyền thực hiện'
    });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  isTeacher,
  isStudent
};