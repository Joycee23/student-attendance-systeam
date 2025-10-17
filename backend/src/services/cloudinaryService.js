const cloudinary = require('cloudinary').v2;
const Settings = require('../models/Settings');

/**
 * Cloudinary Service
 * Handles image uploads to Cloudinary
 */

class CloudinaryService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize Cloudinary with settings
   */
  async init() {
    try {
      if (this.initialized) return;

      const settings = await Settings.getSettings();

      if (!settings.cloudinaryEnabled) {
        console.warn('Cloudinary is disabled in settings');
        return;
      }

      cloudinary.config({
        cloud_name: settings.cloudinaryCloudName || process.env.CLOUDINARY_CLOUD_NAME,
        api_key: settings.cloudinaryApiKey || process.env.CLOUDINARY_API_KEY,
        api_secret: settings.cloudinaryApiSecret || process.env.CLOUDINARY_API_SECRET
      });

      this.initialized = true;
      this.enabled = settings.cloudinaryEnabled;

    } catch (error) {
      console.error('Cloudinary init error:', error);
      this.initialized = false;
      this.enabled = false;
    }
  }

  /**
   * Upload image to Cloudinary
   * @param {string} imageBase64 - Base64 encoded image or file path
   * @param {Object} options - Upload options
   * @returns {Object} Upload result
   */
  async uploadImage(imageBase64, options = {}) {
    try {
      await this.init();

      if (!this.enabled) {
        throw new Error('Cloudinary is disabled');
      }

      // Default options
      const uploadOptions = {
        folder: options.folder || 'attendance',
        resource_type: options.resource_type || 'auto',
        public_id: options.public_id || undefined,
        overwrite: options.overwrite !== undefined ? options.overwrite : true,
        transformation: options.transformation || undefined,
        format: options.format || undefined,
        quality: options.quality || 'auto',
        tags: options.tags || []
      };

      // Upload
      const result = await cloudinary.uploader.upload(imageBase64, uploadOptions);

      return {
        success: true,
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        created_at: result.created_at
      };

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple images
   * @param {Array} images - Array of base64 images
   * @param {Object} options - Upload options
   */
  async uploadMultiple(images, options = {}) {
    const results = [];
    const errors = [];

    for (let i = 0; i < images.length; i++) {
      try {
        const result = await this.uploadImage(images[i], {
          ...options,
          public_id: options.public_id ? `${options.public_id}_${i}` : undefined
        });
        results.push(result);
      } catch (error) {
        errors.push({
          index: i,
          error: error.message
        });
      }
    }

    return {
      success: results,
      failed: errors,
      summary: {
        total: images.length,
        succeeded: results.length,
        failed: errors.length
      }
    };
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Public ID of image
   */
  async deleteImage(publicId) {
    try {
      await this.init();

      if (!this.enabled) {
        return { success: false, message: 'Cloudinary is disabled' };
      }

      const result = await cloudinary.uploader.destroy(publicId);

      return {
        success: result.result === 'ok',
        message: result.result === 'ok' ? 'Image deleted successfully' : 'Image not found',
        result: result.result
      };

    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return {
        success: false,
        message: `Delete failed: ${error.message}`
      };
    }
  }

  /**
   * Delete multiple images
   * @param {Array} publicIds - Array of public IDs
   */
  async deleteMultiple(publicIds) {
    try {
      await this.init();

      if (!this.enabled) {
        return { success: false, message: 'Cloudinary is disabled' };
      }

      const result = await cloudinary.api.delete_resources(publicIds);

      return {
        success: true,
        deleted: result.deleted,
        partial: result.partial,
        rate_limit_allowed: result.rate_limit_allowed,
        rate_limit_remaining: result.rate_limit_remaining
      };

    } catch (error) {
      console.error('Cloudinary delete multiple error:', error);
      return {
        success: false,
        message: `Delete failed: ${error.message}`
      };
    }
  }

  /**
   * Get image info
   * @param {string} publicId - Public ID
   */
  async getImageInfo(publicId) {
    try {
      await this.init();

      if (!this.enabled) {
        throw new Error('Cloudinary is disabled');
      }

      const result = await cloudinary.api.resource(publicId);

      return {
        success: true,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        url: result.url,
        secure_url: result.secure_url,
        created_at: result.created_at
      };

    } catch (error) {
      console.error('Get image info error:', error);
      throw new Error(`Get info failed: ${error.message}`);
    }
  }

  /**
   * Generate transformation URL
   * @param {string} publicId - Public ID
   * @param {Object} transformations - Transformation options
   */
  generateTransformationURL(publicId, transformations = {}) {
    try {
      return cloudinary.url(publicId, transformations);
    } catch (error) {
      console.error('Generate transformation URL error:', error);
      return null;
    }
  }

  /**
   * Generate thumbnail URL
   * @param {string} publicId - Public ID
   * @param {number} width - Width
   * @param {number} height - Height
   */
  generateThumbnailURL(publicId, width = 200, height = 200) {
    return this.generateTransformationURL(publicId, {
      width,
      height,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      fetch_format: 'auto'
    });
  }

  /**
   * Upload avatar image
   * @param {string} imageBase64 - Base64 image
   * @param {string} userId - User ID
   */
  async uploadAvatar(imageBase64, userId) {
    try {
      const result = await this.uploadImage(imageBase64, {
        folder: 'avatars',
        public_id: `avatar_${userId}`,
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ],
        overwrite: true
      });

      return result;

    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  }

  /**
   * Upload face encoding image
   * @param {string} imageBase64 - Base64 image
   * @param {string} studentCode - Student code
   */
  async uploadFaceEncoding(imageBase64, studentCode) {
    try {
      const result = await this.uploadImage(imageBase64, {
        folder: 'face-encodings',
        public_id: `face_${studentCode}_${Date.now()}`,
        transformation: [
          { width: 800, height: 800, crop: 'fill' },
          { quality: '90' }
        ],
        tags: ['face-encoding', studentCode]
      });

      return result;

    } catch (error) {
      console.error('Upload face encoding error:', error);
      throw error;
    }
  }

  /**
   * Upload attendance check image
   * @param {string} imageBase64 - Base64 image
   * @param {string} sessionId - Session ID
   * @param {string} studentId - Student ID
   */
  async uploadAttendanceCheck(imageBase64, sessionId, studentId) {
    try {
      const result = await this.uploadImage(imageBase64, {
        folder: 'attendance-checks',
        public_id: `check_${sessionId}_${studentId}_${Date.now()}`,
        tags: ['attendance', sessionId, studentId]
      });

      return result;

    } catch (error) {
      console.error('Upload attendance check error:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats() {
    try {
      await this.init();

      if (!this.enabled) {
        return null;
      }

      const usage = await cloudinary.api.usage();

      return {
        plan: usage.plan,
        credits: usage.credits,
        used_credits: usage.used_credits,
        resources: usage.resources,
        transformations: usage.transformations,
        bandwidth: usage.bandwidth,
        storage: usage.storage,
        last_updated: usage.last_updated
      };

    } catch (error) {
      console.error('Get usage stats error:', error);
      return null;
    }
  }

  /**
   * List images in folder
   * @param {string} folder - Folder path
   * @param {Object} options - List options
   */
  async listImages(folder, options = {}) {
    try {
      await this.init();

      if (!this.enabled) {
        throw new Error('Cloudinary is disabled');
      }

      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: options.max_results || 100,
        next_cursor: options.next_cursor || undefined
      });

      return {
        success: true,
        resources: result.resources,
        next_cursor: result.next_cursor,
        total_count: result.total_count
      };

    } catch (error) {
      console.error('List images error:', error);
      throw error;
    }
  }

  /**
   * Search images by tags
   * @param {Array} tags - Tags to search
   */
  async searchByTags(tags) {
    try {
      await this.init();

      if (!this.enabled) {
        throw new Error('Cloudinary is disabled');
      }

      const result = await cloudinary.api.resources_by_tag(tags[0], {
        max_results: 100
      });

      return {
        success: true,
        resources: result.resources,
        total_count: result.total_count
      };

    } catch (error) {
      console.error('Search by tags error:', error);
      throw error;
    }
  }

  /**
   * Clean up old images
   * @param {string} folder - Folder to clean
   * @param {number} daysOld - Delete files older than this
   */
  async cleanupOldImages(folder, daysOld = 30) {
    try {
      await this.init();

      if (!this.enabled) {
        return { deleted: 0 };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const images = await this.listImages(folder);
      const toDelete = [];

      for (const image of images.resources) {
        const createdAt = new Date(image.created_at);
        if (createdAt < cutoffDate) {
          toDelete.push(image.public_id);
        }
      }

      if (toDelete.length > 0) {
        await this.deleteMultiple(toDelete);
      }

      return {
        deleted: toDelete.length,
        publicIds: toDelete
      };

    } catch (error) {
      console.error('Cleanup old images error:', error);
      return { deleted: 0, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new CloudinaryService();