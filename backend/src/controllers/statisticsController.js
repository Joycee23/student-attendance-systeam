const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const AttendanceSession = require('../models/Attendance');
const AttendanceHistory = require('../models/AttendanceHistory');
const Notification = require('../models/Notification');
const FaceEncoding = require('../models/FaceEncoding');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get overview statistics
// @route   GET /api/statistics/overview
// @access  Private (Admin)
exports.getOverview = async (req, res) => {
  try {
    // Users
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalLecturers = await User.countDocuments({ role: 'lecturer', isActive: true });
    const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });

    // Classes
    const totalClasses = await Class.countDocuments({ isActive: true });

    // Subjects
    const totalSubjects = await Subject.countDocuments({ isActive: true });

    // Attendance Sessions
    const totalSessions = await AttendanceSession.countDocuments();
    const openSessions = await AttendanceSession.countDocuments({ status: 'open' });
    const todaySessions = await AttendanceSession.countDocuments({
      sessionDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    // Face Recognition
    const studentsWithFace = await User.countDocuments({ 
      role: 'student', 
      hasFaceRegistered: true,
      isActive: true 
    });

    // Attendance Rate (today)
    const todayHistory = await AttendanceHistory.find({
      sessionDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    const todayPresent = todayHistory.filter(h => h.status === 'present' || h.status === 'late').length;
    const todayAttendanceRate = todayHistory.length > 0 
      ? Math.round((todayPresent / todayHistory.length) * 100) 
      : 0;

    // Notifications
    const totalNotifications = await Notification.countDocuments({ isDeleted: false });
    const unreadNotifications = await Notification.countDocuments({ 
      isRead: false, 
      isDeleted: false 
    });

    return successResponse(res, {
      users: {
        total: totalUsers,
        students: totalStudents,
        lecturers: totalLecturers,
        admins: totalAdmins,
        studentsWithFace
      },
      classes: {
        total: totalClasses
      },
      subjects: {
        total: totalSubjects
      },
      sessions: {
        total: totalSessions,
        open: openSessions,
        today: todaySessions
      },
      attendance: {
        todayRate: todayAttendanceRate,
        todayTotal: todayHistory.length,
        todayPresent
      },
      notifications: {
        total: totalNotifications,
        unread: unreadNotifications
      }
    }, 'Overview statistics retrieved successfully');

  } catch (error) {
    console.error('Get overview error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get class statistics
// @route   GET /api/statistics/class/:classId
// @access  Private
exports.getClassStatistics = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const classDoc = await Class.findById(classId)
      .populate('studentIds', 'fullName studentCode hasFaceRegistered')
      .populate('courseIds', 'code name');

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.sessionDate = {};
      if (startDate) dateFilter.sessionDate.$gte = new Date(startDate);
      if (endDate) dateFilter.sessionDate.$lte = new Date(endDate);
    }

    // Total sessions
    const totalSessions = await AttendanceSession.countDocuments({
      classId,
      ...dateFilter
    });

    // Attendance by status
    const attendanceByStatus = await AttendanceHistory.aggregate([
      { 
        $match: { 
          classId: classDoc._id,
          ...dateFilter
        } 
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Overall attendance rate
    const totalRecords = await AttendanceHistory.countDocuments({
      classId,
      ...dateFilter
    });

    const presentRecords = await AttendanceHistory.countDocuments({
      classId,
      status: { $in: ['present', 'late'] },
      ...dateFilter
    });

    const attendanceRate = totalRecords > 0 
      ? Math.round((presentRecords / totalRecords) * 100) 
      : 0;

    // Students with low attendance
    const studentsWithLowAttendance = [];
    for (const student of classDoc.studentIds) {
      const stats = await AttendanceHistory.getStudentStats(student._id, {
        classId,
        ...dateFilter
      });
      
      if (stats.attendanceRate < 80) {
        studentsWithLowAttendance.push({
          studentId: student._id,
          fullName: student.fullName,
          studentCode: student.studentCode,
          attendanceRate: stats.attendanceRate,
          totalSessions: stats.total
        });
      }
    }

    // Attendance by method
    const attendanceByMethod = await AttendanceHistory.aggregate([
      { 
        $match: { 
          classId: classDoc._id,
          ...dateFilter
        } 
      },
      {
        $group: {
          _id: '$recognizedBy',
          count: { $sum: 1 }
        }
      }
    ]);

    return successResponse(res, {
      class: {
        id: classDoc._id,
        name: classDoc.name,
        totalStudents: classDoc.currentStudents,
        totalCourses: classDoc.totalCourses
      },
      sessions: {
        total: totalSessions
      },
      attendance: {
        rate: attendanceRate,
        totalRecords,
        presentRecords,
        byStatus: attendanceByStatus,
        byMethod: attendanceByMethod
      },
      studentsWithLowAttendance
    }, 'Class statistics retrieved successfully');

  } catch (error) {
    console.error('Get class statistics error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get student statistics
// @route   GET /api/statistics/student/:studentId
// @access  Private
exports.getStudentStatistics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate } = req.query;

    // Check permission
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const student = await User.findById(studentId)
      .populate('classId', 'name')
      .populate('courseIds', 'code name');

    if (!student || student.role !== 'student') {
      return errorResponse(res, 'Student not found', 404);
    }

    // Build filters
    const filters = {};
    if (courseId) filters.courseId = courseId;
    if (startDate || endDate) {
      filters.sessionDate = {};
      if (startDate) filters.sessionDate.$gte = new Date(startDate);
      if (endDate) filters.sessionDate.$lte = new Date(endDate);
    }

    // Overall stats
    const overallStats = await AttendanceHistory.getStudentStats(studentId, filters);

    // Stats by course
    const statsByCourse = [];
    const courses = courseId 
      ? [await Subject.findById(courseId)]
      : await Subject.find({ classIds: student.classId });

    for (const course of courses) {
      if (!course) continue;
      
      const courseStats = await AttendanceHistory.getStudentStats(studentId, {
        courseId: course._id,
        ...filters
      });

      statsByCourse.push({
        courseId: course._id,
        courseCode: course.code,
        courseName: course.name,
        ...courseStats
      });
    }

    // Recent attendance
    const recentAttendance = await AttendanceHistory.find({
      studentId,
      ...filters
    })
      .populate('sessionId', 'sessionDate startTime location')
      .populate('courseId', 'code name')
      .sort({ sessionDate: -1 })
      .limit(10);

    // Attendance trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await AttendanceHistory.aggregate([
      {
        $match: {
          studentId: student._id,
          sessionDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$sessionDate' }
          },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
            }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return successResponse(res, {
      student: {
        id: student._id,
        fullName: student.fullName,
        studentCode: student.studentCode,
        className: student.classId?.name,
        hasFaceRegistered: student.hasFaceRegistered
      },
      overall: overallStats,
      byCourse: statsByCourse,
      recent: recentAttendance,
      trend: trendData
    }, 'Student statistics retrieved successfully');

  } catch (error) {
    console.error('Get student statistics error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get lecturer statistics
// @route   GET /api/statistics/lecturer/:lecturerId
// @access  Private
exports.getLecturerStatistics = async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { startDate, endDate } = req.query;

    const lecturer = await User.findById(lecturerId)
      .populate('courseIds', 'code name');

    if (!lecturer || lecturer.role !== 'lecturer') {
      return errorResponse(res, 'Lecturer not found', 404);
    }

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.sessionDate = {};
      if (startDate) dateFilter.sessionDate.$gte = new Date(startDate);
      if (endDate) dateFilter.sessionDate.$lte = new Date(endDate);
    }

    // Classes taught
    const classes = await Class.find({ lecturerId });

    // Total sessions
    const totalSessions = await AttendanceSession.countDocuments({
      lecturerId,
      ...dateFilter
    });

    // Open sessions
    const openSessions = await AttendanceSession.countDocuments({
      lecturerId,
      status: 'open'
    });

    // Average attendance rate
    const sessionStats = await AttendanceSession.aggregate([
      {
        $match: {
          lecturerId: lecturer._id,
          status: 'closed',
          ...dateFilter
        }
      },
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
          },
          totalStudents: { $sum: '$totalStudents' },
          totalPresent: { $sum: '$presentCount' }
        }
      }
    ]);

    const avgAttendanceRate = sessionStats[0]?.avgRate || 0;

    // Stats by course
    const statsByCourse = [];
    for (const course of lecturer.courseIds) {
      const courseSessions = await AttendanceSession.countDocuments({
        lecturerId,
        courseId: course._id,
        ...dateFilter
      });

      const courseStats = await AttendanceSession.aggregate([
        {
          $match: {
            lecturerId: lecturer._id,
            courseId: course._id,
            status: 'closed',
            ...dateFilter
          }
        },
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

      statsByCourse.push({
        courseId: course._id,
        courseCode: course.code,
        courseName: course.name,
        totalSessions: courseSessions,
        avgAttendanceRate: courseStats[0]?.avgRate || 0
      });
    }

    return successResponse(res, {
      lecturer: {
        id: lecturer._id,
        fullName: lecturer.fullName,
        lecturerCode: lecturer.lecturerCode,
        totalCourses: lecturer.courseIds.length,
        totalClasses: classes.length
      },
      sessions: {
        total: totalSessions,
        open: openSessions
      },
      attendance: {
        avgRate: Math.round(avgAttendanceRate),
        totalStudents: sessionStats[0]?.totalStudents || 0,
        totalPresent: sessionStats[0]?.totalPresent || 0
      },
      byCourse: statsByCourse
    }, 'Lecturer statistics retrieved successfully');

  } catch (error) {
    console.error('Get lecturer statistics error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get attendance trends
// @route   GET /api/statistics/trends
// @access  Private (Admin)
exports.getAttendanceTrends = async (req, res) => {
  try {
    const { days = 30, classId, courseId } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const matchFilter = {
      sessionDate: { $gte: startDate }
    };
    if (classId) matchFilter.classId = classId;
    if (courseId) matchFilter.courseId = courseId;

    const trends = await AttendanceHistory.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$sessionDate' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Format data
    const formattedTrends = {};
    trends.forEach(item => {
      const date = item._id.date;
      if (!formattedTrends[date]) {
        formattedTrends[date] = {
          date,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        };
      }
      formattedTrends[date][item._id.status] = item.count;
    });

    const trendArray = Object.values(formattedTrends);

    return successResponse(res, { trends: trendArray }, 'Trends retrieved successfully');

  } catch (error) {
    console.error('Get attendance trends error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;