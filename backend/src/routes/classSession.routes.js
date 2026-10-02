import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/classSession.controller.js";

const router = express.Router();

router.use(protect);

const managerRoles = ["campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"];
const staffRoles = ["teacher", "faculty", ...managerRoles];

// ----------------------------------------------------
// Teacher & Faculty Endpoints (also accessible by managers)
// ----------------------------------------------------
router.get(
  "/my-sessions",
  restrictTo(...staffRoles),
  ctrl.getTeacherSessions
);

router.get(
  "/today-classes",
  restrictTo(...staffRoles),
  ctrl.getTodayClasses
);

router.get(
  "/my-summary",
  restrictTo(...staffRoles),
  ctrl.getTeacherSummary
);

router.patch(
  "/:id/status",
  restrictTo(...staffRoles),
  ctrl.markSessionStatus
);

router.post(
  "/:id/dispute",
  restrictTo(...staffRoles),
  ctrl.requestDispute
);

router.get(
  "/timeline/:teacherId",
  restrictTo(...staffRoles),
  ctrl.getTeacherTimeline
);

// ----------------------------------------------------
// Campus Manager / Admin Only Endpoints
// ----------------------------------------------------
router.post(
  "/generate",
  restrictTo(...managerRoles),
  ctrl.generateSessions
);

router.get(
  "/performance",
  restrictTo(...managerRoles),
  ctrl.getCampusPerformance
);

router.get(
  "/review-center",
  restrictTo(...managerRoles),
  ctrl.getSalaryReviewCenter
);

router.post(
  "/:id/resolve-dispute",
  restrictTo(...managerRoles),
  ctrl.resolveDispute
);

router.post(
  "/:id/review-adjustment",
  restrictTo(...managerRoles),
  ctrl.reviewAdjustment
);

router.post(
  "/:id/substitute",
  restrictTo(...managerRoles),
  ctrl.assignSubstitute
);

router.get(
  "/config",
  restrictTo(...managerRoles),
  ctrl.getConfig
);

router.put(
  "/config",
  restrictTo(...managerRoles),
  ctrl.updateConfig
);

router.get(
  "/teacher/:teacherId/sessions",
  restrictTo(...managerRoles),
  ctrl.getTeacherSessions
);

router.get(
  "/teacher/:teacherId/summary",
  restrictTo(...managerRoles),
  ctrl.getTeacherSummary
);

export default router;
