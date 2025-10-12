const Settings = require('../models/Settings');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private (Admin)
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    return successResponse(res, { settings }, 'Settings retrieved successfully');

  } catch (error) {
    console.error('Get settings error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get public settings
// @route   GET /api/settings/public
// @access  Public
exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.getPublicSettings();

    return successResponse(res, { settings }, 'Public settings retrieved successfully');

  } catch (error) {
    console.error('Get public settings error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private (Admin)
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    const settings = await Settings.updateSettings(updates, req.user.id);

    return successResponse(res, { settings }, 'Settings updated successfully');

  } catch (error) {
    console.error('Update settings error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update attendance settings
// @route   PUT /api/settings/attendance
// @access  Private (Admin)
exports.updateAttendanceSettings = async (req, res) => {
  try {
    const {
      attendanceTimeout,
      lateThreshold,
      autoCloseSession,
      allowLateCheckIn,
      maxLateMinutes,
      minimumAttendanceRate
    } = req.body;

    const settings = await Settings.getSettings();

    if (attendanceTimeout) settings.attendanceTimeout = attendanceTimeout;
    if (lateThreshold !== undefined) settings.lateThreshold = lateThreshold;
    if (autoCloseSession !== undefined) settings.autoCloseSession = autoCloseSession;
    if (allowLateCheckIn !== undefined) settings.allowLateCheckIn = allowLateCheckIn;
    if (maxLateMinutes) settings.maxLateMinutes = maxLateMinutes;
    if (minimumAttendanceRate) settings.minimumAttendanceRate = minimumAttendanceRate;

    settings.lastModifiedBy = req.user.id;
    await settings.save();

    return successResponse(res, { settings }, 'Attendance settings updated successfully');

  } catch (error) {
    console.error('Update attendance settings error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update AI settings
// @route   PUT /api/settings/ai
// @access  Private (Admin)
exports.updateAISettings = async (req, res) => {
  try {
    const {
      minConfidence,
      aiServiceUrl,
      aiServiceEnabled,
      aiServiceTimeout,
      faceRecognitionEnabled,
      maxFaceRecognitionRetries
    } = req.body;

    const settings = await Settings.getSettings();

    if (minConfidence) settings.minConfidence = minConfidence;
    if (aiServiceUrl) settings.aiServiceUrl = aiServiceUrl;
    if (aiServiceEnabled !== undefined) settings.aiServiceEnabled = aiServiceEnabled;
    if (aiServiceTimeout) settings.aiServiceTimeout = aiServiceTimeout;
    if (faceRecognitionEnabled !== undefined) settings.faceRecognitionEnabled = faceRecognitionEnabled;
    if (maxFaceRecognitionRetries) settings.maxFaceRecognitionRetries = maxFaceRecognitionRetries;

    settings.lastModifiedBy = req.user.id;
    await settings.save();

    return successResponse(res, { settings }, 'AI settings updated successfully');

  } catch (error) {
    console.error('Update AI settings error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update storage settings
// @route   PUT /api/settings/storage
// @access  Private (Admin)
exports.updateStorageSettings = async (req, res) => {
  try {
    const {
      supabaseUrl,
      supabaseKey,
      supabaseEnabled,
      cloudinaryEnabled,
      imageStorageProvider,
      maxImageSize,
      allowedImageTypes
    } = req.body;

    const settings = await Settings.getSettings();

    if (supabaseUrl) settings.supabaseUrl = supabaseUrl;
    if (supabaseKey) settings.supabaseKey = supabaseKey;
    if (supabaseEnabled !== undefined) settings.supabaseEnabled = supabaseEnabled;
    if (cloudinaryEnabled !== undefined) settings.cloudinaryEnabled = cloudinaryEnabled;
    if (imageStorageProvider) settings.imageStorageProvider = imageStorageProvider;
    if (maxImageSize) settings.maxImageSize = maxImageSize;
    if (allowedImageTypes) settings.allowedImageTypes = allowedImageTypes;

    settings.lastModifiedBy = req.user.id;
    await settings.save();

    return successResponse(res, { settings }, 'Storage settings updated successfully');

  } catch (error) {
    console.error('Update storage settings error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update notification settings
// @route   PUT /api/settings/notifications
// @access  Private (Admin)
exports.updateNotificationSettings = async (req, res) => {
  try {
    const {
      notificationsEnabled,
      pushNotificationsEnabled,
      emailNotificationsEnabled,
      smsNotificationsEnabled,
      notifyOnAbsence,
      notifyOnLate,
      notifyBeforeSession,
      notifyBeforeSessionMinutes
    } = req.body;

    const settings = await Settings.getSettings();

    if (notificationsEnabled !== undefined) settings.notificationsEnabled = notificationsEnabled;
    if (pushNotificationsEnabled !== undefined) settings.pushNotificationsEnabled = pushNotificationsEnabled;
    if (emailNotificationsEnabled !== undefined) settings.emailNotificationsEnabled = emailNotificationsEnabled;
    if (smsNotificationsEnabled !== undefined) settings.smsNotificationsEnabled = smsNotificationsEnabled;
    if (notifyOnAbsence !== undefined) settings.notifyOnAbsence = notifyOnAbsence;
    if (notifyOnLate !== undefined) settings.notifyOnLate = notifyOnLate;
    if (notifyBeforeSession !== undefined) settings.notifyBeforeSession = notifyBeforeSession;
    if (notifyBeforeSessionMinutes) settings.notifyBeforeSessionMinutes = notifyBeforeSessionMinutes;

    settings.lastModifiedBy = req.user.id;
    await settings.save();

    return successResponse(res, { settings }, 'Notification settings updated successfully');

  } catch (error) {
    console.error('Update notification settings error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update security settings
// @route   PUT /api/settings/security
// @access  Private (Admin)
exports.updateSecuritySettings = async (req, res) => {
  try {
    const {
      maxLoginAttempts,
      lockoutDurationMinutes,
      jwtExpiryDays,
      passwordMinLength,
      requirePasswordChange,
      passwordChangeIntervalDays
    } = req.body;

    const settings = await Settings.getSettings();

    if (maxLoginAttempts) settings.maxLoginAttempts = maxLoginAttempts;
    if (lockoutDurationMinutes) settings.lockoutDurationMinutes = lockoutDurationMinutes;
    if (jwtExpiryDays) settings.jwtExpiryDays = jwtExpiryDays;
    if (passwordMinLength) settings.passwordMinLength = passwordMinLength;
    if (requirePasswordChange !== undefined) settings.requirePasswordChange = requirePasswordChange;
    if (passwordChangeIntervalDays) settings.passwordChangeIntervalDays = passwordChangeIntervalDays;

    settings.lastModifiedBy = req.user.id;
    await settings.save();

    return successResponse(res, { settings }, 'Security settings updated successfully');

  } catch (error) {
    console.error('Update security settings error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update feature flags
// @route   PUT /api/settings/features
// @access  Private (Admin)
exports.updateFeatures = async (req, res) => {
  try {
    const { features } = req.body;

    if (!features) {
      return errorResponse(res, 'Features object is required', 400);
    }

    const settings = await Settings.getSettings();

    settings.features = {
      ...settings.features,
      ...features
    };

    settings.lastModifiedBy = req.user.id;
    await settings.save();

    return successResponse(res, { settings }, 'Features updated successfully');

  } catch (error) {
    console.error('Update features error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Toggle maintenance mode
// @route   PATCH /api/settings/maintenance
// @access  Private (Admin)
exports.toggleMaintenanceMode = async (req, res) => {
  try {
    const { enabled, message } = req.body;

    const settings = await Settings.getSettings();

    settings.maintenanceMode = enabled;
    if (message) settings.maintenanceMessage = message;
    settings.lastModifiedBy = req.user.id;

    await settings.save();

    return successResponse(res, { 
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage
    }, `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);

  } catch (error) {
    console.error('Toggle maintenance mode error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Validate AI service connection
// @route   GET /api/settings/validate/ai-service
// @access  Private (Admin)
exports.validateAIService = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const validation = await settings.validateAIService();

    return successResponse(res, validation, 
      validation.valid ? 'AI service is connected' : 'AI service connection failed'
    );

  } catch (error) {
    console.error('Validate AI service error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Validate storage configuration
// @route   GET /api/settings/validate/storage
// @access  Private (Admin)
exports.validateStorage = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const validation = settings.validateStorageConfig();

    return successResponse(res, validation, validation.message);

  } catch (error) {
    console.error('Validate storage error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Validate email configuration
// @route   GET /api/settings/validate/email
// @access  Private (Admin)
exports.validateEmail = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const validation = settings.validateEmailConfig();

    return successResponse(res, validation, validation.message);

  } catch (error) {
    console.error('Validate email error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Validate all configurations
// @route   GET /api/settings/validate/all
// @access  Private (Admin)
exports.validateAllConfigs = async (req, res) => {
  try {
    const results = await Settings.validateAllConfigs();

    return successResponse(res, results, 
      results.allValid ? 'All configurations valid' : 'Some configurations invalid'
    );

  } catch (error) {
    console.error('Validate all configs error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Reset settings to defaults
// @route   POST /api/settings/reset
// @access  Private (Admin)
exports.resetToDefaults = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    await settings.resetToDefaults(req.user.id);

    return successResponse(res, { settings }, 'Settings reset to defaults');

  } catch (error) {
    console.error('Reset settings error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get configuration history
// @route   GET /api/settings/history
// @access  Private (Admin)
exports.getConfigHistory = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const settings = await Settings.getSettings();
    
    const history = settings.configHistory
      .sort((a, b) => b.modifiedAt - a.modifiedAt)
      .slice(0, parseInt(limit));

    // Populate modifiedBy
    await Settings.populate(history, {
      path: 'modifiedBy',
      select: 'fullName email role'
    });

    return successResponse(res, { history }, 'Configuration history retrieved successfully');

  } catch (error) {
    console.error('Get config history error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;