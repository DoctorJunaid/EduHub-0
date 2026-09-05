// routes/authRoutes.js
import express from "express";
import { registerSuperAdmin, loginSuperAdmin } from "../controllers/auth/superAdmin.controller.js";

const router = express.Router();

// Super Admin routes
router.post("/register", registerSuperAdmin);
router.post("/login", loginSuperAdmin);

export default router;