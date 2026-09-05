import express from "express";

// Controllers
import { registerSuperAdmin, loginSuperAdmin } from "../controllers/auth/superAdmin.controller.js";
import { registerCampusAdmin, loginCampusAdmin } from "../controllers/auth/campusAdmin.controller.js";

// Middleware
import { protect } from "../middleware/auth.js";
import { isSuperAdmin } from "../middleware/superAdmin.js";

const router = express.Router();

// ──────────────────────────────────────────────────────────
//  SUPER ADMIN ROUTES
//  Base URL: /api/v1/auth/super-admin
// ──────────────────────────────────────────────────────────

// POST /api/v1/auth/super-admin/register
// Body: { name, email, password, secretKey }
// No token needed — protected by the SUPER_ADMIN_SECRET key in body
router.post("/super-admin/register", registerSuperAdmin);

// POST /api/v1/auth/super-admin/login
// Body: { email, password }
router.post("/super-admin/login", loginSuperAdmin);

// ──────────────────────────────────────────────────────────
//  CAMPUS ADMIN ROUTES
//  Base URL: /api/v1/auth/campus-admin
// ──────────────────────────────────────────────────────────

// POST /api/v1/auth/campus-admin/register
// Body: { name, email, password }
// Requires: Bearer token of a logged-in Super Admin
router.post("/campus-admin/register", protect, isSuperAdmin, registerCampusAdmin);

// POST /api/v1/auth/campus-admin/login
// Body: { email, password }
router.post("/campus-admin/login", loginCampusAdmin);

export default router;