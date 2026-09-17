/**
 * Campus Teacher Attendance Routes
 * Base prefix: /api/v1/campus/attendance/teachers
 *
 * Available Endpoints:
 * - GET    /api/v1/campus/attendance/teachers/stats?date=YYYY-MM-DD
 * - GET    /api/v1/campus/attendance/teachers?date=&status=&department=&search=
 * - GET    /api/v1/campus/attendance/teachers/weekly?date=
 * - GET    /api/v1/campus/attendance/teachers/history?page=&limit=
 * - POST   /api/v1/campus/attendance/teachers
 * - PUT    /api/v1/campus/attendance/teachers/:id
 * - DELETE /api/v1/campus/attendance/teachers/:id
 */
import express from "express";
import * as ctrl from "../controllers/teacherAttendance.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, restrictTo("campus_admin", "campus_manager"));

// GET /api/v1/campus/attendance/teachers/stats?date=YYYY-MM-DD
router.get("/stats", ctrl.getStats);

// GET /api/v1/campus/attendance/teachers?date=&status=&department=&search=
router.get("/", ctrl.listAttendance);

// GET /api/v1/campus/attendance/teachers/weekly?date=
router.get("/weekly", ctrl.getWeekly);

// GET /api/v1/campus/attendance/teachers/history?page=&limit=
router.get("/history", ctrl.getHistory);

// POST /api/v1/campus/attendance/teachers/checkin
router.post("/checkin", ctrl.checkIn);

// POST /api/v1/campus/attendance/teachers/checkout
router.post("/checkout", ctrl.checkOut);

// POST /api/v1/campus/attendance/teachers
router.post("/", ctrl.markAttendance);

// PUT /api/v1/campus/attendance/teachers/:id
router.put("/:id", ctrl.updateAttendance);

// DELETE /api/v1/campus/attendance/teachers/:id
router.delete("/:id", ctrl.deleteAttendance);

export default router;
