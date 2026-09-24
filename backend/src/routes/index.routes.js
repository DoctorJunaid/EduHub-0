/**
 * API Root Router
 * Mounts all module-level routes under /api/v1.
 */
import express from "express";
import authRoutes from "./auth.routes.js";
import superAdminRoutes from "./superAdmin.routes.js";
// import authRoutes from "./auth.routes.js";
import campusAdminRoutes from "./campusAdmin.routes.js";
// import userRoutes from "./user.routes.js";
import instituteAdminRoutes from "./instituteAdmin.routes.js";
import inquiryRoutes from "./inquiry.routes.js";
import teacherAttendenceRoutes from "./teacherAttendance.routes.js";
import settingsRoutes from "./settings.routes.js";
import substituteRoutes from "./substitute.routes.js";
import salaryPolicyRoutes from "./salaryPolicy.routes.js";
import salaryProfileRoutes from "./salaryProfile.routes.js";
import payrollRoutes from "./payroll.routes.js";
import attendanceApprovalRoutes from "./attendanceApproval.routes.js";
import studentRoutes from "./student.routes.js";
import academicRoutes from "./academic.routes.js";

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EduHub API is running and healthy.",
  });
});

// Mount Track A governance & authentication routes
router.use("/auth", authRoutes);
router.use("/student", studentRoutes);
router.use("/super-admin", superAdminRoutes);
router.use("/institute-admin", instituteAdminRoutes);

router.use("/inquiries", inquiryRoutes);
router.use("/campus-admin", campusAdminRoutes);
router.use("/campus/faculty", (req, res, next) => {
  req.url = "/faculty" + (req.url === "/" ? "" : req.url);
  campusAdminRoutes(req, res, next);
});

router.use("/academic", academicRoutes);

router.use("/campus/attendance/teachers", teacherAttendenceRoutes);
router.use("/campus/attendence/teachers", teacherAttendenceRoutes);

router.use("/settings", settingsRoutes);
router.use("/campus/substitutes", substituteRoutes);
router.use("/campus/salary/profiles", salaryProfileRoutes);
router.use("/campus/salary/payroll", payrollRoutes);
router.use("/campus/salary/approvals", attendanceApprovalRoutes);
router.use("/campus/salary/policy", salaryPolicyRoutes);
import seedRoutes from "./seed.routes.js";

router.use("/admin/seed", seedRoutes);
router.use("/campus/seed", seedRoutes);

export default router;
