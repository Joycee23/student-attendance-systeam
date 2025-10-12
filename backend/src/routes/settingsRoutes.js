const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, optionalAuth } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/roleMiddleware');
const { validateUpdateSettings } = require('../middlewares/validation');

// @route   GET /api/settings/public
// @desc    Get public settings (no auth required)
// @access  Public
router.get('/public', optionalAuth, settingsController.getPublicSettings);

// @route   GET /api/settings
// @desc    Get system settings
// @access  Private (Admin)
router.get('/', protect, adminOnly, settingsController.getSettings);

// @route   PUT /api/settings
// @desc    Update settings
// @access  Private (Admin)
router.put('/', protect, adminOnly, validateUpdateSettings, settingsController.updateSettings);

// @route   PUT /api/settings/attendance
// @desc    Update attendance settings
// @access  Private (Admin)
router.put('/attendance', protect, adminOnly, settingsController.updateAttendanceSettings);

// @route   PUT /api/settings/ai
// @desc    Update AI settings
// @access  Private (Admin)
router.put('/ai', protect, adminOnly, settingsController.updateAISettings);

// @route   PUT /api/settings/storage
// @desc    Update storage settings
// @access  Private (Admin)
router.put('/storage', protect, adminOnly, settingsController.updateStorageSettings);

// @route   PUT /api/settings/notifications
// @desc    Update notification settings
// @access  Private (Admin)
router.put('/notifications', protect, adminOnly, settingsController.updateNotificationSettings);

// @route   PUT /api/settings/security
// @desc    Update security settings
// @access  Private (Admin)
router.put('/security', protect, adminOnly, settingsController.updateSecuritySettings);

// @route   PUT /api/settings/features
// @desc    Update feature flags
// @access  Private (Admin)
router.put('/features', protect, adminOnly, settingsController.updateFeatures);

// @route   PATCH /api/settings/maintenance
// @desc    Toggle maintenance mode
// @access  Private (Admin)
router.patch('/maintenance', protect, adminOnly, settingsController.toggleMaintenanceMode);

// @route   GET /api/settings/validate/ai-service
// @desc    Validate AI service connection
// @access  Private (Admin)
router.get('/validate/ai-service', protect, adminOnly, settingsController.validateAIService);

// @route   GET /api/settings/validate/storage
// @desc    Validate storage configuration
// @access  Private (Admin)
router.get('/validate/storage', protect, adminOnly, settingsController.validateStorage);

// @route   GET /api/settings/validate/email
// @desc    Validate email configuration
// @access  Private (Admin)
router.get('/validate/email', protect, adminOnly, settingsController.validateEmail);

// @route   GET /api/settings/validate/all
// @desc    Validate all configurations
// @access  Private (Admin)
router.get('/validate/all', protect, adminOnly, settingsController.validateAllConfigs);

// @route   POST /api/settings/reset
// @desc    Reset settings to defaults
// @access  Private (Admin)
router.post('/reset', protect, adminOnly, settingsController.resetToDefaults);

// @route   GET /api/settings/history
// @desc    Get configuration history
// @access  Private (Admin)
router.get('/history', protect, adminOnly, settingsController.getConfigHistory);

module.exports = router;