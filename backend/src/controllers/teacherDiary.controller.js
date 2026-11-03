import * as diaryService from "../services/teacherDiary.service.js";
import User from "../models/user.model.js";
import { TeacherProfile } from "../models/profile.model.js";
import { getTenantCampusId } from "../utils/tenantCampus.js";

/**
 * Helper to extract campusId strictly within the user's tenant scope.
 */
async function getCampusId(req) {
  return await getTenantCampusId(req);
}

/**
 * GET /api/v1/teacher/diary/classes
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

    const classes = await diaryService.getTeacherDiaryClasses(campusId, teacherUserId);
    res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/teacher/diary
 */
export const getDiaryEntries = async (req, res) => {
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
      classId: req.query.classId,
      className: req.query.className,
      section: req.query.section,
      date: req.query.date,
      search: req.query.search,
      teacherOnly: req.query.teacherOnly !== "false",
    };

    const entries = await diaryService.getTeacherDiaryEntries(campusId, teacherUserId, filters);
    res.status(200).json({ success: true, count: entries.length, data: entries });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/teacher/diary/:id
 */
export const getDiaryEntryById = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const entry = await diaryService.getDiaryEntryById(campusId, req.params.id);
    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/v1/teacher/diary
 */
export const createDiaryEntry = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const entry = await diaryService.createDiaryEntry(campusId, teacherUserId, req.body);
    res.status(201).json({ success: true, message: "Diary entry created successfully.", data: entry });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/v1/teacher/diary/:id
 */
export const updateDiaryEntry = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const updated = await diaryService.updateDiaryEntry(campusId, teacherUserId, req.params.id, req.body);
    res.status(200).json({ success: true, message: "Diary entry updated successfully.", data: updated });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/v1/teacher/diary/:id
 */
export const deleteDiaryEntry = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const result = await diaryService.deleteDiaryEntry(campusId, teacherUserId, req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};
