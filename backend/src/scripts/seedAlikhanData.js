import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "../models/user.model.js";
import { TeacherProfile, ExamSchedule, Performance } from "../models/profile.model.js";
import { Grade, Section, Subject } from "../models/academic.model.js";
import TeacherSalaryProfile from "../models/teacherSalaryProfile.model.js";
import TeacherClassSession from "../models/teacherClassSession.model.js";
import Timetable from "../models/timetable.model.js";
import Diary from "../models/diary.model.js";
import Assignment from "../models/assignment.model.js";
import TeachingCreditConfig from "../models/teachingCreditConfig.model.js";

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const teacher = await User.findOne({ email: "alikhan0099@gmail.com" });
  if (!teacher) {
    throw new Error("Teacher alikhan0099@gmail.com not found");
  }

  const campusId = teacher.campusId;
  const teacherId = teacher._id;
  const teacherProfile = await TeacherProfile.findOne({ user: teacherId });

  console.log("Teacher User ID:", teacherId);
  console.log("Teacher Profile ID:", teacherProfile?._id);
  console.log("Campus ID:", campusId);

  // 1. Grade, Section, Subjects
  const grade10 = await Grade.findOne({ name: /Class 10/i });
  const sectionB = await Section.findOne({ name: /Section B/i });
  const mathSub = await Subject.findOne({ name: /Mathematics/i });
  const phySub = await Subject.findOne({ name: /Physics/i });
  const engSub = await Subject.findOne({ name: /English/i });

  // 2. Ensure TeachingCreditConfig exists
  let creditConfig = await TeachingCreditConfig.findOne({ campusId });
  if (!creditConfig) {
    creditConfig = await TeachingCreditConfig.create({
      campusId,
      creditPerCompletedPeriod: 1.0,
      creditForSubstitution: 1.0,
      bonusPerSubstituteClass: 500,
      requireApprovalForSubstituteBonus: false,
      requireApprovalForMissedDeduction: true,
      deductionMode: "Formula",
      perMissedClassDeduction: 0,
      missedClassFormulaMultiplier: 1.0,
      expectedPeriodsPerDay: 5,
      workingDaysPerMonth: 26,
      graceLateMinutes: 15,
      approvedLeaveDeducts: false,
      cancelledClassDeducts: false,
      payrollCutoffDay: 28,
    });
    console.log("Created TeachingCreditConfig");
  }

  // 3. Upsert TeacherSalaryProfile
  const salaryProf = await TeacherSalaryProfile.findOneAndUpdate(
    { teacherProfileId: teacherProfile._id },
    {
      $set: {
        campusId,
        teacherProfileId: teacherProfile._id,
        baseSalary: 85000,
        allowances: [
          { name: "Medical Allowance", amount: 10000 },
          { name: "Conveyance Allowance", amount: 8000 },
          { name: "Class Teacher Allowance", amount: 5000 },
        ],
        taxDeduction: 3500,
        otherDeduction: 1500,
        bankAccount: {
          bankName: "Meezan Bank Ltd",
          accountNumber: "01020304050607",
          iban: "PK36MEZN0001020304050607",
        },
        isActive: true,
      },
    },
    { upsert: true, new: true }
  );
  console.log("Salary profile configured. Base:", salaryProf.baseSalary);

  // 4. Timetable Entries for alikhan
  await Timetable.deleteMany({ teacherId });
  const timetableSlots = [
    {
      campusId,
      institutionType: "School",
      gradeId: grade10._id,
      sectionId: sectionB._id,
      subjectId: mathSub?._id,
      teacherId,
      instructor: teacher.name,
      className: "Class 10",
      program: "Class 10",
      section: "Section B",
      sectionName: "Section B",
      subject: "Mathematics",
      subjectName: "Mathematics",
      room: "Room 204",
      days: [1, 2, 3, 4, 5], // Mon - Fri
      period: 1,
      startTime: "08:00",
      endTime: "08:45",
      slotType: "period",
      status: "Active",
      targetAudience: "both",
    },
    {
      campusId,
      institutionType: "School",
      gradeId: grade10._id,
      sectionId: sectionB._id,
      subjectId: phySub?._id,
      teacherId,
      instructor: teacher.name,
      className: "Class 10",
      program: "Class 10",
      section: "Section B",
      sectionName: "Section B",
      subject: "Physics",
      subjectName: "Physics",
      room: "Physics Lab 1",
      days: [1, 2, 3, 4, 5], // Mon - Fri
      period: 2,
      startTime: "08:45",
      endTime: "09:30",
      slotType: "period",
      status: "Active",
      targetAudience: "both",
    },
    {
      campusId,
      institutionType: "School",
      gradeId: grade10._id,
      sectionId: sectionB._id,
      subjectId: engSub?._id,
      teacherId,
      instructor: teacher.name,
      className: "Class 10",
      program: "Class 10",
      section: "Section B",
      sectionName: "Section B",
      subject: "English Compulsory",
      subjectName: "English Compulsory",
      room: "Room 204",
      days: [1, 3, 5], // Mon, Wed, Fri
      period: 4,
      startTime: "09:45",
      endTime: "10:30",
      slotType: "period",
      status: "Active",
      targetAudience: "both",
    },
  ];

  await Timetable.insertMany(timetableSlots);
  console.log("Seeded Timetable slots:", timetableSlots.length);

  // 5. TeacherClassSessions (Current month credits)
  await TeacherClassSession.deleteMany({
    $or: [{ originalTeacherId: teacherId }, { actualTeacherId: teacherId }]
  });
  const sessionList = [];
  
  // Create 12 past completed sessions across current month
  for (let i = 1; i <= 6; i++) {
    const sDate = new Date(Date.UTC(2026, 9, 17 - i, 0, 0, 0, 0));
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][sDate.getUTCDay()];
    if (dayName === "Sunday") continue;

    sessionList.push({
      campusId,
      date: sDate,
      academicSession: "2026-2027",
      dayOfWeek: dayName,
      period: 1,
      startTime: "08:00",
      endTime: "08:45",
      gradeId: grade10._id,
      sectionId: sectionB._id,
      subjectId: mathSub?._id,
      className: "Class 10",
      section: "Section B",
      subject: "Mathematics",
      room: "Room 204",
      originalTeacherId: teacherId,
      actualTeacherId: teacherId,
      status: "Completed",
      creditValue: 1.0,
      markedAt: sDate,
      markedBy: teacherId,
      isSubstituted: false,
    });

    sessionList.push({
      campusId,
      date: sDate,
      academicSession: "2026-2027",
      dayOfWeek: dayName,
      period: 2,
      startTime: "08:45",
      endTime: "09:30",
      gradeId: grade10._id,
      sectionId: sectionB._id,
      subjectId: phySub?._id,
      className: "Class 10",
      section: "Section B",
      subject: "Physics",
      room: "Physics Lab 1",
      originalTeacherId: teacherId,
      actualTeacherId: teacherId,
      status: "Completed",
      creditValue: 1.0,
      markedAt: sDate,
      markedBy: teacherId,
      isSubstituted: false,
    });
  }

  // Today sessions (2026-10-17)
  const todayUtc = new Date(Date.UTC(2026, 9, 17, 0, 0, 0, 0));
  const todayDayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][todayUtc.getUTCDay()];

  sessionList.push({
    campusId,
    date: todayUtc,
    academicSession: "2026-2027",
    dayOfWeek: todayDayName,
    period: 1,
    startTime: "08:00",
    endTime: "08:45",
    gradeId: grade10._id,
    sectionId: sectionB._id,
    subjectId: mathSub?._id,
    className: "Class 10",
    section: "Section B",
    subject: "Mathematics",
    room: "Room 204",
    originalTeacherId: teacherId,
    actualTeacherId: teacherId,
    status: "Completed",
    creditValue: 1.0,
    markedAt: new Date(),
    markedBy: teacherId,
    isSubstituted: false,
  });

  sessionList.push({
    campusId,
    date: todayUtc,
    academicSession: "2026-2027",
    dayOfWeek: todayDayName,
    period: 2,
    startTime: "08:45",
    endTime: "09:30",
    gradeId: grade10._id,
    sectionId: sectionB._id,
    subjectId: phySub?._id,
    className: "Class 10",
    section: "Section B",
    subject: "Physics",
    room: "Physics Lab 1",
    originalTeacherId: teacherId,
    actualTeacherId: teacherId,
    status: "Scheduled",
    creditValue: 1.0,
    isSubstituted: false,
  });

  // 1 Substitute Session taken by alikhan for another class
  const subDate = new Date(Date.UTC(2026, 9, 15, 0, 0, 0, 0));
  const otherTeacherId = new mongoose.Types.ObjectId();
  sessionList.push({
    campusId,
    date: subDate,
    academicSession: "2026-2027",
    dayOfWeek: "Thursday",
    period: 3,
    startTime: "09:45",
    endTime: "10:30",
    className: "Class 9",
    section: "Section A",
    subject: "General Science",
    room: "Room 102",
    originalTeacherId: otherTeacherId,
    actualTeacherId: teacherId,
    status: "Completed",
    creditValue: 1.0,
    bonusValue: 500,
    isSubstituted: true,
    markedAt: subDate,
    markedBy: teacherId,
  });

  await TeacherClassSession.insertMany(sessionList);
  console.log("Seeded TeacherClassSessions count:", sessionList.length);

  // 6. Diary Entries
  await Diary.deleteMany({ teacherId });
  const baseDate = new Date();
  const todayStr = baseDate.toISOString().split("T")[0];
  const diaryList = [
    {
      campusId,
      teacherId,
      teacherName: teacher.name,
      classId: sectionB._id.toString(),
      className: "Class 10",
      gradeOrClass: "Class 10",
      section: "Section B",
      subject: "Mathematics",
      date: todayStr,
      dateObj: baseDate,
      title: "Quadratic Equations - Factorization & Formulas",
      recap: "Covered standard form ax^2 + bx + c = 0, derived quadratic formula, and solved 4 example problems on board with student participation.",
      homework: "Complete Exercise 2.1 Questions 1 to 5 in notebooks.",
      resources: "Textbook Chapter 2, Page 38-42",
      publicationStatus: "Published",
    },
    {
      campusId,
      teacherId,
      teacherName: teacher.name,
      classId: sectionB._id.toString(),
      className: "Class 10",
      gradeOrClass: "Class 10",
      section: "Section B",
      subject: "Physics",
      date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      dateObj: new Date(Date.now() - 86400000),
      title: "Newton's Laws of Motion & Momentum",
      recap: "Demonstrated inertia and discussed force-acceleration relationship F=ma with numerical examples.",
      homework: "Review lecture notes and solve review questions 3.1 - 3.4.",
      resources: "Physics Lab Kit 1",
      publicationStatus: "Published",
    },
  ];
  await Diary.insertMany(diaryList);
  console.log("Seeded Diary entries:", diaryList.length);

  // 7. Assignments
  await Assignment.deleteMany({ teacherId });
  const assignmentList = [
    {
      campusId,
      classId: sectionB._id,
      gradeId: grade10._id,
      sectionId: sectionB._id,
      subjectId: mathSub?._id,
      teacherId,
      instructor: teacher.name,
      title: "Mathematics Chapter 2 - Quadratic Equations Assignment",
      description: "Solve all problems step-by-step showing discriminant calculations and root nature.",
      subject: "Mathematics",
      className: "Class 10",
      gradeOrClass: "Class 10",
      section: "Section B",
      dueDate: new Date(Date.now() + 5 * 86400000),
      totalMarks: 25,
      status: "Active",
    },
    {
      campusId,
      classId: sectionB._id,
      gradeId: grade10._id,
      sectionId: sectionB._id,
      subjectId: phySub?._id,
      teacherId,
      instructor: teacher.name,
      title: "Physics Dynamics & Momentum Numerical Problems",
      description: "Complete numerical questions from Chapter 3 on conservation of momentum.",
      subject: "Physics",
      className: "Class 10",
      gradeOrClass: "Class 10",
      section: "Section B",
      dueDate: new Date(Date.now() + 7 * 86400000),
      totalMarks: 20,
      status: "Active",
    },
  ];
  await Assignment.insertMany(assignmentList);
  console.log("Seeded Assignments:", assignmentList.length);

  // 8. Exam Schedule & Performance for Gradebook
  await ExamSchedule.deleteMany({ campusId, className: "Class 10", section: "Section B" });
  const exam = await ExamSchedule.create({
    campusId,
    examName: "Midterm Examination 2026",
    examType: "Midterm",
    className: "Class 10",
    gradeOrClass: "Class 10",
    section: "Section B",
    subject: "Mathematics",
    examDate: new Date(Date.now() - 10 * 86400000),
    startTime: "09:00",
    endTime: "12:00",
    totalMarks: 100,
    teacherId,
  });

  const students = await User.find({ campusId, role: "student", gradeOrClass: /Class 10/i, section: /Section B|B/i });
  console.log("Students found for gradebook seeding:", students.length);

  await Performance.deleteMany({ examName: "Midterm Examination 2026", section: "Section B" });
  const sampleMarks = [88, 76, 92, 81];
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const marks = sampleMarks[i % sampleMarks.length];
    const pct = (marks / 100) * 100;
    const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : "C";
    const gpa = pct >= 90 ? 4.0 : pct >= 80 ? 3.7 : pct >= 70 ? 3.0 : 2.0;

    await Performance.create({
      studentId: s._id,
      examName: "Midterm Examination 2026",
      subject: "Mathematics",
      term: "Midterm",
      className: "Class 10",
      gradeOrClass: "Class 10",
      section: "Section B",
      marksObtained: marks,
      totalMarks: 100,
      grade,
      gpa,
      campusId,
    });
  }
  console.log("Seeded Gradebook exam & performances");

  await mongoose.disconnect();
  console.log("ALL DATA SEEDED SUCCESSFULLY!");
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
