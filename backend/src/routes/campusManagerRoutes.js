import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";
import {
  getStudentIdCard,
  updateStudentIdCard,
} from "../controllers/studentIdCard.controller.js";

const router = express.Router();

// Apply auth and role protection across Campus Manager routes
router.use(verifyToken);
router.use(checkRole(["campus_manager", "admin"]));

/**
 * @route   GET /api/campus-manager/students/:id/id-card
 * @desc    Get Student ID Card data for a campus student
 * @access  Private (Campus Manager & Admin only)
 */
router.get("/students/:id/id-card", getStudentIdCard);

/**
 * @route   PUT /api/campus-manager/students/:id/id-card
 * @desc    Update Student ID Card data
 * @access  Private (Campus Manager & Admin only)
 */
router.put("/students/:id/id-card", updateStudentIdCard);

/**
 * @route   PATCH /api/campus-manager/students/:id/id-card
 * @desc    Update Student ID Card data
 * @access  Private (Campus Manager & Admin only)
 */
router.patch("/students/:id/id-card", updateStudentIdCard);

export default router;
