/**
 * API Root Router
 * Mounts all module-level routes under /api/v1.
 */
import express from "express";
import authRoutes from "./auth.routes.js";
import superAdminRoutes from "./superAdmin.routes.js";
import instituteAdminRoutes from "./instituteAdmin.routes.js";
import inquiryRoutes from "./inquiry.routes.js";
import campusAdminRoutes from "./campusAdmin.routes.js";

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

export default router;