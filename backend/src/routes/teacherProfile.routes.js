import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import * as controller from "../controllers/teacherProfile.controller.js";

const router = express.Router();

const adminRoles = [
  "campus_admin",
  "campus_manager",
  "institute_admin",
  "super_admin",
  "principal",
];

const viewRoles = [...adminRoles, "teacher", "faculty"];

// All routes require authentication
router.use(protect);

// Teacher Timetable (Direct endpoint)
router.get("/timetable", restrictTo(...viewRoles), controller.getTeacherTimetable);

// Teacher Profile Endpoints (Admins and Teachers can view)
router.get("/:teacherId", restrictTo(...viewRoles), controller.getTeacherProfile);
router.get("/:teacherId/classes", restrictTo(...viewRoles), controller.getTeacherClasses);
router.get("/:teacherId/timetable", restrictTo(...viewRoles), controller.getTeacherTimetable);
router.get("/:teacherId/attendance", restrictTo(...viewRoles), controller.getTeacherAttendance);
router.get("/:teacherId/payroll", restrictTo(...viewRoles), controller.getTeacherPayroll);
router.get("/:teacherId/substitutes", restrictTo(...viewRoles), controller.getTeacherSubstitutes);
router.get("/:teacherId/activity", restrictTo(...viewRoles), controller.getTeacherActivity);

// Class Assignment / Unassignment (Admins only)
router.post("/:teacherId/classes", restrictTo(...adminRoles), controller.assignTeacherClass);
router.delete("/:teacherId/classes/:assignmentId", restrictTo(...adminRoles), controller.unassignTeacherClass);

export default router;
