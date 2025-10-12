const Subject = require('../models/Subject');
const User = require('../models/User');
const Class = require('../models/Class');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
exports.getAllSubjects = async (req, res) => {
  try {
    const {
      isActive,
      department,
      isRequired,
      semester,
      academicYear,
      page = 1,
      limit = 20,
      search
    } = req.query;

    // Build query
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (department) query.department = department.toUpperCase();
    if (isRequired !== undefined) query.isRequired = isRequired === 'true';
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;

    // Search
    if (search) {
      query.$or = [
        { code: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const subjects = await Subject.find(query)
      .populate('lecturerIds', 'fullName lecturerCode email')
      .populate('prerequisiteIds', 'code name')
      .sort({ code: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Subject.countDocuments(query);

    return successResponse(res, {
      subjects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Subjects retrieved successfully');

  } catch (error) {
    console.error('Get all subjects error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Private
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('lecturerIds', 'fullName lecturerCode email phoneNumber')
      .populate('classIds', 'name currentStudents')
      .populate('prerequisiteIds', 'code name credits');

    if (!subject) {
      return errorResponse(res, 'Subject not found', 404);
    }

    return successResponse(res, { subject }, 'Subject retrieved successfully');

  } catch (error) {
    console.error('Get subject error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private (Admin)
exports.createSubject = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      credits,
      theoryHours,
      practiceHours,
      semester,
      department,
      isRequired,
      academicYear,
      attendanceRequirement
    } = req.body;

    // Check if code exists
    const existingSubject = await Subject.findByCode(code);
    if (existingSubject) {
      return errorResponse(res, 'Subject code already exists', 400);
    }

    // Create subject
    const subject = await Subject.create({
      code,
      name,
      description,
      credits,
      theoryHours,
      practiceHours,
      semester,
      department,
      isRequired,
      academicYear,
      attendanceRequirement
    });

    return successResponse(res, { subject }, 'Subject created successfully', 201);

  } catch (error) {
    console.error('Create subject error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin)
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return errorResponse(res, 'Subject not found', 404);
    }

    const {
      name,
      description,
      credits,
      theoryHours,
      practiceHours,
      semester,
      department,
      isRequired,
      academicYear,
      attendanceRequirement,
      isActive
    } = req.body;

    // Update fields
    if (name) subject.name = name;
    if (description !== undefined) subject.description = description;
    if (credits) subject.credits = credits;
    if (theoryHours !== undefined) subject.theoryHours = theoryHours;
    if (practiceHours !== undefined) subject.practiceHours = practiceHours;
    if (semester) subject.semester = semester;
    if (department) subject.department = department;
    if (isRequired !== undefined) subject.isRequired = isRequired;
    if (academicYear) subject.academicYear = academicYear;
    if (attendanceRequirement) subject.attendanceRequirement = attendanceRequirement;
    if (isActive !== undefined) subject.isActive = isActive;

    await subject.save();

    return successResponse(res, { subject }, 'Subject updated successfully');

  } catch (error) {
    console.error('Update subject error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin)
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return errorResponse(res, 'Subject not found', 404);
    }

    await subject.remove();

    return successResponse(res, null, 'Subject deleted successfully');

  } catch (error) {
    console.error('Delete subject error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Add lecturer to subject
// @route   POST /api/subjects/:id/lecturers
// @access  Private (Admin)
exports.addLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.body;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return errorResponse(res, 'Subject not found', 404);
    }

    await subject.addLecturer(lecturerId);

    return successResponse(res, { subject }, 'Lecturer added successfully');

  } catch (error) {
    console.error('Add lecturer error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Remove lecturer from subject
// @route   DELETE /api/subjects/:id/lecturers/:lecturerId
// @access  Private (Admin)
exports.removeLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.params;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return errorResponse(res, 'Subject not found', 404);
    }

    await subject.removeLecturer(lecturerId);

    return successResponse(res, { subject }, 'Lecturer removed successfully');

  } catch (error) {
    console.error('Remove lecturer error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Add class to subject
// @route   POST /api/subjects/:id/classes
// @access  Private (Admin)
exports.addClass = async (req, res) => {
  try {
    const { classId } = req.body;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return errorResponse(res, 'Subject not found', 404);
    }

    await subject.addClass(classId);

    return successResponse(res, { subject }, 'Class added successfully');

  } catch (error) {
    console.error('Add class error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Remove class from subject
// @route   DELETE /api/subjects/:id/classes/:classId
// @access  Private (Admin)
exports.removeClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return errorResponse(res, 'Subject not found', 404);
    }

    await subject.removeClass(classId);

    return successResponse(res, { subject }, 'Class removed successfully');

  } catch (error) {
    console.error('Remove class error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Add prerequisite
// @route   POST /api/subjects/:id/prerequisites
// @access  Private (Admin)
exports.addPrerequisite = async (req, res) => {
  try {
    const { prerequisiteId } = req.body;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return errorResponse(res, 'Subject not found', 404);
    }

    await subject.addPrerequisite(prerequisiteId);

    return successResponse(res, { subject }, 'Prerequisite added successfully');

  } catch (error) {
    console.error('Add prerequisite error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Remove prerequisite
// @route   DELETE /api/subjects/:id/prerequisites/:prerequisiteId
// @access  Private (Admin)
exports.removePrerequisite = async (req, res) => {
  try {
    const { prerequisiteId } = req.params;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return errorResponse(res, 'Subject not found', 404);
    }

    await subject.removePrerequisite(prerequisiteId);

    return successResponse(res, { subject }, 'Prerequisite removed successfully');

  } catch (error) {
    console.error('Remove prerequisite error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Add material
// @route   POST /api/subjects/:id/materials
// @access  Private (Lecturer/Admin)
exports.addMaterial = async (req, res) => {
  try {
    const { name, url, type } = req.body;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return errorResponse(res, 'Subject not found', 404);
    }

    await subject.addMaterial({ name, url, type });

    return successResponse(res, { subject }, 'Material added successfully');

  } catch (error) {
    console.error('Add material error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Remove material
// @route   DELETE /api/subjects/:id/materials/:materialId
// @access  Private (Lecturer/Admin)
exports.removeMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return errorResponse(res, 'Subject not found', 404);
    }

    await subject.removeMaterial(materialId);

    return successResponse(res, { subject }, 'Material removed successfully');

  } catch (error) {
    console.error('Remove material error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get subjects by lecturer
// @route   GET /api/subjects/lecturer/:lecturerId
// @access  Private
exports.getSubjectsByLecturer = async (req, res) => {
  try {
    const subjects = await Subject.getSubjectsByLecturer(req.params.lecturerId);

    return successResponse(res, {
      subjects,
      total: subjects.length
    }, 'Subjects retrieved successfully');

  } catch (error) {
    console.error('Get subjects by lecturer error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get subjects by class
// @route   GET /api/subjects/class/:classId
// @access  Private
exports.getSubjectsByClass = async (req, res) => {
  try {
    const subjects = await Subject.getSubjectsByClass(req.params.classId);

    return successResponse(res, {
      subjects,
      total: subjects.length
    }, 'Subjects retrieved successfully');

  } catch (error) {
    console.error('Get subjects by class error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Search subjects
// @route   GET /api/subjects/search
// @access  Private
exports.searchSubjects = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return errorResponse(res, 'Search keyword is required', 400);
    }

    const subjects = await Subject.searchSubjects(keyword);

    return successResponse(res, {
      subjects,
      total: subjects.length
    }, 'Search completed successfully');

  } catch (error) {
    console.error('Search subjects error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Get subject statistics
// @route   GET /api/subjects/statistics
// @access  Private (Admin)
exports.getSubjectStatistics = async (req, res) => {
  try {
    const stats = await Subject.getStatistics();

    return successResponse(res, stats, 'Statistics retrieved successfully');

  } catch (error) {
    console.error('Get subject statistics error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;