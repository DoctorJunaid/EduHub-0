import express from "express";
import {
  createInstitute,
  getInstitutes,
  getInstituteById,
  updateInstitute,
  deleteInstitute,
} from "../controllers/institute.conntroller.js";
import {
  createCampusAdmin,
  getCampusAdmins,
  getCampusAdminById,
  updateCampusAdmin,
  deleteCampusAdmin,
} from "../controllers/campusAdmin.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { isSuperAdmin } from "../middleware/superAdmin.js";

const router = express.Router();

// Public health check route for super admin
router.get("/health", (req, res) => {
  res.status(200).json({ status: "Super Admin API is healthy" });
});

// All routes below require valid JWT authentication & Super Admin role
router.use(protect);
router.use(isSuperAdmin);

// --- Institute CRUD ---
router.route("/institutes").post(createInstitute).get(getInstitutes);

router
  .route("/institutes/:id")
  .get(getInstituteById)
  .put(updateInstitute)
  .delete(deleteInstitute);

// --- Campus Admin CRUD ---
router.route("/campus-admins").post(createCampusAdmin).get(getCampusAdmins);

router
  .route("/campus-admins/:id")
  .get(getCampusAdminById)
  .put(updateCampusAdmin)
  .delete(deleteCampusAdmin);

export default router;
