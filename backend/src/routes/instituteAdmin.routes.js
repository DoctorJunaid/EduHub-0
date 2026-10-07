/**
 * Institute Admin Routes
 * Exposes tenant-isolated endpoints for managing an institute and its campuses.
 * Strictly protected by protect and instituteAdminScope.
 */
import express from "express";
import {
  getStats,
  getProfile,
  getCampuses,
  createCampus,
  getCampusById,
  updateCampus,
  deleteCampus,
  assignCampusManager,
  resendCampusManagerInvite,
  updateCampusManager,
  unassignCampusManager,
  getManagers,
  createManager,
  getStaff,
  createStaff,
  deleteStaff,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAlerts,
  createAlert,
  getSubscription,
  getAuditLogs,
} from "../controllers/instituteAdmin.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { instituteAdminScope } from "../middleware/scope.middleware.js";
import {
  checkCampusQuota,
  checkStudentQuota,
  checkStaffQuota,
  checkActiveSubscription,
  requireFeature,
} from "../middleware/quota.middleware.js";

const router = express.Router();

// Guard all Institute Admin endpoints with authentication & tenant scope
router.use(protect);
router.use(instituteAdminScope);

// Analytics & Profile
router.get("/stats", getStats);
router.get("/profile", getProfile);
router.get("/audit-logs", getAuditLogs);

// SaaS Subscription & Quota Usage View
router.get("/subscription", getSubscription);

// Campus Branch Management (Enforces active subscription & plan campus quota)
router
  .route("/campuses")
  .get(getCampuses)
  .post(checkActiveSubscription, checkCampusQuota, createCampus);

router
  .route("/campuses/:id")
  .get(getCampusById)
  .put(checkActiveSubscription, updateCampus)
  .delete(checkActiveSubscription, deleteCampus);

router.post("/campuses/:id/assign-manager", checkActiveSubscription, assignCampusManager);
router.post("/campuses/:id/resend-invite", resendCampusManagerInvite);
router.put("/campuses/:id/manager", checkActiveSubscription, updateCampusManager);
router.delete("/campuses/:id/manager", checkActiveSubscription, unassignCampusManager);

// Campus Managers Appointed Under This Institute
router
  .route("/managers")
  .get(getManagers)
  .post(checkActiveSubscription, checkStaffQuota, createManager);

// Staff Directory (Teachers, Managers, Admins - Enforces staff quota)
router
  .route("/staff")
  .get(getStaff)
  .post(checkActiveSubscription, checkStaffQuota, createStaff);

router
  .route("/staff/:id")
  .delete(checkActiveSubscription, deleteStaff);

// Students Directory (Enforces plan quota)
router
  .route("/students")
  .get(getStudents)
  .post(checkActiveSubscription, checkStudentQuota, createStudent);

router
  .route("/students/:id")
  .put(checkActiveSubscription, updateStudent)
  .delete(checkActiveSubscription, deleteStudent);

// Broadcast Alerts
router
  .route("/alerts")
  .get(getAlerts)
  .post(checkActiveSubscription, createAlert);

export default router;
