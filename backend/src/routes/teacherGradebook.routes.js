import express from "express";
import * as ctrl from "../controllers/teacherGradebook.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(
  protect,
  restrictTo("teacher", "faculty", "campus_admin", "campus_manager", "principal", "super_admin")
);

// GET /api/v1/teacher/gradebook/classes
router.get("/classes", ctrl.getAssignedClasses);

// GET /api/v1/teacher/gradebook/students?classId=&className=&section=
router.get("/students", ctrl.getStudents);

// GET /api/v1/teacher/gradebook/exams?className=&section=&subject=
router.get("/exams", ctrl.getExams);

// GET /api/v1/teacher/gradebook/results
router.get("/results", ctrl.getResults);

// POST /api/v1/teacher/gradebook/results
router.post("/results", ctrl.saveResult);

// DELETE /api/v1/teacher/gradebook/results/:id
router.delete("/results/:id", ctrl.deleteResult);

export default router;
