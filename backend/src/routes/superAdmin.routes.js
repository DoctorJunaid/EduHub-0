import express from "express";
import {
  createInstitute,
  getInstitutes,
  getInstituteById,
  updateInstitute,
  deleteInstitute,
} from "../controllers/institute.controller.js";
import {
  createCampusAdmin,
  getCampusAdmins,
  getCampusAdminById,
  updateCampusAdmin,
  deleteCampusAdmin,
} from "../controllers/campusAdmin.controller.js";

// Note: Add your verifyToken & authorizeRoles("super_admin") middlewares here
const router = express.Router();

// Add health check route for super admin
router.get("/health", (req, res) => {
  res.status(200).json({ status: "Super Admin API is healthy" });
});

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
