import * as attendanceService from "../services/teacherStudentAttendance.service.js";
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
 * GET /api/v1/teacher/attendance/classes
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

    const classes = await attendanceService.getTeacherClasses(campusId, teacherUserId);
    res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/teacher/attendance/roster?classId=...&className=...&section=...&date=YYYY-MM-DD
 */
export const getClassRoster = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    let teacherUserId = req.user._id;
    if (["campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"].includes(req.user?.role)) {
      if (req.query.teacherId) teacherUserId = req.query.teacherId;
    }

    const { classId, className, section, date } = req.query;

    const data = await attendanceService.getClassStudentRosterWithAttendance(campusId, teacherUserId, {
      classId,
      className,
      section,
      date,
    });

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/v1/teacher/attendance/save
 */
export const saveAttendance = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const { classId, className, section, subject, date, records } = req.body;

    const updated = await attendanceService.saveClassAttendance(campusId, teacherUserId, {
      classId,
      className,
      section,
      subject,
      date,
      records,
    });

    res.status(200).json({
      success: true,
      message: `Successfully saved attendance for ${records?.length || 0} student(s).`,
      data: updated,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
