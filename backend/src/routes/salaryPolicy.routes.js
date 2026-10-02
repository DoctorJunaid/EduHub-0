import express from "express";
import mongoose from "mongoose";
import { authorize } from "../middleware/role.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import Campus from "../models/campus.model.js";
import * as salaryPolicyService from "../services/salaryPolicy.service.js";

const router = express.Router();

router.use(protect);

const editorRoles = ["campus_admin", "institute_admin", "super_admin", "campus_manager"];
const readerRoles = [...editorRoles, "accountant"];

const resolveCampusId = (req) => {
  const raw = req.query?.campusId || req.body?.campusId || req.user?.campusId;
  if (!raw) return null;
  if (typeof raw === "object" && raw !== null) {
    return raw._id || raw.id || String(raw);
  }
  return String(raw);
};

const verifyCampusAccess = async (req, campusId) => {
  if (req.user.role === "super_admin") return true;

  if (req.user.role === "institute_admin" && req.user.instituteId) {
    const campus = await Campus.findById(campusId).select("instituteId");
    if (!campus) {
      const err = new Error("Campus not found");
      err.status = 404;
      throw err;
    }
    if (campus.instituteId.toString() !== req.user.instituteId.toString()) {
      const err = new Error("Access denied. Campus belongs to a different institute.");
      err.status = 403;
      throw err;
    }
    return true;
  }

  if (["campus_admin", "campus_manager"].includes(req.user.role)) {
    const userCampusId = req.user.campusId?._id || req.user.campusId;
    if (userCampusId && userCampusId.toString() !== campusId.toString()) {
      const err = new Error("Access denied. You can only access your assigned campus.");
      err.status = 403;
      throw err;
    }
  }

  return true;
};

// GET /campus/salary/policy
router.get("/", authorize(...readerRoles), async (req, res) => {
  try {
    const campusId = resolveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "campusId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(campusId)) {
      return res.status(400).json({ success: false, message: "Valid campusId is required" });
    }

    await verifyCampusAccess(req, campusId);

    const data = await salaryPolicyService.getPolicy(campusId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

// Save handler for PUT and POST
const savePolicyHandler = async (req, res) => {
  try {
    const campusId = resolveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "campusId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(campusId)) {
      return res.status(400).json({ success: false, message: "Valid campusId is required" });
    }

    await verifyCampusAccess(req, campusId);

    const data = await salaryPolicyService.updatePolicy(campusId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

// PUT /campus/salary/policy
router.put("/", authorize(...editorRoles), savePolicyHandler);

// POST /campus/salary/policy
router.post("/", authorize(...editorRoles), savePolicyHandler);

export default router;

