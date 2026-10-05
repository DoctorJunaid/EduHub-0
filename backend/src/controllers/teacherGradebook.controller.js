import * as gradebookService from "../services/teacherGradebook.service.js";
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

/**
 * GET /api/v1/teacher/gradebook/classes
 */
export const getAssignedClasses = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    let teacherUserId = req.user._id;
    if (["campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"].includes(req.user?.role)) {
      if (req.query.teacherId) teacherUserId = req.query.teacherId;
    }

    const classes = await gradebookService.getTeacherGradebookClasses(campusId, teacherUserId);
    res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/teacher/gradebook/students?classId=&className=&section=
 */
export const getStudents = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    let teacherUserId = req.user._id;
    if (["campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"].includes(req.user?.role)) {
      if (req.query.teacherId) teacherUserId = req.query.teacherId;
    }

    const { classId, className, section } = req.query;
    const students = await gradebookService.getGradebookStudents(campusId, teacherUserId, {
      classId,
      className,
      section,
    });

    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/teacher/gradebook/exams?className=&section=&subject=
 */
export const getExams = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { className, section, subject } = req.query;
    const exams = await gradebookService.getGradebookExams(campusId, {
      className,
      section,
      subject,
    });

    res.status(200).json({ success: true, count: exams.length, data: exams });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/teacher/gradebook/results
 */
export const getResults = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    let teacherUserId = req.user._id;
    if (["campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"].includes(req.user?.role)) {
      if (req.query.teacherId) teacherUserId = req.query.teacherId;
    }

    const filters = {
      className: req.query.className,
      section: req.query.section,
      subject: req.query.subject,
      term: req.query.term,
      studentId: req.query.studentId,
    };

    const data = await gradebookService.getGradebookResults(campusId, teacherUserId, filters);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/v1/teacher/gradebook/results
 */
export const saveResult = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const result = await gradebookService.saveGradebookResult(campusId, teacherUserId, req.body);
    res.status(201).json({ success: true, message: "Marks recorded successfully.", data: result });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/v1/teacher/gradebook/results/:id
 */
export const deleteResult = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const response = await gradebookService.deleteGradebookResult(campusId, teacherUserId, req.params.id);
    res.status(200).json(response);
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};
