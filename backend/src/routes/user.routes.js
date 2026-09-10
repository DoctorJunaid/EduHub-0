import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  changeUserRole,
  deleteUser,
  toggleUserStatus,
} from "../controllers/user.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { updateUserProfileById } from "../controllers/user.controller.js";

const router = express.Router();

// All user-management routes require Super Admin
router.use(protect);
router.use(authorize("super_admin"));

router.get("/all", getAllUsers);

router
  .route("/:id")
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.put("/:id/role", changeUserRole);

router.put("/:id/status", toggleUserStatus);

export default router;
