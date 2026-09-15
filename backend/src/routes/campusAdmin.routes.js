// src/routes/campusAdmin.routes.js

import express from "express";

import {
  getCampusStudents,
  addStudentToCampus,
  createStudentForCampus,
  removeStudentFromCampus,
  updateStudentInCampus,
  getCampusFaculty,
  createFacultyForCampus,
  removeFacultyFromCampus,
  updateFacultyInCampus
} from "../controllers/campusStudent.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { validateStudentId } from "../middleware/campusStudent.middleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("campus_admin"));

router.route("/students")
  .get(getCampusStudents)
  .post(validateStudentId, addStudentToCampus);

router.post("/students/new", createStudentForCampus);
router.delete("/students/:id", removeStudentFromCampus);
router.put("/students/:id", updateStudentInCampus);

router.route("/faculty")
  .get(getCampusFaculty);

router.post("/faculty/new", createFacultyForCampus);
router.delete("/faculty/:id", removeFacultyFromCampus);
router.put("/faculty/:id", updateFacultyInCampus);

export default router;