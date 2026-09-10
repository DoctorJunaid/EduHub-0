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