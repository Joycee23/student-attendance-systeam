'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * ================================
 * Middleware: Protect route
 * ================================
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('❌ [ERROR] protect middleware:', err.message);
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

/**
 * ================================
 * Middleware: Role checks
 * ================================
 */
const normalizeRoles = (rolesOrArray) => {
  if (!rolesOrArray) return [];
  if (Array.isArray(rolesOrArray)) return rolesOrArray;
  return [rolesOrArray];
};

const authorize = (...roles) => {
  const allowedRoles = (roles.length === 1 && Array.isArray(roles[0])) ? roles[0] : roles;

  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Role '${req.user.role}' is not authorized to access this route`
        });
      }

      return next();
    } catch (err) {
      console.error('❌ [ERROR] authorize middleware:', err);
      return res.status(500).json({ success: false, message: 'Server error in authorization middleware' });
    }
  };
};

const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.role) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

const lecturerOrAdmin = (req, res, next) => {
  if (!req.user || !req.user.role) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (!['lecturer', 'admin'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Lecturer or Admin access required' });
  next();
};

const studentOnly = (req, res, next) => {
  if (!req.user || !req.user.role) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Student access required' });
  next();
};

const ownerOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Not authenticated' });

      if (req.user.role === 'admin') return next();

      const resourceUserId = req.params[userIdField] || req.params.id || req.body[userIdField] || req.body.id;
      if (!resourceUserId) return res.status(400).json({ success: false, message: 'Resource owner id is required' });

      if (resourceUserId.toString() === req.user.id.toString()) return next();

      return res.status(403).json({ success: false, message: 'Not authorized to access this resource' });
    } catch (err) {
      console.error('❌ [ERROR] ownerOrAdmin middleware:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
};

const lecturerOwnsClass = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Not authenticated' });

    if (req.user.role === 'admin') return next();

    if (req.user.role !== 'lecturer') return res.status(403).json({ success: false, message: 'Lecturer access required' });

    const Class = require('../models/Class');
    const classId = req.params.classId || req.params.id || req.body.classId;
    if (!classId) return res.status(400).json({ success: false, message: 'Class ID is required' });

    const classDoc = await Class.findById(classId).lean();
    if (!classDoc) return res.status(404).json({ success: false, message: 'Class not found' });

    const lecturerId = classDoc.lecturerId || classDoc.lecturer;
    if (!lecturerId) return res.status(403).json({ success: false, message: 'No lecturer assigned to this class' });

    if (lecturerId.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: 'Not authorized to access this class' });

    next();
  } catch (err) {
    console.error('❌ [ERROR] lecturerOwnsClass middleware:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const lecturerTeachesSubject = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Not authenticated' });

    if (req.user.role === 'admin') return next();

    if (req.user.role !== 'lecturer') return res.status(403).json({ success: false, message: 'Lecturer access required' });

    const Subject = require('../models/Subject');
    const subjectId = req.params.subjectId || req.params.id || req.body.courseId;
    if (!subjectId) return res.status(400).json({ success: false, message: 'Subject ID is required' });

    const subject = await Subject.findById(subjectId).lean();
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const lecturerIds = subject.lecturerIds || subject.lecturers || (subject.lecturerId ? [subject.lecturerId] : []);
    const found = lecturerIds.some((l) => l.toString() === req.user.id.toString());

    if (!found) return res.status(403).json({ success: false, message: 'Not authorized to access this subject' });

    next();
  } catch (err) {
    console.error('❌ [ERROR] lecturerTeachesSubject middleware:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Backwards-compatible alias
 */
const roleMiddleware = (...args) => {
  if (args.length === 1 && Array.isArray(args[0])) return authorize(...args[0]);
  return authorize(...args);
};

module.exports = {
  protect,
  authorize,
  adminOnly,
  lecturerOrAdmin,
  studentOnly,
  ownerOrAdmin,
  lecturerOwnsClass,
  lecturerTeachesSubject,
  roleMiddleware,
};