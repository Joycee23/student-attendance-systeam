const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');
const moment = require('moment');

/**
 * Email Service
 * Handles sending emails for notifications
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.enabled = false;
    this.fromEmail = 'noreply@attendance.system';
  }

  /**
   * Initialize email service with settings
   */
  async init() {
    try {
      const settings = await Settings.getSettings();

      if (!settings.emailNotificationsEnabled) {
        console.warn('Email notifications disabled');
        this.enabled = false;
        return;
      }

      this.fromEmail = settings.emailFrom || this.fromEmail;

      // Create transporter based on provider
      if (settings.emailProvider === 'smtp') {
        this.transporter = nodemailer.createTransport({
          host: settings.smtpHost,
          port: settings.smtpPort,
          secure: settings.smtpSecure, // true for 465, false for other ports
          auth: {
            user: settings.smtpUser,
            pass: settings.smtpPassword
          }
        });
      } else {
        // For other providers (SendGrid, Mailgun, etc.)
        // Implement specific configurations
        console.warn('Email provider not configured');
        this.enabled = false;
        return;
      }

      this.enabled = true;

      // Verify connection
      await this.verifyConnection();

    } catch (error) {
      console.error('Email service init error:', error);
      this.enabled = false;
    }
  }

  /**
   * Verify email connection
   */
  async verifyConnection() {
    try {
      if (!this.transporter) {
        return false;
      }

      await this.transporter.verify();
      console.log('✅ Email service ready');
      return true;

    } catch (error) {
      console.error('Email verification failed:', error);
      return false;
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   */
  async sendEmail(options) {
    try {
      await this.init();

      if (!this.enabled) {
        console.log('Email not sent (service disabled):', options.subject);
        return {
          success: false,
          message: 'Email service is disabled'
        };
      }

      const mailOptions = {
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text || undefined,
        html: options.html || undefined,
        attachments: options.attachments || undefined
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully'
      };

    } catch (error) {
      console.error('Send email error:', error);
      return {
        success: false,
        message: `Email send failed: ${error.message}`
      };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Welcome to Student Attendance System!</h2>
        <p>Hello <strong>${user.fullName}</strong>,</p>
        <p>Your account has been created successfully.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Account Details:</strong></p>
          <p>Email: ${user.email}</p>
          <p>Role: ${user.role.toUpperCase()}</p>
          ${user.studentCode ? `<p>Student Code: ${user.studentCode}</p>` : ''}
          ${user.lecturerCode ? `<p>Lecturer Code: ${user.lecturerCode}</p>` : ''}
        </div>
        <p>Please login to start using the system.</p>
        <p>Best regards,<br/>Attendance System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Student Attendance System',
      html
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Password Reset Request</h2>
        <p>Hello <strong>${user.fullName}</strong>,</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #e74c3c;"><strong>This link will expire in 10 minutes.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br/>Attendance System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(user, verificationToken) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Verify Your Email</h2>
        <p>Hello <strong>${user.fullName}</strong>,</p>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy this link: <a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>Best regards,<br/>Attendance System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      html
    });
  }

  /**
   * Send attendance notification
   */
  async sendAttendanceNotification(student, session, status) {
    const statusColors = {
      present: '#27ae60',
      late: '#f39c12',
      absent: '#e74c3c',
      excused: '#9b59b6'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColors[status]};">Attendance Update</h2>
        <p>Hello <strong>${student.fullName}</strong>,</p>
        <p>Your attendance has been recorded:</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Session Details:</strong></p>
          <p>Date: ${moment(session.sessionDate).format('YYYY-MM-DD')}</p>
          <p>Course: ${session.courseId?.name || 'N/A'}</p>
          <p>Time: ${moment(session.startTime).format('HH:mm')} - ${moment(session.endTime).format('HH:mm')}</p>
          <p>Location: ${session.location}</p>
          <p>Status: <strong style="color: ${statusColors[status]}">${status.toUpperCase()}</strong></p>
        </div>
        <p>Best regards,<br/>Attendance System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: student.email,
      subject: `Attendance Recorded - ${status.toUpperCase()}`,
      html
    });
  }

  /**
   * Send session reminder
   */
  async sendSessionReminder(student, session) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">⏰ Session Reminder</h2>
        <p>Hello <strong>${student.fullName}</strong>,</p>
        <p>You have an upcoming session:</p>
        <div style="background: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #f39c12; margin: 20px 0;">
          <p><strong>Session Details:</strong></p>
          <p>📅 Date: ${moment(session.sessionDate).format('YYYY-MM-DD')}</p>
          <p>🕐 Time: ${moment(session.startTime).format('HH:mm')} - ${moment(session.endTime).format('HH:mm')}</p>
          <p>📚 Course: ${session.courseId?.name || 'N/A'}</p>
          <p>📍 Location: ${session.location}</p>
        </div>
        <p>Don't forget to attend!</p>
        <p>Best regards,<br/>Attendance System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: student.email,
      subject: 'Upcoming Session Reminder',
      html
    });
  }

  /**
   * Send absence warning
   */
  async sendAbsenceWarning(student, stats) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">⚠️ Attendance Warning</h2>
        <p>Hello <strong>${student.fullName}</strong>,</p>
        <p>Your attendance rate is below the required threshold.</p>
        <div style="background: #fee; padding: 20px; border-radius: 5px; border-left: 4px solid #e74c3c; margin: 20px 0;">
          <p><strong>Your Attendance Statistics:</strong></p>
          <p>Total Sessions: ${stats.total}</p>
          <p>Present: ${stats.present}</p>
          <p>Absent: ${stats.absent}</p>
          <p>Late: ${stats.late}</p>
          <p>Attendance Rate: <strong style="color: #e74c3c">${stats.attendanceRate}%</strong></p>
        </div>
        <p style="color: #e74c3c;"><strong>Please improve your attendance to meet the minimum requirement of 80%.</strong></p>
        <p>Best regards,<br/>Attendance System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: student.email,
      subject: '⚠️ Attendance Warning - Action Required',
      html
    });
  }

  /**
   * Send bulk emails
   */
  async sendBulk(emails) {
    const results = [];
    const errors = [];

    for (const emailData of emails) {
      try {
        const result = await this.sendEmail(emailData);
        results.push({ to: emailData.to, ...result });
      } catch (error) {
        errors.push({ to: emailData.to, error: error.message });
      }
    }

    return {
      success: results,
      failed: errors,
      summary: {
        total: emails.length,
        succeeded: results.length,
        failed: errors.length
      }
    };
  }

  /**
   * Send report email
   */
  async sendReportEmail(recipient, reportData) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">📊 Attendance Report</h2>
        <p>Hello,</p>
        <p>Your requested attendance report is ready.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Report Details:</strong></p>
          <p>Type: ${reportData.type}</p>
          <p>Period: ${reportData.period}</p>
          <p>Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
        </div>
        <p>Please find the report attached.</p>
        <p>Best regards,<br/>Attendance System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: recipient.email,
      subject: 'Attendance Report Ready',
      html,
      attachments: reportData.attachments || []
    });
  }

  /**
   * Test email connection
   */
  async testEmail(testEmail) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">✅ Email Test Successful</h2>
        <p>This is a test email from the Student Attendance System.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <p>Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
      </div>
    `;

    return await this.sendEmail({
      to: testEmail,
      subject: 'Email Service Test',
      html
    });
  }
}

// Export singleton instance
module.exports = new EmailService();