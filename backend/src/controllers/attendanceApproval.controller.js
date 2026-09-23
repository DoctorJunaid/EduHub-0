import {
  listApprovals as listApprovalsService,
  getApprovalById as getApprovalByIdService,
  processAdminDecision as processAdminDecisionService,
} from "../services/attendanceApproval.service.js";
import { getAuditTrail as getAuditTrailService } from "../services/auditLog.service.js";

/**
 * List approvals with filters and pagination
 */
export async function listApprovals(req, res) {
  try {
    const campusId = req.user.campusId;
    const { status, month, teacherProfileId, page, limit } = req.query;

    const result = await listApprovalsService(campusId, {
      status,
      month,
      teacherProfileId,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch approvals",
    });
  }
}

/**
 * Get single approval record with full proof details
 */
export async function getApprovalById(req, res) {
  try {
    const campusId = req.user.campusId;
    const { id } = req.params;

    const approval = await getApprovalByIdService(campusId, id);

    return res.status(200).json({
      success: true,
      data: approval,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch approval details",
    });
  }
}

/**
 * Approve a pending attendance/salary deduction approval
 */
export async function approveDecision(req, res) {
  try {
    const campusId = req.user.campusId;
    const { id } = req.params;
    const { notes, screenSnapshot } = req.body;

    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown User-Agent";

    const updated = await processAdminDecisionService(
      campusId,
      id,
      req.user,
      "Approved",
      {
        notes: notes || "",
        ipAddress,
        userAgent,
        screenSnapshot: screenSnapshot || {},
      }
    );

    return res.status(200).json({
      success: true,
      message: "Deduction/bonus approval granted and recorded with cryptographic proof",
      data: updated,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to process approval",
    });
  }
}

/**
 * Reject a pending attendance/salary deduction approval
 */
export async function rejectDecision(req, res) {
  try {
    const campusId = req.user.campusId;
    const { id } = req.params;
    const { reason, notes, screenSnapshot } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is strictly required to reject an approval request.",
      });
    }

    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown User-Agent";

    const updated = await processAdminDecisionService(
      campusId,
      id,
      req.user,
      "Rejected",
      {
        reason: reason.trim(),
        notes: notes || "",
        ipAddress,
        userAgent,
        screenSnapshot: screenSnapshot || {},
      }
    );

    return res.status(200).json({
      success: true,
      message: "Approval request rejected. No deductions or bonuses were applied.",
      data: updated,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to reject approval",
    });
  }
}

/**
 * Get immutable audit trail for a specific approval
 */
export async function getAuditTrail(req, res) {
  try {
    const campusId = req.user.campusId;
    const { id } = req.params;

    const auditTrail = await getAuditTrailService(campusId, id);

    return res.status(200).json({
      success: true,
      data: auditTrail,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve audit trail",
    });
  }
}
