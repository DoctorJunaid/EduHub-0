import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../models/user.model.js";
import feeService from "../services/fee.service.js";
import { resolveStudentSubjects } from "../controllers/studentPortal.controller.js";
import { Performance, ExamSchedule } from "../models/profile.model.js";

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const student = await User.findOne({ email: "danyal.mirza16@eduhub.com" }).lean();
    console.log("Verified Student:", student.name, "| Class:", student.gradeOrClass, "| Section:", student.section);

    // 1. Check Fee History
    const feeData = await feeService.getStudentFeeHistory(student._id, student.campusId);
    console.log("Fee Vouchers Count:", feeData.vouchers.length);
    console.log("Fee Summary:", feeData.summary);
    if (feeData.vouchers.length > 0) {
      console.log("Sample Voucher:", {
        voucherNo: feeData.vouchers[0].voucherNo,
        amount: feeData.vouchers[0].amount,
        totalPayable: feeData.vouchers[0].totalPayable,
        status: feeData.vouchers[0].status,
      });
    }

    // 2. Check Progress Report Performance & Exams
    const perfs = await Performance.find({ campusId: student.campusId, studentId: student._id }).lean();
    console.log("Performance Records Count:", perfs.length);
    const exams = await ExamSchedule.find({ campusId: student.campusId }).lean();
    console.log("Exams Count:", exams.length);

    console.log("All verifications succeeded!");
  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
