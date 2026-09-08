// src/routes/campusAdminRoutes.js

import express from "express";

import {
  getCampusStudents,
  addStudentToCampus,
} from "../controllers/campusAdminStudent.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

// All routes require authentication
// and Campus Admin role
router.use(protect);
router.use(authorize("campus_admin"));

router
  .route("/students")
  .get(getCampusStudents)
  .post(addStudentToCampus);

export default router;