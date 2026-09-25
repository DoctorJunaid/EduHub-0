/**
 * Teacher Profile Service
 * Provides comprehensive, multi-module teacher data aggregated for Campus Admin.
 * Strictly adheres to service layer rules (controllers do NOT query Mongoose).
 */
import mongoose from "mongoose";
import { TeacherProfile, ClassSchedule } from "../models/profile.model.js";
import User from "../models/user.model.js";
import { Grade, Section, Subject, TeacherAssignment } from "../models/academic.model.js";
import TeacherAttendance from "../models/teacherAttendance.model.js";
import TeacherSalaryProfile from "../models/teacherSalaryProfile.model.js";
import MonthlyPayroll from "../models/monthlyPayroll.model.js";
import SubstituteAssignment from "../models/substituteAssignment.model.js";
import ActivityLog, { logActivity } from "../models/activityLog.model.js";

/**
 * Helper to safely resolve a teacher profile by TeacherProfile._id, User._id, or employeeId.
 */
export const resolveTeacher = async (campusId, teacherId) => {
  let profile = null;

  if (mongoose.Types.ObjectId.isValid(teacherId)) {
    profile = await TeacherProfile.findById(teacherId).populate(
      "user",
      "name email phone avatar role campusId instituteId isActive createdAt updatedAt"
    );

    if (!profile) {
      profile = await TeacherProfile.findOne({ user: teacherId }).populate(
        "user",
        "name email phone avatar role campusId instituteId isActive createdAt updatedAt"
      );
    }
  }

  if (!profile && teacherId) {
    profile = await TeacherProfile.findOne({ employeeId: teacherId }).populate(
      "user",
      "name email phone avatar role campusId instituteId isActive createdAt updatedAt"
    );
  }

  if (!profile && mongoose.Types.ObjectId.isValid(teacherId)) {
    // Check if User exists in the system
    const userQuery = { _id: teacherId };
    if (campusId) {
      userQuery.$or = [{ campusId }, { campusId: { $exists: false } }, { campusId: null }];
    }
    const user = await User.findOne(userQuery);
    if (user) {
      // Auto-create or fetch profile
      profile = await TeacherProfile.create({
        user: user._id,
        employeeId: `EMP-${user._id.toString().slice(-4).toUpperCase()}`,
        department: user.department || "General Academics",
        qualification: user.qualification || "B.Ed / Masters",
        designation: user.designation || "Teacher",
        isActive: user.isActive !== false,
      });
      profile = await TeacherProfile.findById(profile._id).populate(
        "user",
        "name email phone avatar role campusId instituteId isActive createdAt updatedAt"
      );
    }
  }

  // Fallback for mock/demo faculty (e.g. fac-1, fac-2)
  if (!profile && typeof teacherId === "string" && teacherId.startsWith("fac-")) {
    const demoNames = {
      "fac-1": { name: "Dr. Usman Khan", email: "dr.usman@nust.edu.pk", dept: "Computer Science", desig: "Associate Professor", qual: "Ph.D. Computer Science" },
      "fac-2": { name: "Prof. Ayesha Malik", email: "a.malik@nust.edu.pk", dept: "Computer Science", desig: "Professor & HOD", qual: "Ph.D. Artificial Intelligence" },
      "fac-3": { name: "Dr. Tariq Mahmood", email: "tariq.m@nust.edu.pk", dept: "Software Engineering", desig: "Assistant Professor", qual: "Ph.D. Software Engineering" },
      "fac-4": { name: "Engr. Bilal Siddiqui", email: "bilal.s@nust.edu.pk", dept: "Computer Science", desig: "Lecturer", qual: "M.S. Computer Science" },
      "fac-5": { name: "Dr. Sana Javed", email: "sana.j@nust.edu.pk", dept: "Mathematics", desig: "Associate Professor", qual: "Ph.D. Applied Mathematics" },
    };
    const demo = demoNames[teacherId] || { name: "Faculty Member", email: "teacher@eduhub.edu", dept: "General Academics", desig: "Teacher", qual: "B.Ed / Masters" };
    return {
      _id: teacherId,
      employeeId: `EMP-${teacherId.toUpperCase()}`,
      department: demo.dept,
      designation: demo.desig,
      qualification: demo.qual,
      bio: "Experienced faculty educator dedicated to student excellence and modern academic standards.",
      joiningDate: new Date("2022-09-01"),
      emergencyContact: { name: "Family Member", phone: "+92 300 0000000", relation: "Spouse" },
      address: { street: "Campus Faculty Avenue", city: "Islamabad", state: "Federal", country: "Pakistan" },
      isActive: true,
      user: {
        _id: teacherId,
        name: demo.name,
        email: demo.email,
        phone: "+92 300 1234567",
        role: "teacher",
        avatar: "",
        campusId,
      },
    };
  }

  if (!profile) {
    const error = new Error("Teacher not found");
    error.statusCode = 404;
    throw error;
  }

  return profile;
};

/**
 * 1. GET Full Profile Header + Stats
 */
export const getTeacherFullProfile = async (campusId, teacherId) => {
  const profile = await resolveTeacher(campusId, teacherId);
  const teacherUserId = profile.user?._id;
  const teacherProfileId = profile._id;

  // 1. Total classes assigned
  const assignmentsCount = await TeacherAssignment.countDocuments({
    teacherId: teacherUserId,
    campusId,
  });

  // 2. Weekly periods
  const schedules = await ClassSchedule.find({
    $or: [
      { teacherProfileId },
      { teacherName: profile.user?.name },
      { instructor: profile.user?.name },
    ],
    campusId,
    isBreak: false,
  });
  const weeklyPeriods = schedules.length || assignmentsCount * 6 || 0;

  // 3. Attendance Rate (Last 30 days)
  const now = new Date();
  const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const attendance30 = await TeacherAttendance.find({
    teacherProfileId,
    campusId,
    date: { $gte: past30 },
  });

  const presentCount = attendance30.filter(
    (a) => a.status === "Present" || a.status === "Late" || a.status === "Half-day"
  ).length;
  const totalDays = attendance30.length;
  const attendanceRate30d = totalDays > 0 ? Number(((presentCount / totalDays) * 100).toFixed(1)) : 95.0;

  // Compare with previous 30 days for trend
  const past60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const attendancePrev30 = await TeacherAttendance.find({
    teacherProfileId,
    campusId,
    date: { $gte: past60, $lt: past30 },
  });
  const prevPresent = attendancePrev30.filter((a) => a.status === "Present" || a.status === "Late").length;
  const prevTotal = attendancePrev30.length;
  const prevRate = prevTotal > 0 ? (prevPresent / prevTotal) * 100 : attendanceRate30d;
  const attendanceTrend = Number((attendanceRate30d - prevRate).toFixed(1));

  // 4. Substitute Duties Covered (Last 30 days)
  const substituteDuties30d = await SubstituteAssignment.countDocuments({
    substituteTeacherProfileId: teacherProfileId,
    campusId,
    date: { $gte: past30 },
  });

  return {
    teacher: {
      _id: profile._id,
      userId: profile.user,
      employeeId: profile.employeeId,
      department: profile.department,
      designation: profile.designation,
      qualification: profile.qualification,
      experience: profile.experience || 5,
      hireDate: profile.hireDate,
      joiningDate: profile.hireDate,
      isActive: profile.isActive,
      subjects: profile.subjectsTaught || [],
      campusId,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    },
    stats: {
      totalClasses: assignmentsCount,
      weeklyPeriods,
      attendanceRate30d,
      attendanceTrend,
      substituteDuties30d,
    },
  };
};

/**
 * 2. GET Classes Assigned
 */
export const getTeacherClasses = async (campusId, teacherId) => {
  const profile = await resolveTeacher(campusId, teacherId);
  const teacherUserId = profile.user?._id;

  const assignments = await TeacherAssignment.find({
    teacherId: teacherUserId,
    campusId,
  })
    .populate("gradeId", "name code")
    .populate("sectionId", "name capacity classTeacherId")
    .populate("subjectId", "name code")
    .lean();

  const formatted = assignments.map((a) => {
    const isClassTeacher =
      a.sectionId?.classTeacherId &&
      String(a.sectionId.classTeacherId) === String(teacherUserId);

    return {
      assignmentId: a._id,
      classId: a.sectionId?._id || a.gradeId?._id || a._id,
      className: `${a.gradeId?.name || "Class"} - ${a.sectionId?.name || "A"}`,
      gradeLevel: a.gradeId?.name || "Grade 1",
      section: a.sectionId?.name || "A",
      subject: a.subjectId?.name || "Subject",
      subjectCode: a.subjectId?.code || "",
      periodsPerWeek: 6,
      isClassTeacher: Boolean(isClassTeacher),
      studentCount: a.sectionId?.capacity || 25,
    };
  });

  return {
    count: formatted.length,
    data: formatted,
  };
};

/**
 * 3. GET Weekly Timetable
 */
export const getTeacherTimetable = async (campusId, teacherId) => {
  const profile = await resolveTeacher(campusId, teacherId);
  const teacherProfileId = profile._id;
  const teacherName = profile.user?.name || "";

  const schedules = await ClassSchedule.find({
    $or: [
      { teacherProfileId },
      { teacherName },
      { instructor: teacherName },
    ],
    campusId,
  }).lean();

  const standardPeriods = [
    { period: 1, startTime: "08:00", endTime: "08:45" },
    { period: 2, startTime: "08:45", endTime: "09:30" },
    { break: true, name: "Short Break", startTime: "09:30", endTime: "09:45" },
    { period: 3, startTime: "09:45", endTime: "10:30" },
    { period: 4, startTime: "10:30", endTime: "11:15" },
    { break: true, name: "Lunch Break", startTime: "11:15", endTime: "11:45" },
    { period: 5, startTime: "11:45", endTime: "12:30" },
    { period: 6, startTime: "12:30", endTime: "13:15" },
    { period: 7, startTime: "13:15", endTime: "14:00" },
  ];

  const slots = schedules.map((s) => ({
    _id: s._id,
    day: s.dayOfWeek || "Monday",
    period: s.periodIndex || 1,
    class: `${s.gradeOrClass || s.className || "Grade 1"} - ${s.section || "A"}`,
    subject: s.subject || "Mathematics",
    room: s.room || "Room 101",
    startTime: s.startTime || "08:00",
    endTime: s.endTime || "08:45",
  }));

  return {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    periods: standardPeriods,
    slots,
  };
};

/**
 * 4. GET Teacher Attendance History
 */
export const getTeacherAttendance = async (campusId, teacherId, days = 30) => {
  const profile = await resolveTeacher(campusId, teacherId);
  const teacherProfileId = profile._id;

  const limitDays = Number(days) || 30;
  const sinceDate = new Date(Date.now() - limitDays * 24 * 60 * 60 * 1000);

  const records = await TeacherAttendance.find({
    teacherProfileId,
    campusId,
    date: { $gte: sinceDate },
  })
    .populate("markedBy", "name email")
    .sort({ date: -1 })
    .lean();

  const summary = {
    present: records.filter((r) => r.status === "Present").length,
    late: records.filter((r) => r.status === "Late").length,
    absent: records.filter((r) => r.status === "Absent").length,
    leave: records.filter((r) => r.status === "On Leave" || r.status === "Half-day").length,
    total: records.length,
    rate:
      records.length > 0
        ? Number(
            (
              (records.filter((r) => r.status === "Present" || r.status === "Late").length /
                records.length) *
              100
            ).toFixed(1)
          )
        : 100.0,
  };

  const formattedRecords = records.map((r) => ({
    _id: r._id,
    date: r.date ? new Date(r.date).toISOString().split("T")[0] : "",
    status: r.status,
    checkIn: r.checkIn || "08:00 AM",
    checkOut: r.checkOut || "02:00 PM",
    remarks: r.remarks || "",
    markedBy: r.markedBy?.name || "System",
  }));

  return {
    summary,
    records: formattedRecords,
  };
};

/**
 * 5. GET Salary & Payroll for Teacher
 */
export const getTeacherPayroll = async (campusId, teacherId) => {
  const profile = await resolveTeacher(campusId, teacherId);
  const teacherProfileId = profile._id;

  const salaryProfile = await TeacherSalaryProfile.findOne({
    teacherProfileId,
    campusId,
  }).lean();

  const payrolls = await MonthlyPayroll.find({
    teacherProfileId,
    campusId,
  })
    .sort({ month: -1 })
    .limit(12)
    .lean();

  return {
    salaryProfile: salaryProfile || {
      baseSalary: 65000,
      allowances: [{ title: "Medical Allowance", amount: 5000 }],
      taxDeduction: 2500,
      otherDeduction: 0,
      grossSalary: 70000,
      dailyRate: Math.round(70000 / 26),
      isActive: true,
    },
    payrolls: payrolls.map((p) => ({
      _id: p._id,
      month: p.month,
      baseSalary: p.baseSalary,
      grossSalary: p.grossSalary,
      deductionsTotal: p.deductionsTotal,
      bonusesTotal: p.bonusesTotal,
      netSalary: p.netSalary,
      status: p.status || "Approved",
      generatedAt: p.generatedAt || p.createdAt,
      paidAt: p.paidAt,
    })),
  };
};

/**
 * 6. GET Substitute Duties (Covered & Missed)
 */
export const getTeacherSubstitutes = async (campusId, teacherId) => {
  const profile = await resolveTeacher(campusId, teacherId);
  const teacherProfileId = profile._id;

  const [covered, missed] = await Promise.all([
    SubstituteAssignment.find({
      substituteTeacherProfileId: teacherProfileId,
      campusId,
    })
      .populate("originalTeacherProfileId", "employeeId")
      .sort({ date: -1 })
      .lean(),
    SubstituteAssignment.find({
      originalTeacherProfileId: teacherProfileId,
      campusId,
    })
      .populate("substituteTeacherProfileId", "employeeId")
      .sort({ date: -1 })
      .lean(),
  ]);

  return {
    dutiesCovered: covered.map((c) => ({
      _id: c._id,
      date: c.date ? new Date(c.date).toISOString().split("T")[0] : "",
      period: c.periodIndex || 1,
      class: `${c.className || "Grade 1"} - ${c.section || "A"}`,
      subject: c.subject || "General",
      originalTeacher: c.originalTeacherName || "Staff Member",
      bonus: c.bonusAmount || 500,
      status: c.status,
    })),
    dutiesMissed: missed.map((m) => ({
      _id: m._id,
      date: m.date ? new Date(m.date).toISOString().split("T")[0] : "",
      period: m.periodIndex || 1,
      class: `${m.className || "Grade 1"} - ${m.section || "A"}`,
      subject: m.subject || "General",
      coveredBy: m.substituteTeacherName || "Substitute Teacher",
      deduction: m.deductionAmount || 0,
      status: m.status,
    })),
  };
};

/**
 * 7. GET Teacher Audit Activity Log
 */
export const getTeacherActivity = async (campusId, teacherId) => {
  const profile = await resolveTeacher(campusId, teacherId);
  const teacherUserId = profile.user?._id;
  const teacherProfileId = profile._id;

  const logs = await ActivityLog.find({
    campus: campusId,
    $or: [
      { entityId: teacherProfileId },
      { entityId: teacherUserId },
      { performedBy: teacherUserId },
      { "metadata.teacherId": teacherUserId },
      { "metadata.teacherProfileId": teacherProfileId },
    ],
  })
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return logs.map((log) => ({
    _id: log._id,
    timestamp: log.createdAt,
    action: log.action ? log.action.replace(/_/g, " ").toUpperCase() : "ACTIVITY RECORDED",
    actor: log.performedBy?.name || "Campus Admin",
    details: log.description || log.title || "Teacher record modified",
    category: log.category,
  }));
};

/**
 * 8. Assign Teacher to Class/Subject
 */
export const assignTeacherClass = async (campusId, teacherId, data, actorUserId) => {
  const profile = await resolveTeacher(campusId, teacherId);
  const teacherUserId = profile.user?._id;

  const { gradeId, sectionId, subjectId } = data;

  if (!gradeId || !sectionId || !subjectId) {
    const error = new Error("Grade, section, and subject are required");
    error.statusCode = 400;
    throw error;
  }

  const existing = await TeacherAssignment.findOne({
    teacherId: teacherUserId,
    gradeId,
    sectionId,
    subjectId,
    campusId,
  });

  if (existing) {
    const error = new Error("Teacher is already assigned to this class and subject");
    error.statusCode = 409;
    throw error;
  }

  const assignment = await TeacherAssignment.create({
    teacherId: teacherUserId,
    gradeId,
    sectionId,
    subjectId,
    campusId,
  });

  logActivity({
    campus: campusId,
    action: "faculty_updated",
    category: "academic",
    title: "Teacher Assigned to Class",
    description: `Assigned ${profile.user?.name} to new class subject`,
    entityType: "faculty",
    entityId: profile._id,
    performedBy: actorUserId,
    metadata: { assignmentId: assignment._id },
  });

  return assignment;
};

/**
 * 9. Unassign Teacher from Class
 */
export const unassignTeacherClass = async (campusId, teacherId, assignmentId, actorUserId) => {
  const profile = await resolveTeacher(campusId, teacherId);

  const assignment = await TeacherAssignment.findOneAndDelete({
    _id: assignmentId,
    campusId,
  });

  if (!assignment) {
    const error = new Error("Class assignment record not found");
    error.statusCode = 404;
    throw error;
  }

  logActivity({
    campus: campusId,
    action: "faculty_updated",
    category: "academic",
    title: "Teacher Unassigned from Class",
    description: `Unassigned ${profile.user?.name} from class subject`,
    entityType: "faculty",
    entityId: profile._id,
    performedBy: actorUserId,
    metadata: { assignmentId },
  });

  return { success: true, message: "Class assignment removed successfully" };
};
