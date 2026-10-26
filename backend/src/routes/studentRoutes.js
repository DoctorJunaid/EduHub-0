import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";
import {
  getStudentIdCard,
  updateStudentIdCard,
  regenerateStudentQr,
} from "../controllers/studentIdCard.controller.js";

const router = express.Router();

/**
 * @route   GET /api/students/:id/id-card
 * @desc    Get Student ID Card data (authenticated students own record, campus managers/admins)
 * @access  Private (Student own record, Campus Manager / Admin campus record)
 */
router.get("/:id/id-card", verifyToken, getStudentIdCard);

/**
 * @route   PUT /api/students/:id/id-card
 * @desc    Update Student ID Card data (Campus Manager / Admin only)
 * @access  Private (Campus Manager & Admin restricted via verifyToken and checkRole)
 */
router.put(
  "/:id/id-card",
  verifyToken,
  checkRole(["campus_manager", "admin", "campus_admin", "super_admin"]),
  updateStudentIdCard
);

/**
 * @route   PATCH /api/students/:id/id-card
 * @desc    Patch Student ID Card data (Campus Manager / Admin only)
 * @access  Private (Campus Manager & Admin restricted via verifyToken and checkRole)
 */
router.patch(
  "/:id/id-card",
  verifyToken,
  checkRole(["campus_manager", "admin", "campus_admin", "super_admin"]),
  updateStudentIdCard
);

/**
 * @route   POST /api/students/:id/regenerate-qr
 * @desc    Regenerate Student QR code data
 * @access  Private (Campus Manager & Admin restricted via verifyToken and checkRole)
 */
router.post(
  "/:id/regenerate-qr",
  verifyToken,
  checkRole(["campus_manager", "admin", "campus_admin", "super_admin", "principal"]),
  regenerateStudentQr
);

export default router;
