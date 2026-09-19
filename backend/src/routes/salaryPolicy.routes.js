import express from "express";
import { authorize } from "../middleware/role.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import * as salaryPolicyService from "../services/salaryPolicy.service.js";

const router = express.Router();

router.use(protect);

const editorRoles = ["campus_admin", "institute_admin", "super_admin", "campus_manager"];
const readerRoles = [...editorRoles, "accountant"];

// GET /campus/salary/policy
router.get("/policy", authorize(...readerRoles), async (req, res) => {
  try {
    const campusId = req.user.campusId || req.query.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const data = await salaryPolicyService.getPolicy(campusId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /campus/salary/policy
router.put("/policy", authorize(...editorRoles), async (req, res) => {
  try {
    const campusId = req.user.campusId || req.body.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const data = await salaryPolicyService.updatePolicy(campusId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
