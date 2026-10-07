/**
 * Automated Verification Script for Class Teacher & Result Compilation System
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Grade, Section } from "../src/models/academic.model.js";
import { TeacherProfile } from "../src/models/profile.model.js";
import User from "../src/models/user.model.js";
import StudentResult from "../src/models/studentResult.model.js";
import ReportCard from "../src/models/reportCard.model.js";
import { calculateGrade, calculateRanks } from "../src/utils/gradeCalculator.js";

async function runTests() {
  console.log("==========================================");
  console.log("🎓 Verifying Class Teacher & Results Architecture");
  console.log("==========================================");

  // 1. Verify Grade Calculator
  console.log("1. Testing Grade Calculator...");
  const g95 = calculateGrade(95);
  const g82 = calculateGrade(82);
  const g74 = calculateGrade(74);
  const g45 = calculateGrade(45);
  const g30 = calculateGrade(30);

  if (g95.grade !== "A+" || g95.gpa !== 4.0) throw new Error("A+ calculation failed");
  if (g82.grade !== "A" || g82.gpa !== 3.7) throw new Error("A calculation failed");
  if (g74.grade !== "B+" || g74.gpa !== 3.3) throw new Error("B+ calculation failed");
  if (g45.grade !== "D" || g45.gpa !== 1.0) throw new Error("D calculation failed");
  if (g30.grade !== "F" || g30.gpa !== 0.0) throw new Error("F calculation failed");
  console.log("✅ Grade calculator passed: A+ (4.0), A (3.7), B+ (3.3), D (1.0), F (0.0)");

  // 2. Testing Rank Calculator
  console.log("2. Testing Rank Calculator...");
  const dummyStudents = [
    { studentId: "s1", percentage: 84.5, obtainedMarks: 507 },
    { studentId: "s2", percentage: 92.0, obtainedMarks: 552 },
    { studentId: "s3", percentage: 76.0, obtainedMarks: 456 },
  ];
  const ranked = calculateRanks(dummyStudents);
  if (ranked[0].studentId !== "s2" || ranked[0].classRank !== 1) throw new Error("Rank 1 failed");
  if (ranked[1].studentId !== "s1" || ranked[1].classRank !== 2) throw new Error("Rank 2 failed");
  if (ranked[2].studentId !== "s3" || ranked[2].classRank !== 3) throw new Error("Rank 3 failed");
  console.log("✅ Rank calculator passed: S2 #1 (92%), S1 #2 (84.5%), S3 #3 (76%)");

  // 3. Schema & Model integrity
  console.log("3. Verifying Mongoose Schemas & Model registrations...");
  if (!Section.schema.paths.classTeacherId) throw new Error("Section.classTeacherId path missing");
  if (!Section.schema.paths.classTeacherAssignedAt) throw new Error("Section.classTeacherAssignedAt path missing");
  if (!Section.schema.paths.classTeacherAssignedBy) throw new Error("Section.classTeacherAssignedBy path missing");
  if (!TeacherProfile.schema.paths.isClassTeacher) throw new Error("TeacherProfile.isClassTeacher path missing");
  if (!TeacherProfile.schema.paths.classTeacherOf) throw new Error("TeacherProfile.classTeacherOf path missing");
  if (!StudentResult) throw new Error("StudentResult model missing");
  if (!ReportCard) throw new Error("ReportCard model missing");
  console.log("✅ All schemas and model fields verified.");

  console.log("==========================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  console.log("==========================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("❌ Test Failed:", err);
  process.exit(1);
});
