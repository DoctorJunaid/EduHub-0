import teacherAssignmentService from "../services/teacherAssignment.service.js";
import User from "../models/user.model.js";
import { TeacherProfile } from "../models/profile.model.js";

/**
 * Helper to extract campusId from user context with multi-level fallback.
 */
async function getCampusId(req) {
  let cid = req.body?.campusId || req.query?.campusId || req.headers?.["x-campus-id"] || req.user?.campusId;
  if (cid) {
    return typeof cid === "object" && cid !== null ? (cid._id || cid.id || cid).toString() : String(cid);
  }
  if (req.user?._id) {
    const userDoc = await User.findById(req.user._id).select("campusId").lean();
    if (userDoc?.campusId) {
      return (userDoc.campusId._id || userDoc.campusId).toString();
    }
    const prof = await TeacherProfile.findOne({ user: req.user._id }).select("campusId").lean();
    if (prof?.campusId) {
      return (prof.campusId._id || prof.campusId).toString();
    }
  }
  return null;
}

export const getAssignedClasses = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    let teacherUserId = req.user._id;
    if (["campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"].includes(req.user.role)) {
      if (req.query.teacherId) teacherUserId = req.query.teacherId;
    }

    const classes = await teacherAssignmentService.getTeacherAssignedClasses(campusId, teacherUserId);
    res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    let teacherUserId = req.user._id;
    if (["campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"].includes(req.user.role)) {
      if (req.query.teacherId) teacherUserId = req.query.teacherId;
    }

    const assignments = await teacherAssignmentService.getTeacherAssignments(
      campusId,
      teacherUserId,
      req.query
    );
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const created = await teacherAssignmentService.createTeacherAssignment(
      campusId,
      req.user,
      req.body
    );
    res.status(201).json({
      success: true,
      message: "Assignment created successfully.",
      data: created,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    const { id } = req.params;

    const updated = await teacherAssignmentService.updateTeacherAssignment(
      id,
      campusId,
      req.user,
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Assignment updated successfully.",
      data: updated,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    const { id } = req.params;

    const result = await teacherAssignmentService.deleteTeacherAssignment(
      id,
      campusId,
      req.user
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getAssignmentSubmissions = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    const { id } = req.params;

    const data = await teacherAssignmentService.getAssignmentSubmissions(
      id,
      campusId
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    const { id } = req.params;
    const { submissionId, studentId, score, feedback } = req.body;

    const result = await teacherAssignmentService.gradeSubmission(
      id,
      campusId,
      req.user,
      { submissionId, studentId, score, feedback }
    );
    res.status(200).json({
      success: true,
      message: "Submission graded successfully.",
      data: result,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, attachmentUrl } = req.body;

    const result = await teacherAssignmentService.submitStudentAssignment(
      id,
      req.user,
      { notes, attachmentUrl }
    );
    res.status(200).json({
      success: true,
      message: "Assignment submitted successfully.",
      data: result,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export default {
  getAssignedClasses,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  submitAssignment,
};
