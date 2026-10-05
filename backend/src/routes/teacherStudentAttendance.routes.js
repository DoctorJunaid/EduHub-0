import express from "express";
import * as ctrl from "../controllers/teacherStudentAttendance.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(
  protect,
  restrictTo("teacher", "faculty", "campus_admin", "campus_manager", "principal", "super_admin")
);

// GET /api/v1/teacher/attendance/classes
router.get("/classes", ctrl.getAssignedClasses);

// GET /api/v1/teacher/attendance/roster?classId=...&className=...&section=...&date=YYYY-MM-DD
router.get("/roster", ctrl.getClassRoster);

// POST /api/v1/teacher/attendance/save
router.post("/save", ctrl.saveAttendance);

export default router;
