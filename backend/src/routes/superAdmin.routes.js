/**
 * Super Admin Routes
 * Exposes platform-level governance and administrative endpoints.
 * Strictly protected by protect and restrictTo('super_admin').
 */
import express from "express";
import {
  getStats,
  getInstitutes,
  createInstitute,
  getInstituteById,
  updateInstitute,
  deleteInstitute,
  assignInstituteAdmin,
  getInstituteAdmins,
  createInstituteAdmin,
  getCampuses,
  createCampus,
  updateCampus,
  deleteCampus,
  getUsers,
  toggleUserStatus,
} from "../controllers/superAdmin.controller.js";

import { protect, restrictTo } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Guard all Super Admin endpoints
router.use(protect);
router.use(restrictTo("super_admin"));

// Analytics
router.get("/stats", getStats);

// Institute Management
router
  .route("/institutes")
  .get(getInstitutes)
  .post(upload.single("image"), createInstitute);

router
  .route("/institutes/:id")
  .get(getInstituteById)
  .put(upload.single("image"), updateInstitute)
  .delete(deleteInstitute);

router.post("/institutes/:id/assign-admin", assignInstituteAdmin);

// Institute Admins Standalone
router
  .route("/institute-admins")
  .get(getInstituteAdmins)
  .post(createInstituteAdmin);

// Campus Management
router
  .route("/campuses")
  .get(getCampuses)
  .post(createCampus);

router
  .route("/campuses/:id")
  .put(updateCampus)
  .delete(deleteCampus);

// Global User Governance
router.get("/users", getUsers);
router.patch("/users/:id/toggle-status", toggleUserStatus);

export default router;
