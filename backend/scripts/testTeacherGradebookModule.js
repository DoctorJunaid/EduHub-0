import mongoose from "mongoose";
import dotenv from "dotenv";
import assert from "node:assert";
import User from "../src/models/user.model.js";
import { Performance } from "../src/models/profile.model.js";
import * as gradebookService from "../src/services/teacherGradebook.service.js";

dotenv.config({ path: "backend/.env" });
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function runGradebookTest() {
  console.log("================================================================");
  console.log("Starting End-to-End Test for Teacher Gradebook & Marks Module");
  console.log("================================================================");

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB Atlas.");

  // 1. Pick a Teacher
  let teacher = await User.findOne({ role: { $in: ["teacher", "faculty"] }, campusId: { $ne: null } }).lean();
  if (!teacher) {
    teacher = await User.findOne({ email: /teacher|tariq|zeeshan/i }).lean();
  }
  if (!teacher) {
    teacher = await User.findOne().lean();
  }
  assert(teacher, "Found teacher user for testing.");
  const campusId = teacher.campusId || new mongoose.Types.ObjectId();
  console.log(`Using Teacher: ${teacher.name} (${teacher.email}) [Campus: ${campusId}]`);

  // Ensure test students exist in this campus
  let testStudents = await User.find({ campusId, role: "student" }).limit(3).lean();
  if (testStudents.length < 2) {
    for (let i = 1; i <= 2; i++) {
      const s = await User.create({
        name: `Gradebook Test Student ${i}`,
        email: `gb_student${i}_${Date.now()}@eduhub.com`,
        passwordHash: "$2a$10$hashedtestdummy1234567890",
        role: "student",
        gradeOrClass: "Class 10",
        program: "Class 10",
        section: "A",
        rollNumber: `GB-${100 + i}`,
        campusId,
      });
      testStudents.push(s);
    }
  }
  const testStudent = testStudents[0];
  console.log(`Using Test Student: ${testStudent.name} (${testStudent.email})`);

  // -------------------------------------------------------------
  // STEP 1: Fetch Assigned Teacher Classes
  // -------------------------------------------------------------
  console.log("\n--- STEP 1: Fetch Assigned Teacher Classes ---");
  const assignedClasses = await gradebookService.getTeacherGradebookClasses(campusId, teacher._id);
  assert(assignedClasses.length > 0, "1. Successfully retrieved assigned class(es) for teacher.");
  const targetClass = assignedClasses[0];
  console.log(`  Target Class: ${targetClass.className} - Section ${targetClass.section} (${targetClass.subject})`);

  // -------------------------------------------------------------
  // STEP 2: Fetch Students in Target Class
  // -------------------------------------------------------------
  console.log("\n--- STEP 2: Fetch Enrolled Students in Class ---");
  const classStudents = await gradebookService.getGradebookStudents(campusId, teacher._id, {
    classId: targetClass._id,
    className: targetClass.className,
    section: targetClass.section,
  });
  assert(classStudents.length > 0, "2. Retrieved student roster for gradebook.");
  console.log(`  Found ${classStudents.length} student(s) in class cohort.`);

  // -------------------------------------------------------------
  // STEP 3: Fetch Available Exams / Assessment Types
  // -------------------------------------------------------------
  console.log("\n--- STEP 3: Fetch Exams & Assessment Types ---");
  const exams = await gradebookService.getGradebookExams(campusId, {
    className: targetClass.className,
    section: targetClass.section,
    subject: targetClass.subject,
  });
  assert(exams.length > 0, "3. Retrieved available exam and assessment presets.");
  console.log(`  Found ${exams.length} assessment options.`);

  // -------------------------------------------------------------
  // STEP 4: Record Marks for Student (88/100 -> A, 3.7 GPA)
  // -------------------------------------------------------------
  console.log("\n--- STEP 4: Record Student Marks ---");
  const savedRecord = await gradebookService.saveGradebookResult(campusId, teacher._id, {
    studentId: testStudent._id,
    examName: "Midterm Examination - Mathematics",
    subject: targetClass.subject || "Mathematics",
    term: "Midterm",
    className: targetClass.className,
    section: targetClass.section,
    marksObtained: 88,
    totalMarks: 100,
    remarks: "Outstanding problem solving in algebra and geometry.",
  });

  assert(savedRecord && savedRecord.marksObtained === 88, "4. Marks recorded successfully.");
  assert(savedRecord.percentage === 88, "Percentage computed as 88%.");
  assert(savedRecord.grade === "A", "Letter grade evaluated as 'A'.");
  assert(savedRecord.gpa === 3.7, "GPA computed as 3.7.");
  console.log(`  ✓ Record ID: ${savedRecord._id}, Grade: ${savedRecord.grade}, GPA: ${savedRecord.gpa}`);

  // -------------------------------------------------------------
  // STEP 5: Query Gradebook Results with Aggregates
  // -------------------------------------------------------------
  console.log("\n--- STEP 5: Query Gradebook Results with Aggregated Analytics ---");
  const queryData = await gradebookService.getGradebookResults(campusId, teacher._id, {
    className: targetClass.className,
    section: targetClass.section,
  });
  assert(queryData.results.length > 0, "5. Gradebook results list contains evaluations.");
  assert(queryData.stats.totalEvaluated >= 1, "Total evaluated count updated.");
  assert(queryData.stats.highestScore >= 88, "Highest score metric verified.");
  console.log(`  Class Average: ${queryData.stats.averagePercentage}%, Pass Rate: ${queryData.stats.passRate}%`);

  // -------------------------------------------------------------
  // STEP 6: Update Marks (95/100 -> A+, 4.0 GPA)
  // -------------------------------------------------------------
  console.log("\n--- STEP 6: Update Student Marks ---");
  const updatedRecord = await gradebookService.saveGradebookResult(campusId, teacher._id, {
    _id: savedRecord._id,
    studentId: testStudent._id,
    examName: "Midterm Examination - Mathematics",
    subject: targetClass.subject || "Mathematics",
    term: "Midterm",
    className: targetClass.className,
    section: targetClass.section,
    marksObtained: 95,
    totalMarks: 100,
    remarks: "Perfect score in derivation proofs.",
  });

  assert(updatedRecord.marksObtained === 95, "6. Marks updated to 95.");
  assert(updatedRecord.grade === "A+", "Letter grade updated to 'A+'.");
  assert(updatedRecord.gpa === 4.0, "GPA updated to 4.0.");
  console.log(`  ✓ Updated Grade: ${updatedRecord.grade}, GPA: ${updatedRecord.gpa}`);

  // -------------------------------------------------------------
  // STEP 7: Direct MongoDB Verification
  // -------------------------------------------------------------
  console.log("\n--- STEP 7: Direct MongoDB Document Verification ---");
  const doc = await Performance.findById(savedRecord._id).lean();
  assert(doc, "7. Found Performance document in MongoDB.");
  assert(doc.marksObtained === 95, "Marks obtained matches 95.");
  assert(String(doc.markedBy) === String(teacher._id), "MarkedBy attributed to teacher.");
  console.log("  ✓ MongoDB document verified.");

  // -------------------------------------------------------------
  // STEP 8: Delete Gradebook Record
  // -------------------------------------------------------------
  console.log("\n--- STEP 8: Delete Gradebook Record ---");
  const delRes = await gradebookService.deleteGradebookResult(campusId, teacher._id, savedRecord._id);
  assert(delRes.success, "8. Gradebook record deleted successfully.");

  const checkDeleted = await Performance.findById(savedRecord._id);
  assert(!checkDeleted, "Verified record is completely removed from DB.");

  console.log("\n================================================================");
  console.log("🎉 ALL TEACHER GRADEBOOK & MARKS TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================\n");

  await mongoose.disconnect();
}

runGradebookTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
