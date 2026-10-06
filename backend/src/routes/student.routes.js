import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  getStudentPortal,
  getStudentSubjects,
  getStudentFees,
  submitAssignment,
  sendConversationMessage,
  submitFeePayment,
} from "../controllers/studentPortal.controller.js";

const router = express.Router();
router.use(protect, authorize("student"));
router.get("/portal", getStudentPortal);
router.get("/subjects", getStudentSubjects);
router.get("/fees", getStudentFees);
router.post("/assignments/:id/submission", submitAssignment);
router.post("/conversations/:id/messages", sendConversationMessage);
router.post("/fees/:id/submit-payment", submitFeePayment);

export default router;
