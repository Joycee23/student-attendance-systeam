const QRCode = require('qrcode');
const crypto = require('crypto');
const Settings = require('../models/Settings');

/**
 * QR Code Service
 * Generates and validates QR codes for attendance
 */

class QRService {
  constructor() {
    this.defaultExpiry = 5; // minutes
    this.enabled = true;
  }

  /**
   * Initialize service with settings
   */
  async init() {
    try {
      const settings = await Settings.getSettings();
      this.defaultExpiry = settings.qrCodeExpiryMinutes;
      this.enabled = settings.qrCodeEnabled;
    } catch (error) {
      console.error('QR Service init error:', error);
    }
  }

  /**
   * Generate unique QR code string
   * @param {string} sessionId - Attendance session ID
   * @param {number} expiryMinutes - Expiry time in minutes
   * @returns {Object} QR code data
   */
  async generateQRCode(sessionId, expiryMinutes = null) {
    try {
      await this.init();

      if (!this.enabled) {
        throw new Error('QR code feature is disabled');
      }

      const expiry = expiryMinutes || this.defaultExpiry;
      const expiresAt = new Date(Date.now() + expiry * 60 * 1000);

      // Generate unique code
      const randomString = crypto.randomBytes(32).toString('hex');
      const timestamp = Date.now();
      
      // Create QR data object
      const qrData = {
        sessionId,
        code: randomString,
        timestamp,
        expiresAt: expiresAt.getTime()
      };

      // Convert to JSON string
      const qrString = JSON.stringify(qrData);

      return {
        code: randomString,
        data: qrString,
        sessionId,
        expiresAt,
        expiryMinutes: expiry
      };

    } catch (error) {
      console.error('Generate QR code error:', error);
      throw new Error(`QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generate QR code image (base64)
   * @param {string} qrCode - QR code string to encode
   * @param {Object} options - QR code options
   * @returns {string} Base64 encoded QR image
   */
  async generateQRCodeImage(qrCode, options = {}) {
    try {
      const qrOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel || 'H',
        type: options.type || 'image/png',
        quality: options.quality || 0.92,
        margin: options.margin || 1,
        width: options.width || 300,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        }
      };

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrCode, qrOptions);

      return qrCodeDataURL;

    } catch (error) {
      console.error('Generate QR image error:', error);
      throw new Error(`QR image generation failed: ${error.message}`);
    }
  }

  /**
   * Generate QR code buffer
   * @param {string} qrCode - QR code string
   * @returns {Buffer} QR code buffer
   */
  async generateQRCodeBuffer(qrCode) {
    try {
      const buffer = await QRCode.toBuffer(qrCode, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 300,
        margin: 1
      });

      return buffer;

    } catch (error) {
      console.error('Generate QR buffer error:', error);
      throw new Error(`QR buffer generation failed: ${error.message}`);
    }
  }

  /**
   * Validate QR code
   * @param {string} qrCodeString - QR code string to validate
   * @param {string} sessionId - Expected session ID
   * @returns {Object} Validation result
   */
  validateQRCode(qrCodeString, sessionId) {
    try {
      // Parse QR data
      let qrData;
      try {
        qrData = JSON.parse(qrCodeString);
      } catch {
        // If not JSON, treat as simple code
        return {
          valid: false,
          message: 'Invalid QR code format'
        };
      }

      // Check if expired
      const now = Date.now();
      if (qrData.expiresAt && now > qrData.expiresAt) {
        return {
          valid: false,
          message: 'QR code has expired'
        };
      }

      // Check session ID
      if (sessionId && qrData.sessionId !== sessionId) {
        return {
          valid: false,
          message: 'QR code does not match session'
        };
      }

      // Check if too old (more than 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (qrData.timestamp && (now - qrData.timestamp) > maxAge) {
        return {
          valid: false,
          message: 'QR code is too old'
        };
      }

      return {
        valid: true,
        message: 'QR code is valid',
        data: qrData
      };

    } catch (error) {
      console.error('Validate QR code error:', error);
      return {
        valid: false,
        message: `QR validation failed: ${error.message}`
      };
    }
  }

  /**
   * Generate dynamic QR code (refreshes automatically)
   * @param {string} sessionId - Session ID
   * @param {number} refreshIntervalMinutes - Refresh interval
   */
  async generateDynamicQRCode(sessionId, refreshIntervalMinutes = 3) {
    try {
      const qrData = await this.generateQRCode(sessionId, refreshIntervalMinutes);
      const qrImage = await this.generateQRCodeImage(qrData.code);

      return {
        ...qrData,
        image: qrImage,
        refreshInterval: refreshIntervalMinutes,
        isDynamic: true
      };

    } catch (error) {
      console.error('Generate dynamic QR error:', error);
      throw error;
    }
  }

  /**
   * Generate QR code with logo
   * @param {string} qrCode - QR code string
   * @param {string} logoUrl - Logo image URL
   */
  async generateQRCodeWithLogo(qrCode, logoUrl = null) {
    try {
      // For now, generate standard QR
      // Logo overlay would require canvas manipulation
      const qrImage = await this.generateQRCodeImage(qrCode);

      // TODO: Implement logo overlay using canvas
      // This would require additional packages like 'canvas' or 'sharp'

      return qrImage;

    } catch (error) {
      console.error('Generate QR with logo error:', error);
      throw error;
    }
  }

  /**
   * Generate multiple QR codes
   * @param {Array} sessions - Array of session IDs
   */
  async batchGenerateQRCodes(sessions) {
    const results = [];
    const errors = [];

    for (const sessionId of sessions) {
      try {
        const qrData = await this.generateQRCode(sessionId);
        const qrImage = await this.generateQRCodeImage(qrData.code);
        
        results.push({
          sessionId,
          ...qrData,
          image: qrImage
        });
      } catch (error) {
        errors.push({
          sessionId,
          error: error.message
        });
      }
    }

    return {
      success: results,
      failed: errors
    };
  }

  /**
   * Decode QR code from image (if needed)
   * Note: This requires additional package like 'qrcode-reader'
   */
  async decodeQRCode(imageBuffer) {
    // TODO: Implement QR decoding from image
    // Would require packages like 'jimp' and 'qrcode-reader'
    throw new Error('QR decoding not implemented yet');
  }

  /**
   * Generate QR code for URL
   * @param {string} url - URL to encode
   */
  async generateURLQRCode(url) {
    try {
      const qrImage = await this.generateQRCodeImage(url, {
        width: 400,
        errorCorrectionLevel: 'M'
      });

      return {
        url,
        image: qrImage
      };

    } catch (error) {
      console.error('Generate URL QR error:', error);
      throw error;
    }
  }

  /**
   * Get QR code statistics
   */
  async getStatistics() {
    try {
      await this.init();

      return {
        enabled: this.enabled,
        defaultExpiry: this.defaultExpiry,
        expiryUnit: 'minutes'
      };

    } catch (error) {
      console.error('Get QR statistics error:', error);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new QRService();