import express from "express";
import {
  createInquiry,
  getPublicInstitutes,
  getPublicInstituteById,
} from "../controllers/inquiry.controller.js";

const router = express.Router();

// Public Institute Directory (for dynamic landing page)
router.get("/public-institutes", getPublicInstitutes);
router.get("/public-institutes/:id", getPublicInstituteById);

// Public Inquiry submission
router.post("/", createInquiry);
router.post("/create-inquiry", createInquiry);

export default router;

