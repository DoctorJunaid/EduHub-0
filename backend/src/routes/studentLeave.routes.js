import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  applyStudentLeave,
  getStudentLeaves,
  getTeacherLeaves,
  reviewLeaveRequest,
  getCampusLeaves,
} from "../controllers/studentLeave.controller.js";

const router = express.Router();

// Student Leave application endpoints
router.post(
  "/student/leave-requests",
  protect,
  restrictTo("student"),
  applyStudentLeave
);

router.get(
  "/student/leave-requests",
  protect,
  restrictTo("student"),
  getStudentLeaves
);

// Teacher Leave Review endpoints
router.get(
  "/teacher/leave-requests",
  protect,
  restrictTo("teacher", "faculty", "campus_admin", "campus_manager", "principal", "super_admin"),
  getTeacherLeaves
);

router.patch(
  "/teacher/leave-requests/:id/review",
  protect,
  restrictTo("teacher", "faculty", "campus_admin", "campus_manager", "principal", "super_admin"),
  reviewLeaveRequest
);

// Campus Manager / Admin endpoints
router.get(
  "/campus-admin/leave-requests",
  protect,
  restrictTo("campus_admin", "campus_manager", "principal", "super_admin"),
  getCampusLeaves
);

export default router;
