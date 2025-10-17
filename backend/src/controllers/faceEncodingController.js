const FaceEncoding = require('../models/FaceEncoding');
const User = require('../models/User');
const cloudinaryService = require('../services/cloudinaryService');
const aiService = require('../services/aiService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Register/Update face encoding for student
// @route   POST /api/face-encodings
// @access  Private (Student or Admin)
exports.registerFaceEncoding = async (req, res) => {
  try {
    const { studentId, imageBase64 } = req.body;

    // Check permissions
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return errorResponse(res, 'Not authorized to register face for this student', 403);
    }

    // Validate student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student' || !student.isActive) {
      return errorResponse(res, 'Student not found or inactive', 404);
    }

    // Check if face encoding already exists
    const existingEncoding = await FaceEncoding.findByUser(studentId);
    if (existingEncoding) {
      return errorResponse(res, 'Face encoding already exists for this student', 400);
    }

    // Process image through AI service
    const aiResult = await aiService.processFaceRegistration(imageBase64, {
      studentCode: student.studentCode,
      studentId: studentId
    });

    if (!aiResult.success) {
      return errorResponse(res, aiResult.message || 'Face processing failed', 400);
    }

    // Upload image to cloudinary
    const cloudinaryResult = await cloudinaryService.uploadFaceEncoding(imageBase64, student.studentCode);

    if (!cloudinaryResult.success) {
      return errorResponse(res, 'Image upload failed', 500);
    }

    // Create face encoding record
    const faceEncoding = await FaceEncoding.create({
      userId: studentId,
      encodings: aiResult.encodings,
      imageUrls: [cloudinaryResult.secure_url],
      cloudinaryIds: [cloudinaryResult.public_id],
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

    // Update user status
    student.hasFaceRegistered = true;
    student.faceEncodingId = faceEncoding._id;
    await student.save();

    return successResponse(res, {
      faceEncoding: await faceEncoding.getFullDetails(),
      message: 'Face encoding registered successfully'
    }, 'Face encoding registered successfully', 201);

  } catch (error) {
    console.error('Register face encoding error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update face encoding
// @route   PUT /api/face-encodings/:id
// @access  Private (Student or Admin)
exports.updateFaceEncoding = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageBase64 } = req.body;

    const faceEncoding = await FaceEncoding.findById(id);
    if (!faceEncoding) {
      return errorResponse(res, 'Face encoding not found', 404);
    }

    // Check permissions
    if (req.user.role === 'student' && req.user.id !== faceEncoding.userId.toString()) {
      return errorResponse(res, 'Not authorized to update this face encoding', 403);
    }

    // Process new image
    const student = await User.findById(faceEncoding.userId);
    const aiResult = await aiService.processFaceRegistration(imageBase64, {
      studentCode: student.studentCode,
      studentId: faceEncoding.userId
    });

    if (!aiResult.success) {
      return errorResponse(res, aiResult.message || 'Face processing failed', 400);
    }

    // Upload new image
    const cloudinaryResult = await cloudinaryService.uploadFaceEncoding(imageBase64, student.studentCode);

    if (!cloudinaryResult.success) {
      return errorResponse(res, 'Image upload failed', 500);
    }

    // Update face encoding
    await faceEncoding.updateEncodings(aiResult.encodings, {
      qualityScore: aiResult.qualityScore,
      processingMetadata: {
        processingTime: aiResult.processingTime,
        imageDimensions: aiResult.dimensions,
        confidence: aiResult.confidence,
        detectorUsed: aiResult.detector || 'face_recognition'
      },
      aiServiceVersion: aiResult.version || '1.0.0',
      modelVersion: aiResult.modelVersion || 'face-recognition-v1'
    });

    // Add new image URL
    await faceEncoding.addImageUrl(cloudinaryResult.secure_url, cloudinaryResult.public_id);

    return successResponse(res, {
      faceEncoding: await faceEncoding.getFullDetails()
    }, 'Face encoding updated successfully');

  } catch (error) {
    console.error('Update face encoding error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get face encoding by ID
// @route   GET /api/face-encodings/:id
// @access  Private (Student or Admin)
exports.getFaceEncodingById = async (req, res) => {
  try {
    const faceEncoding = await FaceEncoding.findById(req.params.id);

    if (!faceEncoding) {
      return errorResponse(res, 'Face encoding not found', 404);
    }

    // Check permissions
    if (req.user.role === 'student' && req.user.id !== faceEncoding.userId.toString()) {
      return errorResponse(res, 'Not authorized to view this face encoding', 403);
    }

    const fullDetails = await faceEncoding.getFullDetails();

    return successResponse(res, { faceEncoding: fullDetails }, 'Face encoding retrieved successfully');

  } catch (error) {
    console.error('Get face encoding error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get face encoding by user ID
// @route   GET /api/face-encodings/user/:userId
// @access  Private (Student or Admin)
exports.getFaceEncodingByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permissions
    if (req.user.role === 'student' && req.user.id !== userId) {
      return errorResponse(res, 'Not authorized to view this face encoding', 403);
    }

    const faceEncoding = await FaceEncoding.findByUser(userId);

    if (!faceEncoding) {
      return errorResponse(res, 'Face encoding not found', 404);
    }

    const fullDetails = await faceEncoding.getFullDetails();

    return successResponse(res, { faceEncoding: fullDetails }, 'Face encoding retrieved successfully');

  } catch (error) {
    console.error('Get face encoding by user error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get all face encodings
// @route   GET /api/face-encodings
// @access  Private (Admin)
exports.getAllFaceEncodings = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, isVerified, search } = req.query;

    // Build query
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    // Search by student code, name, or email
    if (search) {
      const users = await User.find({
        role: 'student',
        $or: [
          { fullName: new RegExp(search, 'i') },
          { studentCode: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ]
      }).select('_id');

      const userIds = users.map(user => user._id);
      query.userId = { $in: userIds };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const faceEncodings = await FaceEncoding.find(query)
      .populate('userId', 'fullName studentCode email avatarUrl')
      .populate('verifiedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FaceEncoding.countDocuments(query);

    return successResponse(res, {
      faceEncodings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Face encodings retrieved successfully');

  } catch (error) {
    console.error('Get all face encodings error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Delete face encoding
// @route   DELETE /api/face-encodings/:id
// @access  Private (Admin)
exports.deleteFaceEncoding = async (req, res) => {
  try {
    const faceEncoding = await FaceEncoding.findById(req.params.id);

    if (!faceEncoding) {
      return errorResponse(res, 'Face encoding not found', 404);
    }

    // Delete images from cloudinary
    if (faceEncoding.cloudinaryIds && faceEncoding.cloudinaryIds.length > 0) {
      await cloudinaryService.deleteMultiple(faceEncoding.cloudinaryIds);
    }

    // Update user status
    const student = await User.findById(faceEncoding.userId);
    if (student) {
      student.hasFaceRegistered = false;
      student.faceEncodingId = null;
      await student.save();
    }

    await faceEncoding.remove();

    return successResponse(res, null, 'Face encoding deleted successfully');

  } catch (error) {
    console.error('Delete face encoding error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Verify face encoding
// @route   PATCH /api/face-encodings/:id/verify
// @access  Private (Admin)
exports.verifyFaceEncoding = async (req, res) => {
  try {
    const faceEncoding = await FaceEncoding.findById(req.params.id);

    if (!faceEncoding) {
      return errorResponse(res, 'Face encoding not found', 404);
    }

    await faceEncoding.verify(req.user.id);

    const fullDetails = await faceEncoding.getFullDetails();

    return successResponse(res, { faceEncoding: fullDetails }, 'Face encoding verified successfully');

  } catch (error) {
    console.error('Verify face encoding error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Deactivate face encoding
// @route   PATCH /api/face-encodings/:id/deactivate
// @access  Private (Admin)
exports.deactivateFaceEncoding = async (req, res) => {
  try {
    const { reason } = req.body;

    const faceEncoding = await FaceEncoding.findById(req.params.id);

    if (!faceEncoding) {
      return errorResponse(res, 'Face encoding not found', 404);
    }

    await faceEncoding.deactivate(reason);

    // Update user status
    const student = await User.findById(faceEncoding.userId);
    if (student) {
      student.hasFaceRegistered = false;
      await student.save();
    }

    return successResponse(res, {
      faceEncoding: await faceEncoding.getFullDetails()
    }, 'Face encoding deactivated successfully');

  } catch (error) {
    console.error('Deactivate face encoding error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Reactivate face encoding
// @route   PATCH /api/face-encodings/:id/reactivate
// @access  Private (Admin)
exports.reactivateFaceEncoding = async (req, res) => {
  try {
    const faceEncoding = await FaceEncoding.findById(req.params.id);

    if (!faceEncoding) {
      return errorResponse(res, 'Face encoding not found', 404);
    }

    await faceEncoding.reactivate();

    // Update user status
    const student = await User.findById(faceEncoding.userId);
    if (student) {
      student.hasFaceRegistered = true;
      student.faceEncodingId = faceEncoding._id;
      await student.save();
    }

    return successResponse(res, {
      faceEncoding: await faceEncoding.getFullDetails()
    }, 'Face encoding reactivated successfully');

  } catch (error) {
    console.error('Reactivate face encoding error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get face encoding statistics
// @route   GET /api/face-encodings/statistics
// @access  Private (Admin)
exports.getFaceEncodingStatistics = async (req, res) => {
  try {
    const stats = await FaceEncoding.getStatistics();

    return successResponse(res, stats, 'Face encoding statistics retrieved successfully');

  } catch (error) {
    console.error('Get face encoding statistics error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Add image to face encoding
// @route   POST /api/face-encodings/:id/images
// @access  Private (Student or Admin)
exports.addImageToFaceEncoding = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageBase64 } = req.body;

    const faceEncoding = await FaceEncoding.findById(id);
    if (!faceEncoding) {
      return errorResponse(res, 'Face encoding not found', 404);
    }

    // Check permissions
    if (req.user.role === 'student' && req.user.id !== faceEncoding.userId.toString()) {
      return errorResponse(res, 'Not authorized to update this face encoding', 403);
    }

    // Validate student
    const student = await User.findById(faceEncoding.userId);

    // Upload image
    const cloudinaryResult = await cloudinaryService.uploadFaceEncoding(imageBase64, student.studentCode);

    if (!cloudinaryResult.success) {
      return errorResponse(res, 'Image upload failed', 500);
    }

    // Add image URL
    await faceEncoding.addImageUrl(cloudinaryResult.secure_url, cloudinaryResult.public_id);

    return successResponse(res, {
      faceEncoding: await faceEncoding.getFullDetails()
    }, 'Image added to face encoding successfully');

  } catch (error) {
    console.error('Add image to face encoding error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Remove image from face encoding
// @route   DELETE /api/face-encodings/:id/images/:imageUrl
// @access  Private (Student or Admin)
exports.removeImageFromFaceEncoding = async (req, res) => {
  try {
    const { id, imageUrl } = req.params;

    const faceEncoding = await FaceEncoding.findById(id);
    if (!faceEncoding) {
      return errorResponse(res, 'Face encoding not found', 404);
    }

    // Check permissions
    if (req.user.role === 'student' && req.user.id !== faceEncoding.userId.toString()) {
      return errorResponse(res, 'Not authorized to update this face encoding', 403);
    }

    // Find and remove image URL
    const index = faceEncoding.imageUrls.indexOf(decodeURIComponent(imageUrl));
    if (index === -1) {
      return errorResponse(res, 'Image not found in face encoding', 404);
    }

    const cloudinaryId = faceEncoding.cloudinaryIds[index];

    // Delete from cloudinary if exists
    if (cloudinaryId) {
      await cloudinaryService.deleteImage(cloudinaryId);
    }

    // Remove from arrays
    faceEncoding.imageUrls.splice(index, 1);
    faceEncoding.cloudinaryIds.splice(index, 1);

    await faceEncoding.save();

    return successResponse(res, {
      faceEncoding: await faceEncoding.getFullDetails()
    }, 'Image removed from face encoding successfully');

  } catch (error) {
    console.error('Remove image from face encoding error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;