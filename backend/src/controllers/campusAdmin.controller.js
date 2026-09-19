import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Institute from "../models/institute.model.js";
import campusAdminService from "../services/campusAdmin.service.js";

// Helper to safely extract campus and institute context
const getContext = (req) => {
  const campusId = req.user?.campusId || req.query.campusId;
  const instituteId = req.user?.instituteId || req.query.instituteId;
  if (!campusId && req.user?.role !== "super_admin") {
    const error = new Error("Campus context required. No campus assigned to user.");
    error.statusCode = 400;
    throw error;
  }
  return { campusId, instituteId };
};

// Helper for HTTP response error handling
const handleError = (res, error, status = 400) => {
  res.status(status).json({ success: false, message: error.message });
};

// GET Aggregated Campus / School Dashboard Statistics
export const getDashboardStats = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const isSchool = req.query.isSchool === "true" || req.user?.instituteType === "School";
    const stats = await campusAdminService.getDashboardStats(campusId, isSchool);
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    handleError(res, error, error.statusCode || 500);
  }
};

// CREATE Campus Admin
export const createCampusAdmin = async (req, res) => {
  try {
    const { fullName, name, email, password, instituteId } = req.body;
    const adminName = name || fullName;

    if (!adminName) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    // Verify assigned institute exists
    const institute = await Institute.findById(instituteId);
    if (!institute) {
      return res
        .status(404)
        .json({ success: false, message: "Assigned institute does not exist" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || "admin123", salt);

    const campusAdmin = await User.create({
      name: adminName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "campus_admin",
      instituteId,
    });

    const result = campusAdmin.toObject();
    delete result.passwordHash;

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET All Campus Admins
export const getCampusAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ["campus_admin", "campus_manager"] } })
      .populate("instituteId", "name type email")
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET Single Campus Admin
export const getCampusAdminById = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: { $in: ["campus_admin", "campus_manager"] },
    })
      .populate("instituteId", "name type email")
      .select("-passwordHash");

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Campus Admin not found" });
    }
    return res.status(200).json({ success: true, data: admin });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Campus Admin
export const updateCampusAdmin = async (req, res) => {
  try {
    const { fullName, name, email, instituteId, status, password } = req.body;

    const updateFields = {};
    const adminName = name || fullName;
    if (adminName) updateFields.name = adminName.trim();
    if (email) updateFields.email = email.toLowerCase().trim();
    if (instituteId) updateFields.instituteId = instituteId;
    if (status) updateFields.status = status;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.passwordHash = await bcrypt.hash(password, salt);
    }

    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: ["campus_admin", "campus_manager"] } },
      updateFields,
      { new: true, runValidators: true },
    )
      .populate("instituteId", "name type")
      .select("-passwordHash");

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Campus Admin not found" });
    }

    return res.status(200).json({ success: true, data: admin });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Campus Admin
export const deleteCampusAdmin = async (req, res) => {
  try {
    const admin = await User.findOneAndDelete({
      _id: req.params.id,
      role: { $in: ["campus_admin", "campus_manager"] },
    });
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Campus Admin not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Campus Admin deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Teacher Controllers ---
export const createTeacher = async (req, res) => {
  try {
    const profile = await campusAdminService.createTeacherProfile(req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error);
  }
};

export const getTeachers = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const profiles = await campusAdminService.getAllTeacherProfiles(campusId, req.query);
    res
      .status(200)
      .json({ success: true, count: profiles.length, data: profiles });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getTeacherById = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const profile = await campusAdminService.getTeacherProfileById(
      req.params.id,
      campusId,
    );
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const profile = await campusAdminService.updateTeacherProfile(
      req.params.id,
      campusId,
      req.body,
    );
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    await campusAdminService.deleteTeacherProfile(req.params.id, campusId);
    res.status(200).json({
      success: true,
      message: "Teacher profile deleted successfully.",
    });
  } catch (error) {
    handleError(res, error, 404);
  }
};

// --- Student Controllers ---
export const createStudent = async (req, res) => {
  try {
    const profile = await campusAdminService.createStudentProfile(req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error);
  }
};

export const getStudents = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const profiles = await campusAdminService.getAllStudentProfiles(campusId, req.query);
    res
      .status(200)
      .json({ success: true, count: profiles.length, data: profiles });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const profile = await campusAdminService.getStudentProfileById(
      req.params.id,
      campusId,
    );
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const profile = await campusAdminService.updateStudentProfile(
      req.params.id,
      campusId,
      req.body,
    );
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    await campusAdminService.deleteStudentProfile(req.params.id, campusId);
    res.status(200).json({
      success: true,
      message: "Student profile deleted successfully.",
    });
  } catch (error) {
    handleError(res, error, 404);
  }
};

// --- Class Schedule Controllers ---
export const createClassSchedule = async (req, res) => {
  try {
    const { campusId, instituteId } = getContext(req);
    const record = await campusAdminService.createClassSchedule(
      campusId,
      instituteId,
      req.body,
    );
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const getClassSchedules = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const records = await campusAdminService.getAllClassSchedules(campusId, req.query);
    res
      .status(200)
      .json({ success: true, count: records.length, data: records });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getClassScheduleById = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.getClassScheduleById(req.params.id, campusId);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export const updateClassSchedule = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.updateClassSchedule(
      req.params.id,
      campusId,
      req.body,
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const deleteClassSchedule = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    await campusAdminService.deleteClassSchedule(req.params.id, campusId);
    res
      .status(200)
      .json({ success: true, message: "Class schedule deleted successfully." });
  } catch (error) {
    handleError(res, error, 404);
  }
};

// --- Exam Schedule Controllers ---
export const createExamSchedule = async (req, res) => {
  try {
    const { campusId, instituteId } = getContext(req);
    const record = await campusAdminService.createExamSchedule(
      campusId,
      instituteId,
      req.body,
    );
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const getExamSchedules = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const records = await campusAdminService.getAllExamSchedules(campusId, req.query);
    res
      .status(200)
      .json({ success: true, count: records.length, data: records });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getExamScheduleById = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.getExamScheduleById(req.params.id, campusId);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export const updateExamSchedule = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.updateExamSchedule(
      req.params.id,
      campusId,
      req.body,
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const deleteExamSchedule = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    await campusAdminService.deleteExamSchedule(req.params.id, campusId);
    res
      .status(200)
      .json({ success: true, message: "Exam schedule deleted successfully." });
  } catch (error) {
    handleError(res, error, 404);
  }
};

// --- Teacher Attendance Controllers ---
export const createTeacherAttendance = async (req, res) => {
  try {
    const record = await campusAdminService.createTeacherAttendance(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const getTeacherAttendance = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const records = await campusAdminService.getAllTeacherAttendance(campusId, req.query);
    res
      .status(200)
      .json({ success: true, count: records.length, data: records });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getTeacherAttendanceById = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.getTeacherAttendanceById(
      req.params.id,
      campusId,
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export const updateTeacherAttendance = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.updateTeacherAttendance(
      req.params.id,
      campusId,
      req.body,
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const deleteTeacherAttendance = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    await campusAdminService.deleteTeacherAttendance(req.params.id, campusId);
    res
      .status(200)
      .json({
        success: true,
        message: "Teacher attendance deleted successfully.",
      });
  } catch (error) {
    handleError(res, error, 404);
  }
};

// --- Student Attendance Controllers ---
export const createStudentAttendance = async (req, res) => {
  try {
    const { campusId, instituteId } = getContext(req);
    const record = await campusAdminService.createStudentAttendance(
      campusId,
      instituteId,
      req.body,
    );
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const createBulkStudentAttendance = async (req, res) => {
  try {
    const { campusId, instituteId } = getContext(req);
    const records = await campusAdminService.createBulkStudentAttendance(
      campusId,
      instituteId,
      req.body,
    );
    res.status(201).json({ success: true, count: records.length, data: records });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const records = await campusAdminService.getAllStudentAttendance(campusId, req.query);
    res
      .status(200)
      .json({ success: true, count: records.length, data: records });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getStudentAttendanceById = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.getStudentAttendanceById(
      req.params.id,
      campusId,
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export const updateStudentAttendance = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.updateStudentAttendance(
      req.params.id,
      campusId,
      req.body,
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const deleteStudentAttendance = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    await campusAdminService.deleteStudentAttendance(req.params.id, campusId);
    res
      .status(200)
      .json({
        success: true,
        message: "Student attendance deleted successfully.",
      });
  } catch (error) {
    handleError(res, error, 404);
  }
};

// --- Fee Record Controllers ---
export const createFeeRecord = async (req, res) => {
  try {
    const { campusId, instituteId } = getContext(req);
    const record = await campusAdminService.createFeeRecord(
      campusId,
      instituteId,
      req.body,
    );
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const getFeeRecords = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const records = await campusAdminService.getAllFeeRecords(campusId, req.query);
    res
      .status(200)
      .json({ success: true, count: records.length, data: records });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getFeeRecordById = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.getFeeRecordById(req.params.id, campusId);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export const updateFeeRecord = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.updateFeeRecord(
      req.params.id,
      campusId,
      req.body,
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const deleteFeeRecord = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    await campusAdminService.deleteFeeRecord(req.params.id, campusId);
    res
      .status(200)
      .json({ success: true, message: "Fee record deleted successfully." });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export const generateMonthlyFees = async (req, res) => {
  try {
    const { campusId, instituteId } = getContext(req);
    const result = await campusAdminService.generateMonthlyFees(
      campusId,
      instituteId,
      req.body,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const getFeeStructures = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const structures = await campusAdminService.getFeeStructures(campusId);
    res.status(200).json({ success: true, count: structures.length, data: structures });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const saveFeeStructure = async (req, res) => {
  try {
    const { campusId, instituteId } = getContext(req);
    const structure = await campusAdminService.upsertFeeStructure(
      campusId,
      instituteId,
      req.body,
    );
    res.status(200).json({ success: true, data: structure });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const deleteFeeStructure = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    await campusAdminService.deleteFeeStructure(req.params.id, campusId);
    res.status(200).json({ success: true, message: "Fee structure removed successfully." });
  } catch (error) {
    handleError(res, error, 404);
  }
};

// --- Performance Controllers ---
export const createPerformanceRecord = async (req, res) => {
  try {
    const { campusId, instituteId } = getContext(req);
    const record = await campusAdminService.createPerformance(
      campusId,
      instituteId,
      req.body,
    );
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const getPerformanceRecords = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const records = await campusAdminService.getAllPerformance(campusId, req.query);
    res
      .status(200)
      .json({ success: true, count: records.length, data: records });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getPerformanceRecordById = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.getPerformanceById(req.params.id, campusId);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export const updatePerformanceRecord = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    const record = await campusAdminService.updatePerformance(
      req.params.id,
      campusId,
      req.body,
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    handleError(res, error, 400);
  }
};

export const deletePerformanceRecord = async (req, res) => {
  try {
    const { campusId } = getContext(req);
    await campusAdminService.deletePerformance(req.params.id, campusId);
    res
      .status(200)
      .json({
        success: true,
        message: "Performance record deleted successfully.",
      });
  } catch (error) {
    handleError(res, error, 404);
  }
};
