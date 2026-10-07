import express from "express";
import * as classTeacherController from "../controllers/classTeacher.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect);

// 1. Campus Admin Routes (Assign / Remove / Query all)
router.post(
  "/classes/:classId/assign-class-teacher",
  authorize("campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"),
  classTeacherController.assignClassTeacher
);

router.delete(
  "/classes/:classId/class-teacher",
  authorize("campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"),
  classTeacherController.removeClassTeacher
);

router.put(
  "/classes/:classId/class-teacher",
  authorize("campus_admin", "campus_manager", "principal", "institute_admin", "super_admin"),
  classTeacherController.assignClassTeacher
);

router.get(
  "/classes/:classId/class-teacher",
  classTeacherController.getClassTeacher
);

router.get(
  "/classes/all-class-teachers",
  classTeacherController.getAllClassTeachers
);

router.get(
  "/classes/unmarked-today",
  classTeacherController.getUnmarkedClassesToday
);

// 2. Class Teacher Own Class Views & Operations
router.get(
  "/teachers/me/class",
  classTeacherController.getMyClassAssignment
);

router.get(
  "/teachers/me/class/students",
  classTeacherController.getMyClassStudents
);

router.get(
  "/teachers/me/class/attendance/today",
  classTeacherController.getMyClassAttendance
);

router.get(
  "/teachers/me/class/attendance",
  classTeacherController.getMyClassAttendance
);

router.post(
  "/teachers/me/class/attendance",
  classTeacherController.markClassAttendance
);

router.put(
  "/teachers/me/class/attendance/:date",
  classTeacherController.markClassAttendance
);

router.get(
  "/teachers/me/class/attendance/monthly",
  classTeacherController.getMyClassAttendanceMonthly
);

router.get(
  "/teachers/me/class/stats",
  classTeacherController.getMyClassStats
);

export default router;
