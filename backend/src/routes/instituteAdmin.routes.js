/**
 * Institute Admin Routes
 * Exposes tenant-isolated endpoints for managing an institute and its campuses.
 * Strictly protected by protect and instituteAdminScope.
 */
import express from "express";
import {
  getStats,
  getProfile,
  getCampuses,
  createCampus,
  getCampusById,
  updateCampus,
  deleteCampus,
  assignCampusManager,
  getManagers,
  createManager,
  getStaff,
  createStaff,
  deleteStaff,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAlerts,
  createAlert,
} from "../controllers/instituteAdmin.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { instituteAdminScope } from "../middleware/scope.middleware.js";

const router = express.Router();

// Guard all Institute Admin endpoints with authentication & tenant scope
router.use(protect);
router.use(instituteAdminScope);

// Analytics & Profile
router.get("/stats", getStats);
router.get("/profile", getProfile);

// Campus Branch Management
router
  .route("/campuses")
  .get(getCampuses)
  .post(createCampus);

router
  .route("/campuses/:id")
  .get(getCampusById)
  .put(updateCampus)
  .delete(deleteCampus);

router.post("/campuses/:id/assign-manager", assignCampusManager);

// Campus Managers Appointed Under This Institute
router
  .route("/managers")
  .get(getManagers)
  .post(createManager);

// Staff Directory (Teachers, Managers, Admins)
router
  .route("/staff")
  .get(getStaff)
  .post(createStaff);

router
  .route("/staff/:id")
  .delete(deleteStaff);

// Students Directory
router
  .route("/students")
  .get(getStudents)
  .post(createStudent);

router
  .route("/students/:id")
  .put(updateStudent)
  .delete(deleteStudent);

// Broadcast Alerts
router
  .route("/alerts")
  .get(getAlerts)
  .post(createAlert);

export default router;
