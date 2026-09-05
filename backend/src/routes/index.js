import express from "express";
import authRoutes from "./authRoutes.js";
import superAdminRoutes from "./superAdminRoutes.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/super-admin", protect, superAdminRoutes);
router.use("/inquiries", (req, res) => {
  res.send("working");
});

export default router;
