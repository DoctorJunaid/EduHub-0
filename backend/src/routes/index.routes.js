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
import teacherSalaryProfileRoutes from "./teacherSalaryProfile.routes.js";

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
router.use("/super-admin", superAdminRoutes);
router.use("/institute-admin", instituteAdminRoutes);

// Optional existing tracks / services
router.use("/inquiries", inquiryRoutes);
router.use("/campus-admin", campusAdminRoutes);

router.use("/campus/attendance/teachers", teacherAttendenceRoutes);
router.use("/campus/attendence/teachers", teacherAttendenceRoutes);

router.use("/settings", settingsRoutes);
router.use("/campus/substitutes", substituteRoutes);
router.use("/campus/salary", salaryPolicyRoutes);
router.use("/campus/salary/profiles", teacherSalaryProfileRoutes);

export default router;
