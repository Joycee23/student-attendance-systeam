const axios = require('axios');
const FormData = require('form-data');
const Settings = require('../models/Settings');
const User = require('../models/User');
const FaceEncoding = require('../models/FaceEncoding');
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

      // Process face registration through AI service
      const aiResult = await this.processFaceRegistration(imageBase64, {
        studentCode: student.studentCode,
        studentId: studentId
      });

      if (!aiResult.success) {
        throw new Error(aiResult.message || 'Face processing failed');
      }

      // Upload image to Cloudinary
      const uploadResult = await cloudinaryService.uploadFaceEncoding(imageBase64, student.studentCode);

      // Create FaceEncoding record
      const faceEncoding = await FaceEncoding.create({
        userId: studentId,
        encodings: aiResult.encodings,
        imageUrls: [uploadResult.secure_url],
        cloudinaryIds: [uploadResult.public_id],
        aiServiceVersion: aiResult.version || '1.0.0',
        modelVersion: aiResult.modelVersion || 'face-recognition-v1',
        qualityScore: aiResult.qualityScore,
        processingMetadata: {
          processingTime: aiResult.processingTime,
          imageDimensions: aiResult.dimensions,
          confidence: aiResult.confidence,
          detectorUsed: aiResult.detector || 'face_recognition'
        },
        faceCount: aiResult.encodings.length
      });

      // Update user
      student.hasFaceRegistered = true;
      student.faceEncodingId = faceEncoding._id;
      await student.save();

      return {
        success: true,
        message: 'Face registered successfully',
        studentId: student._id,
        studentCode: student.studentCode,
        faceEncodingId: faceEncoding._id,
        imageUrl: uploadResult.secure_url,
        encodingCount: aiResult.encodings.length,
        qualityScore: aiResult.qualityScore
      };

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

      // Find and delete FaceEncoding record
      const faceEncoding = await FaceEncoding.findOneAndDelete({
        userId: (await User.findOne({ studentCode, role: 'student' }))?._id
      });

      if (faceEncoding) {
        // Delete images from cloudinary
        if (faceEncoding.cloudinaryIds && faceEncoding.cloudinaryIds.length > 0) {
          await cloudinaryService.deleteMultiple(faceEncoding.cloudinaryIds);
        }
      }

      // Also try to delete from AI service if enabled
      if (this.enabled) {
        try {
          const response = await axios.delete(
            `${this.serviceUrl}/api/face/delete/${studentCode}`,
            { timeout: this.timeout }
          );
          return {
            success: response.data.success,
            message: response.data.message || 'Face deleted successfully'
          };
        } catch (aiError) {
          console.warn('AI service delete failed, but local records deleted:', aiError.message);
        }
      }

      return {
        success: true,
        message: 'Face encoding deleted from database successfully'
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
      // Get count from local database
      const localCount = await FaceEncoding.countDocuments({
        isActive: true,
        isVerified: true
      });

      // Fallback to AI service if enabled
      await this.init();
      if (this.enabled) {
        try {
          const response = await axios.get(
            `${this.serviceUrl}/api/face/count`,
            { timeout: 5000 }
          );
          return Math.max(localCount, response.data.count || 0);
        } catch (aiError) {
          console.warn('AI service count failed, using local count:', aiError.message);
        }
      }

      return localCount;

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
      // First check local database
      const student = await User.findOne({ studentCode, role: 'student' });
      if (!student) return false;

      const faceEncoding = await FaceEncoding.findByUser(student._id);
      if (faceEncoding && faceEncoding.isActive && faceEncoding.isVerified) {
        return true;
      }

      // Fallback to AI service if enabled
      await this.init();
      if (this.enabled) {
        try {
          const response = await axios.get(
            `${this.serviceUrl}/api/face/verify/${studentCode}`,
            { timeout: 5000 }
          );
          return response.data.exists === true;
        } catch (aiError) {
          console.warn('AI service verify failed:', aiError.message);
        }
      }

      return false;

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
   * Process face registration and return encoding data
   * @param {string} imageBase64 - Base64 encoded image
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Processing result with encodings
   */
  async processFaceRegistration(imageBase64, metadata = {}) {
    try {
      await this.init();

      if (!this.enabled) {
        throw new Error('Face recognition is disabled');
      }

      if (!imageBase64) {
        throw new Error('Image is required');
      }

      const startTime = Date.now();

      // Upload image temporarily for processing
      const uploadResult = await cloudinaryService.uploadImage(imageBase64, {
        folder: 'temp-face-processing',
        public_id: `process_${Date.now()}`
      });

      // Send to AI service for face detection and encoding
      const formData = new FormData();
      formData.append('image_url', uploadResult.secure_url);
      formData.append('return_encodings', 'true');

      if (metadata.studentCode) {
        formData.append('student_id', metadata.studentCode);
      }

      const response = await axios.post(
        `${this.serviceUrl}/api/face/process`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout
        }
      );

      const processingTime = Date.now() - startTime;

      if (response.data.success && response.data.encodings) {
        // Clean up temp image
        await cloudinaryService.deleteImage(uploadResult.public_id);

        return {
          success: true,
          encodings: response.data.encodings,
          version: response.data.version || '1.0.0',
          modelVersion: response.data.model_version || 'face-recognition-v1',
          qualityScore: response.data.quality_score || response.data.confidence || 1,
          processingTime,
          dimensions: response.data.dimensions || null,
          confidence: response.data.confidence || response.data.quality_score || 1,
          detector: response.data.detector_used || 'face_recognition',
          message: 'Face processing completed successfully'
        };
      } else {
        // Clean up temp image
        await cloudinaryService.deleteImage(uploadResult.public_id);
        throw new Error(response.data.message || 'Face processing failed');
      }

    } catch (error) {
      console.error('Process face registration error:', error);
      return {
        success: false,
        message: `Face processing failed: ${error.message}`
      };
    }
  }

  /**
   * Get face encodings for recognition (compare against database)
   * @param {string} imageBase64 - Image to recognize
   * @returns {Object} Recognition result using local FaceEncoding data
   */
  async recognizeFaceLocal(imageBase64) {
    try {
      await this.init();

      if (!imageBase64) {
        throw new Error('Image is required');
      }

      const startTime = Date.now();

      // Process the input image to get encodings
      const processResult = await this.processFaceRegistration(imageBase64);

      if (!processResult.success || !processResult.encodings || processResult.encodings.length === 0) {
        return {
          success: false,
          recognized: false,
          message: processResult.message || 'No face detected in image'
        };
      }

      // Get all active face encodings from database
      const faceEncodings = await FaceEncoding.findActive();

      if (faceEncodings.length === 0) {
        return {
          success: false,
          recognized: false,
          message: 'No face encodings registered in database'
        };
      }

      // Compare encodings (simplified distance calculation)
      let bestMatch = null;
      let bestDistance = Infinity;
      let bestConfidence = 0;

      for (const faceEncoding of faceEncodings) {
        for (const knownEncoding of faceEncoding.encodings) {
          for (const inputEncoding of processResult.encodings) {
            // Calculate Euclidean distance
            let distance = 0;
            const length = Math.min(knownEncoding.length, inputEncoding.length);

            for (let i = 0; i < length; i++) {
              const diff = knownEncoding[i] - inputEncoding[i];
              distance += diff * diff;
            }
            distance = Math.sqrt(distance);

            // Convert distance to confidence (lower distance = higher confidence)
            const confidence = Math.max(0, Math.min(1, 1 - (distance / 2))); // Assuming max distance ~2

            if (confidence > bestConfidence && confidence >= this.minConfidence) {
              bestMatch = faceEncoding;
              bestDistance = distance;
              bestConfidence = confidence;
            }
          }
        }
      }

      const processingTime = Date.now() - startTime;

      if (bestMatch && bestConfidence >= this.minConfidence) {
        // Update usage statistics
        await bestMatch.updateUsage();

        return {
          success: true,
          recognized: true,
          studentId: bestMatch.userId.toString(),
          studentCode: (await User.findById(bestMatch.userId)).studentCode,
          studentName: (await User.findById(bestMatch.userId)).fullName,
          confidence: bestConfidence,
          distance: bestDistance,
          faceEncodingId: bestMatch._id,
          processingTime,
          message: 'Face recognized successfully'
        };
      } else {
        return {
          success: false,
          recognized: false,
          message: 'Face not recognized',
          confidence: bestConfidence || 0
        };
      }

    } catch (error) {
      console.error('Local face recognition error:', error);
      return {
        success: false,
        recognized: false,
        message: `Face recognition failed: ${error.message}`
      };
    }
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