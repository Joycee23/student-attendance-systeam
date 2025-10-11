const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Chỉ có 1 document duy nhất trong collection này
    _id: {
      type: String,
      default: 'system_settings'
    },

    // ==================== ATTENDANCE SETTINGS ====================
    attendanceTimeout: {
      type: Number,
      required: [true, 'Attendance timeout is required'],
      min: [5, 'Attendance timeout must be at least 5 minutes'],
      max: [480, 'Attendance timeout cannot exceed 480 minutes (8 hours)'],
      default: 120 // 2 giờ
    },

    lateThreshold: {
      type: Number,
      min: [0, 'Late threshold cannot be negative'],
      max: [60, 'Late threshold cannot exceed 60 minutes'],
      default: 15 // 15 phút
    },

    autoCloseSession: {
      type: Boolean,
      default: true
    },

    allowLateCheckIn: {
      type: Boolean,
      default: true
    },

    maxLateMinutes: {
      type: Number,
      min: [0, 'Max late minutes cannot be negative'],
      max: [120, 'Max late minutes cannot exceed 120 minutes'],
      default: 30
    },

    // Yêu cầu điểm danh tối thiểu (%)
    minimumAttendanceRate: {
      type: Number,
      min: [0, 'Minimum attendance rate cannot be less than 0'],
      max: [100, 'Minimum attendance rate cannot exceed 100'],
      default: 80
    },

    // ==================== AI FACE RECOGNITION SETTINGS ====================
    minConfidence: {
      type: Number,
      required: [true, 'Minimum confidence is required'],
      min: [0, 'Confidence cannot be less than 0'],
      max: [1, 'Confidence cannot be greater than 1'],
      default: 0.85
    },

    aiServiceUrl: {
      type: String,
      required: [true, 'AI service URL is required'],
      trim: true,
      default: 'http://localhost:5000',
      validate: {
        validator: function(value) {
          return /^https?:\/\/.+/.test(value);
        },
        message: 'AI service URL must be a valid HTTP/HTTPS URL'
      }
    },

    aiServiceEnabled: {
      type: Boolean,
      default: true
    },

    aiServiceTimeout: {
      type: Number,
      min: [1000, 'Timeout must be at least 1000ms'],
      max: [60000, 'Timeout cannot exceed 60000ms'],
      default: 10000 // 10 seconds
    },

    faceRecognitionEnabled: {
      type: Boolean,
      default: true
    },

    maxFaceRecognitionRetries: {
      type: Number,
      min: [0, 'Retries cannot be negative'],
      max: [5, 'Retries cannot exceed 5'],
      default: 2
    },

    // ==================== STORAGE SETTINGS (SUPABASE/CLOUDINARY) ====================
    supabaseUrl: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function(value) {
          if (!value) return true;
          return /^https?:\/\/.+/.test(value);
        },
        message: 'Supabase URL must be a valid HTTP/HTTPS URL'
      }
    },

    supabaseKey: {
      type: String,
      trim: true,
      default: null,
      select: false // Không trả về key khi query
    },

    supabaseEnabled: {
      type: Boolean,
      default: false
    },

    cloudinaryEnabled: {
      type: Boolean,
      default: true
    },

    cloudinaryCloudName: {
      type: String,
      trim: true,
      default: null
    },

    cloudinaryApiKey: {
      type: String,
      trim: true,
      default: null,
      select: false
    },

    cloudinaryApiSecret: {
      type: String,
      trim: true,
      default: null,
      select: false
    },

    // Storage preference
    imageStorageProvider: {
      type: String,
      enum: ['cloudinary', 'supabase', 'local'],
      default: 'cloudinary'
    },

    maxImageSize: {
      type: Number,
      min: [1024, 'Max image size must be at least 1KB'],
      max: [10485760, 'Max image size cannot exceed 10MB'],
      default: 5242880 // 5MB
    },

    allowedImageTypes: {
      type: [String],
      default: ['image/jpeg', 'image/png', 'image/jpg']
    },

    // ==================== QR CODE SETTINGS ====================
    qrCodeEnabled: {
      type: Boolean,
      default: true
    },

    qrCodeExpiryMinutes: {
      type: Number,
      min: [1, 'QR code expiry must be at least 1 minute'],
      max: [60, 'QR code expiry cannot exceed 60 minutes'],
      default: 5
    },

    qrCodeAutoRefresh: {
      type: Boolean,
      default: false
    },

    qrCodeRefreshInterval: {
      type: Number,
      min: [1, 'Refresh interval must be at least 1 minute'],
      max: [30, 'Refresh interval cannot exceed 30 minutes'],
      default: 3
    },

    // ==================== GPS SETTINGS ====================
    gpsEnabled: {
      type: Boolean,
      default: false
    },

    gpsRadius: {
      type: Number,
      min: [10, 'GPS radius must be at least 10 meters'],
      max: [1000, 'GPS radius cannot exceed 1000 meters'],
      default: 100 // 100 meters
    },

    gpsAccuracyThreshold: {
      type: Number,
      min: [5, 'GPS accuracy threshold must be at least 5 meters'],
      max: [100, 'GPS accuracy threshold cannot exceed 100 meters'],
      default: 20
    },

    // ==================== NOTIFICATION SETTINGS ====================
    notificationsEnabled: {
      type: Boolean,
      default: true
    },

    pushNotificationsEnabled: {
      type: Boolean,
      default: true
    },

    emailNotificationsEnabled: {
      type: Boolean,
      default: false
    },

    smsNotificationsEnabled: {
      type: Boolean,
      default: false
    },

    notifyOnAbsence: {
      type: Boolean,
      default: true
    },

    notifyOnLate: {
      type: Boolean,
      default: true
    },

    notifyBeforeSession: {
      type: Boolean,
      default: true
    },

    notifyBeforeSessionMinutes: {
      type: Number,
      min: [5, 'Notify time must be at least 5 minutes'],
      max: [120, 'Notify time cannot exceed 120 minutes'],
      default: 30
    },

    // ==================== EMAIL SETTINGS ====================
    emailProvider: {
      type: String,
      enum: ['smtp', 'sendgrid', 'mailgun', 'none'],
      default: 'smtp'
    },

    emailFrom: {
      type: String,
      trim: true,
      default: 'noreply@attendance.system'
    },

    smtpHost: {
      type: String,
      trim: true,
      default: null,
      select: false
    },

    smtpPort: {
      type: Number,
      min: [1, 'SMTP port must be at least 1'],
      max: [65535, 'SMTP port cannot exceed 65535'],
      default: 587,
      select: false
    },

    smtpUser: {
      type: String,
      trim: true,
      default: null,
      select: false
    },

    smtpPassword: {
      type: String,
      trim: true,
      default: null,
      select: false
    },

    smtpSecure: {
      type: Boolean,
      default: false,
      select: false
    },

    // ==================== SECURITY SETTINGS ====================
    maxLoginAttempts: {
      type: Number,
      min: [1, 'Max login attempts must be at least 1'],
      max: [10, 'Max login attempts cannot exceed 10'],
      default: 5
    },

    lockoutDurationMinutes: {
      type: Number,
      min: [1, 'Lockout duration must be at least 1 minute'],
      max: [1440, 'Lockout duration cannot exceed 1440 minutes (24 hours)'],
      default: 120 // 2 hours
    },

    jwtExpiryDays: {
      type: Number,
      min: [1, 'JWT expiry must be at least 1 day'],
      max: [365, 'JWT expiry cannot exceed 365 days'],
      default: 7
    },

    passwordMinLength: {
      type: Number,
      min: [6, 'Password min length must be at least 6'],
      max: [20, 'Password min length cannot exceed 20'],
      default: 8
    },

    requirePasswordChange: {
      type: Boolean,
      default: false
    },

    passwordChangeIntervalDays: {
      type: Number,
      min: [30, 'Password change interval must be at least 30 days'],
      max: [365, 'Password change interval cannot exceed 365 days'],
      default: 90
    },

    // ==================== SESSION SETTINGS ====================
    allowMultipleSessions: {
      type: Boolean,
      default: false
    },

    sessionConcurrency: {
      type: Number,
      min: [1, 'Session concurrency must be at least 1'],
      max: [10, 'Session concurrency cannot exceed 10'],
      default: 1
    },

    // ==================== DATA RETENTION ====================
    dataRetentionDays: {
      type: Number,
      min: [30, 'Data retention must be at least 30 days'],
      max: [3650, 'Data retention cannot exceed 3650 days (10 years)'],
      default: 365
    },

    autoDeleteOldData: {
      type: Boolean,
      default: false
    },

    backupEnabled: {
      type: Boolean,
      default: false
    },

    backupIntervalDays: {
      type: Number,
      min: [1, 'Backup interval must be at least 1 day'],
      max: [30, 'Backup interval cannot exceed 30 days'],
      default: 7
    },

    // ==================== SYSTEM SETTINGS ====================
    systemName: {
      type: String,
      trim: true,
      default: 'Student Attendance System'
    },

    systemVersion: {
      type: String,
      trim: true,
      default: '1.0.0'
    },

    maintenanceMode: {
      type: Boolean,
      default: false
    },

    maintenanceMessage: {
      type: String,
      trim: true,
      default: 'System is under maintenance. Please try again later.'
    },

    allowRegistration: {
      type: Boolean,
      default: false
    },

    requireEmailVerification: {
      type: Boolean,
      default: true
    },

    // ==================== API SETTINGS ====================
    apiRateLimitEnabled: {
      type: Boolean,
      default: true
    },

    apiRateLimitWindowMinutes: {
      type: Number,
      min: [1, 'Rate limit window must be at least 1 minute'],
      max: [60, 'Rate limit window cannot exceed 60 minutes'],
      default: 15
    },

    apiRateLimitMaxRequests: {
      type: Number,
      min: [10, 'Max requests must be at least 10'],
      max: [10000, 'Max requests cannot exceed 10000'],
      default: 100
    },

    // ==================== FEATURES FLAGS ====================
    features: {
      faceRecognition: {
        type: Boolean,
        default: true
      },
      qrCode: {
        type: Boolean,
        default: true
      },
      gpsTracking: {
        type: Boolean,
        default: false
      },
      manualAttendance: {
        type: Boolean,
        default: true
      },
      bulkOperations: {
        type: Boolean,
        default: true
      },
      reports: {
        type: Boolean,
        default: true
      },
      analytics: {
        type: Boolean,
        default: true
      },
      exportData: {
        type: Boolean,
        default: true
      }
    },

    // ==================== METADATA ====================
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    configHistory: [{
      modifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      modifiedAt: {
        type: Date,
        default: Date.now
      },
      changes: mongoose.Schema.Types.Mixed
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== VIRTUAL FIELDS ====================

// QR code expiry in seconds
settingsSchema.virtual('qrCodeExpirySeconds').get(function() {
  return this.qrCodeExpiryMinutes * 60;
});

// Lockout duration in seconds
settingsSchema.virtual('lockoutDurationSeconds').get(function() {
  return this.lockoutDurationMinutes * 60;
});

// JWT expiry in seconds
settingsSchema.virtual('jwtExpirySeconds').get(function() {
  return this.jwtExpiryDays * 24 * 60 * 60;
});

// Check if system is operational
settingsSchema.virtual('isOperational').get(function() {
  return !this.maintenanceMode && this.aiServiceEnabled;
});

// ==================== METHODS ====================

// Update settings
settingsSchema.methods.updateSettings = async function(updates, userId) {
  const changes = {};
  
  // Track changes
  for (const [key, value] of Object.entries(updates)) {
    if (this[key] !== value) {
      changes[key] = {
        from: this[key],
        to: value
      };
      this[key] = value;
    }
  }

  // Add to history
  if (Object.keys(changes).length > 0) {
    this.configHistory.push({
      modifiedBy: userId,
      modifiedAt: new Date(),
      changes
    });
    
    this.lastModifiedBy = userId;
  }

  return this.save();
};

// Validate AI service connection
settingsSchema.methods.validateAIService = async function() {
  if (!this.aiServiceEnabled || !this.aiServiceUrl) {
    return { valid: false, message: 'AI service is not enabled or URL not configured' };
  }

  try {
    const axios = require('axios');
    const response = await axios.get(`${this.aiServiceUrl}/api/health`, {
      timeout: this.aiServiceTimeout
    });
    
    return { 
      valid: response.status === 200, 
      message: 'AI service is reachable',
      data: response.data
    };
  } catch (error) {
    return { 
      valid: false, 
      message: `AI service unreachable: ${error.message}` 
    };
  }
};

// Validate storage configuration
settingsSchema.methods.validateStorageConfig = function() {
  const provider = this.imageStorageProvider;
  
  if (provider === 'cloudinary' && this.cloudinaryEnabled) {
    if (!this.cloudinaryCloudName || !this.cloudinaryApiKey || !this.cloudinaryApiSecret) {
      return { valid: false, message: 'Cloudinary configuration incomplete' };
    }
  }
  
  if (provider === 'supabase' && this.supabaseEnabled) {
    if (!this.supabaseUrl || !this.supabaseKey) {
      return { valid: false, message: 'Supabase configuration incomplete' };
    }
  }
  
  return { valid: true, message: 'Storage configuration valid' };
};

// Validate email configuration
settingsSchema.methods.validateEmailConfig = function() {
  if (!this.emailNotificationsEnabled) {
    return { valid: true, message: 'Email notifications disabled' };
  }

  if (this.emailProvider === 'smtp') {
    if (!this.smtpHost || !this.smtpUser || !this.smtpPassword) {
      return { valid: false, message: 'SMTP configuration incomplete' };
    }
  }

  return { valid: true, message: 'Email configuration valid' };
};

// Get public settings (no sensitive data)
settingsSchema.methods.getPublicSettings = function() {
  return {
    attendanceTimeout: this.attendanceTimeout,
    lateThreshold: this.lateThreshold,
    minConfidence: this.minConfidence,
    qrCodeEnabled: this.qrCodeEnabled,
    qrCodeExpiryMinutes: this.qrCodeExpiryMinutes,
    faceRecognitionEnabled: this.faceRecognitionEnabled,
    gpsEnabled: this.gpsEnabled,
    gpsRadius: this.gpsRadius,
    systemName: this.systemName,
    systemVersion: this.systemVersion,
    maintenanceMode: this.maintenanceMode,
    maintenanceMessage: this.maintenanceMessage,
    features: this.features,
    allowRegistration: this.allowRegistration,
    requireEmailVerification: this.requireEmailVerification,
    minimumAttendanceRate: this.minimumAttendanceRate
  };
};

// Reset to defaults
settingsSchema.methods.resetToDefaults = async function(userId) {
  const defaults = {
    attendanceTimeout: 120,
    lateThreshold: 15,
    minConfidence: 0.85,
    qrCodeExpiryMinutes: 5,
    gpsRadius: 100,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 120,
    jwtExpiryDays: 7,
    passwordMinLength: 8
  };

  return this.updateSettings(defaults, userId);
};

// ==================== STATIC METHODS ====================

// Get settings (singleton pattern)
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findById('system_settings');
  
  if (!settings) {
    settings = await this.create({ _id: 'system_settings' });
  }
  
  return settings;
};

// Update settings (singleton)
settingsSchema.statics.updateSettings = async function(updates, userId) {
  const settings = await this.getSettings();
  return settings.updateSettings(updates, userId);
};

// Get public settings
settingsSchema.statics.getPublicSettings = async function() {
  const settings = await this.getSettings();
  return settings.getPublicSettings();
};

// Validate all configurations
settingsSchema.statics.validateAllConfigs = async function() {
  const settings = await this.getSettings();
  
  const results = {
    aiService: await settings.validateAIService(),
    storage: settings.validateStorageConfig(),
    email: settings.validateEmailConfig()
  };

  results.allValid = Object.values(results).every(r => r.valid);
  
  return results;
};

// ==================== INDEXES ====================
// Không cần indexes vì chỉ có 1 document

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;