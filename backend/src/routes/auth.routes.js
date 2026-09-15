/**
 * Authentication Routes
 * Handles user login, registration, and profile management.
 */
import express from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
  setPassword,
  getSetPasswordPage,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/set-password", setPassword);
router.get("/set-password", getSetPasswordPage);

// Protected routes
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

export default router;