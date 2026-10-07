import * as resultCompilationService from "../services/resultCompilation.service.js";
import User from "../models/user.model.js";
import { TeacherProfile } from "../models/profile.model.js";

/**
 * Helper to extract campusId
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

// 1. Get Class Results Grid (Full Students × Subjects matrix for Class Teacher)
export const getClassResultsGrid = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { classId, examName, term } = req.query;
    const teacherUserId = req.user._id;

    const data = await resultCompilationService.getClassResultsGrid(
      campusId,
      teacherUserId,
      { classId, examName, term }
    );

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 2. Remind Subject Teacher
export const remindSubjectTeacher = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { teacherId } = req.params;
    const { classId, subject, examName } = req.body;

    const result = await resultCompilationService.remindSubjectTeacher(
      campusId,
      req.user._id,
      {
        targetTeacherId: teacherId,
        classId,
        subject,
        examName,
      }
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 3. Compile Class Results
export const compileClassResults = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { classId, examName, term, academicYear } = req.body;
    const result = await resultCompilationService.compileClassResults(
      campusId,
      req.user._id,
      { classId, examName, term, academicYear }
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 4. Save Student Remarks
export const saveStudentRemarks = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { studentId } = req.params;
    const { classId, examName, term, remarks } = req.body;

    const result = await resultCompilationService.saveStudentRemarks(
      campusId,
      req.user._id,
      { studentId, classId, examName, term, remarks }
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 5. Submit for Approval
export const submitClassResultsForApproval = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { classId, examName, term } = req.body;
    const result = await resultCompilationService.submitClassResultsForApproval(
      campusId,
      req.user._id,
      { classId, examName, term }
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 6. Campus Admin: Get Pending Approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const data = await resultCompilationService.getPendingApprovals(campusId);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 7. Campus Admin: Approve
export const approveClassResults = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { classId, examName, term } = req.body;
    const result = await resultCompilationService.approveClassResults(
      campusId,
      req.user._id,
      { classId, examName, term }
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 8. Campus Admin: Reject
export const rejectClassResults = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { classId, examName, term, rejectionReason } = req.body;
    const result = await resultCompilationService.rejectClassResults(
      campusId,
      req.user._id,
      { classId, examName, term, rejectionReason }
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 9. Campus Admin: Publish
export const publishClassResults = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const { classId } = req.params;
    const { examName, term } = req.body;

    const result = await resultCompilationService.publishClassResults(
      campusId,
      req.user._id,
      { classId, examName, term }
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 10. Student / Parent: Get My Report Cards
export const getMyReportCards = async (req, res) => {
  try {
    const campusId = await getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    let studentUserId = req.user._id;
    if (["campus_admin", "teacher", "faculty"].includes(req.user.role) && req.query.studentId) {
      studentUserId = req.query.studentId;
    }

    const { term } = req.query;
    const data = await resultCompilationService.getStudentReportCards(
      campusId,
      studentUserId,
      term
    );

    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
