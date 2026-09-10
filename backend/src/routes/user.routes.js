import express from "express";

import {
  getAllUsers,
  getUserById,
  updateUser,
  changeUserRole,
  deleteUser,
} from "../controllers/userController.js";

import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/role.middleware.js";
import { updateUserProfileById } from "../controllers/user.controller.js";

const router = express.Router();

// All user-management routes require Super Admin
router.use(protect);
router.use(authorize("super_admin"));

router.get("/", getAllUsers);

router
  .route("/:id")
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser)
  .put("/:id/profile", updateUserProfileById)

router.put("/:id/role", changeUserRole);

export default router;