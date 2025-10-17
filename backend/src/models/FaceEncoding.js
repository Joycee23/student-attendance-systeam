const mongoose = require('mongoose');

const faceEncodingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
      validate: {
        validator: async function(value) {
          const User = mongoose.model('User');
          const user = await User.findById(value);
          return user && user.role === 'student' && user.isActive;
        },
        message: 'Face encoding must belong to an active student'
      }
    },

    // Face encodings từ AI service (array of arrays)
    encodings: [{
      type: [Number], // Array of float numbers representing face encoding
      required: true,
      validate: {
        validator: function(arr) {
          return arr.length > 0 && arr.every(num => typeof num === 'number');
        },
        message: 'Each encoding must be a non-empty array of numbers'
      }
    }],

    // URLs của ảnh đã upload
    imageUrls: [{
      type: String,
      trim: true,
      validate: {
        validator: function(url) {
          // Basic URL validation
          const urlPattern = /^https?:\/\/.+/;
          return urlPattern.test(url);
        },
        message: 'Invalid image URL format'
      }
    }],

    // Cloudinary public IDs để quản lý xóa ảnh
    cloudinaryIds: [{
      type: String,
      trim: true
    }],

    // Thông tin AI service
    aiServiceVersion: {
      type: String,
      required: true,
      default: '1.0.0'
    },

    // Model version used for encoding
    modelVersion: {
      type: String,
      required: true,
      default: 'face-recognition-v1'
    },

    // Quality score (0-1)
    qualityScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },

    // Số lượng khuôn mặt detected trong ảnh
    faceCount: {
      type: Number,
      min: 1,
      default: 1
    },

    // Metadata từ AI processing
    processingMetadata: {
      processingTime: {
        type: Number, // milliseconds
        min: 0
      },
      imageDimensions: {
        width: Number,
        height: Number
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      detectorUsed: {
        type: String,
        enum: ['dlib', 'mtcnn', 'opencv', 'face_recognition'],
        default: 'face_recognition'
      }
    },

    // Trạng thái
    isActive: {
      type: Boolean,
      default: true
    },

    // Lý do inactive (nếu có)
    inactiveReason: {
      type: String,
      trim: true,
      maxlength: [200, 'Inactive reason cannot exceed 200 characters'],
      default: null
    },

    // Verification status
    isVerified: {
      type: Boolean,
      default: true // Đối với face encoding, thường được verify tự động
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    // Usage statistics
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },

    lastUsedAt: {
      type: Date,
      default: null
    },

    // Notes
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
faceEncodingSchema.index({ userId: 1 });
faceEncodingSchema.index({ isActive: 1 });
faceEncodingSchema.index({ isVerified: 1 });
faceEncodingSchema.index({ 'processingMetadata.detectorUsed': 1 });
faceEncodingSchema.index({ createdAt: -1 });
faceEncodingSchema.index({ lastUsedAt: -1 });

// ==================== VIRTUAL FIELDS ====================

// URL của ảnh chính (đầu tiên)
faceEncodingSchema.virtual('primaryImageUrl').get(function() {
  return this.imageUrls && this.imageUrls.length > 0 ? this.imageUrls[0] : null;
});

// Quality score dạng phần trăm
faceEncodingSchema.virtual('qualityPercent').get(function() {
  if (this.qualityScore === null) return null;
  return Math.round(this.qualityScore * 100);
});

// Có thể sử dụng hay không
faceEncodingSchema.virtual('isUsable').get(function() {
  return this.isActive && this.isVerified && this.encodings && this.encodings.length > 0;
});

// ==================== MIDDLEWARE ====================

// Validate trước khi lưu
faceEncodingSchema.pre('save', async function(next) {
  try {
    // Kiểm tra không có face encoding khác cho cùng user
    if (this.isNew) {
      const existing = await mongoose.model('FaceEncoding').findOne({
        userId: this.userId,
        isActive: true
      });

      if (existing) {
        return next(new Error('Active face encoding already exists for this user'));
      }
    }

    // Validate rằng có ít nhất 1 encoding
    if (!this.encodings || this.encodings.length === 0) {
      return next(new Error('At least one face encoding is required'));
    }

    // Set faceCount nếu chưa có
    if (!this.faceCount) {
      this.faceCount = this.encodings.length;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ==================== METHODS ====================

// Update usage statistics
faceEncodingSchema.methods.updateUsage = async function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

// Deactivate face encoding
faceEncodingSchema.methods.deactivate = async function(reason = null) {
  this.isActive = false;
  this.inactiveReason = reason;
  return this.save();
};

// Reactivate face encoding
faceEncodingSchema.methods.reactivate = async function() {
  this.isActive = true;
  this.inactiveReason = null;
  return this.save();
};

// Verify face encoding
faceEncodingSchema.methods.verify = async function(verifiedBy = null) {
  this.isVerified = true;
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  return this.save();
};

// Update encodings (cho trường hợp retrain)
faceEncodingSchema.methods.updateEncodings = async function(newEncodings, metadata = {}) {
  if (!newEncodings || newEncodings.length === 0) {
    throw new Error('New encodings are required');
  }

  this.encodings = newEncodings;
  this.faceCount = newEncodings.length;

  if (metadata.qualityScore !== undefined) {
    this.qualityScore = metadata.qualityScore;
  }

  if (metadata.processingMetadata) {
    this.processingMetadata = { ...this.processingMetadata, ...metadata.processingMetadata };
  }

  if (metadata.aiServiceVersion) {
    this.aiServiceVersion = metadata.aiServiceVersion;
  }

  if (metadata.modelVersion) {
    this.modelVersion = metadata.modelVersion;
  }

  return this.save();
};

// Add new image URL
faceEncodingSchema.methods.addImageUrl = async function(url, cloudinaryId = null) {
  if (!this.imageUrls.includes(url)) {
    this.imageUrls.push(url);
  }

  if (cloudinaryId && !this.cloudinaryIds.includes(cloudinaryId)) {
    this.cloudinaryIds.push(cloudinaryId);
  }

  return this.save();
};

// Remove image URL
faceEncodingSchema.methods.removeImageUrl = async function(url) {
  const index = this.imageUrls.indexOf(url);
  if (index > -1) {
    this.imageUrls.splice(index, 1);
  }

  return this.save();
};

// Lấy thông tin đầy đủ
faceEncodingSchema.methods.getFullDetails = async function() {
  return this.populate([
    { path: 'userId', select: 'fullName studentCode email avatarUrl hasFaceRegistered' },
    { path: 'verifiedBy', select: 'fullName role' }
  ]);
};

// ==================== STATIC METHODS ====================

// Tìm face encoding theo user
faceEncodingSchema.statics.findByUser = function(userId) {
  return this.findOne({ userId, isActive: true });
};

// Tìm face encodings active
faceEncodingSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Tìm face encodings verified
faceEncodingSchema.statics.findVerified = function() {
  return this.find({ isActive: true, isVerified: true });
};

// Tìm face encodings chưa verified
faceEncodingSchema.statics.findUnverified = function() {
  return this.find({ isActive: true, isVerified: false });
};

// Thống kê
faceEncodingSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        verified: {
          $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
        },
        avgQualityScore: { $avg: '$qualityScore' },
        totalUsage: { $sum: '$usageCount' }
      }
    }
  ]);

  return stats[0] || {
    total: 0,
    active: 0,
    verified: 0,
    avgQualityScore: 0,
    totalUsage: 0
  };
};

// Cleanup inactive encodings
faceEncodingSchema.statics.cleanupInactive = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    isActive: false,
    updatedAt: { $lt: cutoffDate }
  });

  return result.deletedCount;
};

// ==================== QUERY HELPERS ====================

faceEncodingSchema.query.active = function() {
  return this.where({ isActive: true });
};

faceEncodingSchema.query.inactive = function() {
  return this.where({ isActive: false });
};

faceEncodingSchema.query.verified = function() {
  return this.where({ isVerified: true });
};

faceEncodingSchema.query.unverified = function() {
  return this.where({ isVerified: false });
};

faceEncodingSchema.query.byDetector = function(detector) {
  return this.where('processingMetadata.detectorUsed').equals(detector);
};

faceEncodingSchema.query.recent = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.where('createdAt').gte(date);
};

faceEncodingSchema.query.highQuality = function(minScore = 0.8) {
  return this.where('qualityScore').gte(minScore);
};

const FaceEncoding = mongoose.model('FaceEncoding', faceEncodingSchema);

module.exports = FaceEncoding;