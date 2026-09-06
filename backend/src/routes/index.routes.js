import express from "express";
import inquiryRoutes from "./inquiry.routes.js";

const router = express.Router();

// Health Check route
router.get("/", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Mount individual route files
// Endpoints will be available at: /api/v1/inquiries
router.use(inquiryRoutes);

export default router;
