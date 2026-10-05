import express from "express";
import * as ctrl from "../controllers/teacherDiary.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(
  protect,
  restrictTo("teacher", "faculty", "campus_admin", "campus_manager", "principal", "super_admin")
);

// GET /api/v1/teacher/diary/classes
router.get("/classes", ctrl.getAssignedClasses);

// GET /api/v1/teacher/diary
router.get("/", ctrl.getDiaryEntries);

// GET /api/v1/teacher/diary/:id
router.get("/:id", ctrl.getDiaryEntryById);

// POST /api/v1/teacher/diary
router.post("/", ctrl.createDiaryEntry);

// PUT /api/v1/teacher/diary/:id
router.put("/:id", ctrl.updateDiaryEntry);

// DELETE /api/v1/teacher/diary/:id
router.delete("/:id", ctrl.deleteDiaryEntry);

export default router;
