const express = require('express');
const router = express.Router();

// Import all routes
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const classRoutes = require('./classRoutes');
const subjectRoutes = require('./subjectRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const notificationRoutes = require('./notificationRoutes');
const statisticsRoutes = require('./statisticsRoutes');
const settingsRoutes = require('./settingsRoutes');
const reportRoutes = require('./reportRoutes');
const securityRoutes = require('./securityRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/subjects', subjectRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/settings', settingsRoutes);
router.use('/reports', reportRoutes);
router.use('/security', securityRoutes);

// API health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Attendance System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      classes: '/api/classes',
      subjects: '/api/subjects',
      attendance: '/api/attendance',
      notifications: '/api/notifications',
      statistics: '/api/statistics',
      settings: '/api/settings',
      reports: '/api/reports',
      security: '/api/security'
    },
    documentation: '/api/docs', // If you add Swagger
    health: '/api/health'
  });
});

module.exports = router;