import express from "express";
import { authorize } from "../middleware/role.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import * as payrollService from "../services/payroll.service.js";

const router = express.Router();

router.use(protect);

const editorRoles = ["campus_admin", "campus_manager"];
const approveRoles = ["campus_admin", "institute_admin", "principal"];
const readerRoles = [...editorRoles, ...approveRoles, "accountant"];

// POST /campus/salary/payroll/generate
router.post("/generate", authorize(...editorRoles), async (req, res) => {
  try {
    const campusId = req.user.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const { month } = req.body; // "2026-09"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: "month is required in YYYY-MM format" });
    }

    const result = await payrollService.generatePayroll(campusId, req.user._id, { month });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Payroll generation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /campus/salary/payroll?month=&status=&page=&limit=
router.get("/", authorize(...readerRoles), async (req, res) => {
  try {
    const campusId = req.user.campusId || req.query.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const { month, status, page, limit } = req.query;
    const data = await payrollService.listPayroll(campusId, { month, status, page, limit });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/my-payslips", authorize("teacher", "faculty"), async (req, res) => {
  try {
    const campusId = req.user.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });
    const { month, page, limit } = req.query;
    const data = await payrollService.listMyPayslips(campusId, req.user._id, { month, page, limit });
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.put("/:id", authorize(...editorRoles), async (req, res) => {
  try {
    const data = await payrollService.updatePayroll(req.params.id, req.user.campusId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.post("/:id/approve", authorize(...approveRoles), async (req, res) => {
  try {
    const data = await payrollService.approvePayroll(req.params.id, req.user.campusId, req.user._id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.post("/:id/mark-paid", authorize("accountant", "campus_admin", "campus_manager"), async (req, res) => {
  try {
    const data = await payrollService.markPaid(req.params.id, req.user.campusId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/:id/export", authorize(...readerRoles, "teacher", "faculty"), async (req, res) => {
  try {
    const campusId = req.user.campusId;
    const data = await payrollService.exportPayslip(req.params.id, campusId, req.query.format || "csv", ["teacher", "faculty"].includes(req.user.role) ? req.user._id : undefined);
    res.setHeader("Content-Type", data.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${data.filename}"`);
    res.send(data.content);
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

// GET /campus/salary/payroll/:id
router.get("/:id", authorize(...readerRoles, "teacher", "faculty"), async (req, res) => {
  try {
    const campusId = req.user.campusId || req.query.campusId;
    if (!campusId) return res.status(400).json({ success: false, message: "campusId is required" });

    const data = await payrollService.getPayroll(req.params.id, campusId, ["teacher", "faculty"].includes(req.user.role) ? req.user._id : undefined);
    if (!data) return res.status(404).json({ success: false, message: "Payroll record not found" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
