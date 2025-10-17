const axios = require('axios');
const FormData = require('form-data');
const Settings = require('../models/Settings');
const User = require('../models/User');
const cloudinaryService = require('./cloudinaryService');

/**
 * AI Service for Face Recognition
 * Integrates with AI service for facial recognition attendance
 */

class AIService {
  constructor() {
    this.serviceUrl = null;
    this.timeout = 10000;
    this.minConfidence = 0.85;
    this.maxRetries = 2;
  }

  /**
   * Initialize service with settings
   */
  async init() {
    try {
      const settings = await Settings.getSettings();
      this.serviceUrl = settings.aiServiceUrl;
      this.timeout = settings.aiServiceTimeout;
      this.minConfidence = settings.minConfidence;
      this.maxRetries = settings.maxFaceRecognitionRetries;
      this.enabled = settings.aiServiceEnabled && settings.faceRecognitionEnabled;
    } catch (error) {
      console.error('AI Service init error:', error);
      this.enabled = false;
    }
  }

  /**
   * Check AI service health
   */
  async checkHealth() {
    try {
      if (!this.enabled) {
        return { healthy: false, message: 'AI service is disabled' };
      }

      const response = await axios.get(`${this.serviceUrl}/health`, {
        timeout: 5000
      });

      return {
        healthy: response.status === 200,
        message: 'AI service is healthy',
        data: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        message: `AI service unreachable: ${error.message}`
      };
    }
  }

  /**
   * Register face encoding for a student
   * @param {string} studentId - Student ID
   * @param {string} imageBase64 - Base64 encoded image
   * @returns {Object} Registration result
   */
  async registerFace(studentId, imageBase64) {
    try {
      await this.init();

      if (!this.enabled) {
        throw new Error('Face recognition is disabled');
      }

      if (!imageBase64) {
        throw new Error('Image is required');
      }

      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        throw new Error('Student not found');
      }

      // Upload image to Cloudinary first
      const uploadResult = await cloudinaryService.uploadImage(imageBase64, {
        folder: 'face-encodings',
        public_id: `student_${student.studentCode}_${Date.now()}`
      });

      // Send to AI service for encoding
      const formData = new FormData();
      formData.append('student_id', student.studentCode);
      formData.append('student_name', student.fullName);
      formData.append('image_url', uploadResult.secure_url);

      const response = await axios.post(
        `${this.serviceUrl}/api/face/register`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout
        }
      );

      if (response.data.success) {
        // Update user
        student.hasFaceRegistered = true;
        student.avatarUrl = uploadResult.secure_url;
        await student.save();

        return {
          success: true,
          message: 'Face registered successfully',
          studentId: student._id,
          studentCode: student.studentCode,
          imageUrl: uploadResult.secure_url,
          encodingId: response.data.encoding_id,
          confidence: response.data.confidence || 100
        };
      } else {
        throw new Error(response.data.message || 'Face registration failed');
      }

    } catch (error) {
      console.error('Register face error:', error);
      throw new Error(`Face registration failed: ${error.message}`);
    }
  }

  /**
   * Recognize face from image
   * @param {string} imageBase64 - Base64 encoded image
   * @returns {Object} Recognition result
   */
  async recognizeFace(imageBase64) {
    try {
      await this.init();

      if (!this.enabled) {
        throw new Error('Face recognition is disabled');
      }

      if (!imageBase64) {
        throw new Error('Image is required');
      }

      const startTime = Date.now();

      // Upload image temporarily
      const uploadResult = await cloudinaryService.uploadImage(imageBase64, {
        folder: 'attendance-checks',
        public_id: `check_${Date.now()}`
      });

      // Try recognition with retries
      let lastError;
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const formData = new FormData();
          formData.append('image_url', uploadResult.secure_url);
          formData.append('min_confidence', this.minConfidence);

          const response = await axios.post(
            `${this.serviceUrl}/api/face/recognize`,
            formData,
            {
              headers: formData.getHeaders(),
              timeout: this.timeout
            }
          );

          if (response.data.success && response.data.recognized) {
            const processingTime = Date.now() - startTime;

            // Find student by code
            const student = await User.findOne({
              studentCode: response.data.student_id,
              role: 'student'
            });

            if (!student) {
              return {
                success: false,
                message: 'Recognized student not found in database'
              };
            }

            return {
              success: true,
              recognized: true,
              studentId: student._id.toString(),
              studentCode: response.data.student_id,
              studentName: response.data.student_name || student.fullName,
              confidence: response.data.confidence,
              distance: response.data.distance,
              imageUrl: uploadResult.secure_url,
              processingTime,
              message: 'Face recognized successfully'
            };
          } else {
            return {
              success: false,
              recognized: false,
              message: response.data.message || 'Face not recognized',
              confidence: response.data.confidence || 0
            };
          }

        } catch (error) {
          lastError = error;
          if (attempt < this.maxRetries) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
      }

      throw lastError || new Error('Face recognition failed after retries');

    } catch (error) {
      console.error('Recognize face error:', error);
      return {
        success: false,
        recognized: false,
        message: `Face recognition failed: ${error.message}`
      };
    }
  }

  /**
   * Update face encoding
   * @param {string} studentId - Student ID
   * @param {string} imageBase64 - New image
   */
  async updateFace(studentId, imageBase64) {
    try {
      await this.init();

      if (!this.enabled) {
        throw new Error('Face recognition is disabled');
      }

      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        throw new Error('Student not found');
      }

      // Delete old encoding from AI service
      if (student.hasFaceRegistered) {
        await this.deleteFace(student.studentCode);
      }

      // Register new face
      return await this.registerFace(studentId, imageBase64);

    } catch (error) {
      console.error('Update face error:', error);
      throw new Error(`Face update failed: ${error.message}`);
    }
  }

  /**
   * Delete face encoding
   * @param {string} studentCode - Student code
   */
  async deleteFace(studentCode) {
    try {
      await this.init();

      if (!this.enabled) {
        return { success: true, message: 'AI service disabled' };
      }

      const response = await axios.delete(
        `${this.serviceUrl}/api/face/delete/${studentCode}`,
        { timeout: this.timeout }
      );

      return {
        success: response.data.success,
        message: response.data.message || 'Face deleted successfully'
      };

    } catch (error) {
      console.error('Delete face error:', error);
      return {
        success: false,
        message: `Face deletion failed: ${error.message}`
      };
    }
  }

  /**
   * Get all registered faces count
   */
  async getRegisteredCount() {
    try {
      await this.init();

      if (!this.enabled) {
        return 0;
      }

      const response = await axios.get(
        `${this.serviceUrl}/api/face/count`,
        { timeout: 5000 }
      );

      return response.data.count || 0;

    } catch (error) {
      console.error('Get registered count error:', error);
      return 0;
    }
  }

  /**
   * Verify if face encoding exists
   * @param {string} studentCode - Student code
   */
  async verifyEncoding(studentCode) {
    try {
      await this.init();

      if (!this.enabled) {
        return false;
      }

      const response = await axios.get(
        `${this.serviceUrl}/api/face/verify/${studentCode}`,
        { timeout: 5000 }
      );

      return response.data.exists === true;

    } catch (error) {
      console.error('Verify encoding error:', error);
      return false;
    }
  }

  /**
   * Batch register faces
   * @param {Array} students - Array of {studentId, imageBase64}
   */
  async batchRegister(students) {
    const results = [];
    const errors = [];

    for (const studentData of students) {
      try {
        const result = await this.registerFace(
          studentData.studentId,
          studentData.imageBase64
        );
        results.push(result);
      } catch (error) {
        errors.push({
          studentId: studentData.studentId,
          error: error.message
        });
      }
    }

    return {
      success: results,
      failed: errors,
      summary: {
        total: students.length,
        succeeded: results.length,
        failed: errors.length
      }
    };
  }

  /**
   * Detect face in image (without recognition)
   * @param {string} imageBase64 - Image to check
   */
  async detectFace(imageBase64) {
    try {
      await this.init();

      if (!this.enabled) {
        throw new Error('Face detection is disabled');
      }

      const uploadResult = await cloudinaryService.uploadImage(imageBase64, {
        folder: 'temp',
        public_id: `detect_${Date.now()}`
      });

      const formData = new FormData();
      formData.append('image_url', uploadResult.secure_url);

      const response = await axios.post(
        `${this.serviceUrl}/api/face/detect`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout
        }
      );

      return {
        success: response.data.success,
        detected: response.data.face_detected === true,
        faceCount: response.data.face_count || 0,
        message: response.data.message
      };

    } catch (error) {
      console.error('Detect face error:', error);
      return {
        success: false,
        detected: false,
        message: `Face detection failed: ${error.message}`
      };
    }
  }
}

// Export singleton instance
module.exports = new AIService();