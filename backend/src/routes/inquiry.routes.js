import express from "express";
import { createInquiry } from "../controllers/inquiry.controller.js";
const router = express.Router();
router.use("/create-inquiry", createInquiry);
export default router;
