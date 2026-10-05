import mongoose from "mongoose";
import dotenv from "dotenv";
import assert from "node:assert";
import User from "../src/models/user.model.js";
import { StudentAttendance } from "../src/models/profile.model.js";
import * as attendanceService from "../src/services/teacherStudentAttendance.service.js";

dotenv.config({ path: "backend/.env" });
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function runAttendanceTest() {
  console.log("================================================================");
  console.log("Starting End-to-End Test for Teacher Student Attendance Module");
  console.log("================================================================");

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB Atlas.");

  // 1. Find or pick a Teacher
  let teacher = await User.findOne({ role: { $in: ["teacher", "faculty"] }, campusId: { $ne: null } }).lean();
  if (!teacher) {
    teacher = await User.findOne({ email: /teacher|tariq|zeeshan/i }).lean();
  }
  if (!teacher) {
    teacher = await User.findOne().lean();
  }
  assert(teacher, "Found a teacher user for testing.");
  const campusId = teacher.campusId || new mongoose.Types.ObjectId();
  console.log(`Using Teacher: ${teacher.name} (${teacher.email}) [Campus: ${campusId}]`);

  // Ensure test students exist in this campus
  let testStudents = await User.find({ campusId, role: "student" }).limit(5).lean();
  if (testStudents.length < 3) {
    console.log("Creating 3 test students for campus...");
    for (let i = 1; i <= 3; i++) {
      const s = await User.create({
        name: `Test Student ${i}`,
        email: `teststudent${i}_${Date.now()}@eduhub.com`,
        passwordHash: "$2a$10$hashedtestdummy1234567890",
        role: "student",
        gradeOrClass: "Class 10",
        program: "Class 10",
        section: "A",
        rollNumber: `ST-100${i}`,
        campusId,
      });
      testStudents.push(s);
    }
  }
  console.log(`Found/Created ${testStudents.length} students for testing.`);

  // -------------------------------------------------------------
  // STEP 1: Fetch Assigned Teacher Classes
  // -------------------------------------------------------------
  console.log("\n--- STEP 1: Fetch Assigned Teacher Classes ---");
  const assignedClasses = await attendanceService.getTeacherClasses(campusId, teacher._id);
  assert(assignedClasses.length > 0, "1. Successfully retrieved assigned class(es) for teacher.");
  const targetClass = assignedClasses[0];
  console.log(`  Target Class: ${targetClass.className} - Section ${targetClass.section} (${targetClass.subject})`);

  // -------------------------------------------------------------
  // STEP 2: Fetch Class Roster for Today
  // -------------------------------------------------------------
  const todayStr = new Date().toISOString().split("T")[0];
  console.log(`\n--- STEP 2: Fetch Class Roster for Date: ${todayStr} ---`);
  const rosterResult = await attendanceService.getClassStudentRosterWithAttendance(campusId, teacher._id, {
    classId: targetClass._id,
    className: targetClass.className,
    section: targetClass.section,
    date: todayStr,
  });

  assert(rosterResult && Array.isArray(rosterResult.students), "2. Retrieved student roster array.");
  assert(rosterResult.students.length > 0, `  Roster contains ${rosterResult.students.length} student(s).`);
  console.log(`  Initial Counts: Total=${rosterResult.totalStudents}, Present=${rosterResult.presentCount}, Absent=${rosterResult.absentCount}`);

  // -------------------------------------------------------------
  // STEP 3: Save Attendance (Batch)
  // -------------------------------------------------------------
  console.log("\n--- STEP 3: Save Student Attendance Batch ---");
  const student1 = rosterResult.students[0];
  const student2 = rosterResult.students[1] || rosterResult.students[0];
  const student3 = rosterResult.students[2] || rosterResult.students[0];

  const recordsToSave = [
    { studentId: student1._id, status: "Present", remarks: "On time" },
    { studentId: student2._id, status: "Absent", remarks: "Unexcused" },
    { studentId: student3._id, status: "Late", remarks: "Arrived 10 mins late" },
  ];

  const saveResult = await attendanceService.saveClassAttendance(campusId, teacher._id, {
    classId: targetClass._id,
    className: targetClass.className,
    section: targetClass.section,
    subject: targetClass.subject,
    date: todayStr,
    records: recordsToSave,
  });

  assert(saveResult, "3. Attendance saved successfully.");
  console.log(`  Updated KPI Counts: Total=${saveResult.totalStudents}, Present=${saveResult.presentCount}, Absent=${saveResult.absentCount}, Late=${saveResult.lateCount}`);
  assert(saveResult.presentCount >= 1, "At least 1 student marked Present.");
  assert(saveResult.absentCount >= 1, "At least 1 student marked Absent.");

  // -------------------------------------------------------------
  // STEP 4: Direct DB Verification in StudentAttendance Collection
  // -------------------------------------------------------------
  console.log("\n--- STEP 4: Direct DB Verification in StudentAttendance ---");
  const doc1 = await StudentAttendance.findOne({
    campusId,
    studentId: student1._id,
    dateStr: todayStr,
  });
  assert(doc1, "4. Found StudentAttendance record in MongoDB.");
  assert(doc1.status === "Present", "Status is 'Present'.");
  assert(String(doc1.markedBy) === String(teacher._id), "markedBy matches teacher userId.");
  console.log("  ✓ Direct MongoDB document verified.");

  // -------------------------------------------------------------
  // STEP 5: Re-fetch and Verify Idempotent Upsert
  // -------------------------------------------------------------
  console.log("\n--- STEP 5: Idempotent Updates (Mark All Present) ---");
  const allPresentRecords = rosterResult.students.map((s) => ({
    studentId: s._id,
    status: "Present",
    remarks: "All present",
  }));

  const allPresentResult = await attendanceService.saveClassAttendance(campusId, teacher._id, {
    classId: targetClass._id,
    className: targetClass.className,
    section: targetClass.section,
    subject: targetClass.subject,
    date: todayStr,
    records: allPresentRecords,
  });

  assert(allPresentResult.presentCount === rosterResult.students.length, "5. All students now marked Present.");
  assert(allPresentResult.absentCount === 0, "0 students marked Absent.");

  console.log("\n================================================================");
  console.log("🎉 ALL TEACHER ATTENDANCE TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================\n");

  await mongoose.disconnect();
}

runAttendanceTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
