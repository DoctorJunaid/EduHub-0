import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  getGrades,
  createGrade,
  deleteGrade,
  getSections,
  createSection,
  deleteSection,
  getSubjects,
  createSubject,
  deleteSubject,
  getGradeSubjects,
  assignSubjectToGrade,
  removeSubjectFromGrade,
  getTeacherAssignments,
  createTeacherAssignment,
  deleteTeacherAssignment,
} from "../controllers/academic.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("campus_admin", "campus_manager", "principal"));

// Grades
router.route("/grades")
  .get(getGrades)
  .post(createGrade);
router.route("/grades/:id")
  .delete(deleteGrade);

// Sections
router.route("/sections")
  .get(getSections)
  .post(createSection);
router.route("/sections/:id")
  .delete(deleteSection);

// Subjects
router.route("/subjects")
  .get(getSubjects)
  .post(createSubject);
router.route("/subjects/:id")
  .delete(deleteSubject);

// Grade-Subjects (Class Subjects)
router.route("/grade-subjects")
  .get(getGradeSubjects)
  .post(assignSubjectToGrade);
router.route("/grade-subjects/:id")
  .delete(removeSubjectFromGrade);

// Teacher Assignments
router.route("/teacher-assignments")
  .get(getTeacherAssignments)
  .post(createTeacherAssignment);
router.route("/teacher-assignments/:id")
  .delete(deleteTeacherAssignment);

export default router;
