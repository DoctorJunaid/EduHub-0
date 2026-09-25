import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/classSession.controller.js";

const router = express.Router();

router.use(protect);

// ----------------------------------------------------
// Teacher & Faculty Endpoints (also accessible by managers)
// ----------------------------------------------------
router.get(
  "/my-sessions",
  restrictTo("teacher", "faculty", "campus_admin", "campus_manager", "principal"),
  ctrl.getTeacherSessions
);

router.get(
  "/today-classes",
  restrictTo("teacher", "faculty", "campus_admin", "campus_manager", "principal"),
  ctrl.getTodayClasses
);

router.get(
  "/my-summary",
  restrictTo("teacher", "faculty", "campus_admin", "campus_manager", "principal"),
  ctrl.getTeacherSummary
);

router.patch(
  "/:id/status",
  restrictTo("teacher", "faculty", "campus_admin", "campus_manager", "principal"),
  ctrl.markSessionStatus
);

router.post(
  "/:id/dispute",
  restrictTo("teacher", "faculty", "campus_admin", "campus_manager"),
  ctrl.requestDispute
);

router.get(
  "/timeline/:teacherId",
  restrictTo("teacher", "faculty", "campus_admin", "campus_manager", "principal"),
  ctrl.getTeacherTimeline
);

// ----------------------------------------------------
// Campus Manager / Admin Only Endpoints
// ----------------------------------------------------
router.post(
  "/generate",
  restrictTo("campus_admin", "campus_manager", "principal"),
  ctrl.generateSessions
);

router.get(
  "/performance",
  restrictTo("campus_admin", "campus_manager", "principal"),
  ctrl.getCampusPerformance
);

router.get(
  "/review-center",
  restrictTo("campus_admin", "campus_manager", "principal"),
  ctrl.getSalaryReviewCenter
);

router.post(
  "/:id/resolve-dispute",
  restrictTo("campus_admin", "campus_manager", "principal"),
  ctrl.resolveDispute
);

router.post(
  "/:id/review-adjustment",
  restrictTo("campus_admin", "campus_manager", "principal"),
  ctrl.reviewAdjustment
);

router.post(
  "/:id/substitute",
  restrictTo("campus_admin", "campus_manager", "principal"),
  ctrl.assignSubstitute
);

router.get(
  "/config",
  restrictTo("campus_admin", "campus_manager", "principal", "institute_admin"),
  ctrl.getConfig
);

router.put(
  "/config",
  restrictTo("campus_admin", "campus_manager", "principal"),
  ctrl.updateConfig
);

router.get(
  "/teacher/:teacherId/sessions",
  restrictTo("campus_admin", "campus_manager", "principal"),
  ctrl.getTeacherSessions
);

router.get(
  "/teacher/:teacherId/summary",
  restrictTo("campus_admin", "campus_manager", "principal"),
  ctrl.getTeacherSummary
);

export default router;
