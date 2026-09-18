import express from "express";
import { authorize } from "../middleware/role.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import { listProfiles, upsertProfile } from "../services/teacherSalaryProfile.service.js";

const router = express.Router();

router.use(protect);

const editorRoles = ["campus_admin", "campus_manager"];
const readerRoles = [...editorRoles, "institute_admin", "accountant"];

// GET /campus/salary/profiles
router.get("/", authorize(...readerRoles), async (req, res) => {
  try {
    const campusId = req.user.campusId || req.query.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const profiles = await listProfiles(campusId);
    res.json({ success: true, data: profiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch salary profiles" });
  }
});

// PUT /campus/salary/profiles/:teacherId
router.put("/:teacherId", authorize(...editorRoles), async (req, res) => {
  try {
    const campusId = req.user.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const teacherId = req.params.teacherId;
    const payload = req.body;
    const profile = await upsertProfile(campusId, teacherId, payload);
    res.json({ success: true, data: profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to upsert salary profile" });
  }
});

export default router;
