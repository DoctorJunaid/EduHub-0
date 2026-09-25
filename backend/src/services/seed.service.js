import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Campus from "../models/campus.model.js";
import {
  TeacherProfile,
  StudentProfile,
  ClassSchedule,
  ExamSchedule,
  StudentAttendance,
  FeeRecord,
  Performance,
} from "../models/profile.model.js";
import TeacherAttendance from "../models/teacherAttendance.model.js";
import { TeacherSalaryProfile } from "../models/teacherSalaryProfile.model.js";
import { SubstituteAssignment } from "../models/substituteAssignment.model.js";
import { MonthlyPayroll } from "../models/monthlyPayroll.model.js";
import Timetable from "../models/timetable.model.js";
import FeeStructure from "../models/feeStructure.model.js";
import Assignment from "../models/assignment.model.js";
import Inquiry from "../models/inqueries.model.js";
import Alert from "../models/alert.model.js";
import {
  Grade,
  Section,
  Subject,
  GradeSubject,
  TeacherAssignment,
} from "../models/academic.model.js";

import {
  CURATED_TEACHERS,
  generateRandomName,
  generateRandomEmail,
  generateRandomPhone,
  generateGuardianInfo,
} from "../utils/seedData/names.js";
import {
  getSubjectsForGrade,
  ALL_UNIQUE_SUBJECTS,
} from "../utils/seedData/subjects.js";
import { buildWeeklyTimetable } from "../utils/seedData/timetable.js";

// In-memory concurrency lock for seed execution per campus
const campusSeedLocks = new Set();

const TEACHING_ROLES = ["teacher", "faculty", "class_teacher", "subject_teacher"];
const STUDENT_ROLES = ["student"];

function getUtcMidnight(dateObj) {
  const d = new Date(dateObj);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Ensures 8 Grades (Class 1 to Class 8) and Section A per Grade.
 */
export async function ensureFullAcademicStructure(campusId, instituteId) {
  const classNames = [
    "Class 1", "Class 2", "Class 3", "Class 4",
    "Class 5", "Class 6", "Class 7", "Class 8"
  ];
  const sectionNames = ["Section A"];

  const grades = [];
  for (let i = 0; i < classNames.length; i++) {
    const cName = classNames[i];
    let g = await Grade.findOne({ campusId, name: cName });
    if (!g) {
      const altName = cName.replace("Class", "Grade");
      g = await Grade.findOne({ campusId, name: altName });
    }
    if (!g) {
      try {
        g = await Grade.create({
          name: cName,
          description: `Curriculum for ${cName}`,
          campusId,
          instituteId,
        });
      } catch (e) {
        g = await Grade.findOne({ campusId, name: cName });
      }
    }
    if (g) grades.push(g);
  }

  const sections = [];
  const classRooms = [];

  for (let i = 0; i < grades.length; i++) {
    const grade = grades[i];
    const gradeLevel = i + 1;

    for (let sIdx = 0; sIdx < sectionNames.length; sIdx++) {
      const sName = sectionNames[sIdx];
      let sec = await Section.findOne({ campusId, gradeId: grade._id, name: sName });
      if (!sec) {
        try {
          sec = await Section.create({
            name: sName,
            gradeId: grade._id,
            campusId,
            instituteId,
          });
        } catch (e) {
          sec = await Section.findOne({ campusId, gradeId: grade._id, name: sName });
        }
      }
      if (sec) {
        sections.push(sec);
        const roomNum = 100 + (gradeLevel * 10) + (sIdx + 1);
        const subjects = getSubjectsForGrade(gradeLevel, sName);
        classRooms.push({
          grade,
          gradeLevel,
          section: sec,
          sectionName: sName,
          roomName: `Room ${roomNum}`,
          subjects,
        });
      }
    }
  }

  // Ensure all unique subjects exist in Subject collection
  const subjectMap = new Map();
  for (const sub of ALL_UNIQUE_SUBJECTS) {
    let s = await Subject.findOne({ campusId, name: sub.name });
    if (!s) {
      try {
        s = await Subject.create({
          name: sub.name,
          code: sub.code,
          description: `${sub.department} core curriculum`,
          campusId,
          instituteId,
        });
      } catch (e) {
        s = await Subject.findOne({ campusId, name: sub.name });
      }
    }
    if (s) subjectMap.set(s.name, s);
  }

  // Create GradeSubject mappings
  const gradeSubjectDocs = [];
  for (const room of classRooms) {
    for (const sub of room.subjects) {
      const subDoc = subjectMap.get(sub.name);
      if (subDoc) {
        gradeSubjectDocs.push({
          gradeId: room.grade._id,
          subjectId: subDoc._id,
          campusId,
          instituteId,
        });
      }
    }
  }

  await GradeSubject.deleteMany({ campusId });
  if (gradeSubjectDocs.length > 0) {
    const seen = new Set();
    const uniqueGs = gradeSubjectDocs.filter((doc) => {
      const key = `${doc.gradeId}-${doc.subjectId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    try {
      await GradeSubject.insertMany(uniqueGs, { ordered: false });
    } catch (e) {
      // ignore partial duplicate insert errors
    }
  }

  return { grades, sections, classRooms, subjectMap };
}

/**
 * Clear Existing Teachers & Students
 */
export async function clearTeachers(campusId) {
  if (!campusId) throw new Error("campusId is required to clear teachers");

  const teacherUsers = await User.find({
    campusId,
    role: { $in: TEACHING_ROLES },
  }).select("_id").lean();

  const userIds = teacherUsers.map((u) => u._id);

  const teacherProfiles = await TeacherProfile.find({
    $or: [{ user: { $in: userIds } }, { campusId }],
  }).select("_id user").lean();

  const profileIds = teacherProfiles.map((tp) => tp._id);
  const profileUserIds = teacherProfiles.map((tp) => tp.user).filter(Boolean);
  const allTeacherRefs = [...userIds, ...profileIds, ...profileUserIds];

  const payrollRes = await MonthlyPayroll.deleteMany({
    $or: [{ teacherProfileId: { $in: allTeacherRefs } }, { campusId }],
  });

  const substituteRes = await SubstituteAssignment.deleteMany({
    $or: [
      { originalTeacherId: { $in: allTeacherRefs } },
      { substituteTeacherId: { $in: allTeacherRefs } },
      { campusId },
    ],
  });

  const salaryRes = await TeacherSalaryProfile.deleteMany({
    $or: [{ teacherProfileId: { $in: allTeacherRefs } }, { campusId }],
  });

  const attendanceRes = await TeacherAttendance.deleteMany({
    $or: [{ teacherProfileId: { $in: allTeacherRefs } }, { campusId }],
  });

  const profileRes = await TeacherProfile.deleteMany({
    $or: [{ _id: { $in: profileIds } }, { user: { $in: userIds } }],
  });

  const userRes = await User.deleteMany({
    campusId,
    role: { $in: TEACHING_ROLES },
  });

  await TeacherAssignment.deleteMany({ campusId });
  await Timetable.deleteMany({ campusId });
  await ClassSchedule.deleteMany({ campusId });

  return {
    success: true,
    deleted: {
      monthlyPayroll: payrollRes.deletedCount || 0,
      substituteAssignments: substituteRes.deletedCount || 0,
      teacherSalaryProfiles: salaryRes.deletedCount || 0,
      teacherAttendance: attendanceRes.deletedCount || 0,
      teacherProfiles: profileRes.deletedCount || 0,
      teacherUsers: userRes.deletedCount || 0,
    },
  };
}

export async function clearStudents(campusId) {
  if (!campusId) throw new Error("campusId is required to clear students");

  const studentUsers = await User.find({
    campusId,
    role: { $in: STUDENT_ROLES },
  }).select("_id").lean();

  const userIds = studentUsers.map((u) => u._id);

  const grades = await Grade.find({ campusId }).select("_id").lean();
  const gradeIds = grades.map((g) => g._id);
  const sections = await Section.find({ campusId }).select("_id").lean();
  const sectionIds = sections.map((s) => s._id);

  const attendanceRes = await StudentAttendance.deleteMany({
    $or: [{ studentId: { $in: userIds } }, { campusId }],
  });

  const feeRes = await FeeRecord.deleteMany({
    $or: [{ studentId: { $in: userIds } }, { campusId }],
  });

  const perfRes = await Performance.deleteMany({
    $or: [{ studentId: { $in: userIds } }, { campusId }],
  });

  const profileRes = await StudentProfile.deleteMany({
    $or: [
      { user: { $in: userIds } },
      { gradeId: { $in: gradeIds } },
      { sectionId: { $in: sectionIds } },
    ],
  });

  const userRes = await User.deleteMany({
    campusId,
    role: { $in: STUDENT_ROLES },
  });

  return {
    success: true,
    deleted: {
      studentAttendance: attendanceRes.deletedCount || 0,
      feeRecords: feeRes.deletedCount || 0,
      performanceRecords: perfRes.deletedCount || 0,
      studentProfiles: profileRes.deletedCount || 0,
      studentUsers: userRes.deletedCount || 0,
    },
  };
}

export async function clearTeachersAndStudents(campusId) {
  const teacherResult = await clearTeachers(campusId);
  const studentResult = await clearStudents(campusId);

  return {
    success: true,
    message: "Teachers and students cleared successfully without touching administrators",
    deleted: {
      ...teacherResult.deleted,
      ...studentResult.deleted,
    },
  };
}

/**
 * Seeds 10 Realistic Curated Pakistani Teachers with Salary Profiles.
 */
export async function seedTeachers(campusId, { count = 10, clearFirst = false } = {}, currentUser = null) {
  if (!campusId) throw new Error("campusId is required");

  if (clearFirst) {
    await clearTeachers(campusId);
  }

  let instituteId = currentUser?.instituteId || null;
  if (!instituteId) {
    const campus = await Campus.findById(campusId).lean();
    instituteId = campus?.instituteId || null;
  }

  const { grades } = await ensureFullAcademicStructure(campusId, instituteId);
  const teacherPasswordHash = await bcrypt.hash("teacher123", 8);

  const teacherUsers = [];
  const teacherProfiles = [];
  const salaryProfiles = [];
  const createdTeachersList = [];

  const catalog = CURATED_TEACHERS.slice(0, count);

  for (let i = 0; i < catalog.length; i++) {
    const t = catalog[i];
    const gradeDoc = grades[i % grades.length];
    const employeeId = `EMP-${campusId.toString().slice(-4).toUpperCase()}-${(i + 1).toString().padStart(3, "0")}`;

    const userId = new mongoose.Types.ObjectId();
    const profileId = new mongoose.Types.ObjectId();
    const salaryProfileId = new mongoose.Types.ObjectId();

    const userDoc = {
      _id: userId,
      name: t.name,
      email: t.email,
      passwordHash: teacherPasswordHash,
      role: "teacher",
      campusId,
      instituteId,
      phone: t.phone,
      department: t.department,
      designation: t.designation,
      qualification: t.qualification,
      gradeOrClass: gradeDoc?.name || `Class ${i + 1}`,
      subjects: t.subjects,
      status: "Active",
    };

    const profileDoc = {
      _id: profileId,
      user: userId,
      employeeId,
      department: t.department,
      designation: t.designation,
      qualification: t.qualification,
      subjectsTaught: [t.subjects],
      hireDate: new Date(Date.now() - (180 + i * 40) * 86400000),
      isActive: true,
    };

    const salaryProfileDoc = {
      _id: salaryProfileId,
      teacherProfileId: profileId,
      campusId,
      baseSalary: t.baseSalary,
      allowances: [
        { name: "House Rent", amount: t.allowance },
        { name: "Medical", amount: t.medical },
        { name: "Transport", amount: 5000 },
      ],
      taxDeduction: Math.round(t.baseSalary * 0.05),
      otherDeduction: Math.round(t.baseSalary * 0.02),
      isActive: true,
    };

    teacherUsers.push(userDoc);
    teacherProfiles.push(profileDoc);
    salaryProfiles.push(salaryProfileDoc);

    createdTeachersList.push({
      _id: userId,
      profileId,
      name: t.name,
      email: t.email,
      employeeId,
      department: t.department,
      designation: t.designation,
      primarySubject: t.subjects,
      subjectsTaught: [t.subjects],
      gradeLevel: i + 1,
      gradeName: gradeDoc?.name,
    });
  }

  if (teacherUsers.length > 0) {
    await User.insertMany(teacherUsers, { ordered: false });
    await TeacherProfile.insertMany(teacherProfiles, { ordered: false });
    await TeacherSalaryProfile.insertMany(salaryProfiles, { ordered: false });
  }

  return {
    success: true,
    created: teacherUsers.length,
    salaryProfilesCreated: salaryProfiles.length,
    teachers: createdTeachersList,
  };
}

/**
 * Seeds 40 Students (5 students per class across 8 classes).
 */
export async function seedStudents(campusId, { studentsPerClass = 5, clearFirst = false } = {}, currentUser = null) {
  if (!campusId) throw new Error("campusId is required");

  if (clearFirst) {
    await clearStudents(campusId);
  }

  let instituteId = currentUser?.instituteId || null;
  if (!instituteId) {
    const campus = await Campus.findById(campusId).lean();
    instituteId = campus?.instituteId || null;
  }

  const { classRooms } = await ensureFullAcademicStructure(campusId, instituteId);
  const studentPasswordHash = await bcrypt.hash("student123", 8);

  const studentUsers = [];
  const studentProfiles = [];
  const sampleStudents = [];

  for (const room of classRooms) {
    const gradeLevel = room.gradeLevel;
    const classCode = `C${gradeLevel}A`;

    for (let sIdx = 1; sIdx <= studentsPerClass; sIdx++) {
      const gender = sIdx % 2 === 1 ? "male" : "female";
      const studentName = generateRandomName(gender);
      const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
      const email = generateRandomEmail(studentName, "student", uniqueSuffix);
      const rollNumStr = `${classCode}-${sIdx.toString().padStart(3, "0")}`;
      const guardian = generateGuardianInfo(studentName);

      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();

      studentUsers.push({
        _id: userId,
        name: studentName,
        email,
        passwordHash: studentPasswordHash,
        role: "student",
        campusId,
        instituteId,
        phone: generateRandomPhone(),
        gradeOrClass: room.grade.name,
        section: room.section.name,
        roll: rollNumStr,
        admissionNo: `ADM-2026-${rollNumStr}`,
        guardian: guardian.name,
        guardianPhone: guardian.phone,
        status: "Active",
      });

      studentProfiles.push({
        _id: profileId,
        user: userId,
        studentId: `STU-${campusId.toString().slice(-4).toUpperCase()}-${rollNumStr}`,
        gradeId: room.grade._id,
        sectionId: room.section._id,
        rollNumber: rollNumStr,
        guardianDetails: guardian,
        enrollmentDate: new Date(Date.now() - (120 + sIdx * 10) * 86400000),
        isActive: true,
      });

      if (sampleStudents.length < 5) {
        sampleStudents.push({
          name: studentName,
          email,
          rollNumber: rollNumStr,
          class: room.grade.name,
          section: room.section.name,
        });
      }
    }
  }

  if (studentUsers.length > 0) {
    await User.insertMany(studentUsers, { ordered: false });
    await StudentProfile.insertMany(studentProfiles, { ordered: false });
  }

  return {
    success: true,
    totalStudents: studentUsers.length,
    classesCount: classRooms.length,
    studentsPerClass,
    sampleStudents,
  };
}

/**
 * Seed Attendance (14 days of realistic records + today)
 */
export async function seedAttendance(campusId, { days = 14 } = {}) {
  if (!campusId) throw new Error("campusId is required");

  const [teachers, students] = await Promise.all([
    User.find({ campusId, role: { $in: TEACHING_ROLES } }).select("_id").lean(),
    User.find({ campusId, role: { $in: STUDENT_ROLES } }).select("_id gradeOrClass section").lean(),
  ]);

  const teacherAttendanceDocs = [];
  const studentAttendanceDocs = [];
  const now = new Date();

  for (let d = days; d >= 0; d--) {
    const dayDate = new Date(now.getTime() - d * 86400000);
    if (dayDate.getUTCDay() === 0) continue; // Skip Sunday

    const dateStr = dayDate.toISOString().split("T")[0];
    const utcMidnight = getUtcMidnight(dayDate);

    for (const tUser of teachers) {
      const rand = Math.random();
      let status = "Present";
      let checkInTime = "07:50";
      let checkOutTime = "14:10";

      if (d === 0) {
        // For today, make almost all Present with check-in
        status = rand < 0.1 ? "Absent" : rand < 0.2 ? "Late" : "Present";
        checkInTime = status === "Absent" ? "" : status === "Late" ? "08:25" : "07:55";
        checkOutTime = ""; // Still working today
      } else if (rand < 0.06) {
        status = "Absent";
        checkInTime = "";
        checkOutTime = "";
      } else if (rand < 0.12) {
        status = "Late";
        checkInTime = "08:20";
        checkOutTime = "14:05";
      } else if (rand < 0.16) {
        status = "On Leave";
        checkInTime = "";
        checkOutTime = "";
      }

      teacherAttendanceDocs.push({
        teacherProfileId: tUser._id,
        campusId,
        date: utcMidnight,
        status,
        checkInTime,
        checkOutTime,
      });
    }

    for (const stu of students) {
      const rand = Math.random();
      let status = "Present";

      if (rand < 0.05) status = "Absent";
      else if (rand < 0.10) status = "Late";
      else if (rand < 0.13) status = "On Leave";

      studentAttendanceDocs.push({
        studentId: stu._id,
        campusId,
        date: utcMidnight,
        dateStr,
        className: stu.gradeOrClass || "",
        gradeOrClass: stu.gradeOrClass || "",
        section: stu.section || "",
        status,
      });
    }
  }

  await TeacherAttendance.deleteMany({ campusId });
  await StudentAttendance.deleteMany({ campusId });

  if (teacherAttendanceDocs.length > 0) {
    await TeacherAttendance.insertMany(teacherAttendanceDocs, { ordered: false });
  }

  if (studentAttendanceDocs.length > 0) {
    await StudentAttendance.insertMany(studentAttendanceDocs, { ordered: false });
  }

  return {
    success: true,
    daysProcessed: days,
    teacherRecordsCreated: teacherAttendanceDocs.length,
    studentRecordsCreated: studentAttendanceDocs.length,
  };
}

/**
 * Seed Fee Structures and Student Fee Records
 */
export async function seedFees(campusId, instituteId) {
  const grades = await Grade.find({ campusId }).lean();
  const students = await User.find({ campusId, role: { $in: STUDENT_ROLES } }).lean();

  const feeStructures = [];
  for (let i = 0; i < grades.length; i++) {
    const g = grades[i];
    const gradeLevel = i + 1;
    const baseTuition = 4500 + gradeLevel * 400;

    feeStructures.push({
      campusId,
      instituteId,
      gradeOrClass: g.name,
      admissionFee: 8000,
      tuitionFee: baseTuition,
      labFee: gradeLevel >= 5 ? 1200 : 500,
      computerFee: 800,
      libraryFee: 400,
      sportsFee: 300,
      examFee: 1500,
      otherFee: 0,
      lateFeeFine: 300,
      isActive: true,
      description: `Official fee structure for ${g.name}`,
    });
  }

  await FeeStructure.deleteMany({ campusId });
  if (feeStructures.length > 0) {
    try {
      await FeeStructure.insertMany(feeStructures, { ordered: false });
    } catch {
      // ignore
    }
  }

  const now = new Date();
  const currentMonth = `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, "0")}`;
  const feeRecords = [];

  for (let i = 0; i < students.length; i++) {
    const stu = students[i];
    const totalPayable = 6500;
    const isPaid = i % 3 === 0;
    const isPartial = i % 3 === 1;

    feeRecords.push({
      studentId: stu._id,
      feeType: "tuition",
      amount: totalPayable,
      paidAmount: isPaid ? totalPayable : isPartial ? 3500 : 0,
      previousArrears: 0,
      totalPayable,
      dueDate: new Date(now.getUTCFullYear(), now.getUTCMonth(), 15),
      paymentDate: isPaid || isPartial ? new Date() : null,
      status: isPaid ? "PAID" : isPartial ? "PARTIALLY_PAID" : "UNPAID",
      challanNo: `CH-${stu.roll || (i + 100)}-${currentMonth.replace("-", "")}`,
      month: currentMonth,
      gradeOrClass: stu.gradeOrClass || "Class 1",
      campusId,
      instituteId,
    });
  }

  await FeeRecord.deleteMany({ campusId });
  if (feeRecords.length > 0) {
    await FeeRecord.insertMany(feeRecords, { ordered: false });
  }

  return { feeStructuresCreated: feeStructures.length, feeRecordsCreated: feeRecords.length };
}

/**
 * Seed Exams and Student Performance Results
 */
export async function seedExamsAndResults(campusId, instituteId) {
  const [classes, subjects, students] = await Promise.all([
    Grade.find({ campusId }).lean(),
    Subject.find({ campusId }).lean(),
    User.find({ campusId, role: { $in: STUDENT_ROLES } }).lean(),
  ]);

  const examDocs = [];
  const perfDocs = [];
  const now = new Date();

  // Create Midterm Exam schedules
  for (let i = 0; i < Math.min(classes.length, 4); i++) {
    const g = classes[i];
    for (let j = 0; j < Math.min(subjects.length, 3); j++) {
      const sub = subjects[j];
      const examDate = new Date(now.getTime() + (j + 1) * 86400000);

      examDocs.push({
        examName: `Midterm Exam - ${sub.name}`,
        examType: "Midterm",
        className: g.name,
        gradeOrClass: g.name,
        section: "Section A",
        subject: sub.name,
        examDate,
        date: examDate.toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "11:30",
        room: `Hall A`,
        totalMarks: 100,
        campusId,
        instituteId,
      });
    }
  }

  await ExamSchedule.deleteMany({ campusId });
  if (examDocs.length > 0) {
    await ExamSchedule.insertMany(examDocs, { ordered: false });
  }

  // Create student performance/result records
  for (const stu of students) {
    for (let j = 0; j < Math.min(subjects.length, 4); j++) {
      const sub = subjects[j];
      const marksObtained = 65 + Math.floor(Math.random() * 32); // 65 - 96
      let grade = "B";
      if (marksObtained >= 90) grade = "A+";
      else if (marksObtained >= 80) grade = "A";
      else if (marksObtained >= 70) grade = "B";

      perfDocs.push({
        studentId: stu._id,
        examName: "Midterm Examination",
        subject: sub.name,
        term: "First Term 2026",
        marksObtained,
        totalMarks: 100,
        grade,
        percentage: marksObtained,
        remarks: marksObtained >= 80 ? "Excellent Performance" : "Good Effort",
        campusId,
        instituteId,
      });
    }
  }

  await Performance.deleteMany({ campusId });
  if (perfDocs.length > 0) {
    await Performance.insertMany(perfDocs, { ordered: false });
  }

  return { examsCreated: examDocs.length, performanceRecordsCreated: perfDocs.length };
}

/**
 * Seed Substitutes
 */
export async function seedSubstitutes(campusId, { days = 7 } = {}) {
  if (!campusId) throw new Error("campusId is required");

  const teacherUsers = await User.find({
    campusId,
    role: { $in: TEACHING_ROLES },
  }).select("_id").lean();

  const allProfiles = await TeacherProfile.find({
    user: { $in: teacherUsers.map((u) => u._id) },
  })
    .populate("user", "name email phone gradeOrClass department")
    .lean();

  if (allProfiles.length < 2) {
    return { success: true, created: 0 };
  }

  const absentAttendance = await TeacherAttendance.find({
    campusId,
    status: "Absent",
  }).lean();

  const substituteDocs = [];
  const periods = [
    { period: 1, start: "08:00", end: "08:45" },
    { period: 2, start: "08:45", end: "09:30" },
    { period: 3, start: "09:45", end: "10:30" },
    { period: 5, start: "11:45", end: "12:30" },
  ];

  for (let i = 0; i < Math.min(absentAttendance.length, 6); i++) {
    const abs = absentAttendance[i];
    const originalTeacher = allProfiles.find(
      (tp) => String(tp.user?._id || tp.user) === String(abs.teacherProfileId)
    ) || allProfiles[i % allProfiles.length];

    const availableSubstitutes = allProfiles.filter(
      (tp) => String(tp._id) !== String(originalTeacher._id)
    );
    if (availableSubstitutes.length === 0) continue;

    const subTeacher = availableSubstitutes[i % availableSubstitutes.length];
    const p = periods[i % periods.length];

    substituteDocs.push({
      campusId,
      date: abs.date || new Date(),
      period: p.period,
      startTime: p.start,
      endTime: p.end,
      className: originalTeacher.user?.gradeOrClass || "Class 5",
      section: "Section A",
      subject: originalTeacher.department || "General",
      originalTeacherId: originalTeacher._id,
      substituteTeacherId: subTeacher._id,
      reason: "Teacher on Leave",
      status: "Assigned",
    });
  }

  await SubstituteAssignment.deleteMany({ campusId });
  if (substituteDocs.length > 0) {
    await SubstituteAssignment.insertMany(substituteDocs, { ordered: false });
  }

  return { success: true, created: substituteDocs.length };
}

/**
 * Seed Monthly Payroll for Teachers
 */
export async function seedPayroll(campusId) {
  if (!campusId) throw new Error("campusId is required");

  const salaryProfiles = await TeacherSalaryProfile.find({ campusId })
    .populate({
      path: "teacherProfileId",
      populate: { path: "user" },
    })
    .lean();

  const adminUser = await User.findOne({
    campusId,
    role: { $in: ["campus_admin", "campus_manager", "principal", "super_admin", "institute_admin"] },
  }).select("_id").lean();

  const generatedById = adminUser?._id || new mongoose.Types.ObjectId();
  const now = new Date();
  const currentMonth = `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, "0")}`;
  const currentYear = now.getUTCFullYear();

  const payrollDocs = [];
  for (const sp of salaryProfiles) {
    if (!sp.teacherProfileId) continue;

    const base = sp.baseSalary || 65000;
    const allowancesTotal = Array.isArray(sp.allowances)
      ? sp.allowances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0)
      : 25000;
    const grossSalary = base + allowancesTotal;
    const deductionsTotal = (sp.taxDeduction || 3000) + (sp.otherDeduction || 1000);
    const netSalary = grossSalary - deductionsTotal;

    payrollDocs.push({
      campusId,
      teacherProfileId: sp.teacherProfileId._id,
      month: currentMonth,
      year: currentYear,
      baseSalary: base,
      allowancesTotal,
      grossSalary,
      deductionsTotal,
      bonusesTotal: 0,
      netSalary,
      deductions: [
        { reason: "Income Tax", category: "Tax", amount: sp.taxDeduction || 3000 },
      ],
      bonuses: [],
      attendanceSummary: {
        totalWorkingDays: 24,
        presentDays: 22,
        absentDays: 1,
        lateCount: 1,
        leaveDays: 0,
        substituteDuties: 1,
      },
      status: "Approved",
      generatedBy: generatedById,
      approvedBy: generatedById,
      paidOn: new Date(),
    });
  }

  await MonthlyPayroll.deleteMany({ campusId, month: currentMonth });
  if (payrollDocs.length > 0) {
    await MonthlyPayroll.insertMany(payrollDocs, { ordered: false });
  }

  return { month: currentMonth, created: payrollDocs.length };
}

/**
 * Seed Sample Assignments, Inquiries and Alerts
 */
export async function seedExtras(campusId, instituteId) {
  const teachers = await User.find({ campusId, role: { $in: TEACHING_ROLES } }).lean();
  const students = await User.find({ campusId, role: { $in: STUDENT_ROLES } }).lean();

  // 1. Assignments
  const sampleAssignments = [
    {
      title: "Algebra & Linear Equations Worksheet",
      description: "Solve all exercises from Chapter 3 on graphs and linear equations.",
      subject: "Mathematics",
      gradeOrClass: "Class 6",
      section: "Section A",
      instructor: teachers[0]?.name || "Prof. Dr. Tariq Mehmood",
      instructorId: teachers[0]?._id,
      dueDate: new Date(Date.now() + 5 * 86400000),
      totalMarks: 50,
      status: "Active",
      campusId,
      instituteId,
      submissions: students.slice(0, 3).map((stu) => ({
        studentId: stu._id,
        status: "Submitted",
        score: 45,
        feedback: "Very good work on graphing solutions.",
        submittedAt: new Date(),
      })),
    },
    {
      title: "Essay: Importance of Science in Daily Life",
      description: "Write a 300-word essay detailing recent advancements in technology.",
      subject: "English Language",
      gradeOrClass: "Class 5",
      section: "Section A",
      instructor: teachers[1]?.name || "Madam Ayesha Siddiqui",
      instructorId: teachers[1]?._id,
      dueDate: new Date(Date.now() + 7 * 86400000),
      totalMarks: 30,
      status: "Active",
      campusId,
      instituteId,
      submissions: students.slice(0, 2).map((stu) => ({
        studentId: stu._id,
        status: "Submitted",
        score: 28,
        feedback: "Clear structure and good vocabulary.",
        submittedAt: new Date(),
      })),
    },
  ];

  await Assignment.deleteMany({ campusId });
  if (sampleAssignments.length > 0) {
    await Assignment.insertMany(sampleAssignments, { ordered: false });
  }

  // 2. Admission Inquiries
  const sampleInquiries = [
    {
      fullName: "Muhammad Rizwan",
      instituteName: "The Educators Campus",
      instituteType: "School",
      email: "rizwan.parent@gmail.com",
      phone: "0300-4829104",
      message: "Looking for admission criteria and fee structure for Class 4 for next term.",
    },
    {
      fullName: "Mrs. Shazia Farooq",
      instituteName: "Beaconhouse School",
      instituteType: "School",
      email: "shazia.farooq@yahoo.com",
      phone: "0321-9182736",
      message: "Inquiry regarding school transport routes and science lab facilities.",
    },
  ];

  try {
    await Inquiry.insertMany(sampleInquiries, { ordered: false });
  } catch {
    // ignore
  }

  // 3. Broadcast Alerts
  const sampleAlerts = [
    {
      instituteId: instituteId || new mongoose.Types.ObjectId(),
      campusId,
      audience: "all",
      severity: "Info",
      title: "Midterm Examination Date Sheet",
      message: "The Midterm examination schedule for classes 1 to 8 has been published.",
    },
    {
      instituteId: instituteId || new mongoose.Types.ObjectId(),
      campusId,
      audience: "all",
      severity: "Warning",
      title: "Parent-Teacher Meeting (PTM)",
      message: "PTM will be conducted this Saturday from 09:00 AM to 01:00 PM.",
    },
  ];

  await Alert.deleteMany({ campusId });
  try {
    await Alert.insertMany(sampleAlerts, { ordered: false });
  } catch {
    // ignore
  }

  return { assignmentsCreated: sampleAssignments.length, inquiriesCreated: sampleInquiries.length };
}

/**
 * Seed Full Realistic School Structure (10 Teachers, 40 Students, All Modules)
 */
export async function seedFullStructure(campusId, { teachers = 10, studentsPerClass = 5 } = {}, currentUser = null) {
  if (!campusId) throw new Error("campusId is required");

  if (campusSeedLocks.has(String(campusId))) {
    throw new Error("A seed operation is already running for this campus. Please wait.");
  }
  campusSeedLocks.add(String(campusId));

  const startTime = Date.now();

  try {
    let instituteId = currentUser?.instituteId || null;
    if (!instituteId) {
      const campus = await Campus.findById(campusId).lean();
      instituteId = campus?.instituteId || null;
    }

    // 1. Clear existing teachers and students
    await clearTeachersAndStudents(campusId);

    // 2. Ensure academic structure (8 grades, Section A, unique subjects)
    const { grades, sections, classRooms, subjectMap } = await ensureFullAcademicStructure(campusId, instituteId);

    // 3. Seed 10 Curated Pakistani Teachers with salary profiles
    const teacherRes = await seedTeachers(campusId, { count: teachers, clearFirst: false }, currentUser);
    const seededTeacherList = teacherRes.teachers || [];

    // 4. Seed 40 Students (5 per class)
    const studentRes = await seedStudents(campusId, { studentsPerClass, clearFirst: false }, currentUser);

    // 5. Assign Class Teachers and build Weekly Conflict-Free Timetable
    for (let i = 0; i < classRooms.length; i++) {
      const assignedTeacher = seededTeacherList[i % seededTeacherList.length];
      classRooms[i].classTeacher = assignedTeacher;
    }

    const { timetableDocs, classScheduleDocs } = buildWeeklyTimetable({
      classRooms,
      teachers: seededTeacherList,
      subjectMap,
      campusId,
      instituteId,
    });

    if (timetableDocs.length > 0) {
      await Timetable.insertMany(timetableDocs, { ordered: false });
    }

    if (classScheduleDocs.length > 0) {
      await ClassSchedule.insertMany(classScheduleDocs, { ordered: false });
    }

    // 6. Create TeacherAssignment records
    const teacherAssignmentDocs = [];
    for (const item of classScheduleDocs) {
      if (!item.isBreak && item.teacherId) {
        const matchingRoom = classRooms.find(
          (r) => r.grade.name === item.className && r.section.name === item.section
        );
        const subDoc = subjectMap.get(item.subject);

        if (matchingRoom && subDoc) {
          teacherAssignmentDocs.push({
            teacherId: item.teacherId,
            gradeId: matchingRoom.grade._id,
            sectionId: matchingRoom.section._id,
            subjectId: subDoc._id,
            campusId,
            instituteId,
          });
        }
      }
    }

    if (teacherAssignmentDocs.length > 0) {
      const seen = new Set();
      const uniqueAssignments = teacherAssignmentDocs.filter((ta) => {
        const key = `${ta.teacherId}-${ta.gradeId}-${ta.sectionId}-${ta.subjectId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      try {
        await TeacherAssignment.insertMany(uniqueAssignments, { ordered: false });
      } catch {
        // ignore duplicate
      }
    }

    // 7. Seed Attendance (14 days + today)
    const attendanceRes = await seedAttendance(campusId, { days: 14 });

    // 8. Seed Substitutes
    const substituteRes = await seedSubstitutes(campusId, { days: 7 });

    // 9. Seed Payroll
    const payrollRes = await seedPayroll(campusId);

    // 10. Seed Fees (Structures + Vouchers)
    const feeRes = await seedFees(campusId, instituteId);

    // 11. Seed Exams & Results
    const examRes = await seedExamsAndResults(campusId, instituteId);

    // 12. Seed Extras (Assignments, Inquiries, Alerts)
    await seedExtras(campusId, instituteId);

    const durationSec = Math.round((Date.now() - startTime) / 1000);

    return {
      success: true,
      message: "Complete lightweight school data seeded successfully across all modules",
      data: {
        grades: grades.length,
        sections: sections.length,
        classRooms: classRooms.length,
        subjects: subjectMap.size,
        teachers: teacherRes.created,
        students: studentRes.totalStudents,
        salaryProfiles: teacherRes.salaryProfilesCreated,
        timetableSlots: timetableDocs.length,
        attendanceRecords:
          (attendanceRes.teacherRecordsCreated || 0) + (attendanceRes.studentRecordsCreated || 0),
        substituteAssignments: substituteRes.created || 0,
        payrollRecords: payrollRes.created || 0,
        feeRecords: feeRes.feeRecordsCreated || 0,
        examSchedules: examRes.examsCreated || 0,
        duration: `${durationSec} seconds`,
        credentials: {
          teacherPassword: "teacher123",
          studentPassword: "student123",
          sampleTeacherEmail: seededTeacherList[0]?.email,
          sampleStudentEmail: studentRes.sampleStudents[0]?.email,
          note: "All test users share standard credentials per role",
        },
      },
    };
  } finally {
    campusSeedLocks.delete(String(campusId));
  }
}

/**
 * Current Stats counter
 */
export async function getStats(campusId) {
  if (!campusId) throw new Error("campusId is required");

  const [
    teacherUsersCount,
    studentUsersCount,
    gradesCount,
    sectionsCount,
    subjectsCount,
    teacherAttendanceCount,
    studentAttendanceCount,
    substitutesCount,
    payrollCount,
    timetableCount,
    feeRecordsCount,
    campusAdminsCount,
  ] = await Promise.all([
    User.countDocuments({ campusId, role: { $in: TEACHING_ROLES } }),
    User.countDocuments({ campusId, role: { $in: STUDENT_ROLES } }),
    Grade.countDocuments({ campusId }),
    Section.countDocuments({ campusId }),
    Subject.countDocuments({ campusId }),
    TeacherAttendance.countDocuments({ campusId }),
    StudentAttendance.countDocuments({ campusId }),
    SubstituteAssignment.countDocuments({ campusId }),
    MonthlyPayroll.countDocuments({ campusId }),
    Timetable.countDocuments({ campusId }),
    FeeRecord.countDocuments({ campusId }),
    User.countDocuments({
      campusId,
      role: { $in: ["campus_admin", "campus_manager", "principal"] },
    }),
  ]);

  return {
    grades: gradesCount,
    sections: sectionsCount,
    classRooms: sectionsCount,
    subjects: subjectsCount,
    teachers: teacherUsersCount,
    students: studentUsersCount,
    teacherAttendance: teacherAttendanceCount,
    studentAttendance: studentAttendanceCount,
    substituteAssignments: substitutesCount,
    payrollRecords: payrollCount,
    timetableSlots: timetableCount,
    feeRecords: feeRecordsCount,
    campusAdmins: campusAdminsCount,
    note: "Campus administrators, accountants, and system settings are strictly preserved.",
  };
}

export const resetAll = seedFullStructure;
export const seedFull = seedFullStructure;

export default {
  clearTeachers,
  clearStudents,
  clearTeachersAndStudents,
  seedFullStructure,
  seedTeachers,
  seedStudents,
  seedAttendance,
  seedFees,
  seedExamsAndResults,
  seedSubstitutes,
  seedPayroll,
  seedExtras,
  seedFull,
  resetAll,
  getStats,
  ensureFullAcademicStructure,
};
