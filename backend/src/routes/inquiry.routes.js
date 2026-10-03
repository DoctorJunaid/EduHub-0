import express from "express";
import { createInquiry } from "../controllers/inquiry.controller.js";

const router = express.Router();

router.post("/", createInquiry);
router.post("/create-inquiry", createInquiry);

export default router;

