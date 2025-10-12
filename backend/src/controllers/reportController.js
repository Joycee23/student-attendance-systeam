const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const AttendanceSession = require('../models/Attendance');
const AttendanceHistory = require('../models/AttendanceHistory');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const excelService = require('../services/excelService');
const pdfService = require('../services/pdfService');

// @desc    Generate class attendance report
// @route   POST /api/reports/class-attendance
// @access  Private (Admin/Lecturer)
exports.generateClassAttendanceReport = async (req, res) => {
  try {
    const { classId, courseId, startDate, endDate, format = 'excel' } = req.body;

    if (!classId) {
      return errorResponse(res, 'Class ID is required', 400);
    }

    const classDoc = await Class.findById(classId)
      .populate('studentIds', 'fullName studentCode email')
      .populate('lecturerId', 'fullName lecturerCode');

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    // Build filter
    const filter = { classId };
    if (courseId) filter.courseId = courseId;
    if (startDate || endDate) {
      filter.sessionDate = {};
      if (startDate) filter.sessionDate.$gte = new Date(startDate);
      if (endDate) filter.sessionDate.$lte = new Date(endDate);
    }

    // Get sessions
    const sessions = await AttendanceSession.find(filter)
      .populate('courseId', 'code name')
      .sort({ sessionDate: 1 });

    // Get attendance history
    const attendanceData = [];
    for (const student of classDoc.studentIds) {
      const studentData = {
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: student.email,
        sessions: []
      };

      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;
      let totalExcused = 0;

      for (const session of sessions) {
        const history = await AttendanceHistory.findOne({
          sessionId: session._id,
          studentId: student._id
        });

        const status = history ? history.status : 'absent';
        studentData.sessions.push({
          sessionDate: session.sessionDate,
          courseCode: session.courseId.code,
          status
        });

        if (status === 'present') totalPresent++;
        else if (status === 'absent') totalAbsent++;
        else if (status === 'late') totalLate++;
        else if (status === 'excused') totalExcused++;
      }

      const total = sessions.length;
      const attendanceRate = total > 0 
        ? Math.round(((totalPresent + totalLate) / total) * 100) 
        : 0;

      studentData.summary = {
        total,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        excused: totalExcused,
        attendanceRate
      };

      attendanceData.push(studentData);
    }

    // Generate report
    let fileUrl;
    if (format === 'excel') {
      fileUrl = await excelService.generateClassAttendanceReport({
        class: classDoc,
        sessions,
        attendanceData,
        startDate,
        endDate
      });
    } else if (format === 'pdf') {
      fileUrl = await pdfService.generateClassAttendanceReport({
        class: classDoc,
        sessions,
        attendanceData,
        startDate,
        endDate
      });
    } else {
      return errorResponse(res, 'Invalid format. Use "excel" or "pdf"', 400);
    }

    return successResponse(res, {
      fileUrl,
      format,
      className: classDoc.name,
      totalStudents: classDoc.studentIds.length,
      totalSessions: sessions.length
    }, 'Report generated successfully');

  } catch (error) {
    console.error('Generate class attendance report error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Generate student attendance report
// @route   POST /api/reports/student-attendance
// @access  Private
exports.generateStudentAttendanceReport = async (req, res) => {
  try {
    const { studentId, startDate, endDate, format = 'excel' } = req.body;

    const targetStudentId = studentId || req.user.id;

    // Check permission
    if (req.user.role === 'student' && req.user.id !== targetStudentId) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const student = await User.findById(targetStudentId)
      .populate('classId', 'name lecturerId')
      .populate('courseIds', 'code name');

    if (!student || student.role !== 'student') {
      return errorResponse(res, 'Student not found', 404);
    }

    // Build filter
    const filter = { studentId: targetStudentId };
    if (startDate || endDate) {
      filter.sessionDate = {};
      if (startDate) filter.sessionDate.$gte = new Date(startDate);
      if (endDate) filter.sessionDate.$lte = new Date(endDate);
    }

    // Get attendance history
    const history = await AttendanceHistory.find(filter)
      .populate('sessionId', 'sessionDate startTime location sessionType')
      .populate('courseId', 'code name')
      .sort({ sessionDate: -1 });

    // Calculate statistics
    const stats = await AttendanceHistory.getStudentStats(targetStudentId, filter);

    // Group by course
    const byCourse = {};
    for (const record of history) {
      const courseId = record.courseId._id.toString();
      if (!byCourse[courseId]) {
        byCourse[courseId] = {
          courseCode: record.courseId.code,
          courseName: record.courseId.name,
          records: [],
          stats: { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
        };
      }
      byCourse[courseId].records.push(record);
      byCourse[courseId].stats.total++;
      byCourse[courseId].stats[record.status]++;
    }

    // Calculate attendance rate for each course
    Object.values(byCourse).forEach(course => {
      const total = course.stats.total;
      const present = course.stats.present + course.stats.late;
      course.stats.attendanceRate = total > 0 
        ? Math.round((present / total) * 100) 
        : 0;
    });

    // Generate report
    let fileUrl;
    if (format === 'excel') {
      fileUrl = await excelService.generateStudentAttendanceReport({
        student,
        history,
        stats,
        byCourse: Object.values(byCourse),
        startDate,
        endDate
      });
    } else if (format === 'pdf') {
      fileUrl = await pdfService.generateStudentAttendanceReport({
        student,
        history,
        stats,
        byCourse: Object.values(byCourse),
        startDate,
        endDate
      });
    } else {
      return errorResponse(res, 'Invalid format. Use "excel" or "pdf"', 400);
    }

    return successResponse(res, {
      fileUrl,
      format,
      studentCode: student.studentCode,
      fullName: student.fullName,
      totalRecords: history.length,
      attendanceRate: stats.attendanceRate
    }, 'Report generated successfully');

  } catch (error) {
    console.error('Generate student attendance report error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Generate course attendance report
// @route   POST /api/reports/course-attendance
// @access  Private (Admin/Lecturer)
exports.generateCourseAttendanceReport = async (req, res) => {
  try {
    const { courseId, startDate, endDate, format = 'excel' } = req.body;

    if (!courseId) {
      return errorResponse(res, 'Course ID is required', 400);
    }

    const course = await Subject.findById(courseId)
      .populate('lecturerIds', 'fullName lecturerCode')
      .populate('classIds', 'name');

    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    // Build filter
    const filter = { courseId };
    if (startDate || endDate) {
      filter.sessionDate = {};
      if (startDate) filter.sessionDate.$gte = new Date(startDate);
      if (endDate) filter.sessionDate.$lte = new Date(endDate);
    }

    // Get sessions
    const sessions = await AttendanceSession.find(filter)
      .populate('classId', 'name')
      .sort({ sessionDate: 1 });

    // Get overall statistics
    const totalSessions = sessions.length;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalStudents = 0;

    sessions.forEach(session => {
      totalPresent += session.presentCount;
      totalAbsent += session.absentCount;
      totalLate += session.lateCount;
      totalStudents += session.totalStudents;
    });

    const avgAttendanceRate = totalStudents > 0
      ? Math.round(((totalPresent + totalLate) / totalStudents) * 100)
      : 0;

    // Group by class
    const byClass = {};
    for (const session of sessions) {
      const classId = session.classId._id.toString();
      if (!byClass[classId]) {
        byClass[classId] = {
          className: session.classId.name,
          sessions: [],
          stats: { 
            totalSessions: 0,
            totalPresent: 0,
            totalAbsent: 0,
            totalLate: 0,
            totalStudents: 0
          }
        };
      }
      byClass[classId].sessions.push(session);
      byClass[classId].stats.totalSessions++;
      byClass[classId].stats.totalPresent += session.presentCount;
      byClass[classId].stats.totalAbsent += session.absentCount;
      byClass[classId].stats.totalLate += session.lateCount;
      byClass[classId].stats.totalStudents += session.totalStudents;
    }

    // Calculate attendance rate for each class
    Object.values(byClass).forEach(classData => {
      const total = classData.stats.totalStudents;
      const present = classData.stats.totalPresent + classData.stats.totalLate;
      classData.stats.attendanceRate = total > 0
        ? Math.round((present / total) * 100)
        : 0;
    });

    // Generate report
    let fileUrl;
    if (format === 'excel') {
      fileUrl = await excelService.generateCourseAttendanceReport({
        course,
        sessions,
        byClass: Object.values(byClass),
        summary: {
          totalSessions,
          totalPresent,
          totalAbsent,
          totalLate,
          totalStudents,
          avgAttendanceRate
        },
        startDate,
        endDate
      });
    } else if (format === 'pdf') {
      fileUrl = await pdfService.generateCourseAttendanceReport({
        course,
        sessions,
        byClass: Object.values(byClass),
        summary: {
          totalSessions,
          totalPresent,
          totalAbsent,
          totalLate,
          totalStudents,
          avgAttendanceRate
        },
        startDate,
        endDate
      });
    } else {
      return errorResponse(res, 'Invalid format. Use "excel" or "pdf"', 400);
    }

    return successResponse(res, {
      fileUrl,
      format,
      courseCode: course.code,
      courseName: course.name,
      totalSessions,
      avgAttendanceRate
    }, 'Report generated successfully');

  } catch (error) {
    console.error('Generate course attendance report error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Generate attendance summary report
// @route   POST /api/reports/attendance-summary
// @access  Private (Admin)
exports.generateAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate, format = 'excel' } = req.body;

    const filter = {};
    if (startDate || endDate) {
      filter.sessionDate = {};
      if (startDate) filter.sessionDate.$gte = new Date(startDate);
      if (endDate) filter.sessionDate.$lte = new Date(endDate);
    }

    // Overall statistics
    const totalSessions = await AttendanceSession.countDocuments(filter);
    const totalClasses = await Class.countDocuments({ isActive: true });
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });

    // Attendance statistics
    const attendanceStats = await AttendanceHistory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };

    attendanceStats.forEach(stat => {
      stats[stat._id] = stat.count;
    });

    const totalRecords = Object.values(stats).reduce((a, b) => a + b, 0);
    const attendanceRate = totalRecords > 0
      ? Math.round(((stats.present + stats.late) / totalRecords) * 100)
      : 0;

    // By method
    const byMethod = await AttendanceHistory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$recognizedBy',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top classes by attendance rate
    const topClasses = await AttendanceHistory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$classId',
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
            }
          },
          total: { $sum: 1 }
        }
      },
      {
        $project: {
          rate: {
            $multiply: [{ $divide: ['$present', '$total'] }, 100]
          }
        }
      },
      { $sort: { rate: -1 } },
      { $limit: 10 }
    ]);

    // Populate class names
    await Class.populate(topClasses, { path: '_id', select: 'name' });

    // Generate report
    let fileUrl;
    const reportData = {
      summary: {
        totalSessions,
        totalClasses,
        totalStudents,
        totalRecords,
        attendanceRate,
        ...stats
      },
      byMethod,
      topClasses,
      startDate,
      endDate
    };

    if (format === 'excel') {
      fileUrl = await excelService.generateAttendanceSummary(reportData);
    } else if (format === 'pdf') {
      fileUrl = await pdfService.generateAttendanceSummary(reportData);
    } else {
      return errorResponse(res, 'Invalid format. Use "excel" or "pdf"', 400);
    }

    return successResponse(res, {
      fileUrl,
      format,
      summary: reportData.summary
    }, 'Summary report generated successfully');

  } catch (error) {
    console.error('Generate attendance summary error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;