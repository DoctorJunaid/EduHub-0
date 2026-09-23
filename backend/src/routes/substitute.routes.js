import express from "express";
import { authorize } from "../middleware/role.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  listSubstitutes,
  suggestSubstitutes,
  assignSubstitute,
  updateSubstitute,
  deleteSubstitute,
} from "../controllers/substitute.controller.js";

const router = express.Router();

router.use(protect);

const allowedRoles = [
  "campus_admin",
  "campus_manager",
  "institute_admin",
  "super_admin",
  "principal",
];

// GET /api/v1/campus/substitutes/suggest (Must precede /:id)
router.get("/suggest", authorize(...allowedRoles), suggestSubstitutes);

// GET /api/v1/campus/substitutes
router.get("/", authorize(...allowedRoles), listSubstitutes);

// POST /api/v1/campus/substitutes
router.post("/", authorize(...allowedRoles), assignSubstitute);

// PUT /api/v1/campus/substitutes/:id
router.put("/:id", authorize(...allowedRoles), updateSubstitute);

// DELETE /api/v1/campus/substitutes/:id
router.delete("/:id", authorize(...allowedRoles), deleteSubstitute);

export default router;
