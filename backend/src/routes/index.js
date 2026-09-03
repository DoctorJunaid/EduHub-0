import express from "express";
// import inquiryRoutes from "./inquiryRoutes.js";

const router = express.Router();

// Mount individual route files
// Endpoints will be available at: /api/v1/inquiries
// router.use("/inquiries", inquiryRoutes);
router.use("/inquiries", (req, res) => {
  res.send("working");
});

export default router;
