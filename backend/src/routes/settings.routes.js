import express from "express";
import { authorize } from "../middleware/role.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import * as settingsService from "../services/settings.service.js";
import Campus from "../models/campus.model.js";

const router = express.Router();

// Middleware to ensure user is authenticated
router.use(protect);

// ---- CAMPUS MANAGER ROUTES ----

// GET /settings/campus/me
router.get("/campus/me", authorize("campus_admin", "campus_manager"), async (req, res) => {
  try {
    // Assuming req.user.campusId exists for campus_admin
    const campusId = req.user.campusId; 
    if (!campusId) return res.status(400).json({ success: false, message: "No campus assigned to this user" });
    const settings = await settingsService.getCampusSettings(campusId);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /settings/campus/me
router.put("/campus/me", authorize("campus_admin", "campus_manager"), async (req, res) => {
  try {
    const campusId = req.user.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "No campus assigned to this user" });
    const settings = await settingsService.updateCampusSettings(campusId, req.body, req.user._id);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /settings/campus/me/reset
router.post("/campus/me/reset", authorize("campus_admin", "campus_manager"), async (req, res) => {
  try {
    const campusId = req.user.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "No campus assigned to this user" });
    const result = await settingsService.resetCampusSettings(campusId);
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /settings/campus/me/effective
router.get("/campus/me/effective", authorize("campus_admin", "campus_manager"), async (req, res) => {
  try {
    const campusId = req.user.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "No campus assigned to this user" });
    const result = await settingsService.getEffectiveSettings(campusId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---- INSTITUTE ADMIN ROUTES ----

// Helper to get instituteId for institute_admin
const getInstituteIdForAdmin = async (userId) => {
  // Assuming Institute has adminId field (as seen in model)
  const institute = await Campus.db.models.Institute.findOne({ adminId: userId });
  return institute ? institute._id : null;
};

// GET /settings/institute/me
router.get("/institute/me", authorize("institute_admin", "super_admin"), async (req, res) => {
  try {
    const instituteId = req.user.instituteId || await getInstituteIdForAdmin(req.user._id);
    if (!instituteId) return res.status(400).json({ success: false, message: "No institute assigned to this user" });
    const settings = await settingsService.getInstituteSettings(instituteId);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /settings/institute/me
router.put("/institute/me", authorize("institute_admin", "super_admin"), async (req, res) => {
  try {
    const instituteId = req.user.instituteId || await getInstituteIdForAdmin(req.user._id);
    if (!instituteId) return res.status(400).json({ success: false, message: "No institute assigned to this user" });
    const settings = await settingsService.updateInstituteSettings(instituteId, req.body, req.user._id);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /settings/institute/campus/:id
router.get("/institute/campus/:id", authorize("institute_admin", "super_admin"), async (req, res) => {
  try {
    const campusId = req.params.id;
    // Optional: verify the campus belongs to the admin's institute
    const result = await settingsService.getEffectiveSettings(campusId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /settings/institute/campus/:id
router.put("/institute/campus/:id", authorize("institute_admin", "super_admin"), async (req, res) => {
  try {
    const campusId = req.params.id;
    const settings = await settingsService.updateCampusSettings(campusId, req.body, req.user._id);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
