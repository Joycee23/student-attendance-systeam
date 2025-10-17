const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');

/**
 * PDF Service
 * Generates PDF reports for attendance data
 * Note: This is a placeholder implementation
 * For production, use packages like 'pdfkit' or 'puppeteer'
 */

class PDFService {
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
   * Generate class attendance report (PDF)
   * @param {Object} data - Report data
   * @returns {string} File path
   */
  async generateClassAttendanceReport(data) {
    try {
      const { class: classData, sessions, attendanceData, startDate, endDate } = data;

      // Generate HTML content
      const html = this.generateClassReportHTML(classData, sessions, attendanceData, startDate, endDate);

      // For now, save as HTML
      // In production, use puppeteer or pdfkit to convert to PDF
      const filename = `class_attendance_${classData.name}_${Date.now()}.html`;
      const filepath = path.join(this.reportsDir, filename);

      await fs.writeFile(filepath, html, 'utf8');

      // TODO: Convert HTML to PDF using puppeteer or similar
      // const pdf = await this.htmlToPDF(html);
      // const pdfPath = filepath.replace('.html', '.pdf');
      // await fs.writeFile(pdfPath, pdf);
      // return pdfPath;

      return filepath;

    } catch (error) {
      console.error('Generate class PDF report error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate HTML for class report
   */
  generateClassReportHTML(classData, sessions, attendanceData, startDate, endDate) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Class Attendance Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .header-info {
      background: #ecf0f1;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .header-info p {
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #3498db;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    tr:hover {
      background: #f5f5f5;
    }
    .present { color: #27ae60; font-weight: bold; }
    .absent { color: #e74c3c; font-weight: bold; }
    .late { color: #f39c12; font-weight: bold; }
    .rate-high { color: #27ae60; }
    .rate-medium { color: #f39c12; }
    .rate-low { color: #e74c3c; }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #7f8c8d;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>📊 Class Attendance Report</h1>
  
  <div class="header-info">
    <p><strong>Class:</strong> ${classData.name}</p>
    <p><strong>Lecturer:</strong> ${classData.lecturerId?.fullName || 'N/A'}</p>
    <p><strong>Total Students:</strong> ${classData.studentIds.length}</p>
    <p><strong>Total Sessions:</strong> ${sessions.length}</p>
    <p><strong>Period:</strong> ${startDate || 'All'} - ${endDate || 'All'}</p>
    <p><strong>Generated:</strong> ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
  </div>

  <h2>Student Attendance Summary</h2>
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Student Code</th>
        <th>Full Name</th>
        <th>Present</th>
        <th>Absent</th>
        <th>Late</th>
        <th>Excused</th>
        <th>Rate</th>
      </tr>
    </thead>
    <tbody>
      ${attendanceData.map((student, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${student.studentCode}</td>
          <td>${student.fullName}</td>
          <td class="present">${student.summary.present}</td>
          <td class="absent">${student.summary.absent}</td>
          <td class="late">${student.summary.late}</td>
          <td>${student.summary.excused}</td>
          <td class="${this.getRateClass(student.summary.attendanceRate)}">${student.summary.attendanceRate}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Session Details</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Course</th>
        <th>Location</th>
        <th>Time</th>
        <th>Present</th>
        <th>Absent</th>
        <th>Late</th>
      </tr>
    </thead>
    <tbody>
      ${sessions.map(session => `
        <tr>
          <td>${moment(session.sessionDate).format('YYYY-MM-DD')}</td>
          <td>${session.courseId?.code || 'N/A'}</td>
          <td>${session.location}</td>
          <td>${moment(session.startTime).format('HH:mm')}</td>
          <td class="present">${session.presentCount}</td>
          <td class="absent">${session.absentCount}</td>
          <td class="late">${session.lateCount}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated by Student Attendance System</p>
    <p>${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate student attendance report (PDF)
   */
  async generateStudentAttendanceReport(data) {
    try {
      const { student, history, stats, byCourse, startDate, endDate } = data;

      const html = this.generateStudentReportHTML(student, history, stats, byCourse, startDate, endDate);

      const filename = `student_attendance_${student.studentCode}_${Date.now()}.html`;
      const filepath = path.join(this.reportsDir, filename);

      await fs.writeFile(filepath, html, 'utf8');

      return filepath;

    } catch (error) {
      console.error('Generate student PDF report error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate HTML for student report
   */
  generateStudentReportHTML(student, history, stats, byCourse, startDate, endDate) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Student Attendance Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .header-info {
      background: #ecf0f1;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-box {
      background: white;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #3498db;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-box h3 {
      margin: 0 0 10px 0;
      color: #7f8c8d;
      font-size: 14px;
    }
    .stat-box .value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #3498db;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .present { color: #27ae60; font-weight: bold; }
    .absent { color: #e74c3c; font-weight: bold; }
    .late { color: #f39c12; font-weight: bold; }
    .excused { color: #9b59b6; font-weight: bold; }
  </style>
</head>
<body>
  <h1>👤 Student Attendance Report</h1>
  
  <div class="header-info">
    <p><strong>Student Code:</strong> ${student.studentCode}</p>
    <p><strong>Full Name:</strong> ${student.fullName}</p>
    <p><strong>Email:</strong> ${student.email}</p>
    <p><strong>Class:</strong> ${student.classId?.name || 'N/A'}</p>
    <p><strong>Period:</strong> ${startDate || 'All'} - ${endDate || 'All'}</p>
  </div>

  <h2>Overall Statistics</h2>
  <div class="stats-grid">
    <div class="stat-box">
      <h3>Total Sessions</h3>
      <div class="value">${stats.total}</div>
    </div>
    <div class="stat-box">
      <h3>Present</h3>
      <div class="value" style="color: #27ae60">${stats.present}</div>
    </div>
    <div class="stat-box">
      <h3>Absent</h3>
      <div class="value" style="color: #e74c3c">${stats.absent}</div>
    </div>
    <div class="stat-box">
      <h3>Late</h3>
      <div class="value" style="color: #f39c12">${stats.late}</div>
    </div>
    <div class="stat-box">
      <h3>Excused</h3>
      <div class="value" style="color: #9b59b6">${stats.excused}</div>
    </div>
    <div class="stat-box">
      <h3>Attendance Rate</h3>
      <div class="value" style="color: ${this.getRateColor(stats.attendanceRate)}">${stats.attendanceRate}%</div>
    </div>
  </div>

  <h2>By Course</h2>
  <table>
    <thead>
      <tr>
        <th>Course</th>
        <th>Total</th>
        <th>Present</th>
        <th>Absent</th>
        <th>Late</th>
        <th>Rate</th>
      </tr>
    </thead>
    <tbody>
      ${byCourse.map(course => `
        <tr>
          <td>${course.courseCode} - ${course.courseName}</td>
          <td>${course.stats.total}</td>
          <td class="present">${course.stats.present}</td>
          <td class="absent">${course.stats.absent}</td>
          <td class="late">${course.stats.late}</td>
          <td style="color: ${this.getRateColor(course.stats.attendanceRate)}">${course.stats.attendanceRate}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Attendance History</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Course</th>
        <th>Location</th>
        <th>Check-in</th>
        <th>Status</th>
        <th>Method</th>
      </tr>
    </thead>
    <tbody>
      ${history.slice(0, 50).map(record => `
        <tr>
          <td>${moment(record.sessionDate).format('YYYY-MM-DD')}</td>
          <td>${record.courseId?.code || 'N/A'}</td>
          <td>${record.sessionId?.location || 'N/A'}</td>
          <td>${moment(record.checkInTime).format('HH:mm:ss')}</td>
          <td class="${record.status}">${record.status.toUpperCase()}</td>
          <td>${record.recognizedBy}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated by Student Attendance System</p>
    <p>${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate course attendance report (PDF)
   */
  async generateCourseAttendanceReport(data) {
    try {
      const { course, sessions, byClass, summary, startDate, endDate } = data;

      const html = this.generateCourseReportHTML(course, sessions, byClass, summary, startDate, endDate);

      const filename = `course_attendance_${course.code}_${Date.now()}.html`;
      const filepath = path.join(this.reportsDir, filename);

      await fs.writeFile(filepath, html, 'utf8');

      return filepath;

    } catch (error) {
      console.error('Generate course PDF report error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate HTML for course report
   */
  generateCourseReportHTML(course, sessions, byClass, summary, startDate, endDate) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Course Attendance Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .header-info {
      background: #ecf0f1;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-box {
      background: white;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #3498db;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-box h3 {
      margin: 0 0 10px 0;
      color: #7f8c8d;
      font-size: 14px;
    }
    .stat-box .value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #3498db;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <h1>📚 Course Attendance Report</h1>
  
  <div class="header-info">
    <p><strong>Course Code:</strong> ${course.code}</p>
    <p><strong>Course Name:</strong> ${course.name}</p>
    <p><strong>Credits:</strong> ${course.credits}</p>
    <p><strong>Period:</strong> ${startDate || 'All'} - ${endDate || 'All'}</p>
  </div>

  <h2>Overall Statistics</h2>
  <div class="stats-grid">
    <div class="stat-box">
      <h3>Total Sessions</h3>
      <div class="value">${summary.totalSessions}</div>
    </div>
    <div class="stat-box">
      <h3>Total Students</h3>
      <div class="value">${summary.totalStudents}</div>
    </div>
    <div class="stat-box">
      <h3>Total Present</h3>
      <div class="value" style="color: #27ae60">${summary.totalPresent}</div>
    </div>
    <div class="stat-box">
      <h3>Avg Rate</h3>
      <div class="value" style="color: ${this.getRateColor(summary.avgAttendanceRate)}">${summary.avgAttendanceRate}%</div>
    </div>
  </div>

  <h2>By Class</h2>
  <table>
    <thead>
      <tr>
        <th>Class Name</th>
        <th>Sessions</th>
        <th>Students</th>
        <th>Present</th>
        <th>Absent</th>
        <th>Late</th>
        <th>Rate</th>
      </tr>
    </thead>
    <tbody>
      ${byClass.map(cls => `
        <tr>
          <td>${cls.className}</td>
          <td>${cls.stats.totalSessions}</td>
          <td>${cls.stats.totalStudents}</td>
          <td style="color: #27ae60">${cls.stats.totalPresent}</td>
          <td style="color: #e74c3c">${cls.stats.totalAbsent}</td>
          <td style="color: #f39c12">${cls.stats.totalLate}</td>
          <td style="color: ${this.getRateColor(cls.stats.attendanceRate)}">${cls.stats.attendanceRate}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated by Student Attendance System</p>
    <p>${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate attendance summary report (PDF)
   */
  async generateAttendanceSummary(data) {
    try {
      const { summary, byMethod, topClasses, startDate, endDate } = data;

      const html = this.generateSummaryHTML(summary, byMethod, topClasses, startDate, endDate);

      const filename = `attendance_summary_${Date.now()}.html`;
      const filepath = path.join(this.reportsDir, filename);

      await fs.writeFile(filepath, html, 'utf8');

      return filepath;

    } catch (error) {
      console.error('Generate summary PDF error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate HTML for summary report
   */
  generateSummaryHTML(summary, byMethod, topClasses, startDate, endDate) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attendance System Summary</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .header-info {
      background: #ecf0f1;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
      text-align: center;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-box {
      background: white;
      padding: 20px;
      border-radius: 5px;
      border-left: 4px solid #3498db;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-box h3 {
      margin: 0 0 10px 0;
      color: #7f8c8d;
      font-size: 14px;
    }
    .stat-box .value {
      font-size: 32px;
      font-weight: bold;
      color: #2c3e50;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #3498db;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .chart {
      margin: 20px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <h1>📊 Attendance System Summary Report</h1>
  
  <div class="header-info">
    <h2>Report Period</h2>
    <p><strong>${startDate || 'All Time'} - ${endDate || moment().format('YYYY-MM-DD')}</strong></p>
    <p>Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
  </div>

  <h2>System Overview</h2>
  <div class="stats-grid">
    <div class="stat-box">
      <h3>Total Sessions</h3>
      <div class="value">${summary.totalSessions}</div>
    </div>
    <div class="stat-box">
      <h3>Total Classes</h3>
      <div class="value">${summary.totalClasses}</div>
    </div>
    <div class="stat-box">
      <h3>Total Students</h3>
      <div class="value">${summary.totalStudents}</div>
    </div>
    <div class="stat-box">
      <h3>Total Records</h3>
      <div class="value">${summary.totalRecords}</div>
    </div>
  </div>

  <h2>Attendance Breakdown</h2>
  <div class="stats-grid">
    <div class="stat-box" style="border-left-color: #27ae60;">
      <h3>Present</h3>
      <div class="value" style="color: #27ae60">${summary.present}</div>
    </div>
    <div class="stat-box" style="border-left-color: #e74c3c;">
      <h3>Absent</h3>
      <div class="value" style="color: #e74c3c">${summary.absent}</div>
    </div>
    <div class="stat-box" style="border-left-color: #f39c12;">
      <h3>Late</h3>
      <div class="value" style="color: #f39c12">${summary.late}</div>
    </div>
    <div class="stat-box" style="border-left-color: #9b59b6;">
      <h3>Excused</h3>
      <div class="value" style="color: #9b59b6">${summary.excused}</div>
    </div>
  </div>

  <div class="stat-box" style="max-width: 300px; margin: 20px auto;">
    <h3>Overall Attendance Rate</h3>
    <div class="value" style="color: ${this.getRateColor(summary.attendanceRate)}; font-size: 48px;">
      ${summary.attendanceRate}%
    </div>
  </div>

  <h2>Attendance Methods</h2>
  <table>
    <thead>
      <tr>
        <th>Method</th>
        <th>Count</th>
        <th>Percentage</th>
      </tr>
    </thead>
    <tbody>
      ${byMethod.map(method => {
        const percentage = summary.totalRecords > 0 
          ? Math.round((method.count / summary.totalRecords) * 100) 
          : 0;
        return `
          <tr>
            <td>${this.formatMethodName(method._id)}</td>
            <td>${method.count}</td>
            <td>${percentage}%</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h2>Top 10 Classes by Attendance Rate</h2>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Class Name</th>
        <th>Attendance Rate</th>
      </tr>
    </thead>
    <tbody>
      ${topClasses.slice(0, 10).map((cls, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${cls._id?.name || 'N/A'}</td>
          <td style="color: ${this.getRateColor(Math.round(cls.rate))}">${Math.round(cls.rate)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer" style="margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px;">
    <p>Generated by Student Attendance System</p>
    <p>Report generated at ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Helper: Get rate color
   */
  getRateColor(rate) {
    if (rate >= 80) return '#27ae60';
    if (rate >= 60) return '#f39c12';
    return '#e74c3c';
  }

  /**
   * Helper: Get rate class
   */
  getRateClass(rate) {
    if (rate >= 80) return 'rate-high';
    if (rate >= 60) return 'rate-medium';
    return 'rate-low';
  }

  /**
   * Helper: Format method name
   */
  formatMethodName(method) {
    const names = {
      'manual': 'Manual Entry',
      'qrCode': 'QR Code Scan',
      'faceRecognition': 'Face Recognition',
      'gps': 'GPS Location',
      'auto': 'Automatic'
    };
    return names[method] || method;
  }

  /**
   * Delete report file
   */
  async deleteReport(filepath) {
    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Delete report error:', error);
    }
  }

  /**
   * Clean up old reports
   */
  async cleanupOldReports(daysOld = 7) {
    try {
      const files = await fs.readdir(this.reportsDir);
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      let deleted = 0;

      for (const file of files) {
        const filepath = path.join(this.reportsDir, file);
        const stats = await fs.stat(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filepath);
          deleted++;
        }
      }

      return deleted;

    } catch (error) {
      console.error('Cleanup old reports error:', error);
      return 0;
    }
  }

  /**
   * TODO: Convert HTML to PDF using Puppeteer
   * Uncomment and implement when needed
   */
  /*
  async htmlToPDF(html) {
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.setContent(html);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    
    return pdf;
  }
  */
}

// Export singleton instance
module.exports = new PDFService();