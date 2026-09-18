import express from "express";
import { authorize } from "../middleware/role.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import * as substituteService from "../services/substitute.service.js";

const router = express.Router();

router.use(protect);

// Allowed roles: campus_admin, institute_admin, coordinator (we'll just use campus_admin for now, but will add coordinator if added to roles later)
const allowedRoles = ["campus_admin", "institute_admin", "super_admin", "campus_manager"];

// GET /campus/substitutes
router.get("/", authorize(...allowedRoles), async (req, res) => {
  try {
    const campusId = req.user.campusId; // For campus admin/manager
    const filters = req.query;
    
    // If institute admin, they should pass campusId in query
    const targetCampusId = campusId || filters.campusId;
    if (!targetCampusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const data = await substituteService.listSubstitutes(targetCampusId, filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /campus/substitutes/suggest
router.get("/suggest", authorize(...allowedRoles), async (req, res) => {
  try {
    const campusId = req.user.campusId || req.query.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const { date, className, section, period } = req.query;
    if (!date || !period) return res.status(400).json({ success: false, message: "date and period are required" });

    const data = await substituteService.suggestSubstitutes(campusId, { date, className, section, period });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /campus/substitutes
router.post("/", authorize(...allowedRoles), async (req, res) => {
  try {
    const campusId = req.user.campusId || req.body.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const data = await substituteService.assignSubstitute(campusId, req.user._id, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /campus/substitutes/:id
router.put("/:id", authorize(...allowedRoles), async (req, res) => {
  try {
    const campusId = req.user.campusId || req.body.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const data = await substituteService.updateSubstitute(req.params.id, campusId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /campus/substitutes/:id
router.delete("/:id", authorize(...allowedRoles), async (req, res) => {
  try {
    const campusId = req.user.campusId || req.query.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const result = await substituteService.deleteSubstitute(req.params.id, campusId);
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
