import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/teacherAssignment.controller.js";

const router = express.Router();

router.use(protect);

const staffRoles = [
  "teacher",
  "faculty",
  "campus_admin",
  "campus_manager",
  "principal",
  "institute_admin",
  "super_admin",
];

// Classes assigned to teacher
router.get("/classes", restrictTo(...staffRoles), ctrl.getAssignedClasses);

// Teacher Assignments CRUD
router.get("/", restrictTo(...staffRoles), ctrl.getAssignments);
router.post("/", restrictTo(...staffRoles), ctrl.createAssignment);
router.put("/:id", restrictTo(...staffRoles), ctrl.updateAssignment);
router.delete("/:id", restrictTo(...staffRoles), ctrl.deleteAssignment);

// Submissions & Grading
router.get("/:id/submissions", restrictTo(...staffRoles), ctrl.getAssignmentSubmissions);
router.patch("/:id/grade", restrictTo(...staffRoles), ctrl.gradeSubmission);
router.post("/:id/grade", restrictTo(...staffRoles), ctrl.gradeSubmission);

// Student submit assignment
router.post("/:id/submit", restrictTo("student", ...staffRoles), ctrl.submitAssignment);

export default router;
