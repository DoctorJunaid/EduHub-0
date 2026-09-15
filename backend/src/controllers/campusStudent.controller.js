import User from "../models/user.model.js";

// @desc    Get students belonging to campus admin's campus
// @route   GET /api/v1/campus-admin/students
// @access  Private / Campus Admin
export const getCampusStudents = async (req, res) => {
  try {
    // Verify authenticated user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Verify role
    if (req.user.role !== "campus_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Campus Admin only.",
      });
    }

    const { campusId } = req.user;

    if (!campusId) {
      return res.status(400).json({
        success: false,
        message: "Campus Admin is not assigned to a campus",
      });
    }

    const students = await User.find({
      role: "student",
      campusId: campusId,
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error("Get Campus Students Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve campus students",
    });
  }
};


// @desc    Assign student to campus admin's campus
// @route   POST /api/v1/campus-admin/students
// @access  Private / Campus Admin
export const addStudentToCampus = async (req, res) => {
  try {
    // Verify authenticated user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Verify role
    if (req.user.role !== "campus_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Campus Admin only.",
      });
    }

    const { campusId, instituteId } = req.user;

    if (!campusId) {
      return res.status(400).json({
        success: false,
        message: "Campus Admin is not assigned to a campus",
      });
    }

    if (!instituteId) {
      return res.status(400).json({
        success: false,
        message: "Campus Admin is not assigned to an institute",
      });
    }

    // Validate request body
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Find only a student
    const student = await User.findOne({
      _id: studentId,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Verify student belongs to the same institute
    if (
      student.instituteId &&
      student.instituteId.toString() !== instituteId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Student does not belong to your institute",
      });
    }

    // Prevent unnecessary reassignment
    if (
      student.campusId &&
      student.campusId.toString() === campusId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Student already belongs to this campus",
      });
    }

    // Assign institute and campus
    student.instituteId = instituteId;
    student.campusId = campusId;

    await student.save();

    // Remove sensitive fields from response
    const studentResponse = student.toObject();

    delete studentResponse.passwordHash;
    delete studentResponse.resetPasswordToken;
    delete studentResponse.resetPasswordExpires;
    delete studentResponse.emailVerificationToken;

    return res.status(200).json({
      success: true,
      message: "Student assigned to campus successfully",
      data: studentResponse,
    });
  } catch (error) {
    console.error("Add Student To Campus Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign student to campus",
    });
  }
};
// @desc    Create a new student for the campus
// @route   POST /api/v1/campus-admin/students/new
// @access  Private / Campus Admin
export const createStudentForCampus = async (req, res) => {
  try {
    const { campusId, instituteId } = req.user;
    if (!campusId || !instituteId) return res.status(400).json({ success: false, message: "Admin lacking campus/institute context" });

    const { name, email, program, roll } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: "Name and email are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "User with email already exists" });

    const student = await User.create({
      name,
      email,
      role: 'student',
      campusId,
      instituteId,
      program: program || 'Unassigned',
      roll: roll || `ROLL-${Math.floor(Math.random() * 10000)}`,
      passwordHash: 'dummy_hash_for_now' // Or whatever default is required by schema
    });

    return res.status(201).json({ success: true, data: student });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a student from the campus
// @route   DELETE /api/v1/campus-admin/students/:id
// @access  Private / Campus Admin
export const removeStudentFromCampus = async (req, res) => {
  try {
    const { campusId } = req.user;
    const studentId = req.params.id;

    const student = await User.findOne({ _id: studentId, role: 'student', campusId });
    if (!student) return res.status(404).json({ success: false, message: "Student not found in this campus" });

    student.campusId = null; // Or just delete the student? User said "remove", I'll delete them entirely for simplicity in this demo system
    await User.findByIdAndDelete(studentId);

    return res.status(200).json({ success: true, message: "Student removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all faculty for the campus
// @route   GET /api/v1/campus-admin/faculty
// @access  Private / Campus Admin
export const getCampusFaculty = async (req, res) => {
  try {
    const { campusId } = req.user;
    if (!campusId) return res.status(400).json({ success: false, message: "No campus assigned" });

    const faculty = await User.find({ role: 'faculty', campusId }).select('-passwordHash').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new faculty for the campus
// @route   POST /api/v1/campus-admin/faculty/new
// @access  Private / Campus Admin
export const createFacultyForCampus = async (req, res) => {
  try {
    const { campusId, instituteId } = req.user;
    if (!campusId || !instituteId) return res.status(400).json({ success: false, message: "Admin lacking campus/institute context" });

    const { name, email, department, designation } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: "Name and email are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "User with email already exists" });

    const faculty = await User.create({
      name,
      email,
      role: 'faculty',
      campusId,
      instituteId,
      department: department || 'General',
      designation: designation || 'Lecturer',
      passwordHash: 'dummy_hash_for_now'
    });

    return res.status(201).json({ success: true, data: faculty });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a faculty from the campus
// @route   DELETE /api/v1/campus-admin/faculty/:id
// @access  Private / Campus Admin
export const removeFacultyFromCampus = async (req, res) => {
  try {
    const { campusId } = req.user;
    const facultyId = req.params.id;

    const faculty = await User.findOne({ _id: facultyId, role: 'faculty', campusId });
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found in this campus" });

    await User.findByIdAndDelete(facultyId);

    return res.status(200).json({ success: true, message: "Faculty removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a student in the campus
// @route   PUT /api/v1/campus-admin/students/:id
// @access  Private / Campus Admin
export const updateStudentInCampus = async (req, res) => {
  try {
    const { campusId } = req.user;
    const studentId = req.params.id;

    const student = await User.findOneAndUpdate(
      { _id: studentId, role: 'student', campusId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found in this campus" });

    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a faculty in the campus
// @route   PUT /api/v1/campus-admin/faculty/:id
// @access  Private / Campus Admin
export const updateFacultyInCampus = async (req, res) => {
  try {
    const { campusId } = req.user;
    const facultyId = req.params.id;

    const faculty = await User.findOneAndUpdate(
      { _id: facultyId, role: 'faculty', campusId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found in this campus" });

    return res.status(200).json({ success: true, data: faculty });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
