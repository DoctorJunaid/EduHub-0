import express from "express";
import {
  clearTeachers,
  clearStudents,
  clearAll,
  seedFullStructure,
  seedTeachers,
  seedStudents,
  seedAttendance,
  seedSubstitutes,
  resetAll,
  getStats,
} from "../controllers/seed.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { requireDev } from "../middleware/requireDev.middleware.js";

const router = express.Router();

// Apply auth, role restrictions, and development safeguard to all seed endpoints
router.use(protect);
router.use(
  restrictTo(
    "super_admin",
    "institute_admin",
    "campus_admin",
    "campus_manager",
    "principal"
  )
);
router.use(requireDev);

router.get("/stats", getStats);
router.post("/full-structure", seedFullStructure);
router.post("/teachers", seedTeachers);
router.post("/students", seedStudents);
router.post("/attendance", seedAttendance);
router.post("/substitutes", seedSubstitutes);
router.post("/clear-teachers", clearTeachers);
router.post("/clear-students", clearStudents);
router.post("/clear-all", clearAll);
router.post("/reset", resetAll);

export default router;
