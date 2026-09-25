/**
 * Presentation Seeder for EduHub Campus Manager & Faculty Modules
 * 
 * 1. Cleans out non-relevant / orphan / legacy data for the target campus.
 * 2. Seeds clean academic structure (Grades, Sections, Subjects, GradeSubjects).
 * 3. Seeds 6 distinguished Faculty members with profiles and salary profiles.
 * 4. Seeds 16 students across classes with student profiles and roll numbers.
 * 5. Seeds complete weekly Timetable (Monday-Friday, 5 periods/day).
 * 6. Seeds Campus TeachingCreditConfig.
 * 7. Seeds live TeacherClassSessions with rich demo states:
 *    - Today's completed & scheduled classes (ready for live 1-click completion)
 *    - Pending missed class deductions in Salary Review Center
 *    - Pending substitute bonuses in Salary Review Center
 *    - Live pending teacher dispute ready to be resolved on screen
 *    - Historical approved deductions & bonuses
 * 8. Seeds teacher attendance records.
 * 9. Seeds monthly payroll records with allowances, deductions, and payslips.
 */

import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/user.model.js";
import Campus from "../src/models/campus.model.js";
import Institute from "../src/models/institute.model.js";
import { Grade, Section, Subject, GradeSubject, TeacherAssignment } from "../src/models/academic.model.js";
import {
  TeacherProfile,
  StudentProfile,
  ClassSchedule,
  StudentAttendance,
} from "../src/models/profile.model.js";
import TeacherAttendance from "../src/models/teacherAttendance.model.js";
import { TeacherSalaryProfile } from "../src/models/teacherSalaryProfile.model.js";
import { MonthlyPayroll } from "../src/models/monthlyPayroll.model.js";
import { SubstituteAssignment } from "../src/models/substituteAssignment.model.js";
import Timetable from "../src/models/timetable.model.js";
import TeacherClassSession from "../src/models/teacherClassSession.model.js";
import TeachingCreditConfig from "../src/models/teachingCreditConfig.model.js";

function getUtcMidnight(dateInput) {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

async function runPresentationSeed() {
  console.log("==================================================================");
  console.log("  EduHub Campus Presentation Data Seeder");
  console.log("==================================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ Connected to MongoDB Atlas.");

  // Target Campus: Islamabad Main Campus or first active campus
  let campus = await Campus.findOne({ name: "Islamabad Main Campus" });
  if (!campus) {
    campus = await Campus.findOne();
  }

  if (!campus) {
    console.error("❌ No campus found in database!");
    process.exit(1);
  }

  const campusId = campus._id;
  const instituteId = campus.instituteId;
  console.log(`✓ Using Target Campus: "${campus.name}" (${campusId})`);

  // Ensure Campus Manager exists with known login: manager@eduhub.com / manager123
  let manager = await User.findOne({ campusId, role: "campus_manager" });
  if (!manager) {
    const managerPasswordHash = await bcrypt.hash("manager123", 8);
    manager = await User.create({
      name: "Campus Manager",
      email: "manager@eduhub.com",
      passwordHash: managerPasswordHash,
      role: "campus_manager",
      campusId,
      instituteId,
      status: "Active",
    });
    console.log("✓ Created default Campus Manager (manager@eduhub.com / manager123)");
  } else {
    console.log(`✓ Existing Campus Manager found: ${manager.name} (${manager.email})`);
  }

  // -------------------------------------------------------------
  // 1. CLEAN OUT STALE / NON-RELEVANT / ORPHAN DATA
  // -------------------------------------------------------------
  console.log("\n--- 1. Cleaning non-relevant and orphan data ---");
  const delClassSchedules = await ClassSchedule.deleteMany({ campusId });
  console.log(`  ✓ Cleared ${delClassSchedules.deletedCount} legacy ClassSchedule entries.`);

  const delSalaries = await TeacherSalaryProfile.deleteMany({ campusId });
  console.log(`  ✓ Cleared ${delSalaries.deletedCount} old TeacherSalaryProfiles.`);

  const delPayrolls = await MonthlyPayroll.deleteMany({ campusId });
  console.log(`  ✓ Cleared ${delPayrolls.deletedCount} old MonthlyPayrolls.`);

  const delSessions = await TeacherClassSession.deleteMany({ campusId });
  console.log(`  ✓ Cleared ${delSessions.deletedCount} old TeacherClassSessions.`);

  const delSubs = await SubstituteAssignment.deleteMany({ campusId });
  console.log(`  ✓ Cleared ${delSubs.deletedCount} old SubstituteAssignments.`);

  const delTimetables = await Timetable.deleteMany({ campusId });
  console.log(`  ✓ Cleared ${delTimetables.deletedCount} old Timetable slots.`);

  const delTeacherAttend = await TeacherAttendance.deleteMany({ campusId });
  console.log(`  ✓ Cleared ${delTeacherAttend.deletedCount} old TeacherAttendance records.`);

  const delStudentAttend = await StudentAttendance.deleteMany({ campusId });
  console.log(`  ✓ Cleared ${delStudentAttend.deletedCount} old StudentAttendance records.`);

  // Clear existing student & teacher profiles and non-manager users for this campus
  const campusUsers = await User.find({ campusId, role: { $in: ["teacher", "faculty", "student"] } }).select("_id");
  const campusUserIds = campusUsers.map(u => u._id);
  await StudentProfile.deleteMany({
    $or: [{ user: { $in: campusUserIds } }, { studentId: { $regex: /^STD-ISB-/ } }],
  });
  await TeacherProfile.deleteMany({
    $or: [{ user: { $in: campusUserIds } }, { employeeId: { $regex: /^EMP-ISB-/ } }],
  });
  await User.deleteMany({ campusId, role: { $in: ["teacher", "faculty", "student"] } });
  console.log(`  ✓ Cleared old teacher and student user accounts & profiles.`);

  // Clean messy duplicate grades/sections
  await GradeSubject.deleteMany({ campusId });
  await TeacherAssignment.deleteMany({ campusId });
  await Section.deleteMany({ campusId });
  await Grade.deleteMany({ campusId });
  console.log(`  ✓ Cleared old Grade, Section, GradeSubject, and TeacherAssignment records.`);

  // -------------------------------------------------------------
  // 2. SEED CLEAN ACADEMIC STRUCTURE
  // -------------------------------------------------------------
  console.log("\n--- 2. Seeding Academic Structure (Grades, Sections, Subjects) ---");
  const gradeNames = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  const grades = [];
  for (const name of gradeNames) {
    const g = await Grade.create({
      name,
      description: `Secondary curriculum for ${name}`,
      campusId,
      instituteId,
    });
    grades.push(g);
  }
  console.log(`  ✓ Created ${grades.length} Grades (Class 6 to Class 10).`);

  const sections = [];
  for (const grade of grades) {
    const secA = await Section.create({ name: "Section A", gradeId: grade._id, campusId, instituteId });
    const secB = await Section.create({ name: "Section B", gradeId: grade._id, campusId, instituteId });
    sections.push(secA, secB);
  }
  console.log(`  ✓ Created ${sections.length} Sections (A and B for each grade).`);

  const subjectsCatalog = [
    { name: "Mathematics", code: "MATH", description: "General and Advanced Mathematics" },
    { name: "Physics", code: "PHY", description: "Theoretical and Applied Physics" },
    { name: "Chemistry", code: "CHEM", description: "Inorganic and Organic Chemistry" },
    { name: "Biology", code: "BIO", description: "General Biology and Life Sciences" },
    { name: "Computer Science", code: "CS", description: "Programming and Computational Thinking" },
    { name: "English Language", code: "ENG", description: "Grammar, Composition, and Literature" },
    { name: "Pakistan Studies", code: "PAK-ST", description: "History and Geography of Pakistan" },
    { name: "Islamic Studies", code: "ISL", description: "Islamiat and Ethics" },
  ];

  const subjects = [];
  for (const item of subjectsCatalog) {
    let sub = await Subject.findOne({ campusId, name: item.name });
    if (!sub) {
      sub = await Subject.create({ ...item, campusId, instituteId });
    }
    subjects.push(sub);
  }
  console.log(`  ✓ Created/verified ${subjects.length} core Subjects.`);

  // Link GradeSubject
  for (const grade of grades) {
    for (const sub of subjects) {
      await GradeSubject.create({ gradeId: grade._id, subjectId: sub._id, campusId, instituteId });
    }
  }
  console.log(`  ✓ Mapped all Subjects to Grades in GradeSubject.`);

  // -------------------------------------------------------------
  // 3. SEED 6 DISTINGUISHED FACULTY MEMBERS
  // -------------------------------------------------------------
  console.log("\n--- 3. Seeding 6 Distinguished Faculty Members ---");
  const teacherPasswordHash = await bcrypt.hash("teacher123", 8);

  const facultyData = [
    {
      name: "Dr. Tariq Mansoor",
      email: "tariq.mansoor@eduhub.com",
      department: "Mathematics",
      designation: "Senior Lecturer & HOD",
      qualification: "Ph.D. in Applied Mathematics",
      phone: "+92 300 5111222",
      baseSalary: 65000,
      employeeId: "EMP-ISB-001",
      primarySubject: "Mathematics",
    },
    {
      name: "Prof. Ayesha Siddiqui",
      email: "ayesha.siddiqui@eduhub.com",
      department: "Physics",
      designation: "Associate Professor",
      qualification: "M.Phil in Physics",
      phone: "+92 300 5222333",
      baseSalary: 60000,
      employeeId: "EMP-ISB-002",
      primarySubject: "Physics",
    },
    {
      name: "Sir Hamza Farooq",
      email: "hamza.farooq@eduhub.com",
      department: "Computer Science",
      designation: "Assistant Professor",
      qualification: "MS in Computer Science",
      phone: "+92 300 5333444",
      baseSalary: 55000,
      employeeId: "EMP-ISB-003",
      primarySubject: "Computer Science",
    },
    {
      name: "Dr. Fatima Zahra",
      email: "fatima.zahra@eduhub.com",
      department: "Chemistry",
      designation: "Lecturer",
      qualification: "Ph.D. in Chemistry",
      phone: "+92 300 5444555",
      baseSalary: 52000,
      employeeId: "EMP-ISB-004",
      primarySubject: "Chemistry",
    },
    {
      name: "Mr. Usman Bilal",
      email: "usman.bilal@eduhub.com",
      department: "English",
      designation: "Senior Instructor",
      qualification: "M.A. English Literature",
      phone: "+92 300 5555666",
      baseSalary: 48000,
      employeeId: "EMP-ISB-005",
      primarySubject: "English Language",
    },
    {
      name: "Mr. Zeeshan Ali",
      email: "zeeshan.ali@eduhub.com",
      department: "General Sciences",
      designation: "Lecturer & Substitute Specialist",
      qualification: "M.Sc General Sciences",
      phone: "+92 300 5666777",
      baseSalary: 45000,
      employeeId: "EMP-ISB-006",
      primarySubject: "Biology",
    },
  ];

  const teachers = [];
  const teacherProfiles = [];

  for (const f of facultyData) {
    const user = await User.create({
      name: f.name,
      email: f.email,
      passwordHash: teacherPasswordHash,
      role: "faculty",
      campusId,
      instituteId,
      department: f.department,
      designation: f.designation,
      phone: f.phone,
      status: "Active",
    });

    const profile = await TeacherProfile.create({
      user: user._id,
      employeeId: f.employeeId,
      department: f.department,
      designation: f.designation,
      qualification: f.qualification,
      subjectsTaught: [f.primarySubject],
      hireDate: new Date("2024-01-15"),
      isActive: true,
    });

    await TeacherSalaryProfile.create({
      campusId,
      teacherProfileId: profile._id,
      baseSalary: f.baseSalary,
      effectiveDate: new Date("2026-01-01"),
      isActive: true,
    });

    teachers.push({ ...f, user, profile });
    teacherProfiles.push(profile);
  }
  console.log(`  ✓ Seeded 6 faculty members with profiles and salary configurations.`);

  // -------------------------------------------------------------
  // 4. SEED 16 ACTIVE STUDENTS
  // -------------------------------------------------------------
  console.log("\n--- 4. Seeding 16 Active Students ---");
  const studentPasswordHash = await bcrypt.hash("student123", 8);

  const studentsList = [
    { name: "Muhammad Ali", gender: "Male", gradeIndex: 3, secIndex: 0 },
    { name: "Sara Ahmed", gender: "Female", gradeIndex: 3, secIndex: 0 },
    { name: "Zainab Fatima", gender: "Female", gradeIndex: 3, secIndex: 1 },
    { name: "Omar Farooq", gender: "Male", gradeIndex: 3, secIndex: 1 },
    { name: "Hamza Malik", gender: "Male", gradeIndex: 4, secIndex: 0 },
    { name: "Areeba Khan", gender: "Female", gradeIndex: 4, secIndex: 0 },
    { name: "Bilal Tariq", gender: "Male", gradeIndex: 4, secIndex: 1 },
    { name: "Hassan Raza", gender: "Male", gradeIndex: 4, secIndex: 1 },
    { name: "Ayesha Noor", gender: "Female", gradeIndex: 2, secIndex: 0 },
    { name: "Usman Ghani", gender: "Male", gradeIndex: 2, secIndex: 1 },
    { name: "Mariam Bibi", gender: "Female", gradeIndex: 1, secIndex: 0 },
    { name: "Abdullah Shah", gender: "Male", gradeIndex: 1, secIndex: 1 },
    { name: "Khadija Rehman", gender: "Female", gradeIndex: 0, secIndex: 0 },
    { name: "Zayd Hashmi", gender: "Male", gradeIndex: 0, secIndex: 1 },
    { name: "Anum Tariq", gender: "Female", gradeIndex: 4, secIndex: 0 },
    { name: "Danyal Mirza", gender: "Male", gradeIndex: 3, secIndex: 0 },
  ];

  let studentCount = 0;
  for (const s of studentsList) {
    studentCount++;
    const gradeDoc = grades[s.gradeIndex];
    // Find Section corresponding to this grade
    const gradeSections = sections.filter(sec => sec.gradeId.toString() === gradeDoc._id.toString());
    const secDoc = gradeSections[s.secIndex] || gradeSections[0];

    const email = `${s.name.toLowerCase().replace(/\s+/g, ".")}${studentCount}@eduhub.com`;
    const studentUser = await User.create({
      name: s.name,
      email,
      passwordHash: studentPasswordHash,
      role: "student",
      campusId,
      instituteId,
      phone: `+92 312 000${studentCount.toString().padStart(4, "0")}`,
      status: "Active",
    });

    const rollNum = `C${s.gradeIndex + 6}${s.secIndex === 0 ? "A" : "B"}-${studentCount.toString().padStart(3, "0")}`;
    await StudentProfile.create({
      user: studentUser._id,
      studentId: `STD-ISB-${studentCount.toString().padStart(4, "0")}`,
      gradeId: gradeDoc._id,
      sectionId: secDoc._id,
      rollNumber: rollNum,
      guardianDetails: {
        name: `Guardian of ${s.name}`,
        phone: "+92 300 1234567",
        relation: s.gender === "Male" ? "Father" : "Mother",
      },
      enrollmentDate: new Date("2025-08-15"),
      isActive: true,
    });
  }
  console.log(`  ✓ Seeded ${studentCount} students across Grades 6 to 10 with profiles.`);

  // -------------------------------------------------------------
  // 5. SEED TIMETABLE SCHEDULE (Monday - Friday, 5 periods/day)
  // -------------------------------------------------------------
  console.log("\n--- 5. Seeding Timetable Matrix (Monday to Friday) ---");
  const periodSlots = [
    { periodNum: 1, startTime: "08:00", endTime: "08:45" },
    { periodNum: 2, startTime: "08:45", endTime: "09:30" },
    { periodNum: 3, startTime: "09:45", endTime: "10:30" },
    { periodNum: 4, startTime: "10:30", endTime: "11:15" },
    { periodNum: 5, startTime: "11:30", endTime: "12:15" },
  ];

  const weekdays = [1, 2, 3, 4, 5]; // Mon to Fri
  const createdSlots = [];

  // Find Class 10 Section A and Section B, Class 9 Section A
  const class10 = grades.find(g => g.name === "Class 10");
  const class9 = grades.find(g => g.name === "Class 9");
  const class8 = grades.find(g => g.name === "Class 8");

  const sec10A = sections.find(s => s.gradeId.toString() === class10._id.toString() && s.name === "Section A");
  const sec10B = sections.find(s => s.gradeId.toString() === class10._id.toString() && s.name === "Section B");
  const sec9A = sections.find(s => s.gradeId.toString() === class9._id.toString() && s.name === "Section A");

  const subMath = subjects.find(s => s.name === "Mathematics");
  const subPhysics = subjects.find(s => s.name === "Physics");
  const subCS = subjects.find(s => s.name === "Computer Science");
  const subChem = subjects.find(s => s.name === "Chemistry");
  const subEng = subjects.find(s => s.name === "English Language");
  const subBio = subjects.find(s => s.name === "Biology");

  // Create standard schedule matrix
  const timetableMatrix = [
    // Period 1: Class 10-A Math (Dr. Tariq Mansoor, Room 101)
    {
      institutionType: "School",
      gradeId: class10._id,
      sectionId: sec10A._id,
      subjectId: subMath._id,
      teacherId: teachers[0].user._id,
      room: "Room 101",
      days: weekdays,
      startTime: "08:00",
      endTime: "08:45",
      status: "Active",
    },
    // Period 2: Class 9-A Math (Dr. Tariq Mansoor, Room 102)
    {
      institutionType: "School",
      gradeId: class9._id,
      sectionId: sec9A._id,
      subjectId: subMath._id,
      teacherId: teachers[0].user._id,
      room: "Room 102",
      days: weekdays,
      startTime: "08:45",
      endTime: "09:30",
      status: "Active",
    },
    // Period 3: Class 10-B Math (Dr. Tariq Mansoor, Room 103)
    {
      institutionType: "School",
      gradeId: class10._id,
      sectionId: sec10B._id,
      subjectId: subMath._id,
      teacherId: teachers[0].user._id,
      room: "Room 103",
      days: weekdays,
      startTime: "09:45",
      endTime: "10:30",
      status: "Active",
    },
    // Period 1: Class 10-B Physics (Prof. Ayesha Siddiqui, Lab 1)
    {
      institutionType: "School",
      gradeId: class10._id,
      sectionId: sec10B._id,
      subjectId: subPhysics._id,
      teacherId: teachers[1].user._id,
      room: "Physics Lab",
      days: weekdays,
      startTime: "08:00",
      endTime: "08:45",
      status: "Active",
    },
    // Period 4: Class 10-A Physics (Prof. Ayesha Siddiqui, Lab 1)
    {
      institutionType: "School",
      gradeId: class10._id,
      sectionId: sec10A._id,
      subjectId: subPhysics._id,
      teacherId: teachers[1].user._id,
      room: "Physics Lab",
      days: weekdays,
      startTime: "10:30",
      endTime: "11:15",
      status: "Active",
    },
    // Period 2: Class 10-A CS (Sir Hamza Farooq, CS Lab)
    {
      institutionType: "School",
      gradeId: class10._id,
      sectionId: sec10A._id,
      subjectId: subCS._id,
      teacherId: teachers[2].user._id,
      room: "CS Lab 1",
      days: weekdays,
      startTime: "08:45",
      endTime: "09:30",
      status: "Active",
    },
    // Period 5: Class 9-A CS (Sir Hamza Farooq, CS Lab)
    {
      institutionType: "School",
      gradeId: class9._id,
      sectionId: sec9A._id,
      subjectId: subCS._id,
      teacherId: teachers[2].user._id,
      room: "CS Lab 1",
      days: weekdays,
      startTime: "11:30",
      endTime: "12:15",
      status: "Active",
    },
    // Period 3: Class 10-A Chemistry (Dr. Fatima Zahra, Science Lab)
    {
      institutionType: "School",
      gradeId: class10._id,
      sectionId: sec10A._id,
      subjectId: subChem._id,
      teacherId: teachers[3].user._id,
      room: "Chemistry Lab",
      days: weekdays,
      startTime: "09:45",
      endTime: "10:30",
      status: "Active",
    },
    // Period 4: Class 9-A English (Mr. Usman Bilal, Room 102)
    {
      institutionType: "School",
      gradeId: class9._id,
      sectionId: sec9A._id,
      subjectId: subEng._id,
      teacherId: teachers[4].user._id,
      room: "Room 102",
      days: weekdays,
      startTime: "10:30",
      endTime: "11:15",
      status: "Active",
    },
    // Period 5: Class 10-A Biology (Mr. Zeeshan Ali, Biology Lab)
    {
      institutionType: "School",
      gradeId: class10._id,
      sectionId: sec10A._id,
      subjectId: subBio._id,
      teacherId: teachers[5].user._id,
      room: "Biology Lab",
      days: weekdays,
      startTime: "11:30",
      endTime: "12:15",
      status: "Active",
    },
  ];

  for (const slot of timetableMatrix) {
    const created = await Timetable.create({
      ...slot,
      campusId,
      instituteId,
    });
    createdSlots.push(created);

    // Also populate TeacherAssignment
    try {
      await TeacherAssignment.create({
        teacherId: slot.teacherId,
        gradeId: slot.gradeId,
        sectionId: slot.sectionId,
        subjectId: slot.subjectId,
        campusId,
        instituteId,
      });
    } catch (e) {}
  }
  console.log(`  ✓ Seeded ${createdSlots.length} Timetable slot templates across Monday-Friday.`);

  // -------------------------------------------------------------
  // 6. SEED TEACHING CREDIT CONFIGURATION
  // -------------------------------------------------------------
  console.log("\n--- 6. Seeding Campus Teaching Credit Configuration ---");
  const config = await TeachingCreditConfig.findOneAndUpdate(
    { campusId },
    {
      creditPerCompletedPeriod: 1.0,
      creditForSubstitution: 1.0,
      bonusPerSubstituteClass: 800,
      requireApprovalForSubstituteBonus: true,
      requireApprovalForMissedDeduction: true,
      deductionMode: "Formula",
      missedClassFormulaMultiplier: 1.0,
      expectedPeriodsPerDay: 5,
      workingDaysPerMonth: 26,
    },
    { upsert: true, returnDocument: "after" }
  );
  console.log("  ✓ Configured Credit Rules: 1.0 credit/class, PKR 800 substitute bonus, Formula deduction.");

  // -------------------------------------------------------------
  // 7. SEED LIVE TEACHER CLASS SESSIONS FOR PRESENTATION
  // -------------------------------------------------------------
  console.log("\n--- 7. Seeding Live Class Sessions & Salary Review Data ---");
  const today = getUtcMidnight(new Date());
  const todayISO = today.toISOString().split("T")[0];

  function getDayName(d) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date(d).getUTCDay()];
  }

  async function createSession(data) {
    const sessionDate = getUtcMidnight(data.date);
    const filter = {
      campusId,
      date: sessionDate,
      period: data.period || 1,
      originalTeacherId: data.originalTeacherId,
      className: data.className || "Class 10",
      section: data.section || "Section A",
    };
    const update = {
      $set: {
        campusId,
        timetableId: data.timetableId || null,
        academicSession: "2026-2027",
        date: sessionDate,
        dayOfWeek: data.dayOfWeek || getDayName(sessionDate),
        period: data.period || 1,
        startTime: data.startTime,
        endTime: data.endTime,
        gradeId: data.gradeId || null,
        sectionId: data.sectionId || null,
        subjectId: data.subjectId || null,
        className: data.className || "Class 10",
        section: data.section || "Section A",
        subject: data.subject || "Mathematics",
        room: data.room || "Room 101",
        originalTeacherId: data.originalTeacherId,
        actualTeacherId: data.actualTeacherId || data.originalTeacherId,
        isSubstituted: Boolean(data.isSubstituted),
        status: data.status || "Scheduled",
        teachingCreditAwarded: data.teachingCreditAwarded || 0,
        substitutionCreditAwarded: data.substitutionCreditAwarded || 0,
        substituteBonusValue: data.substituteBonusValue || 0,
        missedDeductionValue: data.missedDeductionValue || 0,
        adjustmentReview: data.adjustmentReview || { status: "None" },
        dispute: data.dispute || { isDisputed: false, disputeStatus: "None" },
      },
    };
    return await TeacherClassSession.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: "after",
    });
  }

  // TODAY SESSIONS:
  // Dr. Tariq Mansoor (3 classes today):
  // 1. Period 1: Completed (+1.0 credit)
  await createSession({
    timetableId: createdSlots[0]._id,
    gradeId: class10._id,
    sectionId: sec10A._id,
    subjectId: subMath._id,
    className: "Class 10",
    section: "Section A",
    subject: "Mathematics",
    originalTeacherId: teachers[0].user._id,
    actualTeacherId: teachers[0].user._id,
    date: today,
    period: 1,
    startTime: "08:00",
    endTime: "08:45",
    room: "Room 101",
    status: "Completed",
    teachingCreditAwarded: 1.0,
  });

  // 2. Period 2: Scheduled (READY FOR 1-CLICK LIVE DEMO!)
  await createSession({
    timetableId: createdSlots[1]._id,
    gradeId: class9._id,
    sectionId: sec9A._id,
    subjectId: subMath._id,
    className: "Class 9",
    section: "Section A",
    subject: "Mathematics",
    originalTeacherId: teachers[0].user._id,
    actualTeacherId: teachers[0].user._id,
    date: today,
    period: 2,
    startTime: "08:45",
    endTime: "09:30",
    room: "Room 102",
    status: "Scheduled",
  });

  // 3. Period 3: Missed (Unexcused) -> Deduction PKR 500 Pending Manager Review in Salary Review Center
  await createSession({
    timetableId: createdSlots[2]._id,
    gradeId: class10._id,
    sectionId: sec10B._id,
    subjectId: subMath._id,
    className: "Class 10",
    section: "Section B",
    subject: "Mathematics",
    originalTeacherId: teachers[0].user._id,
    actualTeacherId: teachers[0].user._id,
    date: today,
    period: 3,
    startTime: "09:45",
    endTime: "10:30",
    room: "Room 103",
    status: "Missed",
    missedDeductionValue: 500,
    adjustmentReview: {
      status: "Pending Review",
      proposedDeduction: 500,
      reviewRemark: "Teacher reported absent for Period 3 by section monitor",
    },
  });

  // Mr. Zeeshan Ali (Substituted today for Dr. Fatima Zahra in Chemistry):
  // Bonus PKR 800 Pending Manager Review
  await createSession({
    timetableId: createdSlots[7]._id,
    gradeId: class10._id,
    sectionId: sec10A._id,
    subjectId: subChem._id,
    className: "Class 10",
    section: "Section A",
    subject: "Chemistry",
    originalTeacherId: teachers[3].user._id, // Dr. Fatima Zahra (Original)
    actualTeacherId: teachers[5].user._id,    // Mr. Zeeshan Ali (Substitute)
    date: today,
    period: 3,
    startTime: "09:45",
    endTime: "10:30",
    room: "Chemistry Lab",
    status: "Completed",
    isSubstituted: true,
    substitutionCreditAwarded: 1.0,
    substituteBonusValue: 800,
    adjustmentReview: {
      status: "Pending Review",
      proposedBonus: 800,
      reviewRemark: "Successfully conducted Chemistry laboratory practical session",
    },
  });

  // Sir Hamza Farooq (CS - Period 2 Completed today)
  await createSession({
    timetableId: createdSlots[5]._id,
    gradeId: class10._id,
    sectionId: sec10A._id,
    subjectId: subCS._id,
    className: "Class 10",
    section: "Section A",
    subject: "Computer Science",
    originalTeacherId: teachers[2].user._id,
    actualTeacherId: teachers[2].user._id,
    date: today,
    period: 2,
    startTime: "08:45",
    endTime: "09:30",
    room: "CS Lab 1",
    status: "Completed",
    teachingCreditAwarded: 1.0,
  });

  // HISTORICAL SESSIONS (PAST 7 DAYS):
  // 1. A PENDING DISPUTE for Dr. Tariq Mansoor (ready for live resolution demo!)
  const disputeDate = new Date(today);
  disputeDate.setDate(disputeDate.getDate() - 2);

  await createSession({
    timetableId: createdSlots[0]._id,
    gradeId: class10._id,
    sectionId: sec10A._id,
    subjectId: subMath._id,
    className: "Class 10",
    section: "Section A",
    subject: "Mathematics",
    originalTeacherId: teachers[0].user._id,
    actualTeacherId: teachers[0].user._id,
    date: disputeDate,
    period: 1,
    startTime: "08:00",
    endTime: "08:45",
    room: "Room 101",
    status: "Missed",
    missedDeductionValue: 500,
    adjustmentReview: {
      status: "Approved",
      proposedDeduction: 500,
      reviewedBy: manager._id,
      reviewedAt: new Date(disputeDate),
      reviewRemark: "Auto-flagged unexcused absence",
    },
    dispute: {
      isDisputed: true,
      disputeStatus: "Pending",
      disputeReason: "Classroom projector malfunctioned in Room 101; session was relocated to Computer Lab 2 and conducted with 28 students present.",
      disputedAt: new Date(),
    },
  });

  // 2. A RESOLVED DISPUTE from last week for Mr. Usman Bilal
  const resolvedDate = new Date(today);
  resolvedDate.setDate(resolvedDate.getDate() - 5);

  await createSession({
    timetableId: createdSlots[8]._id,
    gradeId: class9._id,
    sectionId: sec9A._id,
    subjectId: subEng._id,
    className: "Class 9",
    section: "Section A",
    subject: "English Language",
    originalTeacherId: teachers[4].user._id,
    actualTeacherId: teachers[4].user._id,
    date: resolvedDate,
    period: 4,
    startTime: "10:30",
    endTime: "11:15",
    room: "Room 102",
    status: "Approved Adjustment",
    teachingCreditAwarded: 1.0,
    missedDeductionValue: 0,
    adjustmentReview: {
      status: "Approved",
      reviewedBy: manager._id,
      reviewedAt: new Date(resolvedDate),
      reviewRemark: "Reversed deduction after verification with Department Chair",
    },
    dispute: {
      isDisputed: true,
      disputeStatus: "Approved",
      disputeReason: "Attended mandatory inter-school speech competition with students.",
      disputedAt: new Date(resolvedDate),
      resolvedBy: manager._id,
      resolvedAt: new Date(),
      resolutionRemark: "Verified with Dean; official co-curricular duty confirmed. Deduction reversed.",
    },
  });

  // 3. Approved Substitute Bonus from 4 days ago for Mr. Zeeshan Ali
  const pastSubDate = new Date(today);
  pastSubDate.setDate(pastSubDate.getDate() - 4);

  await createSession({
    timetableId: createdSlots[3]._id,
    gradeId: class10._id,
    sectionId: sec10B._id,
    subjectId: subPhysics._id,
    className: "Class 10",
    section: "Section B",
    subject: "Physics",
    originalTeacherId: teachers[1].user._id, // Prof Ayesha
    actualTeacherId: teachers[5].user._id,    // Mr. Zeeshan
    date: pastSubDate,
    period: 1,
    startTime: "08:00",
    endTime: "08:45",
    room: "Physics Lab",
    status: "Completed",
    isSubstituted: true,
    substitutionCreditAwarded: 1.0,
    substituteBonusValue: 800,
    adjustmentReview: {
      status: "Approved",
      proposedBonus: 800,
      reviewedBy: manager._id,
      reviewedAt: new Date(pastSubDate),
      reviewRemark: "Approved duty coverage bonus",
    },
  });

  // 4. Generate 20 regular completed past sessions across teachers
  for (let dayOffset = 1; dayOffset <= 6; dayOffset++) {
    const pastDay = new Date(today);
    pastDay.setDate(pastDay.getDate() - dayOffset);
    if (pastDay.getDay() === 0 || pastDay.getDay() === 6) continue; // Skip weekends

    // Dr. Tariq Math
    await createSession({
      timetableId: createdSlots[0]._id,
      gradeId: class10._id,
      sectionId: sec10A._id,
      subjectId: subMath._id,
      className: "Class 10",
      section: "Section A",
      subject: "Mathematics",
      originalTeacherId: teachers[0].user._id,
      actualTeacherId: teachers[0].user._id,
      date: pastDay,
      period: 1,
      startTime: "08:00",
      endTime: "08:45",
      room: "Room 101",
      status: "Completed",
      teachingCreditAwarded: 1.0,
    });

    // Prof. Ayesha Physics
    await createSession({
      timetableId: createdSlots[4]._id,
      gradeId: class10._id,
      sectionId: sec10A._id,
      subjectId: subPhysics._id,
      className: "Class 10",
      section: "Section A",
      subject: "Physics",
      originalTeacherId: teachers[1].user._id,
      actualTeacherId: teachers[1].user._id,
      date: pastDay,
      period: 4,
      startTime: "10:30",
      endTime: "11:15",
      room: "Physics Lab",
      status: "Completed",
      teachingCreditAwarded: 1.0,
    });

    // Sir Hamza CS
    await createSession({
      timetableId: createdSlots[5]._id,
      gradeId: class10._id,
      sectionId: sec10A._id,
      subjectId: subCS._id,
      className: "Class 10",
      section: "Section A",
      subject: "Computer Science",
      originalTeacherId: teachers[2].user._id,
      actualTeacherId: teachers[2].user._id,
      date: pastDay,
      period: 2,
      startTime: "08:45",
      endTime: "09:30",
      room: "CS Lab 1",
      status: "Completed",
      teachingCreditAwarded: 1.0,
    });
  }

  const totalSessionsCount = await TeacherClassSession.countDocuments({ campusId });
  console.log(`  ✓ Seeded ${totalSessionsCount} rich TeacherClassSessions with live demo states.`);

  // -------------------------------------------------------------
  // 8. SEED TEACHER ATTENDANCE (PAST 14 DAYS)
  // -------------------------------------------------------------
  console.log("\n--- 8. Seeding Teacher Attendance Records ---");
  let attendanceCount = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const attendDate = getUtcMidnight(d);

    for (const t of teachers) {
      let status = "Present";
      let checkIn = "07:50";
      let checkOut = "14:10";
      let remarks = "On duty";

      if (t.name === "Dr. Fatima Zahra" && i === 0) {
        status = "On Leave";
        checkIn = "";
        checkOut = "";
        remarks = "Approved medical leave (substitute assigned)";
      }

      await TeacherAttendance.create({
        campusId,
        teacherProfileId: t.user._id,
        date: attendDate,
        status,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        remarks,
        markedBy: manager._id,
      });
      attendanceCount++;
    }
  }
  console.log(`  ✓ Seeded ${attendanceCount} TeacherAttendance records across past 14 days.`);

  // -------------------------------------------------------------
  // 9. SEED MONTHLY PAYROLL WITH DEDUCTIONS & BONUSES
  // -------------------------------------------------------------
  console.log("\n--- 9. Seeding Monthly Payroll Records ---");
  const monthStr = "2026-09";
  const yearNum = 2026;

  for (let i = 0; i < teachers.length; i++) {
    const t = teachers[i];
    const profile = teacherProfiles[i];
    const base = t.baseSalary;

    let allowancesTotal = 0;
    let deductionsTotal = 0;
    const bonuses = [];
    const deductions = [];

    // Mr. Zeeshan Ali has approved substitute bonus
    if (t.name === "Mr. Zeeshan Ali") {
      bonuses.push({
        reason: "Covered Class 10 Physics substitution duty",
        category: "Substitute",
        count: 1,
        rate: 800,
        amount: 800,
        note: "Approved by Campus Manager",
      });
      allowancesTotal += 800;
    }

    // Dr. Tariq Mansoor has an approved deduction
    if (t.name === "Dr. Tariq Mansoor") {
      deductions.push({
        reason: "Unexcused absence on Period 3 class slot",
        category: "Absent",
        days: 0,
        rate: 500,
        amount: 500,
        note: "Formula deduction (Base / 26 / 5)",
      });
      deductionsTotal += 500;
    }

    const grossSalary = base + allowancesTotal;
    const netSalary = grossSalary - deductionsTotal;

    await MonthlyPayroll.create({
      campusId,
      teacherProfileId: profile._id,
      month: monthStr,
      year: yearNum,
      baseSalary: base,
      allowancesTotal,
      grossSalary,
      deductions,
      bonuses,
      deductionsTotal,
      bonusesTotal: allowancesTotal,
      netSalary,
      status: "Draft",
      generatedBy: manager._id,
      attendanceSummary: {
        totalWorkingDays: 26,
        presentDays: 20,
        absentDays: deductions.length ? 1 : 0,
        lateCount: 1,
        leaveDays: 0,
        substituteDuties: bonuses.length,
      },
    });
  }
  console.log(`  ✓ Generated September 2026 Monthly Payroll for all 6 faculty members.`);

  console.log("\n==================================================================");
  console.log("  🎉 PRESENTATION SEEDING COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");
  console.log("\n🔑 PRESENTATION LOGIN CREDENTIALS:");
  console.log("------------------------------------------------------------------");
  console.log("1. Campus Manager Portal:");
  console.log("   URL:      http://localhost:5173/login");
  console.log("   Email:    manager@eduhub.com");
  console.log("   Password: manager123");
  console.log("   Campus:   Islamabad Main Campus");
  console.log("\n2. Teacher Portals (Any Faculty Member):");
  console.log("   Password for ALL teachers: teacher123");
  console.log("   - Dr. Tariq Mansoor (HOD Math):     tariq.mansoor@eduhub.com  (Has Today classes, 1 scheduled, 1 pending dispute!)");
  console.log("   - Prof. Ayesha Siddiqui (Physics):   ayesha.siddiqui@eduhub.com");
  console.log("   - Sir Hamza Farooq (Computer Sci):   hamza.farooq@eduhub.com");
  console.log("   - Mr. Zeeshan Ali (Substitute Hero): zeeshan.ali@eduhub.com    (Has PKR 800 pending substitute bonus!)");
  console.log("\n3. Live Demo Scenarios Ready in Campus Manager:");
  console.log("   - Teaching Performance: /teaching-performance (Faculty cards, credits, substitute assigner)");
  console.log("   - Salary Review Center: /salary-review-center");
  console.log("     * Tab 1: Pending Deductions (Dr. Tariq Mansoor PKR 500)");
  console.log("     * Tab 2: Pending Bonuses (Mr. Zeeshan Ali PKR 800 substitute bonus)");
  console.log("     * Tab 3: Disputes (Dr. Tariq Mansoor classroom relocation dispute ready to approve live!)");
  console.log("   - Salary & Payroll:     /payroll/generate (September 2026 payslips with allowances & deductions)");
  console.log("------------------------------------------------------------------\n");

  process.exit(0);
}

runPresentationSeed().catch((err) => {
  console.error("❌ Seeding failed with error:", err);
  process.exit(1);
});
