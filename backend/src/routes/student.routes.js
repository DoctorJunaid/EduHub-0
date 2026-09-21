import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  getStudentPortal,
  submitAssignment,
  sendConversationMessage,
} from "../controllers/studentPortal.controller.js";

const router = express.Router();
router.use(protect, authorize("student"));
router.get("/portal", getStudentPortal);
router.post("/assignments/:id/submission", submitAssignment);
router.post("/conversations/:id/messages", sendConversationMessage);

export default router;
