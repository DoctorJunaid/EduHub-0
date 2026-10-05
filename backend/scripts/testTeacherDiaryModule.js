import mongoose from "mongoose";
import dotenv from "dotenv";
import assert from "node:assert";
import User from "../src/models/user.model.js";
import Diary from "../src/models/diary.model.js";
import * as diaryService from "../src/services/teacherDiary.service.js";

dotenv.config({ path: "backend/.env" });
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function runDiaryTest() {
  console.log("================================================================");
  console.log("Starting End-to-End Test for Teacher Daily Diary Module");
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

  // -------------------------------------------------------------
  // STEP 1: Fetch Assigned Teacher Classes
  // -------------------------------------------------------------
  console.log("\n--- STEP 1: Fetch Assigned Teacher Classes ---");
  const assignedClasses = await diaryService.getTeacherDiaryClasses(campusId, teacher._id);
  assert(assignedClasses.length > 0, "1. Successfully retrieved assigned class(es) for teacher.");
  const targetClass = assignedClasses[0];
  console.log(`  Target Class: ${targetClass.className} - Section ${targetClass.section} (${targetClass.subject})`);

  // -------------------------------------------------------------
  // STEP 2: Create a New Diary Entry
  // -------------------------------------------------------------
  console.log("\n--- STEP 2: Create a New Diary Entry ---");
  const todayStr = new Date().toISOString().split("T")[0];
  const newEntry = await diaryService.createDiaryEntry(campusId, teacher._id, {
    classId: targetClass._id,
    className: targetClass.className,
    section: targetClass.section,
    subject: targetClass.subject,
    date: todayStr,
    title: "Thermodynamics & Heat Transfer Principles",
    recap: "Introduced the First Law of Thermodynamics, energy conservation equations, and worked through 3 textbook numerical problems.",
    homework: "Complete Exercise 5.1 questions 1 to 6 in the class workbook.",
    resources: "Physics Textbook Vol 2, pp. 112-120; Interactive PhET Simulation on Heat Flow",
  });

  assert(newEntry && newEntry.title === "Thermodynamics & Heat Transfer Principles", "2. Diary entry created successfully in DB.");
  assert(String(newEntry.teacherId) === String(teacher._id), "Teacher attribution is correct.");
  console.log(`  Created Entry ID: ${newEntry._id}`);

  // -------------------------------------------------------------
  // STEP 3: List & Filter Diary Entries
  // -------------------------------------------------------------
  console.log("\n--- STEP 3: List & Filter Diary Entries ---");
  const entries = await diaryService.getTeacherDiaryEntries(campusId, teacher._id, {
    search: "Thermodynamics",
  });
  assert(entries.length > 0, "3. Search query returned matched diary entry.");
  const found = entries.find((e) => String(e._id) === String(newEntry._id));
  assert(found, "Found created entry in search results.");
  assert(found.homework.includes("Exercise 5.1"), "Homework text verified.");

  // -------------------------------------------------------------
  // STEP 4: Update Diary Entry
  // -------------------------------------------------------------
  console.log("\n--- STEP 4: Update Diary Entry ---");
  const updated = await diaryService.updateDiaryEntry(campusId, teacher._id, newEntry._id, {
    title: "Thermodynamics & Heat Transfer — Part 1 Updated",
    homework: "Exercise 5.1 (1-8) and read Section 5.2",
  });
  assert(updated.title.includes("Part 1 Updated"), "4. Diary entry title updated successfully.");
  assert(updated.homework.includes("1-8"), "Updated homework persisted.");

  // -------------------------------------------------------------
  // STEP 5: Direct MongoDB Verification
  // -------------------------------------------------------------
  console.log("\n--- STEP 5: Direct MongoDB Document Verification ---");
  const doc = await Diary.findById(newEntry._id).lean();
  assert(doc, "5. Verified document in MongoDB Atlas Diary collection.");
  assert(doc.title === "Thermodynamics & Heat Transfer — Part 1 Updated", "Title matches update.");
  console.log("  ✓ MongoDB document verified.");

  // -------------------------------------------------------------
  // STEP 6: Delete Diary Entry
  // -------------------------------------------------------------
  console.log("\n--- STEP 6: Delete Diary Entry ---");
  const delRes = await diaryService.deleteDiaryEntry(campusId, teacher._id, newEntry._id);
  assert(delRes.success, "6. Diary entry deleted successfully.");

  const deletedCheck = await Diary.findById(newEntry._id);
  assert(!deletedCheck, "Verified diary entry is removed from MongoDB.");

  console.log("\n================================================================");
  console.log("🎉 ALL TEACHER DAILY DIARY TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================\n");

  await mongoose.disconnect();
}

runDiaryTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
