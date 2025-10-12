const AttendanceSession = require('../models/Attendance');
const AttendanceHistory = require('../models/AttendanceHistory');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const aiService = require('../services/aiService');
const qrService = require('../services/qrService');

// @desc    Create attendance session
// @route   POST /api/attendance/sessions
// @access  Private (Lecturer)
exports.createSession = async (req, res) => {
  try {
    const {
      courseId,
      classId,
      sessionDate,
      startTime,
      endTime,
      location,
      sessionType,
      sessionNumber,
      topic,
      description,
      attendanceMethods,
      gpsLocation,
      lateThreshold
    } = req.body;

    // Verify lecturer teaches this course
    const subject = await Subject.findById(courseId);
    if (!subject || !subject.lecturerIds.includes(req.user.id)) {
      return errorResponse(res, 'You are not authorized to create session for this course', 403);
    }

    // Create session
    const session = await AttendanceSession.create({
      courseId,
      classId,
      lecturerId: req.user.id,
      sessionDate,
      startTime,
      endTime,
      location,
      sessionType,
      sessionNumber,
      topic,
      description,
      attendanceMethods: attendanceMethods || { manual: true },
      gpsLocation,
      lateThreshold
    });

    // Generate QR code if enabled
    if (attendanceMethods?.qrCode) {
      await session.generateQRCode();
    }

    await session.populate([
      { path: 'courseId', select: 'code name' },
      { path: 'classId', select: 'name' },
      { path: 'lecturerId', select: 'fullName email' }
    ]);

    return successResponse(res, { session }, 'Session created successfully', 201);

  } catch (error) {
    console.error('Create session error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get all sessions
// @route   GET /api/attendance/sessions
// @access  Private
exports.getAllSessions = async (req, res) => {
  try {
    const {
      classId,
      courseId,
      lecturerId,
      status,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    if (classId) query.classId = classId;
    if (courseId) query.courseId = courseId;
    if (lecturerId) query.lecturerId = lecturerId;
    if (status) query.status = status;

    // Filter by role
    if (req.user.role === 'lecturer') {
      query.lecturerId = req.user.id;
    } else if (req.user.role === 'student') {
      const user = await User.findById(req.user.id);
      query.classId = user.classId;
    }

    // Pagination
    const skip = (page - 1) * limit;

    const sessions = await AttendanceSession.find(query)
      .populate('courseId', 'code name')
      .populate('classId', 'name')
      .populate('lecturerId', 'fullName email')
      .sort({ sessionDate: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AttendanceSession.countDocuments(query);

    return successResponse(res, {
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Sessions retrieved successfully');

  } catch (error) {
    console.error('Get all sessions error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get session by ID
// @route   GET /api/attendance/sessions/:id
// @access  Private
exports.getSessionById = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate('courseId', 'code name credits')
      .populate('classId', 'name studentIds')
      .populate('lecturerId', 'fullName email phoneNumber');

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    // Get attendance records
    const records = await session.getAttendanceRecords();

    return successResponse(res, {
      session,
      attendanceRecords: records
    }, 'Session retrieved successfully');

  } catch (error) {
    console.error('Get session error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update session
// @route   PUT /api/attendance/sessions/:id
// @access  Private (Lecturer)
exports.updateSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    // Check permission
    if (session.lecturerId.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const {
      sessionDate,
      startTime,
      endTime,
      location,
      topic,
      description,
      lateThreshold
    } = req.body;

    // Update fields
    if (sessionDate) session.sessionDate = sessionDate;
    if (startTime) session.startTime = startTime;
    if (endTime) session.endTime = endTime;
    if (location) session.location = location;
    if (topic !== undefined) session.topic = topic;
    if (description !== undefined) session.description = description;
    if (lateThreshold) session.lateThreshold = lateThreshold;

    await session.save();

    return successResponse(res, { session }, 'Session updated successfully');

  } catch (error) {
    console.error('Update session error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Close session
// @route   PATCH /api/attendance/sessions/:id/close
// @access  Private (Lecturer)
exports.closeSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    // Check permission
    if (session.lecturerId.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 403);
    }

    await session.close(req.user.id);

    return successResponse(res, { session }, 'Session closed successfully');

  } catch (error) {
    console.error('Close session error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Cancel session
// @route   PATCH /api/attendance/sessions/:id/cancel
// @access  Private (Lecturer)
exports.cancelSession = async (req, res) => {
  try {
    const { reason } = req.body;

    const session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    // Check permission
    if (session.lecturerId.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 403);
    }

    await session.cancel(req.user.id, reason);

    return successResponse(res, { session }, 'Session cancelled successfully');

  } catch (error) {
    console.error('Cancel session error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Generate QR code
// @route   POST /api/attendance/sessions/:id/qr-code
// @access  Private (Lecturer)
exports.generateQRCode = async (req, res) => {
  try {
    const { expiryMinutes = 5 } = req.body;

    const session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    // Check permission
    if (session.lecturerId.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 403);
    }

    if (session.status !== 'open') {
      return errorResponse(res, 'Session is not open', 400);
    }

    await session.generateQRCode(expiryMinutes);

    // Generate QR code image
    const qrCodeImage = await qrService.generateQRCodeImage(session.qrCode.code);

    return successResponse(res, {
      qrCode: session.qrCode.code,
      qrCodeImage,
      expiresAt: session.qrCode.expiresAt
    }, 'QR code generated successfully');

  } catch (error) {
    console.error('Generate QR code error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Manual attendance check-in
// @route   POST /api/attendance/check-in/manual
// @access  Private (Lecturer)
exports.manualCheckIn = async (req, res) => {
  try {
    const { sessionId, studentId, status = 'present', notes } = req.body;

    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    // Check permission
    if (session.lecturerId.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 403);
    }

    // Create attendance history
    const history = await AttendanceHistory.create({
      sessionId,
      studentId,
      status,
      checkInTime: new Date(),
      recognizedBy: 'manual',
      notes,
      courseId: session.courseId,
      classId: session.classId,
      sessionDate: session.sessionDate,
      sessionStartTime: session.startTime
    });

    await session.updateStatistics();

    return successResponse(res, { history }, 'Check-in recorded successfully', 201);

  } catch (error) {
    console.error('Manual check-in error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    QR code check-in
// @route   POST /api/attendance/check-in/qr
// @access  Private (Student)
exports.qrCodeCheckIn = async (req, res) => {
  try {
    const { qrCode } = req.body;

    // Find session by QR code
    const session = await AttendanceSession.findByQRCode(qrCode);

    if (!session) {
      return errorResponse(res, 'Invalid or expired QR code', 400);
    }

    // Verify QR code
    const verification = session.verifyQRCode(qrCode);
    if (!verification.valid) {
      return errorResponse(res, verification.message, 400);
    }

    // Check if student already checked in
    const existingHistory = await AttendanceHistory.findOne({
      sessionId: session._id,
      studentId: req.user.id
    });

    if (existingHistory && existingHistory.isCheckedIn) {
      return errorResponse(res, 'Already checked in', 400);
    }

    // Determine status (present/late)
    const now = new Date();
    const lateMinutes = Math.round((now - session.startTime) / (1000 * 60));
    const status = lateMinutes > session.lateThreshold ? 'late' : 'present';

    // Create or update attendance history
    let history;
    if (existingHistory) {
      existingHistory.status = status;
      existingHistory.checkInTime = now;
      existingHistory.recognizedBy = 'qrCode';
      existingHistory.qrCodeData = { code: qrCode, scannedAt: now };
      history = await existingHistory.save();
    } else {
      history = await AttendanceHistory.create({
        sessionId: session._id,
        studentId: req.user.id,
        status,
        checkInTime: now,
        recognizedBy: 'qrCode',
        qrCodeData: { code: qrCode, scannedAt: now },
        courseId: session.courseId,
        classId: session.classId,
        sessionDate: session.sessionDate,
        sessionStartTime: session.startTime
      });
    }

    await session.updateStatistics();

    return successResponse(res, {
      history,
      session: {
        id: session._id,
        courseCode: session.courseId.code,
        location: session.location,
        status
      }
    }, `Check-in successful${status === 'late' ? ' (Late)' : ''}`, 201);

  } catch (error) {
    console.error('QR check-in error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Face recognition check-in
// @route   POST /api/attendance/check-in/face
// @access  Private (Student)
exports.faceRecognitionCheckIn = async (req, res) => {
  try {
    const { sessionId, imageBase64 } = req.body;

    if (!imageBase64) {
      return errorResponse(res, 'Face image is required', 400);
    }

    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    if (session.status !== 'open') {
      return errorResponse(res, 'Session is not open', 400);
    }

    // Check if already checked in
    const existingHistory = await AttendanceHistory.findOne({
      sessionId,
      studentId: req.user.id
    });

    if (existingHistory && existingHistory.isCheckedIn) {
      return errorResponse(res, 'Already checked in', 400);
    }

    // Call AI service for recognition
    const recognition = await aiService.recognizeFace(imageBase64);

    if (!recognition.success) {
      return errorResponse(res, recognition.message || 'Face recognition failed', 400);
    }

    // Verify recognized student is the logged-in user
    const user = await User.findById(req.user.id);
    if (recognition.studentId !== user.studentCode && recognition.studentId !== req.user.id) {
      return errorResponse(res, 'Face does not match your identity', 403);
    }

    // Determine status
    const now = new Date();
    const lateMinutes = Math.round((now - session.startTime) / (1000 * 60));
    const status = lateMinutes > session.lateThreshold ? 'late' : 'present';

    // Create or update history
    let history;
    if (existingHistory) {
      existingHistory.status = status;
      existingHistory.checkInTime = now;
      existingHistory.recognizedBy = 'faceRecognition';
      existingHistory.confidence = recognition.confidence / 100; // Convert to 0-1
      existingHistory.imageUrl = recognition.imageUrl;
      existingHistory.faceRecognitionData = {
        confidence: recognition.confidence,
        distance: recognition.distance,
        processingTime: recognition.processingTime
      };
      history = await existingHistory.save();
    } else {
      history = await AttendanceHistory.create({
        sessionId,
        studentId: req.user.id,
        status,
        checkInTime: now,
        recognizedBy: 'faceRecognition',
        confidence: recognition.confidence / 100,
        imageUrl: recognition.imageUrl,
        faceRecognitionData: {
          confidence: recognition.confidence,
          distance: recognition.distance,
          processingTime: recognition.processingTime
        },
        courseId: session.courseId,
        classId: session.classId,
        sessionDate: session.sessionDate,
        sessionStartTime: session.startTime
      });
    }

    await session.updateStatistics();

    return successResponse(res, {
      history,
      recognition: {
        confidence: recognition.confidence,
        status
      }
    }, `Check-in successful${status === 'late' ? ' (Late)' : ''}`, 201);

  } catch (error) {
    console.error('Face recognition check-in error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    GPS check-in
// @route   POST /api/attendance/check-in/gps
// @access  Private (Student)
exports.gpsCheckIn = async (req, res) => {
  try {
    const { sessionId, latitude, longitude, accuracy } = req.body;

    if (!latitude || !longitude) {
      return errorResponse(res, 'GPS coordinates are required', 400);
    }

    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    if (session.status !== 'open') {
      return errorResponse(res, 'Session is not open', 400);
    }

    // Verify GPS location
    const locationVerification = session.verifyGPSLocation(latitude, longitude);

    if (!locationVerification.valid) {
      return errorResponse(res, locationVerification.message, 400);
    }

    // Check if already checked in
    const existingHistory = await AttendanceHistory.findOne({
      sessionId,
      studentId: req.user.id
    });

    if (existingHistory && existingHistory.isCheckedIn) {
      return errorResponse(res, 'Already checked in', 400);
    }

    // Determine status
    const now = new Date();
    const lateMinutes = Math.round((now - session.startTime) / (1000 * 60));
    const status = lateMinutes > session.lateThreshold ? 'late' : 'present';

    // Create or update history
    let history;
    if (existingHistory) {
      existingHistory.status = status;
      existingHistory.checkInTime = now;
      existingHistory.recognizedBy = 'gps';
      existingHistory.gpsLocation = {
        latitude,
        longitude,
        accuracy,
        distance: locationVerification.distance
      };
      history = await existingHistory.save();
    } else {
      history = await AttendanceHistory.create({
        sessionId,
        studentId: req.user.id,
        status,
        checkInTime: now,
        recognizedBy: 'gps',
        gpsLocation: {
          latitude,
          longitude,
          accuracy,
          distance: locationVerification.distance
        },
        courseId: session.courseId,
        classId: session.classId,
        sessionDate: session.sessionDate,
        sessionStartTime: session.startTime
      });
    }

    await session.updateStatistics();

    return successResponse(res, {
      history,
      location: {
        distance: Math.round(locationVerification.distance),
        status
      }
    }, `Check-in successful${status === 'late' ? ' (Late)' : ''}`, 201);

  } catch (error) {
    console.error('GPS check-in error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get attendance history
// @route   GET /api/attendance/history
// @access  Private
exports.getAttendanceHistory = async (req, res) => {
  try {
    const {
      sessionId,
      studentId,
      classId,
      courseId,
      status,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    if (sessionId) query.sessionId = sessionId;
    if (classId) query.classId = classId;
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;

    // Filter by role
    if (req.user.role === 'student') {
      query.studentId = req.user.id;
    } else if (studentId) {
      query.studentId = studentId;
    }

    // Pagination
    const skip = (page - 1) * limit;

    const history = await AttendanceHistory.find(query)
      .populate('sessionId', 'sessionDate startTime location')
      .populate('studentId', 'fullName studentCode email')
      .populate('courseId', 'code name')
      .populate('classId', 'name')
      .sort({ sessionDate: -1, checkInTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AttendanceHistory.countDocuments(query);

    return successResponse(res, {
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'History retrieved successfully');

  } catch (error) {
    console.error('Get attendance history error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get student attendance statistics
// @route   GET /api/attendance/statistics/student/:studentId
// @access  Private
exports.getStudentStatistics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, classId } = req.query;

    // Check permission
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const filters = {};
    if (courseId) filters.courseId = courseId;
    if (classId) filters.classId = classId;

    const stats = await AttendanceHistory.getStudentStats(studentId, filters);

    return successResponse(res, stats, 'Statistics retrieved successfully');

  } catch (error) {
    console.error('Get student statistics error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get session statistics
// @route   GET /api/attendance/statistics/session/:sessionId
// @access  Private
exports.getSessionStatistics = async (req, res) => {
  try {
    const stats = await AttendanceHistory.getSessionStats(req.params.sessionId);

    return successResponse(res, stats, 'Statistics retrieved successfully');

  } catch (error) {
    console.error('Get session statistics error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;