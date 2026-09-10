// src/routes/campusAdmin.routes.js

import express from "express";

import {
  getCampusStudents,
  addStudentToCampus,
} from "../controllers/campusStudent.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { validateStudentId } from "../middleware/campusStudent.middleware.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// All routes below require:
//   1. Valid JWT  (protect)
//   2. campus_admin role  (authorize)
// ─────────────────────────────────────────────────────────────
router.use(protect);
router.use(authorize("campus_admin"));

// GET  /api/v1/campus-admin/students  → list all students in this campus
// POST /api/v1/campus-admin/students  → assign an existing student to this campus
router
  .route("/students")
  .get(getCampusStudents)
  .post(validateStudentId, addStudentToCampus);

export default router;