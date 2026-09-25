import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import * as controller from "../controllers/teacherProfile.controller.js";

const router = express.Router();

const authorizedRoles = [
  "campus_admin",
  "campus_manager",
  "institute_admin",
  "super_admin",
  "principal",
];

// All routes are protected
router.use(protect);
router.use(restrictTo(...authorizedRoles));

// Teacher Profile Endpoints
router.get("/:teacherId", controller.getTeacherProfile);
router.get("/:teacherId/classes", controller.getTeacherClasses);
router.get("/:teacherId/timetable", controller.getTeacherTimetable);
router.get("/:teacherId/attendance", controller.getTeacherAttendance);
router.get("/:teacherId/payroll", controller.getTeacherPayroll);
router.get("/:teacherId/substitutes", controller.getTeacherSubstitutes);
router.get("/:teacherId/activity", controller.getTeacherActivity);

// Class Assignment / Unassignment
router.post("/:teacherId/classes", controller.assignTeacherClass);
router.delete("/:teacherId/classes/:assignmentId", controller.unassignTeacherClass);

export default router;
