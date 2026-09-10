// src/routes/campusAdminRoutes.js

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

router
  .route("/students")
  .get(getCampusStudents)
  .post(addStudentToCampus);

export default router;
