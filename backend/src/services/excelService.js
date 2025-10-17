const { Parser } = require('json2csv');
const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');

/**
 * Excel Service
 * Generates Excel reports for attendance data
 */

class ExcelService {
  constructor() {
    this.reportsDir = path.join(__dirname, '..', 'temp', 'reports');
    this.ensureReportsDir();
  }

  /**
   * Ensure reports directory exists
   */
  async ensureReportsDir() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      console.error('Create reports dir error:', error);
    }
  }

  /**
   * Generate class attendance report
   * @param {Object} data - Report data
   * @returns {string} File path
   */
  async generateClassAttendanceReport(data) {
    try {
      const { class: classData, sessions, attendanceData, startDate, endDate } = data;

      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summaryData = [
        ['CLASS ATTENDANCE REPORT'],
        [''],
        ['Class Name:', classData.name],
        ['Lecturer:', classData.lecturerId?.fullName || 'N/A'],
        ['Total Students:', classData.studentIds.length],
        ['Total Sessions:', sessions.length],
        ['Period:', `${startDate || 'All'} - ${endDate || 'All'}`],
        ['Generated:', moment().format('YYYY-MM-DD HH:mm:ss')],
        ['']
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Sheet 2: Attendance by Student
      const studentHeaders = [
        'No',
        'Student Code',
        'Full Name',
        'Email',
        'Total Sessions',
        'Present',
        'Absent',
        'Late',
        'Excused',
        'Attendance Rate (%)'
      ];

      const studentRows = attendanceData.map((student, index) => [
        index + 1,
        student.studentCode,
        student.fullName,
        student.email,
        student.summary.total,
        student.summary.present,
        student.summary.absent,
        student.summary.late,
        student.summary.excused,
        student.summary.attendanceRate
      ]);

      const studentData = [studentHeaders, ...studentRows];
      const studentSheet = XLSX.utils.aoa_to_sheet(studentData);
      
      // Set column widths
      studentSheet['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 30 },
        { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 18 }
      ];

      XLSX.utils.book_append_sheet(workbook, studentSheet, 'Student Attendance');

      // Sheet 3: Session Details
      const sessionHeaders = ['Session Date', 'Course', 'Location', 'Start Time', 'Total Students', 'Present', 'Absent', 'Late'];
      
      const sessionRows = sessions.map(session => [
        moment(session.sessionDate).format('YYYY-MM-DD'),
        session.courseId?.code || 'N/A',
        session.location,
        moment(session.startTime).format('HH:mm'),
        session.totalStudents,
        session.presentCount,
        session.absentCount,
        session.lateCount
      ]);

      const sessionData = [sessionHeaders, ...sessionRows];
      const sessionSheet = XLSX.utils.aoa_to_sheet(sessionData);
      
      sessionSheet['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
        { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
      ];

      XLSX.utils.book_append_sheet(workbook, sessionSheet, 'Sessions');

      // Sheet 4: Detailed Attendance
      const detailHeaders = ['Student Code', 'Full Name'];
      sessions.forEach(session => {
        detailHeaders.push(moment(session.sessionDate).format('MM/DD'));
      });

      const detailRows = attendanceData.map(student => {
        const row = [student.studentCode, student.fullName];
        student.sessions.forEach(s => {
          row.push(s.status.charAt(0).toUpperCase()); // P, A, L, E
        });
        return row;
      });

      const detailData = [detailHeaders, ...detailRows];
      const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detailed View');

      // Generate filename
      const filename = `class_attendance_${classData.name}_${Date.now()}.xlsx`;
      const filepath = path.join(this.reportsDir, filename);

      // Write file
      XLSX.writeFile(workbook, filepath);

      return filepath;

    } catch (error) {
      console.error('Generate class attendance report error:', error);
      throw new Error(`Excel generation failed: ${error.message}`);
    }
  }

  /**
   * Generate student attendance report
   * @param {Object} data - Report data
   * @returns {string} File path
   */
  async generateStudentAttendanceReport(data) {
    try {
      const { student, history, stats, byCourse, startDate, endDate } = data;

      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summaryData = [
        ['STUDENT ATTENDANCE REPORT'],
        [''],
        ['Student Code:', student.studentCode],
        ['Full Name:', student.fullName],
        ['Email:', student.email],
        ['Class:', student.classId?.name || 'N/A'],
        ['Period:', `${startDate || 'All'} - ${endDate || 'All'}`],
        [''],
        ['OVERALL STATISTICS'],
        ['Total Sessions:', stats.total],
        ['Present:', stats.present],
        ['Absent:', stats.absent],
        ['Late:', stats.late],
        ['Excused:', stats.excused],
        ['Attendance Rate:', `${stats.attendanceRate}%`],
        ['Generated:', moment().format('YYYY-MM-DD HH:mm:ss')]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Sheet 2: By Course
      const courseHeaders = ['Course Code', 'Course Name', 'Total', 'Present', 'Absent', 'Late', 'Excused', 'Rate (%)'];
      const courseRows = byCourse.map(course => [
        course.courseCode,
        course.courseName,
        course.stats.total,
        course.stats.present,
        course.stats.absent,
        course.stats.late,
        course.stats.excused,
        course.stats.attendanceRate
      ]);

      const courseData = [courseHeaders, ...courseRows];
      const courseSheet = XLSX.utils.aoa_to_sheet(courseData);
      
      courseSheet['!cols'] = [
        { wch: 12 }, { wch: 30 }, { wch: 8 }, { wch: 8 },
        { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }
      ];

      XLSX.utils.book_append_sheet(workbook, courseSheet, 'By Course');

      // Sheet 3: Attendance History
      const historyHeaders = [
        'Date',
        'Course Code',
        'Location',
        'Check-in Time',
        'Status',
        'Method',
        'Late (min)',
        'Notes'
      ];

      const historyRows = history.map(record => [
        moment(record.sessionDate).format('YYYY-MM-DD'),
        record.courseId?.code || 'N/A',
        record.sessionId?.location || 'N/A',
        moment(record.checkInTime).format('HH:mm:ss'),
        record.status.toUpperCase(),
        record.recognizedBy,
        record.lateMinutes || 0,
        record.notes || ''
      ]);

      const historyData = [historyHeaders, ...historyRows];
      const historySheet = XLSX.utils.aoa_to_sheet(historyData);
      
      historySheet['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
        { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 30 }
      ];

      XLSX.utils.book_append_sheet(workbook, historySheet, 'History');

      // Generate filename
      const filename = `student_attendance_${student.studentCode}_${Date.now()}.xlsx`;
      const filepath = path.join(this.reportsDir, filename);

      // Write file
      XLSX.writeFile(workbook, filepath);

      return filepath;

    } catch (error) {
      console.error('Generate student report error:', error);
      throw new Error(`Excel generation failed: ${error.message}`);
    }
  }

  /**
   * Generate course attendance report
   * @param {Object} data - Report data
   */
  async generateCourseAttendanceReport(data) {
    try {
      const { course, sessions, byClass, summary, startDate, endDate } = data;

      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summaryData = [
        ['COURSE ATTENDANCE REPORT'],
        [''],
        ['Course Code:', course.code],
        ['Course Name:', course.name],
        ['Credits:', course.credits],
        ['Period:', `${startDate || 'All'} - ${endDate || 'All'}`],
        [''],
        ['OVERALL STATISTICS'],
        ['Total Sessions:', summary.totalSessions],
        ['Total Students:', summary.totalStudents],
        ['Total Present:', summary.totalPresent],
        ['Total Absent:', summary.totalAbsent],
        ['Total Late:', summary.totalLate],
        ['Average Attendance Rate:', `${summary.avgAttendanceRate}%`],
        ['Generated:', moment().format('YYYY-MM-DD HH:mm:ss')]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Sheet 2: By Class
      const classHeaders = [
        'Class Name',
        'Total Sessions',
        'Total Students',
        'Present',
        'Absent',
        'Late',
        'Attendance Rate (%)'
      ];

      const classRows = byClass.map(classData => [
        classData.className,
        classData.stats.totalSessions,
        classData.stats.totalStudents,
        classData.stats.totalPresent,
        classData.stats.totalAbsent,
        classData.stats.totalLate,
        classData.stats.attendanceRate
      ]);

      const classData = [classHeaders, ...classRows];
      const classSheet = XLSX.utils.aoa_to_sheet(classData);
      
      classSheet['!cols'] = [
        { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 18 }
      ];

      XLSX.utils.book_append_sheet(workbook, classSheet, 'By Class');

      // Sheet 3: Sessions
      const sessionHeaders = [
        'Date',
        'Class',
        'Location',
        'Start Time',
        'Total Students',
        'Present',
        'Absent',
        'Late',
        'Rate (%)'
      ];

      const sessionRows = sessions.map(session => [
        moment(session.sessionDate).format('YYYY-MM-DD'),
        session.classId?.name || 'N/A',
        session.location,
        moment(session.startTime).format('HH:mm'),
        session.totalStudents,
        session.presentCount,
        session.absentCount,
        session.lateCount,
        session.attendanceRate
      ]);

      const sessionData = [sessionHeaders, ...sessionRows];
      const sessionSheet = XLSX.utils.aoa_to_sheet(sessionData);
      
      sessionSheet['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
        { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
      ];

      XLSX.utils.book_append_sheet(workbook, sessionSheet, 'Sessions');

      // Generate filename
      const filename = `course_attendance_${course.code}_${Date.now()}.xlsx`;
      const filepath = path.join(this.reportsDir, filename);

      // Write file
      XLSX.writeFile(workbook, filepath);

      return filepath;

    } catch (error) {
      console.error('Generate course report error:', error);
      throw new Error(`Excel generation failed: ${error.message}`);
    }
  }

  /**
   * Generate attendance summary report
   * @param {Object} data - Report data
   */
  async generateAttendanceSummary(data) {
    try {
      const { summary, byMethod, topClasses, startDate, endDate } = data;

      const workbook = XLSX.utils.book_new();

      // Sheet 1: Overall Summary
      const summaryData = [
        ['ATTENDANCE SYSTEM SUMMARY REPORT'],
        [''],
        ['Period:', `${startDate || 'All'} - ${endDate || 'All'}`],
        ['Generated:', moment().format('YYYY-MM-DD HH:mm:ss')],
        [''],
        ['SYSTEM STATISTICS'],
        ['Total Sessions:', summary.totalSessions],
        ['Total Classes:', summary.totalClasses],
        ['Total Students:', summary.totalStudents],
        ['Total Records:', summary.totalRecords],
        [''],
        ['ATTENDANCE BREAKDOWN'],
        ['Present:', summary.present],
        ['Absent:', summary.absent],
        ['Late:', summary.late],
        ['Excused:', summary.excused],
        ['Overall Attendance Rate:', `${summary.attendanceRate}%`]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Sheet 2: By Method
      const methodHeaders = ['Recognition Method', 'Count', 'Percentage'];
      const totalByMethod = byMethod.reduce((sum, m) => sum + m.count, 0);

      const methodRows = byMethod.map(method => [
        method._id || 'Unknown',
        method.count,
        totalByMethod > 0 ? `${Math.round((method.count / totalByMethod) * 100)}%` : '0%'
      ]);

      const methodData = [methodHeaders, ...methodRows];
      const methodSheet = XLSX.utils.aoa_to_sheet(methodData);
      
      methodSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }];

      XLSX.utils.book_append_sheet(workbook, methodSheet, 'By Method');

      // Sheet 3: Top Classes
      const topHeaders = ['Rank', 'Class Name', 'Attendance Rate (%)'];
      const topRows = topClasses.map((classItem, index) => [
        index + 1,
        classItem._id?.name || 'Unknown',
        Math.round(classItem.rate)
      ]);

      const topData = [topHeaders, ...topRows];
      const topSheet = XLSX.utils.aoa_to_sheet(topData);
      
      topSheet['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 18 }];

      XLSX.utils.book_append_sheet(workbook, topSheet, 'Top Classes');

      // Generate filename
      const filename = `attendance_summary_${Date.now()}.xlsx`;
      const filepath = path.join(this.reportsDir, filename);

      // Write file
      XLSX.writeFile(workbook, filepath);

      return filepath;

    } catch (error) {
      console.error('Generate summary report error:', error);
      throw new Error(`Excel generation failed: ${error.message}`);
    }
  }

  /**
   * Generate CSV from JSON data
   * @param {Array} data - Array of objects
   * @param {Array} fields - Field names
   */
  async generateCSV(data, fields) {
    try {
      const parser = new Parser({ fields });
      const csv = parser.parse(data);

      const filename = `export_${Date.now()}.csv`;
      const filepath = path.join(this.reportsDir, filename);

      await fs.writeFile(filepath, csv);

      return filepath;

    } catch (error) {
      console.error('Generate CSV error:', error);
      throw new Error(`CSV generation failed: ${error.message}`);
    }
  }

  /**
   * Clean up old reports
   * @param {number} daysOld - Delete files older than this
   */
  async cleanupOldReports(daysOld = 7) {
    try {
      const files = await fs.readdir(this.reportsDir);
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(this.reportsDir, file);
        const stats = await fs.stat(filepath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filepath);
          deletedCount++;
        }
      }

      return { deletedCount };

    } catch (error) {
      console.error('Cleanup reports error:', error);
      return { deletedCount: 0, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new ExcelService();