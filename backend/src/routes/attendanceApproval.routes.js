import express from "express";
import { authorize } from "../middleware/role.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  listApprovals,
  getApprovalById,
  approveDecision,
  rejectDecision,
  getAuditTrail,
} from "../controllers/attendanceApproval.controller.js";

const router = express.Router();

router.use(protect);

const approveRoles = [
  "campus_admin",
  "campus_manager",
  "institute_admin",
  "principal",
  "super_admin",
];

const readRoles = [
  ...approveRoles,
  "accountant",
  "admin",
];

// GET /api/v1/campus/salary/approvals
router.get("/", authorize(...readRoles), listApprovals);

// GET /api/v1/campus/salary/approvals/:id
router.get("/:id", authorize(...readRoles), getApprovalById);

// POST /api/v1/campus/salary/approvals/:id/approve
router.post("/:id/approve", authorize(...approveRoles), approveDecision);

// POST /api/v1/campus/salary/approvals/:id/reject
router.post("/:id/reject", authorize(...approveRoles), rejectDecision);

// GET /api/v1/campus/salary/approvals/:id/audit-trail
router.get("/:id/audit-trail", authorize(...readRoles), getAuditTrail);

export default router;
