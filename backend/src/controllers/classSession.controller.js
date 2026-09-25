import classSessionService from "../services/classSession.service.js";
import TeachingCreditConfig from "../models/teachingCreditConfig.model.js";

/**
 * Helper to extract campusId from user context.
 */
function getCampusId(req) {
  return req.user?.campusId || req.query?.campusId || req.body?.campusId;
}

export const generateSessions = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }
    const dateInput = req.body?.date || req.query?.date || new Date();
    const sessions = await classSessionService.generateDailySessions(campusId, dateInput);
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getTeacherSessions = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    // If teacher role, always use req.user._id
    // If manager role, can query for specific teacherId or use req.user._id
    let teacherUserId = req.user._id;
    if (["campus_admin", "campus_manager", "principal"].includes(req.user.role)) {
      if (req.query.teacherId) {
        teacherUserId = req.query.teacherId;
      } else if (req.params.teacherId) {
        teacherUserId = req.params.teacherId;
      }
    }

    const sessions = await classSessionService.listTeacherSessions(
      campusId,
      teacherUserId,
      req.query
    );
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getTodayClasses = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required." });
    }

    const teacherUserId = req.user._id;
    const todayStr = new Date().toISOString().split("T")[0];

    const sessions = await classSessionService.listTeacherSessions(
      campusId,
      teacherUserId,
      { date: todayStr }
    );
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const markSessionStatus = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!["Completed", "Missed", "Absent", "Cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Completed, Missed, Absent, or Cancelled.",
      });
    }

    const updated = await classSessionService.markSessionStatus(
      id,
      campusId,
      req.user,
      { status, remarks }
    );
    res.status(200).json({
      success: true,
      message: `Class marked as ${status}.`,
      data: updated,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const requestDispute = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Dispute reason is required.",
      });
    }

    const updated = await classSessionService.requestDispute(
      id,
      campusId,
      req.user,
      { reason }
    );
    res.status(200).json({
      success: true,
      message: "Review request submitted successfully.",
      data: updated,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const resolveDispute = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const { id } = req.params;
    const { decision, resolutionRemark, adjustedStatus, adjustedDeduction } = req.body;

    if (!["Approve", "Reject", "Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be Approve or Reject.",
      });
    }

    const updated = await classSessionService.resolveDispute(
      id,
      campusId,
      req.user,
      { decision, resolutionRemark, adjustedStatus, adjustedDeduction }
    );
    res.status(200).json({
      success: true,
      message: `Dispute has been ${decision.toLowerCase()}d.`,
      data: updated,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const reviewAdjustment = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const { id } = req.params;
    const { action, remark, adjustedAmount } = req.body;

    if (!["Approve", "Reject", "Adjust"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be Approve, Reject, or Adjust.",
      });
    }

    const updated = await classSessionService.reviewSessionAdjustment(
      id,
      campusId,
      req.user,
      { action, remark, adjustedAmount }
    );
    res.status(200).json({
      success: true,
      message: `Adjustment ${action.toLowerCase()}d successfully.`,
      data: updated,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const assignSubstitute = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const { id } = req.params;
    const { substituteTeacherId, reason, notes } = req.body;

    if (!substituteTeacherId) {
      return res.status(400).json({
        success: false,
        message: "Substitute teacher ID is required.",
      });
    }

    const updated = await classSessionService.assignSubstituteToSession(
      id,
      campusId,
      req.user,
      { substituteTeacherId, reason, notes }
    );
    res.status(200).json({
      success: true,
      message: "Substitute assigned to session successfully.",
      data: updated,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getTeacherSummary = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    let teacherUserId = req.user._id;

    if (["campus_admin", "campus_manager", "principal"].includes(req.user.role)) {
      if (req.query.teacherId) teacherUserId = req.query.teacherId;
      else if (req.params.teacherId) teacherUserId = req.params.teacherId;
    }

    const summary = await classSessionService.getTeacherMonthlySummary(
      campusId,
      teacherUserId,
      req.query.month
    );
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getCampusPerformance = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const performance = await classSessionService.getCampusTeachingPerformance(
      campusId,
      req.query
    );
    res.status(200).json({ success: true, data: performance });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getSalaryReviewCenter = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const items = await classSessionService.getSalaryReviewCenterItems(
      campusId,
      req.query
    );
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getTeacherTimeline = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    let teacherUserId = req.params.teacherId || req.query.teacherId || req.user._id;

    const timeline = await classSessionService.getTeacherSessionTimeline(
      campusId,
      teacherUserId,
      req.query
    );
    res.status(200).json({ success: true, count: timeline.length, data: timeline });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getConfig = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const config = await classSessionService.getEffectiveTeachingConfig(campusId);
    res.status(200).json({ success: true, data: config });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const updateConfig = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    const updated = await TeachingCreditConfig.findOneAndUpdate(
      { campusId },
      { $set: { ...req.body, lastEditedBy: req.user._id } },
      { upsert: true, new: true }
    );
    res.status(200).json({
      success: true,
      message: "Teaching credit configuration updated successfully.",
      data: updated,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
