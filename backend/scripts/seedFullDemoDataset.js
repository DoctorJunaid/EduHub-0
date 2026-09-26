/**
 * ==============================================================================
 * EduHub Professional Demo Dataset Seeder
 * Target Account: junaid.aurangzeb5+test13@gmail.com
 * Campus: Peshawar City Model Campus
 * ==============================================================================
 */

import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Models
import User from "../src/models/user.model.js";
import Campus from "../src/models/campus.model.js";
import Institute from "../src/models/institute.model.js";
import {
  Grade,
  Section,
  Subject,
  GradeSubject,
  TeacherAssignment,
} from "../src/models/academic.model.js";
import {
  TeacherProfile,
  StudentProfile,
  ClassSchedule,
  ExamSchedule,
  StudentAttendance,
  FeeRecord,
  Performance,
} from "../src/models/profile.model.js";
import TeacherAttendance from "../src/models/teacherAttendance.model.js";
import { TeacherSalaryProfile } from "../src/models/teacherSalaryProfile.model.js";
import { MonthlyPayroll } from "../src/models/monthlyPayroll.model.js";
import { SubstituteAssignment } from "../src/models/substituteAssignment.model.js";
import Timetable from "../src/models/timetable.model.js";
import TeacherClassSession from "../src/models/teacherClassSession.model.js";
import TeachingCreditConfig from "../src/models/teachingCreditConfig.model.js";
import { SalaryPolicy } from "../src/models/salaryPolicy.model.js";
import { AttendanceApproval } from "../src/models/attendanceApproval.model.js";
import { PayrollAdjustment } from "../src/models/payrollAdjustment.model.js";
import FeeStructure from "../src/models/feeStructure.model.js";
import PaymentTransaction from "../src/models/paymentTransaction.model.js";
import Alert from "../src/models/alert.model.js";
import Inquiry from "../src/models/inqueries.model.js";
import Assignment from "../src/models/assignment.model.js";

// Utilities & Seed Data
import {
  MALE_FIRST_NAMES,
  FEMALE_FIRST_NAMES,
  LAST_NAMES,
} from "../src/utils/seedData/names.js";

function getUtcMidnight(dateInput) {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function formatDateYMD(dateInput) {
  const d = new Date(dateInput);
  return d.toISOString().split("T")[0];
}

async function runDemoSeeder() {
  console.log("==================================================================");
  console.log("  EduHub Complete Professional Demo Dataset Seeder");
  console.log("  Target: junaid.aurangzeb5+test13@gmail.com");
  console.log("==================================================================");

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI missing from environment!");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ Connected to MongoDB Atlas.");

  // -------------------------------------------------------------
  // 1. LOCATE AND UPDATE TARGET INSTITUTION, CAMPUS & MANAGER
  // -------------------------------------------------------------
  const TARGET_EMAIL = "junaid.aurangzeb5+test13@gmail.com";
  let managerUser = await User.findOne({ email: TARGET_EMAIL });

  if (!managerUser) {
    console.error(`❌ Target user ${TARGET_EMAIL} not found in database!`);
    process.exit(1);
  }

  let campus = await Campus.findById(managerUser.campusId);
  if (!campus) {
    console.error(`❌ Campus ${managerUser.campusId} not found!`);
    process.exit(1);
  }

  let institute = await Institute.findById(managerUser.instituteId || campus.instituteId);
  if (!institute) {
    console.error(`❌ Institute not found!`);
    process.exit(1);
  }

  const campusId = campus._id;
  const instituteId = institute._id;

  console.log(`✓ Located Target User: "${managerUser.name}" (${managerUser.email})`);
  console.log(`✓ Located Target Campus: "${campus.name}" (${campusId})`);
  console.log(`✓ Located Target Institute: "${institute.name}" (${instituteId})`);

  // Update Institute to professional details
  await Institute.findByIdAndUpdate(instituteId, {
    name: "Peshawar Cambridge & Model School System",
    board: "BISE Peshawar",
    type: "School",
    phone: "091-5841234",
    email: "info@peshawarmodel.edu.pk",
    status: "Active",
    address: {
      street: "Sector B-3, Phase 5, Hayatabad",
      city: "Peshawar",
      province: "Khyber Pakhtunkhwa",
      postalCode: "25000",
      country: "Pakistan",
    },
  });

  // Update Campus to professional details
  await Campus.findByIdAndUpdate(campusId, {
    name: "Peshawar City Model Campus",
    location: "Hayatabad, Peshawar",
    phone: "091-5845678",
    email: "peshawar.city@peshawarmodel.edu.pk",
    status: "Active",
    managerId: managerUser._id,
    address: {
      street: "Plot 12-B, Sector B-3, Hayatabad",
      city: "Peshawar",
      province: "Khyber Pakhtunkhwa",
      postalCode: "25000",
      country: "Pakistan",
    },
  });

  // Update Manager User
  await User.findByIdAndUpdate(managerUser._id, {
    name: "Engr. Junaid Aurangzeb",
    role: "campus_manager",
    status: "Active",
    isActive: true,
    phone: "0300-8591234",
    designation: "Campus Director & Principal",
    department: "Executive Administration",
    qualification: "M.Sc Engineering & Educational Leadership",
  });
  managerUser = await User.findById(managerUser._id);

  console.log("✓ Updated Institute, Campus, and Manager profiles to professional values.");

  // -------------------------------------------------------------
  // 2. CLEAN STALE TEST / DEMO DATA FOR THIS SPECIFIC CAMPUS
  // -------------------------------------------------------------
  console.log("\n--- Cleaning previous test/stub data for target campus ---");
  
  // Find non-manager users for this campus
  const oldUsers = await User.find({
    campusId,
    _id: { $ne: managerUser._id },
    role: { $in: ["student", "teacher", "faculty"] },
  }).select("_id");
  const oldUserIds = oldUsers.map((u) => u._id);

  await StudentProfile.deleteMany({
    $or: [{ user: { $in: oldUserIds } }, { campusId }],
  });
  await TeacherProfile.deleteMany({
    $or: [{ user: { $in: oldUserIds } }, { campusId }],
  });
  await User.deleteMany({ _id: { $in: oldUserIds } });

  // Academic structure cleanup
  await TeacherAssignment.deleteMany({ campusId });
  await GradeSubject.deleteMany({ campusId });
  await Section.deleteMany({ campusId });
  await Grade.deleteMany({ campusId });
  await Subject.deleteMany({ campusId });

  // Timetable and classes cleanup
  await Timetable.deleteMany({ campusId });
  await ClassSchedule.deleteMany({ campusId });
  await TeacherClassSession.deleteMany({ campusId });
  await SubstituteAssignment.deleteMany({ campusId });

  // Attendance cleanup
  await StudentAttendance.deleteMany({ campusId });
  await TeacherAttendance.deleteMany({ campusId });

  // Payroll & Salary cleanup
  await AttendanceApproval.deleteMany({ campusId });
  await PayrollAdjustment.deleteMany({ campusId });
  await MonthlyPayroll.deleteMany({ campusId });
  await TeacherSalaryProfile.deleteMany({ campusId });
  await TeachingCreditConfig.deleteMany({ campusId });
  await SalaryPolicy.deleteMany({ campusId });

  // Fees cleanup
  await PaymentTransaction.deleteMany({ campusId });
  await FeeRecord.deleteMany({ campusId });
  await FeeStructure.deleteMany({ campusId });

  // Exams cleanup
  await Performance.deleteMany({ campusId });
  await ExamSchedule.deleteMany({ campusId });

  // Alerts & Assignments cleanup
  await Alert.deleteMany({ campusId });
  await Assignment.deleteMany({ campusId });

  console.log("✓ Target campus cleared for fresh, unified demo data insertion.");

  // -------------------------------------------------------------
  // 3. SEED GRADES (Class 1 to Class 10) & SECTIONS (A and B)
  // -------------------------------------------------------------
  console.log("\n--- Seeding 10 Grades & 20 Sections (Grade 1 to 10) ---");
  const gradeDocs = [];
  const sectionDocs = [];
  const classRooms = []; // { grade, section, roomName, gradeLevel, sectionName }

  for (let i = 1; i <= 10; i++) {
    const levelName = i <= 5 ? "Primary" : i <= 8 ? "Middle" : "Secondary";
    const grade = await Grade.create({
      name: `Class ${i}`,
      description: `${levelName} curriculum for Grade ${i}`,
      campusId,
      instituteId,
    });
    gradeDocs.push(grade);

    // Section A
    const secA = await Section.create({
      name: "Section A",
      gradeId: grade._id,
      campusId,
      instituteId,
    });
    // Section B
    const secB = await Section.create({
      name: "Section B",
      gradeId: grade._id,
      campusId,
      instituteId,
    });

    sectionDocs.push(secA, secB);

    const floor = i <= 5 ? 1 : 2;
    const roomA = `Room ${floor}0${i}`;
    const roomB = `Room ${floor}1${i}`;

    classRooms.push(
      { grade, section: secA, roomName: roomA, gradeLevel: i, sectionName: "Section A" },
      { grade, section: secB, roomName: roomB, gradeLevel: i, sectionName: "Section B" }
    );
  }
  console.log(`✓ Created 10 Grades (Class 1 to Class 10) and 20 Sections (Section A, Section B).`);

  // -------------------------------------------------------------
  // 4. SEED SUBJECTS & GRADE-SUBJECT MAPPINGS
  // -------------------------------------------------------------
  console.log("\n--- Seeding Core Curriculum Subjects & Mappings ---");
  const subjectsMaster = [
    { name: "English Language", code: "ENG", department: "English", desc: "Grammar, Composition, and Literature" },
    { name: "Urdu Literature", code: "URD", department: "Urdu", desc: "Urdu Grammar, Prose, and Poetry" },
    { name: "Mathematics", code: "MATH", department: "Mathematics", desc: "Core Arithmetic, Algebra, and Geometry" },
    { name: "Islamiat & Ethics", code: "ISL", department: "Islamiat", desc: "Islamic Studies, Morals, and Ethics" },
    { name: "General Science", code: "SCI", department: "Science", desc: "Foundational Life and Physical Sciences" },
    { name: "Social Studies", code: "SST", department: "Social Studies", desc: "Geography, History, and Civics" },
    { name: "Computer Science", code: "CS", department: "Computer Science", desc: "IT, Programming, and Digital Literacy" },
    { name: "Art & Craft", code: "ART", department: "Arts", desc: "Creative Arts and Drawing" },
    { name: "Physical Education", code: "PE", department: "Sports", desc: "Health, Sports, and Physical Fitness" },
    { name: "Physics", code: "PHY", department: "Physics", desc: "Mechanics, Thermodynamics, and Electromagnetism" },
    { name: "Chemistry", code: "CHEM", department: "Chemistry", desc: "Physical, Organic, and Inorganic Chemistry" },
    { name: "Biology", code: "BIO", department: "Biology", desc: "Cellular Biology, Anatomy, and Genetics" },
    { name: "Pakistan Studies", code: "PST", department: "Social Studies", desc: "History, Constitution, and Culture of Pakistan" },
  ];

  const subjectMap = new Map();
  for (const s of subjectsMaster) {
    const doc = await Subject.create({
      name: s.name,
      code: s.code,
      description: s.desc,
      campusId,
      instituteId,
    });
    subjectMap.set(s.name, doc);
  }

  function getSubjectsForLevel(gradeLevel) {
    if (gradeLevel <= 5) {
      return [
        "English Language", "Urdu Literature", "Mathematics", "Islamiat & Ethics",
        "General Science", "Social Studies", "Art & Craft", "Physical Education"
      ];
    }
    if (gradeLevel <= 8) {
      return [
        "English Language", "Urdu Literature", "Mathematics", "General Science",
        "Islamiat & Ethics", "Computer Science", "Social Studies", "Physical Education"
      ];
    }
    return [
      "English Language", "Urdu Literature", "Mathematics", "Physics",
      "Chemistry", "Biology", "Computer Science", "Pakistan Studies", "Islamiat & Ethics"
    ];
  }

  const gradeSubjectDocs = [];
  for (const grade of gradeDocs) {
    const level = parseInt(grade.name.replace("Class ", ""), 10);
    const subNames = getSubjectsForLevel(level);
    for (const subName of subNames) {
      const subDoc = subjectMap.get(subName);
      if (subDoc) {
        gradeSubjectDocs.push({
          gradeId: grade._id,
          subjectId: subDoc._id,
          campusId,
          instituteId,
        });
      }
    }
  }
  await GradeSubject.insertMany(gradeSubjectDocs);
  console.log(`✓ Created ${subjectMap.size} Subjects and mapped ${gradeSubjectDocs.length} GradeSubjects.`);

  // -------------------------------------------------------------
  // 5. SEED 22 DISTINGUISHED TEACHERS (Ensuring full timetable coverage)
  // -------------------------------------------------------------
  console.log("\n--- Seeding 22 Faculty Members, Profiles & Salaries ---");
  const teacherPasswordHash = await bcrypt.hash("teacher123", 10);

  const facultyRoster = [
    {
      name: "Prof. Dr. Tariq Mehmood",
      email: "tariq.mehmood@peshawarmodel.edu.pk",
      phone: "0300-9281742",
      department: "Mathematics",
      designation: "HOD Mathematics",
      qualification: "Ph.D. in Applied Mathematics",
      primarySubject: "Mathematics",
      employeeId: "EMP-2026-001",
      baseSalary: 115000,
      allowance: 25000,
      bank: "Meezan Bank",
      iban: "PK36MEZN0001234567890101",
    },
    {
      name: "Madam Ayesha Siddiqui",
      email: "ayesha.siddiqui@peshawarmodel.edu.pk",
      phone: "0321-4829105",
      department: "English",
      designation: "Senior Lecturer",
      qualification: "M.Phil English Literature",
      primarySubject: "English Language",
      employeeId: "EMP-2026-002",
      baseSalary: 90000,
      allowance: 18000,
      bank: "Habib Bank Limited",
      iban: "PK45HABB0002345678901202",
    },
    {
      name: "Sir Muhammad Usman",
      email: "muhammad.usman@peshawarmodel.edu.pk",
      phone: "0333-5192837",
      department: "Physics",
      designation: "Senior Lecturer",
      qualification: "M.Sc Physics",
      primarySubject: "Physics",
      employeeId: "EMP-2026-003",
      baseSalary: 82000,
      allowance: 16000,
      bank: "Bank Alfalah",
      iban: "PK67ALFH0003456789012303",
    },
    {
      name: "Sir Abdul Rehman",
      email: "abdul.rehman@peshawarmodel.edu.pk",
      phone: "0345-6718293",
      department: "Chemistry",
      designation: "Senior Lecturer",
      qualification: "M.Sc Chemistry",
      primarySubject: "Chemistry",
      employeeId: "EMP-2026-004",
      baseSalary: 80000,
      allowance: 15000,
      bank: "MCB Bank",
      iban: "PK89MUCB0004567890123404",
    },
    {
      name: "Sir Farhan Ali",
      email: "farhan.ali@peshawarmodel.edu.pk",
      phone: "0301-8392018",
      department: "Computer Science",
      designation: "Assistant Professor",
      qualification: "MS Computer Science",
      primarySubject: "Computer Science",
      employeeId: "EMP-2026-005",
      baseSalary: 78000,
      allowance: 14000,
      bank: "Allied Bank",
      iban: "PK12ABPA0005678901234505",
    },
    {
      name: "Madam Fatima Zahra",
      email: "fatima.zahra@peshawarmodel.edu.pk",
      phone: "0312-7492019",
      department: "Urdu",
      designation: "Senior Lecturer",
      qualification: "M.A Urdu Literature",
      primarySubject: "Urdu Literature",
      employeeId: "EMP-2026-006",
      baseSalary: 72000,
      allowance: 12000,
      bank: "United Bank Limited",
      iban: "PK34UNIL0006789012345606",
    },
    {
      name: "Sir Bilal Ahmed",
      email: "bilal.ahmed@peshawarmodel.edu.pk",
      phone: "0302-3928174",
      department: "Biology",
      designation: "Lecturer",
      qualification: "M.Sc Zoology",
      primarySubject: "Biology",
      employeeId: "EMP-2026-007",
      baseSalary: 70000,
      allowance: 12000,
      bank: "Meezan Bank",
      iban: "PK56MEZN0007890123456707",
    },
    {
      name: "Sir Hamza Tariq",
      email: "hamza.tariq@peshawarmodel.edu.pk",
      phone: "0300-1928374",
      department: "Social Studies",
      designation: "Lecturer",
      qualification: "M.A Pakistan Studies",
      primarySubject: "Pakistan Studies",
      employeeId: "EMP-2026-008",
      baseSalary: 68000,
      allowance: 10000,
      bank: "Faysal Bank",
      iban: "PK78FAYS0008901234567808",
    },
    {
      name: "Madam Zainab Bibi",
      email: "zainab.bibi@peshawarmodel.edu.pk",
      phone: "0321-8291048",
      department: "Islamiat",
      designation: "Lecturer",
      qualification: "M.A Islamic Studies",
      primarySubject: "Islamiat & Ethics",
      employeeId: "EMP-2026-009",
      baseSalary: 66000,
      allowance: 10000,
      bank: "Bank of Khyber",
      iban: "PK90BOKH0009012345678909",
    },
    {
      name: "Sir Kamran Shah",
      email: "kamran.shah@peshawarmodel.edu.pk",
      phone: "0333-9182736",
      department: "Science",
      designation: "Lecturer",
      qualification: "M.Sc Applied Sciences",
      primarySubject: "General Science",
      employeeId: "EMP-2026-010",
      baseSalary: 65000,
      allowance: 10000,
      bank: "National Bank of Pakistan",
      iban: "PK23NPAA0010123456789010",
    },
    {
      name: "Madam Nida Parveen",
      email: "nida.parveen@peshawarmodel.edu.pk",
      phone: "0313-5847291",
      department: "Arts",
      designation: "Primary Arts & Language Educator",
      qualification: "B.Ed & B.A Fine Arts",
      primarySubject: "Art & Craft",
      employeeId: "EMP-2026-011",
      baseSalary: 60000,
      allowance: 8000,
      bank: "Meezan Bank",
      iban: "PK45MEZN0011234567890111",
    },
    {
      name: "Sir Adeel Raza",
      email: "adeel.raza@peshawarmodel.edu.pk",
      phone: "0346-7193820",
      department: "Sports",
      designation: "Director Physical Education",
      qualification: "M.Sc Physical Education & Sports Sciences",
      primarySubject: "Physical Education",
      employeeId: "EMP-2026-012",
      baseSalary: 58000,
      allowance: 8000,
      bank: "Habib Metropolitan Bank",
      iban: "PK67HABB0012345678901212",
    },
    {
      name: "Madam Sana Malik",
      email: "sana.malik@peshawarmodel.edu.pk",
      phone: "0305-6291834",
      department: "Mathematics",
      designation: "Lecturer",
      qualification: "B.S Mathematics & Science",
      primarySubject: "Mathematics",
      employeeId: "EMP-2026-013",
      baseSalary: 56000,
      allowance: 8000,
      bank: "Askari Bank",
      iban: "PK89ASKA0013456789012313",
    },
    {
      name: "Sir Rashid Minhas",
      email: "rashid.minhas@peshawarmodel.edu.pk",
      phone: "0332-8472019",
      department: "Science",
      designation: "Senior Science Lecturer & Relief Specialist",
      qualification: "M.Sc General Sciences",
      primarySubject: "General Science",
      employeeId: "EMP-2026-014",
      baseSalary: 62000,
      allowance: 10000,
      bank: "Meezan Bank",
      iban: "PK12MEZN0014567890123414",
    },
    {
      name: "Sir Waqar Younis",
      email: "waqar.younis@peshawarmodel.edu.pk",
      phone: "0300-8472910",
      department: "English",
      designation: "Lecturer English Literature",
      qualification: "M.A English",
      primarySubject: "English Language",
      employeeId: "EMP-2026-015",
      baseSalary: 64000,
      allowance: 10000,
      bank: "Habib Bank Limited",
      iban: "PK34HABB0015567890123415",
    },
    {
      name: "Madam Rabia Basri",
      email: "rabia.basri@peshawarmodel.edu.pk",
      phone: "0321-9182734",
      department: "Urdu",
      designation: "Lecturer Urdu",
      qualification: "M.A Urdu",
      primarySubject: "Urdu Literature",
      employeeId: "EMP-2026-016",
      baseSalary: 62000,
      allowance: 9000,
      bank: "United Bank Limited",
      iban: "PK56UNIL0016567890123416",
    },
    {
      name: "Sir Danish Ali",
      email: "danish.ali@peshawarmodel.edu.pk",
      phone: "0333-8273645",
      department: "Science",
      designation: "Lecturer Science",
      qualification: "M.Sc General Science",
      primarySubject: "General Science",
      employeeId: "EMP-2026-017",
      baseSalary: 61000,
      allowance: 9000,
      bank: "Bank Alfalah",
      iban: "PK78ALFH0017567890123417",
    },
    {
      name: "Madam Mehwish Hayat",
      email: "mehwish.hayat@peshawarmodel.edu.pk",
      phone: "0345-7162534",
      department: "Social Studies",
      designation: "Lecturer Social Studies",
      qualification: "M.A History & Civics",
      primarySubject: "Social Studies",
      employeeId: "EMP-2026-018",
      baseSalary: 60000,
      allowance: 8000,
      bank: "MCB Bank",
      iban: "PK90MUCB0018567890123418",
    },
    {
      name: "Sir Zeeshan Akram",
      email: "zeeshan.akram@peshawarmodel.edu.pk",
      phone: "0301-9283746",
      department: "Computer Science",
      designation: "IT & Computer Instructor",
      qualification: "BS Computer Science",
      primarySubject: "Computer Science",
      employeeId: "EMP-2026-019",
      baseSalary: 59000,
      allowance: 8000,
      bank: "Allied Bank",
      iban: "PK12ABPA0019567890123419",
    },
    {
      name: "Madam Bushra Rehman",
      email: "bushra.rehman@peshawarmodel.edu.pk",
      phone: "0312-8374659",
      department: "English",
      designation: "Primary English Instructor",
      qualification: "B.Ed & B.A English",
      primarySubject: "English Language",
      employeeId: "EMP-2026-020",
      baseSalary: 57000,
      allowance: 8000,
      bank: "Meezan Bank",
      iban: "PK34MEZN0020567890123420",
    },
    {
      name: "Sir Arsalan Qureshi",
      email: "arsalan.qureshi@peshawarmodel.edu.pk",
      phone: "0302-7162539",
      department: "Mathematics",
      designation: "Junior Mathematics Instructor",
      qualification: "B.S Mathematics",
      primarySubject: "Mathematics",
      employeeId: "EMP-2026-021",
      baseSalary: 56000,
      allowance: 7000,
      bank: "Faysal Bank",
      iban: "PK56FAYS0021567890123421",
    },
    {
      name: "Madam Kinza Fatima",
      email: "kinza.fatima@peshawarmodel.edu.pk",
      phone: "0300-8273641",
      department: "Islamiat",
      designation: "Instructor Islamic Studies",
      qualification: "M.A Islamic Studies",
      primarySubject: "Islamiat & Ethics",
      employeeId: "EMP-2026-022",
      baseSalary: 55000,
      allowance: 7000,
      bank: "Bank of Khyber",
      iban: "PK78BOKH0022567890123422",
    },
  ];

  const teachers = [];
  const teacherUserMap = new Map();
  const teacherProfileMap = new Map();

  for (const f of facultyRoster) {
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
      qualification: f.qualification,
      subjects: f.primarySubject,
      status: "Active",
      isActive: true,
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
      allowances: [
        { name: "Medical Allowance", amount: Math.round(f.allowance * 0.4) },
        { name: "Transport Allowance", amount: Math.round(f.allowance * 0.6) },
      ],
      taxDeduction: Math.round(f.baseSalary * 0.03),
      otherDeduction: 500,
      bankAccount: {
        bankName: f.bank,
        accountNumber: f.iban.slice(-10),
        iban: f.iban,
      },
      isActive: true,
    });

    const teacherObj = { ...f, user, profile };
    teachers.push(teacherObj);
    teacherUserMap.set(f.employeeId, teacherObj);
    teacherProfileMap.set(String(profile._id), teacherObj);
  }
  console.log(`✓ Created ${teachers.length} Teachers with User accounts, TeacherProfiles & SalaryProfiles.`);

  // -------------------------------------------------------------
  // 6. SEED 100 STUDENTS (Grade 1 to 10 × 10 students = 100 total)
  // -------------------------------------------------------------
  console.log("\n--- Seeding 100 Students (10 per grade: 5 in Sec A, 5 in Sec B) ---");
  const studentPasswordHash = await bcrypt.hash("student123", 10);
  const students = [];
  const studentUserBatch = [];

  let studentSeq = 1;
  for (let gIdx = 0; gIdx < gradeDocs.length; gIdx++) {
    const grade = gradeDocs[gIdx];
    const gradeLevel = gIdx + 1;
    const secA = sectionDocs[gIdx * 2];
    const secB = sectionDocs[gIdx * 2 + 1];

    for (let sIdx = 1; sIdx <= 10; sIdx++) {
      const isSecA = sIdx <= 5;
      const section = isSecA ? secA : secB;
      const rollNo = isSecA ? sIdx : sIdx - 5;

      const isMale = (studentSeq % 2) === 1;
      const firstPool = isMale ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
      const firstName = firstPool[(studentSeq * 7) % firstPool.length];
      const lastName = LAST_NAMES[(studentSeq * 11) % LAST_NAMES.length];
      const studentName = `${firstName} ${lastName}`;

      const admCode = String(studentSeq).padStart(3, "0");
      const admissionNo = `STD-2026-${admCode}`;
      const email = `std.${admCode}@peshawarmodel.edu.pk`;

      const fatherFirst = MALE_FIRST_NAMES[(studentSeq * 13) % MALE_FIRST_NAMES.length];
      const guardianName = `${fatherFirst} ${lastName}`;
      const guardianPhone = `0300-58${String(1000 + studentSeq).slice(1)}`;
      const baseFee = 3500 + gradeLevel * 300;

      studentUserBatch.push({
        meta: { grade, gradeLevel, section, rollNo, studentName, admissionNo, guardianName, guardianPhone, baseFee },
        doc: {
          name: studentName,
          email,
          passwordHash: studentPasswordHash,
          role: "student",
          campusId,
          instituteId,
          phone: `0333-59${String(2000 + studentSeq).slice(1)}`,
          gradeOrClass: grade.name,
          admissionNo,
          roll: String(rollNo),
          section: section.name,
          guardian: guardianName,
          guardianPhone,
          baseFee,
          status: "Active",
          isActive: true,
        }
      });

      studentSeq++;
    }
  }

  // Insert all 100 student users in batch
  const insertedStudentUsers = await User.insertMany(studentUserBatch.map(s => s.doc));
  const studentProfileDocs = [];

  for (let i = 0; i < insertedStudentUsers.length; i++) {
    const user = insertedStudentUsers[i];
    const meta = studentUserBatch[i].meta;

    studentProfileDocs.push({
      user: user._id,
      studentId: meta.admissionNo,
      gradeId: meta.grade._id,
      sectionId: meta.section._id,
      rollNumber: String(meta.rollNo),
      guardianDetails: {
        name: meta.guardianName,
        phone: meta.guardianPhone,
        relation: "Father",
      },
      enrollmentDate: new Date("2026-01-15"),
      isActive: true,
    });

    students.push({
      user,
      grade: meta.grade,
      gradeLevel: meta.gradeLevel,
      section: meta.section,
      rollNo: meta.rollNo,
      studentName: meta.studentName,
      admissionNo: meta.admissionNo,
      baseFee: meta.baseFee,
    });
  }

  const insertedStudentProfiles = await StudentProfile.insertMany(studentProfileDocs);
  for (let i = 0; i < students.length; i++) {
    students[i].profile = insertedStudentProfiles[i];
  }

  console.log(`✓ Created ${students.length} Students across Class 1 to Class 10 with verified profiles.`);

  // -------------------------------------------------------------
  // 7. SEED TEACHER ASSIGNMENTS
  // -------------------------------------------------------------
  console.log("\n--- Seeding Teacher Assignments (Teacher -> Subject -> Grade -> Section) ---");
  const teacherAssignmentDocs = [];

  for (const room of classRooms) {
    const level = room.gradeLevel;
    const subNames = getSubjectsForLevel(level);

    for (const subName of subNames) {
      const subDoc = subjectMap.get(subName);
      if (!subDoc) continue;

      let eligibleTeacher = teachers.find(
        (t) => t.primarySubject === subName || t.department === subDoc.department
      );
      if (!eligibleTeacher) {
        eligibleTeacher = teachers[teacherAssignmentDocs.length % teachers.length];
      }

      teacherAssignmentDocs.push({
        teacherId: eligibleTeacher.user._id,
        gradeId: room.grade._id,
        sectionId: room.section._id,
        subjectId: subDoc._id,
        campusId,
        instituteId,
      });
    }
  }
  await TeacherAssignment.insertMany(teacherAssignmentDocs);
  console.log(`✓ Created ${teacherAssignmentDocs.length} Teacher Assignments.`);

  // -------------------------------------------------------------
  // 8. SEED CONFLICT-FREE 6-DAY WEEKLY TIMETABLE (Mon - Sat)
  // -------------------------------------------------------------
  console.log("\n--- Seeding Conflict-Free 6-Day Timetable & ClassSchedules ---");
  const DAYS = [
    { index: 1, name: "Monday" },
    { index: 2, name: "Tuesday" },
    { index: 3, name: "Wednesday" },
    { index: 4, name: "Thursday" },
    { index: 5, name: "Friday" },
    { index: 6, name: "Saturday" },
  ];

  const PERIOD_SLOTS = [
    { periodNum: 1, name: "Period 1", startTime: "08:00", endTime: "08:45", isBreak: false },
    { periodNum: 2, name: "Period 2", startTime: "08:45", endTime: "09:30", isBreak: false },
    { periodNum: 0, name: "Short Break", startTime: "09:30", endTime: "09:45", isBreak: true },
    { periodNum: 3, name: "Period 3", startTime: "09:45", endTime: "10:30", isBreak: false },
    { periodNum: 4, name: "Period 4", startTime: "10:30", endTime: "11:15", isBreak: false },
    { periodNum: 0, name: "Lunch Break", startTime: "11:15", endTime: "11:45", isBreak: true },
    { periodNum: 5, name: "Period 5", startTime: "11:45", endTime: "12:30", isBreak: false },
    { periodNum: 6, name: "Period 6", startTime: "12:30", endTime: "13:15", isBreak: false },
  ];

  const timetableDocs = [];
  const classScheduleDocs = [];

  // Inverted loop: for each day, for each slot, allocate teachers to all 20 rooms simultaneously.
  // Because classRooms.length === 20 and teachers.length === 22, every room gets a unique teacher!
  for (const day of DAYS) {
    for (const slot of PERIOD_SLOTS) {
      if (slot.isBreak) {
        for (const room of classRooms) {
          timetableDocs.push({
            institutionType: "School",
            gradeId: room.grade._id,
            sectionId: room.section._id,
            days: [day.index],
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBreak: true,
            breakTitle: slot.name,
            colorTag: "#94A3B8",
            status: "Active",
            campusId,
            instituteId,
          });

          classScheduleDocs.push({
            title: `${room.grade.name} (${room.sectionName}) - ${slot.name}`,
            periodName: slot.name,
            subject: slot.name,
            className: room.grade.name,
            gradeOrClass: room.grade.name,
            section: room.sectionName,
            days: [day.index],
            dayOfWeek: day.name,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBreak: true,
            room: room.roomName,
            roomNumber: room.roomName,
            campusId,
            instituteId,
          });
        }
        continue;
      }

      // Teaching period:
      // Offset rotates every day and period so teachers cycle fairly across rooms
      const shiftOffset = (day.index * 5 + slot.periodNum * 3) % teachers.length;

      for (let r = 0; r < classRooms.length; r++) {
        const room = classRooms[r];
        const teacherIndex = (shiftOffset + r) % teachers.length;
        const selectedTeacher = teachers[teacherIndex];

        const level = room.gradeLevel;
        const subNames = getSubjectsForLevel(level);
        const subIndex = (day.index * 2 + slot.periodNum + r) % subNames.length;
        const subName = subNames[subIndex];
        const subDoc = subjectMap.get(subName);

        timetableDocs.push({
          institutionType: "School",
          gradeId: room.grade._id,
          sectionId: room.section._id,
          subjectId: subDoc?._id || subjectMap.get("English Language")._id,
          teacherId: selectedTeacher.user._id,
          room: room.roomName,
          days: [day.index],
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBreak: false,
          colorTag: "#3B82F6",
          status: "Active",
          campusId,
          instituteId,
        });

        classScheduleDocs.push({
          title: `${room.grade.name} (${room.sectionName}) - ${subName}`,
          periodName: slot.name,
          subject: subName,
          className: room.grade.name,
          gradeOrClass: room.grade.name,
          section: room.sectionName,
          days: [day.index],
          dayOfWeek: day.name,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBreak: false,
          room: room.roomName,
          roomNumber: room.roomName,
          teacherId: selectedTeacher.user._id,
          teacherProfileId: selectedTeacher.profile._id,
          teacherName: selectedTeacher.name,
          instructor: selectedTeacher.name,
          campusId,
          instituteId,
        });
      }
    }
  }

  const insertedTimetables = await Timetable.insertMany(timetableDocs);
  await ClassSchedule.insertMany(classScheduleDocs);
  console.log(`✓ Inserted ${insertedTimetables.length} Timetable slots and ${classScheduleDocs.length} ClassSchedules (0 conflicts, guaranteed valid teachers).`);

  // -------------------------------------------------------------
  // 9. SEED HISTORICAL STUDENT ATTENDANCE (August & September 2026)
  // -------------------------------------------------------------
  console.log("\n--- Seeding Historical Student Attendance (Aug 1 - Sep 26, 2026) ---");
  const studentAttendanceDocs = [];
  const startDay = new Date("2026-08-01T00:00:00Z");
  const endDay = new Date("2026-09-26T00:00:00Z");

  const schoolDays = [];
  for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0) { // Monday to Saturday (skip Sunday)
      schoolDays.push(new Date(d));
    }
  }

  for (const day of schoolDays) {
    const dateStr = formatDateYMD(day);
    const dayUtc = getUtcMidnight(day);

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const hashVal = (day.getDate() * 17 + i * 31 + day.getMonth() * 13) % 100;
      let status = "Present";
      let remarks = "";

      if (hashVal < 88) {
        status = "Present";
      } else if (hashVal < 94) {
        status = "Late";
        remarks = "Arrived 15 mins late due to road congestion";
      } else if (hashVal < 98) {
        status = "Absent";
        remarks = "Uninformed absence";
      } else {
        status = "Excused";
        remarks = "Medical leave application approved";
      }

      studentAttendanceDocs.push({
        studentId: student.user._id,
        date: dayUtc,
        dateStr,
        status,
        className: student.grade.name,
        gradeOrClass: student.grade.name,
        section: student.section.name,
        remarks,
        markedBy: managerUser._id,
        campusId,
        instituteId,
      });
    }
  }

  // Insert in batches of 1000
  const BATCH_SIZE = 1000;
  for (let b = 0; b < studentAttendanceDocs.length; b += BATCH_SIZE) {
    const chunk = studentAttendanceDocs.slice(b, b + BATCH_SIZE);
    await StudentAttendance.insertMany(chunk, { ordered: false });
  }
  console.log(`✓ Inserted ${studentAttendanceDocs.length} Student Attendance records across ${schoolDays.length} school days.`);

  // -------------------------------------------------------------
  // 10. SEED TEACHER ATTENDANCE (August & September 2026)
  // -------------------------------------------------------------
  console.log("\n--- Seeding Historical Teacher Attendance ---");
  const teacherAttendanceDocs = [];

  for (const day of schoolDays) {
    const dayUtc = getUtcMidnight(day);
    const dateStr = formatDateYMD(day);

    for (let tIdx = 0; tIdx < teachers.length; tIdx++) {
      const teacher = teachers[tIdx];
      let status = "Present";
      let checkIn = "07:50";
      let checkOut = "14:10";
      let remarks = "On duty";

      if (dateStr === "2026-09-15" && teacher.employeeId === "EMP-2026-003") {
        // Sir Muhammad Usman absent on Sep 15 (Absent Deduction Demo)
        status = "Absent";
        checkIn = "";
        checkOut = "";
        remarks = "Absent without leave notification";
      } else if (dateStr === "2026-09-22" && teacher.employeeId === "EMP-2026-005") {
        // Sir Farhan Ali absent on Sep 22 (Substitute Demo)
        status = "Absent";
        checkIn = "";
        checkOut = "";
        remarks = "Family medical emergency";
      } else if (dateStr === "2026-09-08" && teacher.employeeId === "EMP-2026-004") {
        // Sir Abdul Rehman approved leave
        status = "On Leave";
        checkIn = "";
        checkOut = "";
        remarks = "Approved casual leave";
      } else {
        const rand = (day.getDate() * 11 + tIdx * 19) % 100;
        if (rand < 90) {
          status = "Present";
        } else if (rand < 96) {
          status = "Late";
          checkIn = "08:15";
          remarks = "Late entry recorded";
        } else {
          status = "Present";
        }
      }

      teacherAttendanceDocs.push({
        campusId,
        teacherProfileId: teacher.user._id, // References User per schema
        date: dayUtc,
        status,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        remarks,
        markedBy: managerUser._id,
      });
    }
  }

  await TeacherAttendance.insertMany(teacherAttendanceDocs, { ordered: false });
  console.log(`✓ Inserted ${teacherAttendanceDocs.length} Teacher Attendance records.`);

  // -------------------------------------------------------------
  // 11. SEED TEACHING CREDIT CONFIG & SALARY POLICY
  // -------------------------------------------------------------
  console.log("\n--- Seeding TeachingCreditConfig & SalaryPolicy ---");
  await TeachingCreditConfig.create({
    campusId,
    creditPerCompletedPeriod: 1.0,
    creditForSubstitution: 1.0,
    bonusPerSubstituteClass: 500,
    requireApprovalForSubstituteBonus: true,
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
    lastEditedBy: managerUser._id,
  });

  await SalaryPolicy.create({
    campusId,
    workingDaysPerMonth: 26,
    unpaidAbsentMultiplier: 1.0,
    unpaidLeaveMultiplier: 1.0,
    halfDayMultiplier: 0.5,
    lateCountForHalfDay: 3,
    lateHalfDayPenalty: 0.5,
    earlyLeaveMultiplier: 0.5,
    substituteBonusPerClass: 500,
    perfectAttendanceBonus: 2000,
    extraClassBonus: 400,
    examDutyBonus: 300,
  });
  console.log("✓ Created campus TeachingCreditConfig and SalaryPolicy.");

  // -------------------------------------------------------------
  // 12. SEED SUBSTITUTE TEACHER SYSTEM RECORDS
  // -------------------------------------------------------------
  console.log("\n--- Seeding Substitute Assignments & Coverage Workflow ---");
  const usmanTeacher = teacherUserMap.get("EMP-2026-003"); // Sir Usman
  const farhanTeacher = teacherUserMap.get("EMP-2026-005"); // Sir Farhan
  const rashidTeacher = teacherUserMap.get("EMP-2026-014"); // Sir Rashid Minhas
  const kamranTeacher = teacherUserMap.get("EMP-2026-010"); // Sir Kamran
  const sanaTeacher = teacherUserMap.get("EMP-2026-013"); // Madam Sana

  const subAss1 = await SubstituteAssignment.create({
    campusId,
    date: getUtcMidnight("2026-09-22"),
    period: 2,
    startTime: "08:45",
    endTime: "09:30",
    className: "Class 9",
    section: "Section A",
    subject: "Computer Science",
    originalTeacherId: farhanTeacher.profile._id,
    substituteTeacherId: rashidTeacher.profile._id,
    reason: "Teacher Absent",
    status: "Completed",
    notes: "Completed syllabus topic on boolean algebra and computer logic.",
    assignedBy: managerUser._id,
    bonusEligible: true,
    bonusAmount: 500,
  });

  const subAss2 = await SubstituteAssignment.create({
    campusId,
    date: getUtcMidnight("2026-09-22"),
    period: 3,
    startTime: "09:45",
    endTime: "10:30",
    className: "Class 10",
    section: "Section B",
    subject: "Computer Science",
    originalTeacherId: farhanTeacher.profile._id,
    substituteTeacherId: rashidTeacher.profile._id,
    reason: "Teacher Absent",
    status: "Completed",
    notes: "Supervised hands-on C programming lab session.",
    assignedBy: managerUser._id,
    bonusEligible: true,
    bonusAmount: 500,
  });

  const todayStr = formatDateYMD(new Date());
  const todayUtc = getUtcMidnight(todayStr);
  const subAssToday = await SubstituteAssignment.create({
    campusId,
    date: todayUtc,
    period: 4,
    startTime: "10:30",
    endTime: "11:15",
    className: "Class 8",
    section: "Section A",
    subject: "General Science",
    originalTeacherId: kamranTeacher.profile._id,
    substituteTeacherId: sanaTeacher.profile._id,
    reason: "Training",
    status: "Assigned",
    notes: "Original teacher attending STEM curriculum workshop.",
    assignedBy: managerUser._id,
    bonusEligible: true,
    bonusAmount: 500,
  });

  console.log("✓ Seeded SubstituteAssignments (Completed & Live Assigned).");

  // -------------------------------------------------------------
  // 13. SEED ATTENDANCE APPROVAL & PAYROLL ADJUSTMENTS
  // -------------------------------------------------------------
  console.log("\n--- Seeding Attendance Approval Workflow & Payroll Adjustments ---");
  const usmanDailySalary = Math.round(usmanTeacher.baseSalary / 26);
  const approvalUsman = await AttendanceApproval.create({
    campusId,
    status: "Pending",
    absentDate: getUtcMidnight("2026-09-15"),
    absentTeacherId: usmanTeacher.profile._id,
    absenceProof: {
      attendanceId: new mongoose.Types.ObjectId(),
      date: getUtcMidnight("2026-09-15"),
      status: "Absent",
      markedBy: managerUser._id,
      markedAt: new Date("2026-09-15T09:00:00Z"),
      remarks: "Uninformed absence on morning assembly and teaching slots.",
    },
    deductionProof: {
      salaryProfileId: new mongoose.Types.ObjectId(),
      baseSalary: usmanTeacher.baseSalary,
      workingDaysPerMonth: 26,
      dailySalary: usmanDailySalary,
      multiplier: 1.0,
      formula: `(${usmanTeacher.baseSalary} base / 26 days) × 1.0 multiplier = PKR ${usmanDailySalary}`,
      finalAmount: usmanDailySalary,
    },
    substituteProof: {
      hasSubstitutes: true,
      substituteTeacherId: rashidTeacher.profile._id,
      dutyCount: 1,
      ratePerClass: 500,
      formula: `1 duty × PKR 500 = PKR 500`,
      finalAmount: 500,
    },
    decision: {
      decidedBy: null,
      decidedAt: null,
      type: null,
      reason: "",
    },
  });

  const farhanDailySalary = Math.round(farhanTeacher.baseSalary / 26);
  const approvalFarhan = await AttendanceApproval.create({
    campusId,
    status: "Approved",
    absentDate: getUtcMidnight("2026-09-22"),
    absentTeacherId: farhanTeacher.profile._id,
    absenceProof: {
      attendanceId: new mongoose.Types.ObjectId(),
      date: getUtcMidnight("2026-09-22"),
      status: "Absent",
      markedBy: managerUser._id,
      markedAt: new Date("2026-09-22T08:30:00Z"),
      remarks: "Family emergency communicated to Principal.",
    },
    deductionProof: {
      salaryProfileId: new mongoose.Types.ObjectId(),
      baseSalary: farhanTeacher.baseSalary,
      workingDaysPerMonth: 26,
      dailySalary: farhanDailySalary,
      multiplier: 1.0,
      formula: `(${farhanTeacher.baseSalary} base / 26 days) × 1.0 = PKR ${farhanDailySalary}`,
      finalAmount: farhanDailySalary,
    },
    substituteProof: {
      hasSubstitutes: true,
      substituteTeacherId: rashidTeacher.profile._id,
      assignmentIds: [subAss1._id, subAss2._id],
      dutyCount: 2,
      ratePerClass: 500,
      formula: `2 duties × PKR 500 = PKR 1000`,
      finalAmount: 1000,
    },
    decision: {
      decidedBy: {
        userId: managerUser._id,
        name: managerUser.name,
        email: managerUser.email,
        role: managerUser.role,
      },
      decidedAt: new Date("2026-09-23T11:00:00Z"),
      type: "Approve",
      reason: "Approved substitute bonus and confirmed replacement coverage.",
    },
  });

  await PayrollAdjustment.create({
    campusId,
    teacherProfileId: usmanTeacher.profile._id,
    targetMonth: "2026-09",
    sourceMonth: "2026-09",
    type: "Deduction",
    category: "Absent",
    amount: usmanDailySalary,
    reason: "Unpaid absence on 15 September 2026",
    note: "Under review in Salary Review Center",
    sourceApprovalId: approvalUsman._id,
    status: "Pending",
    createdBy: managerUser._id,
  });

  await PayrollAdjustment.create({
    campusId,
    teacherProfileId: rashidTeacher.profile._id,
    targetMonth: "2026-09",
    sourceMonth: "2026-09",
    type: "Bonus",
    category: "Substitute",
    amount: 1000,
    reason: "2 Substitute classes conducted on 22 September 2026",
    note: "Approved by Principal",
    sourceApprovalId: approvalFarhan._id,
    status: "Pending",
    createdBy: managerUser._id,
  });

  console.log("✓ Created AttendanceApproval workflows & PayrollAdjustments.");

  // -------------------------------------------------------------
  // 14. SEED TEACHER CLASS SESSIONS & SALARY REVIEW CENTER ITEMS
  // -------------------------------------------------------------
  console.log("\n--- Seeding TeacherClassSessions (Performance & Salary Review Center) ---");
  const sampleTimetableSlot = insertedTimetables[0];

  // 1. Live Session for Today (Completed)
  await TeacherClassSession.create({
    campusId,
    timetableId: sampleTimetableSlot._id,
    academicSession: "2026-2027",
    date: todayUtc,
    dayOfWeek: "Saturday",
    period: 1,
    startTime: "08:00",
    endTime: "08:45",
    gradeId: gradeDocs[9]._id,
    sectionId: sectionDocs[18]._id,
    subjectId: subjectMap.get("Mathematics")._id,
    className: "Class 10",
    section: "Section A",
    subject: "Mathematics",
    room: "Room 210",
    originalTeacherId: teachers[0].user._id,
    actualTeacherId: teachers[0].user._id,
    status: "Completed",
    attendanceStatus: "Present",
    creditValue: 1.0,
    markedBy: managerUser._id,
    markedAt: new Date(),
  });

  // 2. Pending Missed Class Deduction in Salary Review Center
  await TeacherClassSession.create({
    campusId,
    academicSession: "2026-2027",
    date: getUtcMidnight("2026-09-15"),
    dayOfWeek: "Tuesday",
    period: 1,
    startTime: "08:00",
    endTime: "08:45",
    gradeId: gradeDocs[9]._id,
    sectionId: sectionDocs[18]._id,
    subjectId: subjectMap.get("Physics")._id,
    className: "Class 10",
    section: "Section A",
    subject: "Physics",
    room: "Room 210",
    originalTeacherId: usmanTeacher.user._id,
    actualTeacherId: usmanTeacher.user._id,
    status: "Missed",
    attendanceStatus: "Absent",
    creditValue: 0,
    deductionValue: 630,
    adjustmentReview: {
      status: "Pending Review",
      proposedDeduction: 630,
      proposedBonus: 0,
      reviewRemark: "Teacher did not report for morning assembly or Period 1 physics session.",
    },
    markedBy: managerUser._id,
    markedAt: new Date("2026-09-15T09:00:00Z"),
  });

  // 3. Pending Substitute Bonus in Salary Review Center
  await TeacherClassSession.create({
    campusId,
    academicSession: "2026-2027",
    date: getUtcMidnight("2026-09-22"),
    dayOfWeek: "Tuesday",
    period: 2,
    startTime: "08:45",
    endTime: "09:30",
    gradeId: gradeDocs[8]._id,
    sectionId: sectionDocs[16]._id,
    subjectId: subjectMap.get("Computer Science")._id,
    className: "Class 9",
    section: "Section A",
    subject: "Computer Science",
    room: "Room 209",
    originalTeacherId: farhanTeacher.user._id,
    actualTeacherId: rashidTeacher.user._id,
    isSubstituted: true,
    substituteAssignmentId: subAss1._id,
    status: "Substituted",
    attendanceStatus: "Present",
    creditValue: 1.0,
    bonusValue: 500,
    adjustmentReview: {
      status: "Pending Review",
      proposedDeduction: 0,
      proposedBonus: 500,
      reviewRemark: "Relief period conducted successfully with signed student log.",
    },
    markedBy: managerUser._id,
    markedAt: new Date("2026-09-22T10:00:00Z"),
  });

  // 4. Live Pending Teacher Dispute in Salary Review Center
  await TeacherClassSession.create({
    campusId,
    academicSession: "2026-2027",
    date: getUtcMidnight("2026-09-18"),
    dayOfWeek: "Friday",
    period: 4,
    startTime: "10:30",
    endTime: "11:15",
    gradeId: gradeDocs[7]._id,
    sectionId: sectionDocs[14]._id,
    subjectId: subjectMap.get("Computer Science")._id,
    className: "Class 8",
    section: "Section A",
    subject: "Computer Science",
    room: "Computer Lab 1",
    originalTeacherId: farhanTeacher.user._id,
    actualTeacherId: farhanTeacher.user._id,
    status: "Missed",
    attendanceStatus: "Absent",
    creditValue: 0,
    deductionValue: 600,
    dispute: {
      isDisputed: true,
      disputeReason: "Conducted class in Computer Lab due to power outage in main wing; biometric attendance was mistakenly not logged.",
      disputedAt: new Date("2026-09-19T10:15:00Z"),
      disputeStatus: "Pending",
      resolutionRemark: "",
    },
    adjustmentReview: {
      status: "Pending Review",
      proposedDeduction: 600,
      proposedBonus: 0,
    },
    markedBy: managerUser._id,
    markedAt: new Date("2026-09-18T12:00:00Z"),
  });

  // 5. Historical Approved Adjustment
  await TeacherClassSession.create({
    campusId,
    academicSession: "2026-2027",
    date: getUtcMidnight("2026-09-04"),
    dayOfWeek: "Friday",
    period: 3,
    startTime: "09:45",
    endTime: "10:30",
    gradeId: gradeDocs[6]._id,
    sectionId: sectionDocs[12]._id,
    subjectId: subjectMap.get("General Science")._id,
    className: "Class 7",
    section: "Section A",
    subject: "General Science",
    room: "Room 207",
    originalTeacherId: kamranTeacher.user._id,
    actualTeacherId: rashidTeacher.user._id,
    isSubstituted: true,
    status: "Approved Adjustment",
    attendanceStatus: "Present",
    creditValue: 1.0,
    bonusValue: 500,
    adjustmentReview: {
      status: "Approved",
      proposedDeduction: 0,
      proposedBonus: 500,
      reviewedBy: managerUser._id,
      reviewedAt: new Date("2026-09-05T09:00:00Z"),
      reviewRemark: "Approved substitute bonus for emergency relief duty.",
    },
    markedBy: managerUser._id,
    markedAt: new Date("2026-09-04T11:00:00Z"),
  });

  console.log("✓ Seeded TeacherClassSessions with live demo items for Salary Review Center.");

  // -------------------------------------------------------------
  // 15. SEED MONTHLY PAYROLL (August 2026 Paid, September 2026 Active)
  // -------------------------------------------------------------
  console.log("\n--- Seeding Monthly Payroll (August Paid, September Approved/Draft) ---");
  const payrollDocs = [];

  for (let i = 0; i < teachers.length; i++) {
    const t = teachers[i];
    const allowanceTotal = t.allowance;
    const grossSalary = t.baseSalary + allowanceTotal;
    const tax = Math.round(t.baseSalary * 0.03);

    // August 2026 (Paid for all 22 teachers)
    const augDeductions = [
      { reason: "Income Tax Deducted at Source", category: "Tax", days: 0, rate: 0, amount: tax },
      { reason: "Staff Welfare Fund", category: "Other", days: 0, rate: 0, amount: 500 },
    ];
    let augBonuses = [];
    if (t.employeeId === "EMP-2026-014") {
      augBonuses.push({
        reason: "Substitute Duty Coverage (2 classes)",
        category: "Substitute",
        count: 2,
        rate: 500,
        amount: 1000,
      });
    } else if (i < 8) {
      augBonuses.push({
        reason: "Perfect Monthly Attendance Award",
        category: "Perfect Attendance",
        count: 1,
        rate: 2000,
        amount: 2000,
      });
    }

    const augDedTotal = augDeductions.reduce((s, d) => s + d.amount, 0);
    const augBonTotal = augBonuses.reduce((s, b) => s + b.amount, 0);
    const augNet = grossSalary + augBonTotal - augDedTotal;

    payrollDocs.push({
      campusId,
      teacherProfileId: t.profile._id,
      month: "2026-08",
      year: 2026,
      baseSalary: t.baseSalary,
      allowancesTotal: allowanceTotal,
      grossSalary,
      deductions: augDeductions,
      bonuses: augBonuses,
      deductionsTotal: augDedTotal,
      bonusesTotal: augBonTotal,
      netSalary: augNet,
      attendanceSummary: {
        totalWorkingDays: 26,
        presentDays: 25,
        absentDays: 0,
        lateCount: 1,
        leaveDays: 1,
        substituteDuties: t.employeeId === "EMP-2026-014" ? 2 : 0,
      },
      status: "Paid",
      generatedBy: managerUser._id,
      approvedBy: managerUser._id,
      paidOn: new Date("2026-09-01T10:00:00Z"),
    });

    // September 2026 (Mix of Approved and Draft)
    const isApproved = i < 14; // First 14 Approved, rest Draft
    const sepDeductions = [
      { reason: "Income Tax Deducted at Source", category: "Tax", days: 0, rate: 0, amount: tax },
      { reason: "Staff Welfare Fund", category: "Other", days: 0, rate: 0, amount: 500 },
    ];

    if (t.employeeId === "EMP-2026-003") {
      sepDeductions.push({
        reason: "Unpaid absence on 15-Sep-2026",
        category: "Absent",
        days: 1,
        rate: Math.round(t.baseSalary / 26),
        amount: Math.round(t.baseSalary / 26),
      });
    }

    let sepBonuses = [];
    if (t.employeeId === "EMP-2026-014") {
      sepBonuses.push({
        reason: "Approved Substitute Bonus (2 Classes)",
        category: "Substitute",
        count: 2,
        rate: 500,
        amount: 1000,
      });
    }

    const sepDedTotal = sepDeductions.reduce((s, d) => s + d.amount, 0);
    const sepBonTotal = sepBonuses.reduce((s, b) => s + b.amount, 0);
    const sepNet = grossSalary + sepBonTotal - sepDedTotal;

    payrollDocs.push({
      campusId,
      teacherProfileId: t.profile._id,
      month: "2026-09",
      year: 2026,
      baseSalary: t.baseSalary,
      allowancesTotal: allowanceTotal,
      grossSalary,
      deductions: sepDeductions,
      bonuses: sepBonuses,
      deductionsTotal: sepDedTotal,
      bonusesTotal: sepBonTotal,
      netSalary: sepNet,
      attendanceSummary: {
        totalWorkingDays: 26,
        presentDays: t.employeeId === "EMP-2026-003" ? 23 : 24,
        absentDays: t.employeeId === "EMP-2026-003" ? 1 : 0,
        lateCount: i % 3 === 0 ? 2 : 1,
        leaveDays: 0,
        substituteDuties: t.employeeId === "EMP-2026-014" ? 2 : 0,
      },
      status: isApproved ? "Approved" : "Draft",
      generatedBy: managerUser._id,
      approvedBy: isApproved ? managerUser._id : null,
      paidOn: null,
    });
  }

  await MonthlyPayroll.insertMany(payrollDocs);
  console.log(`✓ Inserted ${payrollDocs.length} MonthlyPayroll records (August 2026 Paid, September 2026 Approved/Draft).`);

  // -------------------------------------------------------------
  // 16. SEED FEE STRUCTURES & STUDENT FEE RECORDS (With Transactions)
  // -------------------------------------------------------------
  console.log("\n--- Seeding Fee Structures, Fee Vouchers & Payment Transactions ---");
  const feeStructures = [];

  for (let i = 1; i <= 10; i++) {
    const isPrimary = i <= 5;
    const isMiddle = i <= 8;
    const fs = await FeeStructure.create({
      campusId,
      instituteId,
      gradeOrClass: `Class ${i}`,
      admissionFee: isPrimary ? 5000 : 6000,
      tuitionFee: 3500 + i * 300,
      labFee: isPrimary ? 0 : isMiddle ? 800 : 1500,
      computerFee: isPrimary ? 500 : 1200,
      libraryFee: 500,
      sportsFee: 500,
      examFee: isPrimary ? 1000 : 1500,
      otherFee: 200,
      lateFeeFine: 500,
      isActive: true,
      description: `Official approved fee structure for Class ${i} (Session 2026-2027)`,
    });
    feeStructures.push(fs);
  }
  console.log(`✓ Created ${feeStructures.length} Grade FeeStructures.`);

  const feeRecords = [];
  const paymentTransactions = [];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const fs = feeStructures[student.gradeLevel - 1];

    const tuition = fs.tuitionFee;
    const lab = fs.labFee;
    const comp = fs.computerFee;
    const lib = fs.libraryFee;
    const totalAmount = tuition + lab + comp + lib;

    const challanNo = `CHL-2026-09-${String(i + 1).padStart(3, "0")}`;
    const dueDate = new Date("2026-09-20T00:00:00Z");

    let status = "PAID";
    let paidAmount = totalAmount;
    let paymentDate = new Date("2026-09-10T11:00:00Z");
    let discount = null;
    let waiver = null;
    let lateFine = { amount: 0, applied: false };
    let previousArrears = 0;

    if (student.rollNo === 1 && i % 3 === 0) {
      discount = {
        amount: 1000,
        reason: "Academic Merit Scholarship (Top Position)",
      };
    }

    if (i < 60) {
      status = "PAID";
      paidAmount = totalAmount - (discount?.amount || 0);
      paymentDate = new Date(`2026-09-${String(5 + (i % 10)).padStart(2, "0")}T10:00:00Z`);
    } else if (i < 75) {
      status = "PARTIALLY_PAID";
      paidAmount = Math.round(totalAmount * 0.5);
      paymentDate = new Date("2026-09-12T14:00:00Z");
    } else if (i < 90) {
      status = "UNPAID";
      paidAmount = 0;
      paymentDate = null;
    } else {
      status = "OVERDUE";
      paidAmount = 0;
      paymentDate = null;
      lateFine = { amount: fs.lateFeeFine, applied: true };
      previousArrears = 1500;
    }

    const netPayable = totalAmount + (lateFine.applied ? lateFine.amount : 0) + previousArrears - (discount?.amount || 0);

    const feeRec = await FeeRecord.create({
      studentId: student.user._id,
      feeType: "tuition",
      amount: totalAmount,
      paidAmount,
      previousArrears,
      totalPayable: netPayable,
      dueDate,
      paymentDate,
      status,
      challanNo,
      receiptNo: status === "PAID" ? `RCP-2026-09-${String(i + 1).padStart(3, "0")}` : "",
      month: "2026-09",
      semester: "Fall 2026",
      gradeOrClass: student.grade.name,
      academicSession: "2026-2027",
      breakdown: [
        { title: "Monthly Tuition Fee", amount: tuition },
        { title: "Computer Lab Dues", amount: comp },
        { title: "Library Charges", amount: lib },
        ...(lab > 0 ? [{ title: "Science Lab Charges", amount: lab }] : []),
      ],
      discount,
      waiver,
      lateFine,
      campusId,
      instituteId,
    });
    feeRecords.push(feeRec);

    if (paidAmount > 0) {
      const pMethods = ["Cash", "Bank Transfer", "Online Portal", "Easypaisa"];
      const method = pMethods[i % pMethods.length];
      paymentTransactions.push({
        feeRecordId: feeRec._id,
        studentId: student.user._id,
        campusId,
        instituteId,
        amount: paidAmount,
        paymentDate: paymentDate || new Date(),
        paymentMethod: method,
        referenceNo: `TRX-2026-${String(10000 + i)}`,
        status: "CONFIRMED",
        receiptNo: feeRec.receiptNo || `RCP-PART-${String(i + 1)}`,
        confirmedBy: managerUser._id,
        confirmationDate: paymentDate || new Date(),
        notes: `Payment received and reconciled by Accounts Department.`,
      });
    }
  }

  await PaymentTransaction.insertMany(paymentTransactions);
  console.log(`✓ Inserted ${feeRecords.length} Student FeeRecords & ${paymentTransactions.length} PaymentTransactions.`);

  // -------------------------------------------------------------
  // 17. SEED EXAM SCHEDULES (Midterm 2026 for Class 1 to 10)
  // -------------------------------------------------------------
  console.log("\n--- Seeding Midterm Examination Schedules ---");
  const examDocs = [];
  const examSubjectsCore = [
    "English Language",
    "Mathematics",
    "Urdu Literature",
    "General Science",
    "Islamiat & Ethics",
  ];

  for (let gIdx = 0; gIdx < gradeDocs.length; gIdx++) {
    const grade = gradeDocs[gIdx];
    const level = gIdx + 1;

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const examDate = new Date(`2026-10-0${5 + dayOffset}T00:00:00Z`);
      const dateStr = formatDateYMD(examDate);
      const subName = level >= 9 && dayOffset === 3 ? "Physics" : examSubjectsCore[dayOffset];

      const invigilatorTeacher = teachers[(gIdx + dayOffset) % teachers.length];
      const roomNum = `Hall ${gIdx <= 4 ? "A" : "B"} - Room ${101 + gIdx}`;

      examDocs.push({
        examName: `Midterm Exam - ${subName}`,
        examType: "Midterm",
        institutionType: "School",
        program: grade.name,
        className: grade.name,
        gradeOrClass: grade.name,
        department: grade.name,
        section: "Section A",
        subject: subName,
        examDate,
        date: dateStr,
        startTime: "09:00",
        endTime: "11:30",
        roomNumber: roomNum,
        room: roomNum,
        totalMarks: 100,
        sessionOrShift: "Morning",
        isDualExamDay: false,
        teacherId: invigilatorTeacher.user._id,
        invigilator: invigilatorTeacher.name,
        campusId,
        instituteId,
      });

      examDocs.push({
        examName: `Midterm Exam - ${subName}`,
        examType: "Midterm",
        institutionType: "School",
        program: grade.name,
        className: grade.name,
        gradeOrClass: grade.name,
        department: grade.name,
        section: "Section B",
        subject: subName,
        examDate,
        date: dateStr,
        startTime: "09:00",
        endTime: "11:30",
        roomNumber: roomNum,
        room: roomNum,
        totalMarks: 100,
        sessionOrShift: "Morning",
        isDualExamDay: false,
        teacherId: invigilatorTeacher.user._id,
        invigilator: invigilatorTeacher.name,
        campusId,
        instituteId,
      });
    }
  }

  await ExamSchedule.insertMany(examDocs);
  console.log(`✓ Inserted ${examDocs.length} ExamSchedules for Midterm Examinations.`);

  // -------------------------------------------------------------
  // 18. SEED EXAM RESULTS / REPORT CARDS (Performance)
  // -------------------------------------------------------------
  console.log("\n--- Seeding Student Exam Results / Performance Report Cards ---");
  const performanceDocs = [];
  const testSubjects = ["English Language", "Mathematics", "Urdu Literature", "General Science", "Islamiat & Ethics"];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const level = student.gradeLevel;

    for (let sIdx = 0; sIdx < testSubjects.length; sIdx++) {
      const subName = level >= 9 && sIdx === 3 ? "Physics" : testSubjects[sIdx];
      const basePerformance = 45 + ((student.rollNo * 13 + sIdx * 19 + level * 7) % 52);
      const marksObtained = Math.min(98, Math.max(38, basePerformance));
      const percentage = marksObtained;

      let grade = "B";
      let remarks = "Satisfactory progress";

      if (percentage >= 90) {
        grade = "A+";
        remarks = "Outstanding performance and exemplary comprehension.";
      } else if (percentage >= 80) {
        grade = "A";
        remarks = "Excellent command of core concepts and problem solving.";
      } else if (percentage >= 70) {
        grade = "B";
        remarks = "Good overall performance with strong participation.";
      } else if (percentage >= 60) {
        grade = "C";
        remarks = "Satisfactory grasp; needs focused work on numericals.";
      } else if (percentage >= 50) {
        grade = "D";
        remarks = "Passed; supplementary academic support recommended.";
      } else {
        grade = "F";
        remarks = "Unsatisfactory; mandatory remedial classes assigned.";
      }

      performanceDocs.push({
        studentId: student.user._id,
        examName: "Midterm Examination 2026",
        subject: subName,
        term: "Midterm Examination 2026",
        marksObtained,
        totalMarks: 100,
        grade,
        percentage,
        remarks,
        campusId,
        instituteId,
      });
    }
  }

  await Performance.insertMany(performanceDocs);
  console.log(`✓ Inserted ${performanceDocs.length} Student Exam Performance / Report Card records.`);

  // -------------------------------------------------------------
  // 19. SEED ALERTS, ASSIGNMENTS & INQUIRIES
  // -------------------------------------------------------------
  console.log("\n--- Seeding Institutional Alerts, Assignments & Inquiries ---");
  
  await Alert.insertMany([
    {
      instituteId,
      campusId,
      audience: "all",
      severity: "Warning",
      title: "Midterm Examination Date Sheet Published",
      message: "The official Midterm examination date sheet for Class 1 through Class 10 has been published. Morning shifts commence sharply at 09:00 AM.",
      createdBy: managerUser._id,
    },
    {
      instituteId,
      campusId,
      audience: "all",
      severity: "Info",
      title: "Parent-Teacher Council Meeting Scheduled",
      message: "Parent-Teacher consultations for academic progress reviews will be held on Saturday, 3rd October 2026 from 10:00 AM to 01:00 PM.",
      createdBy: managerUser._id,
    },
    {
      instituteId,
      campusId,
      audience: "students",
      severity: "Info",
      title: "Annual Science & STEM Olympiad Registrations",
      message: "Students from Classes 6 to 10 interested in robotics, coding, and science exhibits can register with the Science Department by Sep 30.",
      createdBy: managerUser._id,
    },
    {
      instituteId,
      campusId,
      audience: "faculty",
      severity: "Critical",
      title: "Payroll & Teaching Credit Cutoff Protocol",
      message: "All faculty members are reminded that class session disputes and substitution verification must be submitted before the 28th cutoff date.",
      createdBy: managerUser._id,
    },
  ]);

  const mathTeacher = teachers[0];
  const csTeacher = teachers[4];

  await Assignment.create({
    title: "Quadratic Equations Problem Set",
    description: "Complete exercises 4.1 through 4.3 covering quadratic factorization and completing the square.",
    subject: "Mathematics",
    program: "Class 10",
    gradeOrClass: "Class 10",
    section: "Section A",
    instructor: mathTeacher.name,
    instructorId: mathTeacher.user._id,
    dueDate: new Date("2026-09-28T23:59:59Z"),
    totalMarks: 50,
    status: "Active",
    submissions: [
      {
        studentId: students[90].user._id,
        status: "Graded",
        score: 48,
        feedback: "Flawless step-by-step mathematical derivation.",
        submittedAt: new Date("2026-09-24T18:00:00Z"),
      },
      {
        studentId: students[91].user._id,
        status: "Submitted",
        score: null,
        feedback: "",
        submittedAt: new Date("2026-09-25T14:30:00Z"),
      },
    ],
    instituteId,
    campusId,
  });

  await Assignment.create({
    title: "Introduction to HTML5 & Web Layouts",
    description: "Design a responsive 3-section webpage demonstrating semantic HTML tags, tables, and form controls.",
    subject: "Computer Science",
    program: "Class 9",
    gradeOrClass: "Class 9",
    section: "Section A",
    instructor: csTeacher.name,
    instructorId: csTeacher.user._id,
    dueDate: new Date("2026-09-29T23:59:59Z"),
    totalMarks: 25,
    status: "Active",
    submissions: [
      {
        studentId: students[80].user._id,
        status: "Graded",
        score: 24,
        feedback: "Clean indentation and well-formed semantic structure.",
        submittedAt: new Date("2026-09-23T20:00:00Z"),
      },
    ],
    instituteId,
    campusId,
  });

  await Inquiry.insertMany([
    {
      fullName: "Dr. Asif Shahzad",
      instituteName: "Peshawar Cambridge & Model School System",
      instituteType: "School",
      email: "asif.shahzad@health.kp.gov.pk",
      phone: "0300-9876543",
      message: "Seeking admission criteria and fee concession details for Class 7 and Class 9 for the upcoming academic spring intake.",
    },
    {
      fullName: "Engr. Noman Khattak",
      instituteName: "Peshawar Cambridge & Model School System",
      instituteType: "School",
      email: "noman.khattak@nespak.com.pk",
      phone: "0321-7654321",
      message: "Inquiring about Cambridge O-Level curriculum transition, science laboratory infrastructure, and school transport routes for Hayatabad Phase 4.",
    },
    {
      fullName: "Mrs. Shagufta Parveen",
      instituteName: "Peshawar Cambridge & Model School System",
      instituteType: "School",
      email: "shagufta.parveen@gmail.com",
      phone: "0345-8765432",
      message: "Requesting prospectus and details regarding admission test dates for Class 1.",
    },
  ]);

  console.log("✓ Seeded Announcements, Student Assignments & Inquiries.");

  // -------------------------------------------------------------
  // 20. COMPREHENSIVE DATA INTEGRITY VALIDATION
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  console.log("  VERIFICATION & DATASET CONSISTENCY REPORT");
  console.log("==================================================================");

  const finalStats = {
    campus: (await Campus.findById(campusId)).name,
    manager: (await User.findById(managerUser._id)).name,
    gradesCount: await Grade.countDocuments({ campusId }),
    sectionsCount: await Section.countDocuments({ campusId }),
    subjectsCount: await Subject.countDocuments({ campusId }),
    gradeSubjectsCount: await GradeSubject.countDocuments({ campusId }),
    teachersCount: await User.countDocuments({ campusId, role: { $in: ["teacher", "faculty"] } }),
    teacherProfilesCount: await TeacherProfile.countDocuments({ user: { $in: teachers.map(t => t.user._id) } }),
    studentsCount: await User.countDocuments({ campusId, role: "student" }),
    studentProfilesCount: await StudentProfile.countDocuments({ user: { $in: students.map(s => s.user._id) } }),
    teacherAssignmentsCount: await TeacherAssignment.countDocuments({ campusId }),
    timetableSlots: await Timetable.countDocuments({ campusId }),
    classScheduleSlots: await ClassSchedule.countDocuments({ campusId }),
    studentAttendanceRecords: await StudentAttendance.countDocuments({ campusId }),
    teacherAttendanceRecords: await TeacherAttendance.countDocuments({ campusId }),
    teacherClassSessions: await TeacherClassSession.countDocuments({ campusId }),
    substituteAssignments: await SubstituteAssignment.countDocuments({ campusId }),
    attendanceApprovals: await AttendanceApproval.countDocuments({ campusId }),
    payrollAdjustments: await PayrollAdjustment.countDocuments({ campusId }),
    monthlyPayrolls: await MonthlyPayroll.countDocuments({ campusId }),
    feeStructures: await FeeStructure.countDocuments({ campusId }),
    feeRecords: await FeeRecord.countDocuments({ campusId }),
    paymentTransactions: await PaymentTransaction.countDocuments({ campusId }),
    examSchedules: await ExamSchedule.countDocuments({ campusId }),
    examResults: await Performance.countDocuments({ campusId }),
    alertsCount: await Alert.countDocuments({ campusId }),
    assignmentsCount: await Assignment.countDocuments({ campusId }),
  };

  console.table(finalStats);

  console.log("\n--- Checking Data Integrity Assertions ---");
  const missingStudentProfiles = await StudentProfile.countDocuments({
    user: { $in: students.map(s => s.user._id) },
    gradeId: { $exists: false },
  });
  console.log(`✓ Orphan Student Profiles: ${missingStudentProfiles} (Expected: 0)`);

  const orphanTimetables = await Timetable.countDocuments({
    campusId,
    isBreak: false,
    $or: [{ gradeId: null }, { sectionId: null }, { subjectId: null }, { teacherId: null }],
  });
  console.log(`✓ Broken Timetable Slots: ${orphanTimetables} (Expected: 0)`);

  const orphanFeeRecords = await FeeRecord.countDocuments({
    campusId,
    studentId: null,
  });
  console.log(`✓ Orphan Fee Records: ${orphanFeeRecords} (Expected: 0)`);

  const orphanPerformance = await Performance.countDocuments({
    campusId,
    studentId: null,
  });
  console.log(`✓ Orphan Exam Performance Records: ${orphanPerformance} (Expected: 0)`);

  console.log("\n==================================================================");
  console.log("  DEMO DATASET SEEDING COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");

  process.exit(0);
}

runDemoSeeder().catch((err) => {
  console.error("❌ Fatal Seeding Error:", err);
  process.exit(1);
});
