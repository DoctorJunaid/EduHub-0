import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { FeeRecord } from "../models/profile.model.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function seedFees() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const students = await User.find({ role: "student" }).lean();
    console.log(`Found ${students.length} students across all campuses.`);

    if (students.length === 0) {
      console.log("No students found. Exiting.");
      process.exit(0);
    }

    let createdCount = 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

    for (const student of students) {
      const existing = await FeeRecord.find({
        campusId: student.campusId,
        studentId: student._id,
      });

      if (existing.length > 0) {
        console.log(`Student ${student.name} already has ${existing.length} vouchers. Skipping.`);
        continue;
      }

      const vouchersToCreate = [
        {
          campusId: student.campusId,
          instituteId: student.instituteId || null,
          studentId: student._id,
          feeType: "Tuition Fee",
          amount: 65000,
          paidAmount: 65000,
          dueDate: new Date(currentYear, now.getMonth() - 1, 15),
          paymentDate: new Date(currentYear, now.getMonth() - 1, 12),
          status: "paid",
          challanNo: `CH-${Math.floor(100000 + Math.random() * 900000)}`,
          month: `${currentYear}-${currentMonth}`,
          semester: student.program ? "Fall 2025" : "Term 1",
          notes: "Semester Tuition Fee cleared via 1Link bank transfer.",
        },
        {
          campusId: student.campusId,
          instituteId: student.instituteId || null,
          studentId: student._id,
          feeType: "Exam & Assessment Fee",
          amount: 15000,
          paidAmount: 0,
          dueDate: new Date(currentYear, now.getMonth(), 28),
          paymentDate: null,
          status: "pending",
          challanNo: `CH-${Math.floor(100000 + Math.random() * 900000)}`,
          month: `${currentYear}-${currentMonth}`,
          semester: student.program ? "Spring 2026" : "Term 2",
          notes: "Mid-term examination and laboratory access dues.",
        },
        {
          campusId: student.campusId,
          instituteId: student.instituteId || null,
          studentId: student._id,
          feeType: "Library & Sports Dues",
          amount: 8500,
          paidAmount: 0,
          dueDate: new Date(currentYear, now.getMonth() - 2, 10),
          paymentDate: null,
          status: "overdue",
          challanNo: `CH-${Math.floor(100000 + Math.random() * 900000)}`,
          month: `${currentYear}-${String(now.getMonth() - 1).padStart(2, "0")}`,
          semester: student.program ? "Fall 2025" : "Term 1",
          notes: "Overdue library and athletic subscription charges.",
        },
      ];

      for (const v of vouchersToCreate) {
        await FeeRecord.create(v);
        createdCount++;
      }
      console.log(`Created 3 vouchers for ${student.name} (${student.roll || student.email}).`);
    }

    console.log(`Successfully seeded ${createdCount} fee records.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed fees:", error);
    process.exit(1);
  }
}

seedFees();
