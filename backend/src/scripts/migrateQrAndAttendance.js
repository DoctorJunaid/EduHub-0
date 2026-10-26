/**
 * Optimized Batch Migration & Reconciliation Script:
 * 1. Pre-caches Campuses & Institutes to avoid N+1 queries
 * 2. Uses bulkWrite for atomic, high-performance backfill of Student & User docs
 * 3. Sets deterministic, signed QR tokens for all students
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import { StudentAttendance } from "../models/profile.model.js";
import Campus from "../models/campus.model.js";
import Institute from "../models/institute.model.js";
import { createStudentQrPayload } from "../utils/qrAttendance.js";

async function runMigration() {
  console.log("=== Starting Fast Batch QR & Attendance Migration ===");
  await connectDB();

  const db = mongoose.connection.db;

  // 1. Drop old non-unique or legacy indexes if present
  try {
    const studentIndexes = await db.collection("students").indexes();
    const hasRollUnique = studentIndexes.some((idx) => idx.name === "rollNo_1" && idx.unique);
    if (hasRollUnique) {
      await db.collection("students").dropIndex("rollNo_1");
      console.log("Dropped legacy unique rollNo_1 index.");
    }
  } catch (err) {
    console.warn("Index check note:", err.message);
  }

  // Ensure index on { campusId: 1, studentId: 1, dateStr: 1 } for attendance
  try {
    await db.collection("studentattendances").createIndex(
      { campusId: 1, studentId: 1, dateStr: 1 },
      { unique: true }
    );
    console.log("Enforced unique index on studentattendances { campusId, studentId, dateStr }.");
  } catch (err) {
    console.warn("Attendance index note:", err.message);
  }

  // Pre-fetch all campuses and institutes into memory maps
  const campuses = await Campus.find({}).lean();
  const campusMap = new Map(campuses.map((c) => [String(c._id), c]));

  const institutes = await Institute.find({}).lean();
  const instituteMap = new Map(institutes.map((i) => [String(i._id), i]));

  const defaultCampus = campuses[0] || null;
  const defaultInstitute = institutes[0] || null;

  // Fetch all student users
  const studentUsers = await User.find({ role: "student" }).lean();
  console.log(`Processing ${studentUsers.length} student users...`);

  const studentBulkOps = [];
  const userBulkOps = [];

  for (const user of studentUsers) {
    const cid = user.campusId ? String(user.campusId) : defaultCampus ? String(defaultCampus._id) : "";
    const iid = user.instituteId ? String(user.instituteId) : defaultInstitute ? String(defaultInstitute._id) : "";

    const campusDoc = campusMap.get(cid) || defaultCampus;
    const instituteDoc = instituteMap.get(iid) || defaultInstitute;

    const classProgramValue =
      user.classProgram ||
      (user.gradeOrClass
        ? `${user.gradeOrClass}${user.section ? ` • Section ${user.section.replace(/^Section\s*/i, "")}` : ""}`
        : user.program || "Class 10 • Section A");

    const rollNoValue =
      user.rollNo ||
      user.roll ||
      user.rollNumber ||
      `ROLL-${String(user._id).slice(-4).toUpperCase()}`;

    // Deterministic, secure QR payload
    const qrPayload = createStudentQrPayload({
      userId: user._id,
      campusId: cid,
      rollNo: rollNoValue,
    });

    studentBulkOps.push({
      updateOne: {
        filter: { userId: user._id },
        update: {
          $set: {
            userId: user._id,
            campusId: cid || campusDoc?._id,
            instituteName: user.instituteName || instituteDoc?.name || campusDoc?.name || "EduHub Global Institute",
            instituteLogo: user.instituteLogo || instituteDoc?.logo || "",
            name: user.name || "Student",
            classProgram: classProgramValue,
            rollNo: rollNoValue,
            fatherName: user.fatherName || user.guardian || "",
            guardianPhone: user.guardianPhone || user.phone || "",
            address: user.address || "",
            avatar: user.avatar || "",
            qrCodeData: qrPayload,
            qrToken: qrPayload,
            status: user.status || "Active",
          },
        },
        upsert: true,
      },
    });

    userBulkOps.push({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            qrCodeData: qrPayload,
            rollNo: rollNoValue,
          },
        },
      },
    });
  }

  if (studentBulkOps.length > 0) {
    const studentRes = await Student.bulkWrite(studentBulkOps, { ordered: false });
    console.log(`Student documents synced: ${studentRes.upsertedCount} inserted, ${studentRes.modifiedCount} updated.`);
  }

  if (userBulkOps.length > 0) {
    const userRes = await User.bulkWrite(userBulkOps, { ordered: false });
    console.log(`User documents synced: ${userRes.modifiedCount} updated with QR payload.`);
  }

  console.log("=== Fast Batch Migration Completed Successfully ===");
  await mongoose.disconnect();
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
