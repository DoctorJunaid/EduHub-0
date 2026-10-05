import mongoose from "mongoose";
import { StudentAttendance, StudentProfile } from "../models/profile.model.js";
import User from "../models/user.model.js";
import { getTeacherAssignedClasses, resolveTeacherUser } from "./teacherAssignment.service.js";

/**
 * Normalize date into dateStr (YYYY-MM-DD) and UTC midnight Date object.
 */
export function normalizeDate(rawDate) {
  let dateStr = "";
  if (rawDate instanceof Date) {
    dateStr = rawDate.toISOString().split("T")[0];
  } else if (typeof rawDate === "string") {
    dateStr = rawDate.slice(0, 10);
  } else {
    dateStr = new Date().toISOString().split("T")[0];
  }

  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
  return { dateStr, startOfDay, endOfDay };
}

/**
 * 1. Get assigned classes for the teacher.
 */
export async function getTeacherClasses(campusId, teacherUserId) {
  return await getTeacherAssignedClasses(campusId, teacherUserId);
}

/**
 * 2. Get students in a specific class and section, with existing attendance for the selected date.
 */
export async function getClassStudentRosterWithAttendance(campusId, teacherUserId, { classId, className, section, date }) {
  const { dateStr, startOfDay, endOfDay } = normalizeDate(date);

  // If classId is passed and no className/section, resolve from assigned classes
  let targetClassName = className || "";
  let targetSection = section || "";

  if (!targetClassName && classId) {
    const assignedClasses = await getTeacherAssignedClasses(campusId, teacherUserId);
    const matched = assignedClasses.find(
      (c) => String(c.id || c._id || c.classId) === String(classId)
    );
    if (matched) {
      targetClassName = matched.className || matched.gradeOrClass || "";
      targetSection = matched.section || "";
    }
  }

  // Query students matching campus and class/section
  const studentQuery = {
    campusId,
    role: "student",
  };

  if (targetClassName) {
    studentQuery.$or = [
      { gradeOrClass: targetClassName },
      { program: targetClassName },
      { gradeOrClass: new RegExp(`^${targetClassName}$`, "i") },
      { program: new RegExp(`^${targetClassName}$`, "i") },
    ];
  }

  if (targetSection && targetSection !== "All" && targetSection !== "All sections") {
    studentQuery.section = { $in: [targetSection, `Section ${targetSection}`, targetSection.toUpperCase(), targetSection.toLowerCase()] };
  }

  let students = await User.find(studentQuery)
    .select("_id name email roll rollNo rollNumber gradeOrClass program section avatar phone isActive")
    .sort({ rollNumber: 1, roll: 1, name: 1 })
    .lean();

  // If no students matched the specific class/section filter, fallback to all active campus students
  if (!students.length) {
    students = await User.find({ campusId, role: "student" })
      .select("_id name email roll rollNo rollNumber gradeOrClass program section avatar phone isActive")
      .sort({ name: 1 })
      .limit(50)
      .lean();
  }

  const studentIds = students.map((s) => s._id);

  // Query existing attendance records for these students on this date
  const existingAttendance = await StudentAttendance.find({
    campusId,
    studentId: { $in: studentIds },
    $or: [
      { dateStr },
      { date: { $gte: startOfDay, $lte: endOfDay } },
    ],
  }).lean();

  const attendanceMap = new Map();
  for (const record of existingAttendance) {
    attendanceMap.set(String(record.studentId), record);
  }

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let onLeaveCount = 0;
  let unmarkedCount = 0;

  const roster = students.map((student) => {
    const sId = String(student._id);
    const existing = attendanceMap.get(sId);
    const rawStatus = existing?.status || "";
    
    // Normalize status casing
    let status = "";
    if (rawStatus) {
      const lower = rawStatus.toLowerCase();
      if (lower === "present") status = "Present";
      else if (lower === "absent") status = "Absent";
      else if (lower === "late") status = "Late";
      else if (lower === "on leave" || lower === "leave" || lower === "excused") status = "On Leave";
      else status = rawStatus;
    }

    if (status === "Present") presentCount++;
    else if (status === "Absent") absentCount++;
    else if (status === "Late") lateCount++;
    else if (status === "On Leave") onLeaveCount++;
    else unmarkedCount++;

    return {
      _id: sId,
      id: sId,
      studentId: sId,
      name: student.name || "Student",
      email: student.email || "",
      rollNumber: student.rollNumber || student.rollNo || student.roll || "—",
      gradeOrClass: student.gradeOrClass || student.program || targetClassName || "Class 10",
      program: student.program || student.gradeOrClass || targetClassName || "Class 10",
      section: student.section || targetSection || "A",
      avatar: student.avatar || "",
      phone: student.phone || "",
      status,
      remarks: existing?.remarks || "",
      attendanceId: existing?._id ? String(existing._id) : null,
      updatedAt: existing?.updatedAt || null,
    };
  });

  return {
    date: dateStr,
    className: targetClassName,
    section: targetSection,
    classId: classId || null,
    totalStudents: roster.length,
    presentCount,
    absentCount,
    lateCount,
    onLeaveCount,
    unmarkedCount,
    students: roster,
  };
}

/**
 * 3. Save / Upsert batch student attendance records for a class on a date.
 */
export async function saveClassAttendance(campusId, teacherUserId, payload) {
  const { classId, className, section, subject, date, records } = payload;
  const { dateStr, startOfDay, endOfDay } = normalizeDate(date);

  const resolved = await resolveTeacherUser(teacherUserId);
  const markedBy = resolved?._id || teacherUserId;

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("No attendance records provided to save.");
  }

  const validStatuses = ["Present", "Absent", "Late", "On Leave", "Excused"];
  const bulkOperations = [];

  for (const item of records) {
    const studentId = item.studentId || item.id || item._id;
    if (!studentId || !mongoose.isValidObjectId(studentId)) continue;

    let status = item.status || "Present";
    // Normalize status string
    const match = validStatuses.find((v) => v.toLowerCase() === String(status).toLowerCase());
    if (match) status = match;

    bulkOperations.push({
      updateOne: {
        filter: {
          campusId,
          studentId,
          $or: [
            { dateStr },
            { date: { $gte: startOfDay, $lte: endOfDay } },
          ],
        },
        update: {
          $set: {
            campusId,
            studentId,
            date: startOfDay,
            dateStr,
            status,
            className: item.className || className || "Class 10",
            gradeOrClass: item.className || className || "Class 10",
            section: item.section || section || "A",
            remarks: item.remarks || "",
            markedBy,
          },
        },
        upsert: true,
      },
    });
  }

  if (bulkOperations.length > 0) {
    await StudentAttendance.bulkWrite(bulkOperations, { ordered: false });
  }

  // Return fresh roster and updated KPI counts
  return await getClassStudentRosterWithAttendance(campusId, teacherUserId, {
    classId,
    className,
    section,
    date: dateStr,
  });
}
