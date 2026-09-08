import express from "express";
import {
  createSuperAdmin,
  getAllSuperAdmins,
  getSuperAdminById,
  updateSuperAdmin,
  deleteSuperAdmin,
} from "../controllers/auth/superAdmin.controller.js";

const router = express.Router();

router.route("/")
  .post(createSuperAdmin)
  .get(getAllSuperAdmins);

router.route("/:id")
  .get(getSuperAdminById)
  .put(updateSuperAdmin)
  .delete(deleteSuperAdmin);

export default router;