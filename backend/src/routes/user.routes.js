import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  changeUserRole,
  deleteUser,
  toggleUserStatus,
  updateUserProfileById,
} from "../controllers/user.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/all", getAllUsers);

router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);
// Allow Super Admin, Institute Admin, and Campus Admin to view/search users directory
router.get("/", authorize("super_admin", "institute_admin", "campus_admin"), getAllUsers);

// Single user management
router
  .route("/:id")
  .get(authorize("super_admin", "institute_admin", "campus_admin"), getUserById)
  .put(authorize("super_admin"), updateUser)
  .delete(authorize("super_admin"), deleteUser);

router.put("/:id/profile", authorize("super_admin"), updateUserProfileById);
router.put("/:id/role", authorize("super_admin"), changeUserRole);

router.put("/:id/status", toggleUserStatus);

export default router;
