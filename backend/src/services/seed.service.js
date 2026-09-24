import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Campus from "../models/campus.model.js";
import {
  TeacherProfile,
  StudentProfile,
  ClassSchedule,
  StudentAttendance,
  FeeRecord,
  Performance,
} from "../models/profile.model.js";
import TeacherAttendance from "../models/teacherAttendance.model.js";
import { TeacherSalaryProfile } from "../models/teacherSalaryProfile.model.js";
import { SubstituteAssignment } from "../models/substituteAssignment.model.js";
import { MonthlyPayroll } from "../models/monthlyPayroll.model.js";
import Timetable from "../models/timetable.model.js";
import {
  Grade,
  Section,
  Subject,
  GradeSubject,
  TeacherAssignment,
} from "../models/academic.model.js";

import {
  generateRandomName,
  generateRandomEmail,
  generateRandomPhone,
  generateGuardianInfo,
} from "../utils/seedData/names.js";
import {
  DEPARTMENTS,
  DESIGNATIONS,
  QUALIFICATIONS,
} from "../utils/seedData/departments.js";
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
 * Ensures all 12 Grades (Class 1 to Class 12) and 4 Sections per Grade (Section A to D).
 */
export async function ensureFullAcademicStructure(campusId, instituteId) {
  const classNames = [
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
    "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
  ];
  const sectionNames = ["Section A", "Section B", "Section C", "Section D"];

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
          description: `Academic Curriculum for ${cName}`,
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
 * FEATURE 1 — Clear Existing Teachers & Students
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
 * Seeds 60 Teachers (5 per grade level: 1 HOD, 2 Senior Lecturers, 2 Lecturers).
 * 48 teachers become Class Teachers for the 48 sections; remaining 12 are Subject-only.
 */
export async function seedTeachers(campusId, { count = 60, clearFirst = false } = {}, currentUser = null) {
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
  let teacherGlobalIdx = 1;

  for (let gIdx = 0; gIdx < 12; gIdx++) {
    const gradeLevel = gIdx + 1;
    const gradeDoc = grades[gIdx] || grades[0];

    const teacherRanks = [
      { designation: "HOD", qualification: "PhD", baseSalary: 120000, allowance: 25000, medical: 15000 },
      { designation: "Senior Lecturer", qualification: "M.Phil / MS", baseSalary: 85000, allowance: 18000, medical: 10000 },
      { designation: "Senior Lecturer", qualification: "M.Phil / MS", baseSalary: 80000, allowance: 15000, medical: 10000 },
      { designation: "Lecturer", qualification: "Master's Degree", baseSalary: 65000, allowance: 10000, medical: 8000 },
      { designation: "Lecturer", qualification: "Master's Degree", baseSalary: 60000, allowance: 10000, medical: 8000 },
    ];

    const subjectsForThisGrade = getSubjectsForGrade(gradeLevel, "Section A");

    for (let tIdx = 0; tIdx < 5; tIdx++) {
      if (teacherGlobalIdx > count) break;

      const rank = teacherRanks[tIdx];
      const primarySub = subjectsForThisGrade[tIdx % subjectsForThisGrade.length];
      const department = primarySub?.department || DEPARTMENTS[tIdx % DEPARTMENTS.length];

      const rawName = generateRandomName("male");
      const titlePrefix = tIdx === 0 ? "Prof. Dr." : "Sir";
      const teacherName = `${titlePrefix} ${rawName}`;
      const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
      const teacherEmail = generateRandomEmail(rawName, "teacher", uniqueSuffix);
      const employeeId = `EMP-${campusId.toString().slice(-4).toUpperCase()}-${gradeLevel.toString().padStart(2, "0")}${String.fromCharCode(65 + tIdx)}-${uniqueSuffix}`;

      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();
      const salaryProfileId = new mongoose.Types.ObjectId();

      const userDoc = {
        _id: userId,
        name: teacherName,
        email: teacherEmail,
        passwordHash: teacherPasswordHash,
        role: "teacher",
        campusId,
        instituteId,
        phone: generateRandomPhone(),
        department,
        designation: rank.designation,
        qualification: rank.qualification,
        gradeOrClass: gradeDoc?.name || `Class ${gradeLevel}`,
        subjects: primarySub?.name || "General Curriculum",
      };

      const profileDoc = {
        _id: profileId,
        user: userId,
        employeeId,
        department,
        designation: rank.designation,
        qualification: rank.qualification,
        subjectsTaught: [primarySub?.name || "General Subjects"],
        hireDate: new Date(Date.now() - Math.floor(Math.random() * 800 * 86400000)),
        isActive: true,
      };

      const salaryProfileDoc = {
        _id: salaryProfileId,
        teacherProfileId: profileId,
        campusId,
        baseSalary: rank.baseSalary,
        allowances: [
          { name: "House Rent", amount: rank.allowance },
          { name: "Medical", amount: rank.medical },
          { name: "Transport", amount: 6000 },
          ...(tIdx === 0 ? [{ name: "Special Duty (HOD)", amount: 5000 }] : []),
        ],
        taxDeduction: Math.round(rank.baseSalary * 0.05),
        otherDeduction: Math.round(rank.baseSalary * 0.02),
        isActive: true,
      };

      teacherUsers.push(userDoc);
      teacherProfiles.push(profileDoc);
      salaryProfiles.push(salaryProfileDoc);

      createdTeachersList.push({
        _id: userId,
        profileId,
        name: teacherName,
        email: teacherEmail,
        employeeId,
        department,
        designation: rank.designation,
        primarySubject: primarySub?.name,
        subjectsTaught: [primarySub?.name],
        gradeLevel,
        gradeName: gradeDoc?.name,
      });

      teacherGlobalIdx++;
    }
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
 * Seeds 1,440 Students (30 per section × 48 sections).
 * Exactly 15 boys + 15 girls per class section.
 */
export async function seedStudents(campusId, { studentsPerClass = 30, clearFirst = false } = {}, currentUser = null) {
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
    const secLetter = room.sectionName.replace("Section ", "").trim();
    const classCode = `C${gradeLevel}${secLetter}`;

    // 15 boys + 15 girls
    const halfCount = Math.floor(studentsPerClass / 2);

    for (let sIdx = 1; sIdx <= studentsPerClass; sIdx++) {
      const gender = sIdx <= halfCount ? "male" : "female";
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
      });

      studentProfiles.push({
        _id: profileId,
        user: userId,
        studentId: `STU-${campusId.toString().slice(-4).toUpperCase()}-${rollNumStr}-${uniqueSuffix}`,
        gradeId: room.grade._id,
        sectionId: room.section._id,
        rollNumber: rollNumStr,
        guardianDetails: guardian,
        enrollmentDate: new Date(Date.now() - Math.floor(Math.random() * 300 * 86400000)),
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

  const BATCH_SIZE = 400;
  for (let i = 0; i < studentUsers.length; i += BATCH_SIZE) {
    const userBatch = studentUsers.slice(i, i + BATCH_SIZE);
    const profileBatch = studentProfiles.slice(i, i + BATCH_SIZE);

    await User.insertMany(userBatch, { ordered: false });
    await StudentProfile.insertMany(profileBatch, { ordered: false });
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
 * FEATURE 2 — Seed Full Structure (Classes 1-12, Sections A-D, 60 Teachers, 1440 Students, Timetable)
 */
export async function seedFullStructure(campusId, { teachers = 60, studentsPerClass = 30 } = {}, currentUser = null) {
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

    // 1. Clear existing teachers and students completely
    await clearTeachersAndStudents(campusId);

    // 2. Ensure academic structure (12 grades, 48 sections, unique subjects)
    const { grades, sections, classRooms, subjectMap } = await ensureFullAcademicStructure(campusId, instituteId);

    // 3. Seed 60 Teachers with salary profiles
    const teacherRes = await seedTeachers(campusId, { count: teachers, clearFirst: false }, currentUser);
    const seededTeacherList = teacherRes.teachers || [];

    // 4. Seed 1,440 Students (30 per class section)
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
      const BATCH = 500;
      for (let i = 0; i < timetableDocs.length; i += BATCH) {
        await Timetable.insertMany(timetableDocs.slice(i, i + BATCH), { ordered: false });
      }
    }

    if (classScheduleDocs.length > 0) {
      const BATCH = 500;
      for (let i = 0; i < classScheduleDocs.length; i += BATCH) {
        await ClassSchedule.insertMany(classScheduleDocs.slice(i, i + BATCH), { ordered: false });
      }
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
      } catch (e) {
        // ignore duplicate
      }
    }

    // 7. Seed Attendance (30 days)
    const attendanceRes = await seedAttendance(campusId, { days: 30 });

    // 8. Seed Substitutes (7 days)
    const substituteRes = await seedSubstitutes(campusId, { days: 7 });

    // 9. Seed Payroll (Current month)
    const payrollRes = await seedPayroll(campusId);

    const durationSec = Math.round((Date.now() - startTime) / 1000);

    return {
      success: true,
      message: "Full school structure seeded successfully",
      data: {
        grades: grades.length,
        sections: sections.length,
        classRooms: classRooms.length,
        subjects: subjectMap.size,
        classSubjectMappings: teacherAssignmentDocs.length,
        teachers: teacherRes.created,
        students: studentRes.totalStudents,
        salaryProfiles: teacherRes.salaryProfilesCreated,
        timetableSlots: timetableDocs.length,
        attendanceRecords:
          (attendanceRes.teacherRecordsCreated || 0) + (attendanceRes.studentRecordsCreated || 0),
        substituteAssignments: substituteRes.created || 0,
        payrollRecords: payrollRes.created || 0,
        duration: `${durationSec} seconds`,
        credentials: {
          teacherPassword: "teacher123",
          studentPassword: "student123",
          sampleTeacherEmail: seededTeacherList[0]?.email,
          sampleStudentEmail: studentRes.sampleStudents[0]?.email,
          note: "All seed users share the same password per role",
        },
        summary: {
          classes: "Class 1 to Class 12",
          sections: "A, B, C, D for each class",
          studentsPerClass: studentsPerClass,
          timetableGenerated: `All ${classRooms.length} class rooms with 0 conflicts`,
        },
      },
    };
  } finally {
    campusSeedLocks.delete(String(campusId));
  }
}

/**
 * FEATURE 3 — Seed Attendance (Last N days, skipping Sundays)
 */
export async function seedAttendance(campusId, { days = 30 } = {}) {
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
    if (dayDate.getUTCDay() === 0) continue;

    const dateStr = dayDate.toISOString().split("T")[0];
    const utcMidnight = getUtcMidnight(dayDate);

    for (const tUser of teachers) {
      const rand = Math.random();
      let status = "Present";
      let checkInTime = "07:50";
      let checkOutTime = "14:10";

      if (rand < 0.05) {
        status = "Absent";
        checkInTime = "";
        checkOutTime = "";
      } else if (rand < 0.08) {
        status = "Late";
        checkInTime = "08:20";
        checkOutTime = "14:05";
      } else if (rand < 0.10) {
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

      if (rand < 0.05) {
        status = "Absent";
      } else if (rand < 0.08) {
        status = "Late";
      } else if (rand < 0.10) {
        status = "On Leave";
      }

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

  const BATCH = 1000;
  for (let i = 0; i < teacherAttendanceDocs.length; i += BATCH) {
    await TeacherAttendance.insertMany(teacherAttendanceDocs.slice(i, i + BATCH), { ordered: false });
  }

  for (let i = 0; i < studentAttendanceDocs.length; i += BATCH) {
    await StudentAttendance.insertMany(studentAttendanceDocs.slice(i, i + BATCH), { ordered: false });
  }

  return {
    success: true,
    daysProcessed: days,
    teacherRecordsCreated: teacherAttendanceDocs.length,
    studentRecordsCreated: studentAttendanceDocs.length,
  };
}

/**
 * FEATURE 4 — Seed Substitutes (Last 7 days)
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
    return { success: true, created: 0, message: "Not enough teachers for substitute seeding" };
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
    { period: 4, start: "10:30", end: "11:15" },
    { period: 5, start: "11:45", end: "12:30" },
    { period: 6, start: "12:30", end: "13:15" },
    { period: 7, start: "13:15", end: "14:00" },
  ];

  for (let i = 0; i < Math.min(absentAttendance.length, 30); i++) {
    const abs = absentAttendance[i];
    const originalTeacher = allProfiles.find(
      (tp) => String(tp.user?._id || tp.user) === String(abs.teacherProfileId) || String(tp._id) === String(abs.teacherProfileId)
    ) || allProfiles[i % allProfiles.length];

    const availableSubstitutes = allProfiles.filter(
      (tp) => String(tp._id) !== String(originalTeacher._id)
    );

    if (availableSubstitutes.length === 0) continue;

    const subTeacher = availableSubstitutes[Math.floor(Math.random() * availableSubstitutes.length)];
    const p = periods[Math.floor(Math.random() * periods.length)];

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
      reason: "Teacher Absent",
      status: "Assigned",
    });
  }

  await SubstituteAssignment.deleteMany({ campusId });
  if (substituteDocs.length > 0) {
    await SubstituteAssignment.insertMany(substituteDocs, { ordered: false });
  }

  return {
    success: true,
    created: substituteDocs.length,
  };
}

/**
 * Seed Monthly Payroll for teachers
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

    const base = sp.baseSalary || 60000;
    const allowancesTotal = Array.isArray(sp.allowances)
      ? sp.allowances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0)
      : 30000;
    const grossSalary = base + allowancesTotal;
    const deductionsTotal = (sp.taxDeduction || 0) + (sp.otherDeduction || 0);
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
        totalWorkingDays: 26,
        presentDays: 24,
        absentDays: 1,
        lateCount: 1,
        leaveDays: 0,
        substituteDuties: 2,
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

  return {
    month: currentMonth,
    created: payrollDocs.length,
  };
}

export async function resetAll(campusId, options = {}, currentUser = null) {
  return seedFullStructure(campusId, options, currentUser);
}

export async function seedFull(campusId, options = {}, currentUser = null) {
  return seedFullStructure(campusId, options, currentUser);
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
    campusAdmins: campusAdminsCount,
    note: "Campus administrators, accountants, and system settings are strictly preserved and never touched by seed operations.",
  };
}

export default {
  clearTeachers,
  clearStudents,
  clearTeachersAndStudents,
  seedFullStructure,
  seedTeachers,
  seedStudents,
  seedAttendance,
  seedSubstitutes,
  seedPayroll,
  seedFull,
  resetAll,
  getStats,
  ensureFullAcademicStructure,
};
