import express from "express";
import * as resultCtrl from "../controllers/resultCompilation.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect);

// 1. Class Teacher Routes
router.get(
  "/teachers/me/class/results",
  resultCtrl.getClassResultsGrid
);

router.post(
  "/teachers/me/class/results/remind/:teacherId",
  resultCtrl.remindSubjectTeacher
);

router.post(
  "/teachers/me/class/results/compile",
  resultCtrl.compileClassResults
);

router.post(
  "/teachers/me/class/results/student/:studentId/remarks",
  resultCtrl.saveStudentRemarks
);

router.post(
  "/teachers/me/class/results/submit",
  resultCtrl.submitClassResultsForApproval
);

// 2. Campus Admin Routes (Approval & Publishing)
router.get(
  "/results/pending-approval",
  authorize("campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"),
  resultCtrl.getPendingApprovals
);

router.post(
  "/results/approve",
  authorize("campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"),
  resultCtrl.approveClassResults
);

router.post(
  "/results/reject",
  authorize("campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"),
  resultCtrl.rejectClassResults
);

router.post(
  "/results/:classId/publish",
  authorize("campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"),
  resultCtrl.publishClassResults
);

// 3. Student / Parent / General Report Cards
router.get(
  "/results/my-report-cards",
  resultCtrl.getMyReportCards
);

export default router;
