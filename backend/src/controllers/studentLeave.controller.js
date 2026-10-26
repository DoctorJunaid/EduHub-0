import * as leaveService from "../services/studentLeave.service.js";

/**
 * POST /api/v1/student/leave-requests
 * Student applies for leave on an absent date
 */
export async function applyStudentLeave(req, res) {
  try {
    const studentUser = req.user;
    const { date, reason, category, note, attachmentUrl, attachmentName } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required." });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Reason for absence is required." });
    }

    const leaveRequest = await leaveService.submitStudentLeave({
      studentUser,
      date,
      reason,
      category,
      note,
      attachmentUrl,
      attachmentName,
    });

    return res.status(201).json({
      success: true,
      message: "Leave application submitted successfully. Status updated to Pending.",
      data: leaveRequest,
    });
  } catch (error) {
    console.error("[applyStudentLeave] Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to submit leave application.",
    });
  }
}

/**
 * GET /api/v1/student/leave-requests
 * Fetch all leave requests submitted by logged-in student
 */
export async function getStudentLeaves(req, res) {
  try {
    const studentId = req.user._id;
    const campusId = req.user.campusId;

    const leaves = await leaveService.getStudentLeaveRequests(campusId, studentId);

    return res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error("[getStudentLeaves] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch leave requests.",
    });
  }
}

/**
 * GET /api/v1/teacher/leave-requests
 * Teacher fetches leave requests for their assigned classes/students
 */
export async function getTeacherLeaves(req, res) {
  try {
    const teacherUserId = req.user._id;
    const campusId = req.user.campusId;
    const { status } = req.query;

    const leaves = await leaveService.getTeacherLeaveRequests(campusId, teacherUserId, { status });

    return res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error("[getTeacherLeaves] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch teacher leave requests.",
    });
  }
}

/**
 * PATCH /api/v1/teacher/leave-requests/:id/review
 * Teacher approves or rejects a leave request with central DB synchronization
 */
export async function reviewLeaveRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const reviewerUser = req.user;
    const campusId = req.user.campusId;

    if (!status || !["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status ('Approved' or 'Rejected') is required.",
      });
    }

    const result = await leaveService.reviewLeaveRequest(id, campusId, reviewerUser, {
      status,
      remarks,
    });

    const isApprove = status === "Approved";
    return res.status(200).json({
      success: true,
      message: isApprove
        ? "Leave application approved. Central attendance database synced to 'Excused'."
        : "Leave application rejected.",
      data: result,
    });
  } catch (error) {
    console.error("[reviewLeaveRequest] Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to review leave request.",
    });
  }
}

/**
 * GET /api/v1/campus-admin/leave-requests
 * Campus manager/admin fetches all leave requests across campus
 */
export async function getCampusLeaves(req, res) {
  try {
    const campusId = req.user.campusId;
    const { status } = req.query;

    const leaves = await leaveService.getTeacherLeaveRequests(campusId, req.user._id, { status });

    return res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error("[getCampusLeaves] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch campus leave requests.",
    });
  }
}
