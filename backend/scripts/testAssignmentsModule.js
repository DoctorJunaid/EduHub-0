import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../src/models/user.model.js";
import Campus from "../src/models/campus.model.js";
import Institute from "../src/models/institute.model.js";
import Timetable from "../src/models/timetable.model.js";
import Assignment from "../src/models/assignment.model.js";
import { Grade, Section, Subject } from "../src/models/academic.model.js";
import teacherAssignmentService from "../src/services/teacherAssignment.service.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED ASSERTION: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runTest() {
  console.log("================================================================");
  console.log("Starting End-to-End Test for Teacher Assignments & Grading Module");
  console.log("================================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB Atlas.");

  // 1. Locate or create campus and institute
  let campus = await Campus.findOne();
  if (!campus) {
    let inst = await Institute.create({ name: "Assignment Test Inst", email: "testinst@eduhub.com" });
    campus = await Campus.create({ name: "Assignment Test Campus", instituteId: inst._id, email: "camp@eduhub.com" });
  }
  const campusId = campus._id;

  // 2. Locate or create teacher
  let teacher = await User.findOne({ campusId, role: { $in: ["teacher", "faculty"] } });
  if (!teacher) {
    teacher = await User.create({
      name: "Mr. Zeeshan Ali",
      email: "zeeshan.teacher@eduhub.com",
      role: "faculty",
      campusId,
      department: "Biology",
    });
  }
  console.log(`Using Teacher: ${teacher.name} (${teacher.email})`);

  // 3. Ensure Grade, Section, Subject & Timetable class exists for this teacher
  let grade = await Grade.findOne({ campusId, name: "Class 10" });
  if (!grade) {
    grade = await Grade.create({ name: "Class 10", campusId, instituteId: campus.instituteId });
  }
  let section = await Section.findOne({ campusId, gradeId: grade._id, name: "A" });
  if (!section) {
    section = await Section.create({ name: "A", gradeId: grade._id, campusId, instituteId: campus.instituteId });
  }
  let subject = await Subject.findOne({ campusId, name: "Biology" });
  if (!subject) {
    subject = await Subject.create({ name: "Biology", code: "BIO-10", campusId, instituteId: campus.instituteId });
  }

  // Ensure Timetable slot exists for this teacher
  let timetableSlot = await Timetable.findOne({ campusId, teacherId: teacher._id });
  if (!timetableSlot) {
    timetableSlot = await Timetable.create({
      campusId,
      instituteId: campus.instituteId,
      institutionType: "School",
      gradeId: grade._id,
      sectionId: section._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      room: "Biology Lab",
      days: [1, 2, 3, 4, 5],
      startTime: "11:30",
      endTime: "12:15",
      status: "Active",
    });
  }

  // Ensure student exists in this class
  let student = await User.findOne({ campusId, role: "student" });
  if (!student) {
    student = await User.create({
      name: "Hamza Tariq",
      email: "hamza.student@eduhub.com",
      role: "student",
      campusId,
      gradeOrClass: "Class 10",
      section: "A",
      rollNumber: "BIO-001",
    });
  } else {
    // Ensure grade and section match
    student.gradeOrClass = "Class 10";
    student.section = "A";
    await student.save();
  }

  // -------------------------------------------------------------
  // STEP 1: Fetch Assigned Teacher Classes
  // -------------------------------------------------------------
  console.log("\n--- STEP 1: Fetch Assigned Teacher Classes ---");
  const assignedClasses = await teacherAssignmentService.getTeacherAssignedClasses(campusId, teacher._id);
  assert(assignedClasses.length > 0, `1. Retrieved ${assignedClasses.length} assigned class(es) for teacher.`);
  const targetClass = assignedClasses[0];
  console.log(`  Target Class: ${targetClass.className} - Section ${targetClass.section} (${targetClass.subject})`);

  // -------------------------------------------------------------
  // STEP 2: Create a New Assignment
  // -------------------------------------------------------------
  console.log("\n--- STEP 2: Create a New Assignment ---");
  const newAssignment = await teacherAssignmentService.createTeacherAssignment(campusId, teacher, {
    classId: targetClass._id,
    className: targetClass.className,
    section: targetClass.section,
    subject: targetClass.subject,
    title: "Cell Division & Mitosis Lab Report",
    description: "Submit written observations of onion root tip cells under 400x magnification.",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    totalMarks: 50,
  });

  assert(newAssignment && newAssignment.title === "Cell Division & Mitosis Lab Report", "2. Assignment successfully created in database.");
  assert(newAssignment.totalMarks === 50, "Total marks set to 50.");
  assert(String(newAssignment.teacherId) === String(teacher._id), "Teacher ID assigned correctly.");

  // -------------------------------------------------------------
  // STEP 3: List Teacher Assignments with Stats
  // -------------------------------------------------------------
  console.log("\n--- STEP 3: List Teacher Assignments ---");
  const teacherAssignments = await teacherAssignmentService.getTeacherAssignments(campusId, teacher._id);
  const foundAssignment = teacherAssignments.find((a) => String(a._id) === String(newAssignment._id));
  assert(foundAssignment, "3. Created assignment appears in teacher's assignment list.");
  assert(foundAssignment.submissionsCount === 0, "Initial submissions count is 0.");
  assert(foundAssignment.gradedCount === 0, "Initial graded count is 0.");

  // -------------------------------------------------------------
  // STEP 4: Student Submits Assignment
  // -------------------------------------------------------------
  console.log("\n--- STEP 4: Student Submits Assignment ---");
  const submittedAssignment = await teacherAssignmentService.submitStudentAssignment(newAssignment._id, student, {
    notes: "Attached are my microscope observations showing chromosomes at Metaphase.",
    attachmentUrl: "https://example.com/reports/hamza-bio-lab.pdf",
  });
  assert(submittedAssignment.submissions.length === 1, "4. Student submission recorded.");
  const sub = submittedAssignment.submissions[0];
  assert(sub.status === "Submitted", "Submission status is 'Submitted'.");
  assert(String(sub.studentId) === String(student._id), "Student ID matches.");

  // -------------------------------------------------------------
  // STEP 5: Teacher Views Roster & Submissions
  // -------------------------------------------------------------
  console.log("\n--- STEP 5: Teacher Views Submissions & Class Roster ---");
  const submissionsData = await teacherAssignmentService.getAssignmentSubmissions(newAssignment._id, campusId);
  assert(submissionsData.assignment && submissionsData.submissions.length > 0, "5. Submissions and roster retrieved successfully.");
  const studentEntry = submissionsData.submissions.find((s) => String(s.studentId) === String(student._id));
  assert(studentEntry && studentEntry.status === "Submitted", "Student submission appears as 'Submitted' in roster.");
  assert(studentEntry.notes.includes("microscope observations"), "Submission content verified.");

  // -------------------------------------------------------------
  // STEP 6: Teacher Grades the Submission
  // -------------------------------------------------------------
  console.log("\n--- STEP 6: Teacher Grades Submission ---");
  const gradingResult = await teacherAssignmentService.gradeSubmission(newAssignment._id, campusId, teacher, {
    submissionId: studentEntry._id,
    studentId: student._id,
    score: 46,
    feedback: "Exceptional diagrams and precise identification of cellular stages. Well done!",
  });

  assert(gradingResult.submission.score === 46, "6. Score of 46/50 recorded.");
  assert(gradingResult.submission.status === "Graded", "Status updated to 'Graded'.");
  assert(gradingResult.submission.feedback.includes("Exceptional diagrams"), "Grading feedback saved.");

  // -------------------------------------------------------------
  // STEP 7: Verify Aggregated Assignment Stats
  // -------------------------------------------------------------
  console.log("\n--- STEP 7: Verify Aggregated Assignment Metrics ---");
  const refreshedAssignments = await teacherAssignmentService.getTeacherAssignments(campusId, teacher._id);
  const updatedAssignment = refreshedAssignments.find((a) => String(a._id) === String(newAssignment._id));
  assert(updatedAssignment.gradedCount === 1, "7. Graded count updated to 1.");
  assert(updatedAssignment.avgScore === 46, "Average score computed as 46.");

  // -------------------------------------------------------------
  // STEP 8: Update Assignment Details
  // -------------------------------------------------------------
  console.log("\n--- STEP 8: Update Assignment ---");
  const updatedDoc = await teacherAssignmentService.updateTeacherAssignment(newAssignment._id, campusId, teacher, {
    title: "Cell Division Lab Report (Updated)",
    description: "Extended instructions for lab summary section.",
  });
  assert(updatedDoc.title === "Cell Division Lab Report (Updated)", "8. Assignment title updated.");

  console.log("\n================================================================");
  console.log("🎉 ALL TEACHER ASSIGNMENT & GRADING TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================\n");

  await mongoose.disconnect();
}

runTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
