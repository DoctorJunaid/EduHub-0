import * as classTeacherService from "../services/classTeacher.service.js";
import User from "../models/user.model.js";
import { TeacherProfile } from "../models/profile.model.js";

/**
 * Helper to resolve campusId
 */
async function getCampusId(req) {
  let cid =
    req.body?.campusId ||
    req.query?.campusId ||
    req.headers?.["x-campus-id"] ||
    req.user?.campusId;
  if (cid) {
    return typeof cid === "object" && cid !== null
      ? (cid._id || cid.id || cid).toString()
      : String(cid);
  }
  if (req.user?._id) {
    const userDoc = await User.findById(req.user._id).select("campusId").lean();
    if (userDoc?.campusId) {
      return (userDoc.campusId._id || userDoc.campusId).toString();
    }
    const prof = await TeacherProfile.findOne({ user: req.user._id })
      .select("campusId")
      .lean();
    if (prof?.campusId) {
      return (prof.campusId._id || prof.campusId).toString();
    }
  }
  return null;
}

// 1. Assign Class Teacher (Admin)
export const assignClassTeacher = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { classId } = req.params;
    const { teacherProfileId, note } = req.body;

    if (!teacherProfileId) {
      return res.status(400).json({
        success: false,
        message: "teacherProfileId is required in request body.",
      });
    }

    const data = await classTeacherService.assignClassTeacher(
      campusId,
      classId,
      teacherProfileId,
      req.user?._id,
      note
    );

    res.status(200).json({
      success: true,
      message: "Class teacher assigned successfully",
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 2. Remove Class Teacher (Admin)
export const removeClassTeacher = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { classId } = req.params;
    const result = await classTeacherService.removeClassTeacher(
      campusId,
      classId,
      req.user?._id
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 3. Get Class Teacher for a Class (Admin/Teacher)
export const getClassTeacher = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { classId } = req.params;
    const data = await classTeacherService.getClassTeacher(campusId, classId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 4. Get all classes and class teachers in Campus (Admin)
export const getAllClassTeachers = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const data = await classTeacherService.getAllClassTeachers(campusId);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 5. Get current logged-in teacher's class assignment
export const getMyClassAssignment = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const data = await classTeacherService.getMyClassAssignment(campusId, teacherUserId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 6. Get Students of own class
export const getMyClassStudents = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const data = await classTeacherService.getMyClassStudents(campusId, teacherUserId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 7. Get Today's / specific date's attendance
export const getMyClassAttendance = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const { date, classId } = req.query;
    const data = await classTeacherService.getMyClassAttendance(
      campusId,
      teacherUserId,
      date,
      classId
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 8. Mark / Save daily attendance
export const markClassAttendance = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const { date, records, classId } = req.body;

    const data = await classTeacherService.markClassAttendance(campusId, teacherUserId, {
      date,
      records: records || [],
      classId,
      userRole: req.user.role,
    });

    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 9. Get Monthly Attendance report
export const getMyClassAttendanceMonthly = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const { classId, month, year } = req.query;
    const data = await classTeacherService.getMyClassAttendanceMonthly(
      campusId,
      teacherUserId,
      { classId, month, year }
    );

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 10. Get Class KPIs & Stats
export const getMyClassStats = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const data = await classTeacherService.getMyClassStats(campusId, teacherUserId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 11. Unmarked classes alert
export const getUnmarkedClassesToday = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const data = await classTeacherService.getUnmarkedClassesToday(campusId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
