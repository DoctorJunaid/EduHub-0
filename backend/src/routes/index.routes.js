import express from "express";
import inquiryRoutes from "./inquiry.routes.js";
import superAdminRoutes from "./superAdmin.routes.js";
import authRoutes from "./auth.routes.js";
import campusAdminRoutes from "./campusAdmin.routes.js";
import userRoutes from "./user.routes.js";

const router = express.Router();

// Health Check route
router.get("/", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Mount individual route files
// Endpoints will be available at: /api/v1/inquiries
router.use("/inquiries", inquiryRoutes);
// Endpoints will be available at: /api/v1/super-admin
router.use("/super-admin", superAdminRoutes);
router.use("/auth", authRoutes);
router.use("/campus-admin", campusAdminRoutes);
/**
 *  TODO: Add users routes in openapi.yml
 */
router.use("/users", userRoutes);

export default router;
