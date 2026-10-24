import mongoose from "mongoose";
import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import { StudentAttendance, TeacherProfile } from "../models/profile.model.js";
import { Section } from "../models/academic.model.js";
import {
  parseQrPayload,
  resolveStudentFromPayload,
  createStudentQrPayload,
} from "../utils/qrAttendance.js";
import { normalizeDate } from "./teacherStudentAttendance.service.js";
import { recordClassConducted } from "./classSession.service.js";

/**
 * Record Attendance via QR Scan with strict validation, duplicate prevention, and RBAC
 */
export async function processQrAttendanceScan(requester, body) {
  const {
    qrPayload,
    date,
    status = "Present",
    remarks = "Recorded via QR Code Scan",
    classId,
    className,
    section,
    overrideIfMarked = false,
  } = body;

  if (!qrPayload) {
    const err = new Error("No QR code data provided.");
    err.statusCode = 400;
    err.code = "MISSING_PAYLOAD";
    throw err;
  }

  // 1. Resolve effective campusId from requester
  let campusId = requester.campusId?._id || requester.campusId;
  if (!campusId && reqCampusHeader(requester)) {
    campusId = reqCampusHeader(requester);
  }
  if (!campusId) {
    // If super admin, inspect if payload has campusId
    const parsedProbe = parseQrPayload(qrPayload);
    if (parsedProbe.campusId && mongoose.isValidObjectId(parsedProbe.campusId)) {
      campusId = parsedProbe.campusId;
    }
  }

  // 2. Parse and validate QR payload
  const parsed = parseQrPayload(qrPayload);
  if (!parsed.success) {
    const err = new Error(parsed.message || "Invalid or unreadable QR code payload.");
    err.statusCode = 400;
    err.code = "INVALID_QR_PAYLOAD";
    throw err;
  }

  // 3. Resolve student from database with deep validation
  const resolvedStudent = await resolveStudentFromPayload(parsed, {
    campusId,
    classId,
    className,
    section,
  });

  // 3.5 Enforce Class & Section Scope if specified by teacher/scanner
  if (className && className !== "All" && className !== "All Classes") {
    const targetClass = className.split(" - ")[0].split(" • ")[0].trim().toLowerCase();
    const studentClass = (resolvedStudent.className || "").toLowerCase();
    if (!studentClass.includes(targetClass) && !targetClass.includes(studentClass)) {
      const err = new Error(
        `Class Mismatch: Student '${resolvedStudent.name}' belongs to ${resolvedStudent.className} (${resolvedStudent.section}), not ${className}.`
      );
      err.statusCode = 400;
      err.code = "CLASS_MISMATCH";
      throw err;
    }
  }

  if (section && section !== "All" && section !== "All sections") {
    const targetSec = section.replace(/^Section\s*/i, "").trim().toLowerCase();
    const studentSec = (resolvedStudent.section || "").replace(/^Section\s*/i, "").trim().toLowerCase();
    if (targetSec && studentSec && targetSec !== studentSec) {
      const err = new Error(
        `Section Mismatch: Student '${resolvedStudent.name}' belongs to Section ${resolvedStudent.section}, not Section ${section}.`
      );
      err.statusCode = 400;
      err.code = "SECTION_MISMATCH";
      throw err;
    }
  }

  const effectiveCampusId = campusId || resolvedStudent.campusId;
  if (!effectiveCampusId) {
    const err = new Error("Campus identification required to record attendance.");
    err.statusCode = 400;
    err.code = "MISSING_CAMPUS";
    throw err;
  }

  // 4. Role-based Access Control (RBAC)
  if (requester.role === "teacher") {
    // Teachers can only mark students in their assigned classes or section
    const teacherProfile = await TeacherProfile.findOne({
      $or: [{ user: requester._id }, { userId: requester._id }],
    }).lean();

    let authorized = false;

    if (teacherProfile?.isClassTeacher) {
      if (teacherProfile.classTeacherOf) {
        const sec = await Section.findById(teacherProfile.classTeacherOf).populate("gradeId", "name").lean();
        if (sec) {
          const secGrade = sec.gradeId?.name || "";
          const secName = sec.name || "";
          if (
            resolvedStudent.className.toLowerCase().includes(secGrade.toLowerCase()) &&
            resolvedStudent.section.toLowerCase().includes(secName.toLowerCase())
          ) {
            authorized = true;
          }
        }
      } else {
        authorized = true;
      }
    }

    // Also check if assigned as subject teacher
    if (!authorized) {
      const { getTeacherAssignedClasses } = await import("./teacherAssignment.service.js");
      const assigned = await getTeacherAssignedClasses(effectiveCampusId, requester._id);
      const isStudentInAssigned = assigned.some((cls) => {
        const cName = cls.className || cls.gradeOrClass || "";
        const cSec = cls.section || "";
        return (
          resolvedStudent.className.toLowerCase().includes(cName.toLowerCase()) &&
          (!cSec || resolvedStudent.section.toLowerCase().includes(cSec.toLowerCase()))
        );
      });
      if (isStudentInAssigned) {
        authorized = true;
      }
    }

    if (!authorized) {
      const err = new Error(
        `Access Denied: Student '${resolvedStudent.name}' belongs to ${resolvedStudent.className} (${resolvedStudent.section}), which is outside your assigned teaching roster.`
      );
      err.statusCode = 403;
      err.code = "TEACHER_NOT_AUTHORIZED_FOR_CLASS";
      throw err;
    }
  } else if (!["campus_admin", "campus_manager", "admin", "principal", "super_admin"].includes(requester.role)) {
    const err = new Error("Access Denied: Insufficient permissions to record student attendance.");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  // 5. Determine attendance date
  const { dateStr, startOfDay, endOfDay } = normalizeDate(date || new Date());

  // 6. Check existing attendance on this date (Duplicate Prevention)
  const existingRecord = await StudentAttendance.findOne({
    campusId: effectiveCampusId,
    studentId: resolvedStudent.studentId,
    $or: [{ dateStr }, { date: { $gte: startOfDay, $lte: endOfDay } }],
  }).lean();

  if (existingRecord && !overrideIfMarked) {
    return {
      success: true,
      alreadyMarked: true,
      message: `Attendance has already been marked for ${resolvedStudent.name} on ${dateStr} (Status: ${existingRecord.status}).`,
      student: {
        id: resolvedStudent.studentId,
        studentId: resolvedStudent.studentId,
        name: resolvedStudent.name,
        rollNo: resolvedStudent.rollNo,
        className: resolvedStudent.className,
        section: resolvedStudent.section,
        avatar: resolvedStudent.avatar,
        status: resolvedStudent.status,
      },
      record: {
        id: existingRecord._id,
        attendanceId: existingRecord._id,
        date: existingRecord.dateStr || dateStr,
        status: existingRecord.status,
        method: existingRecord.method || "manual",
        recordedAt: existingRecord.updatedAt || existingRecord.createdAt,
        remarks: existingRecord.remarks || "",
      },
    };
  }

  // 7. Normalize status string
  const validStatuses = ["Present", "Absent", "Late", "On Leave", "Excused"];
  let finalStatus = "Present";
  const matchedStatus = validStatuses.find((v) => v.toLowerCase() === String(status).toLowerCase());
  if (matchedStatus) finalStatus = matchedStatus;

  // 8. Atomically save attendance record
  const attendanceDoc = await StudentAttendance.findOneAndUpdate(
    {
      campusId: effectiveCampusId,
      studentId: resolvedStudent.studentId,
      dateStr,
    },
    {
      $set: {
        campusId: effectiveCampusId,
        instituteId: resolvedStudent.instituteId || null,
        studentId: resolvedStudent.studentId,
        date: startOfDay,
        dateStr,
        status: finalStatus,
        method: "qr_scan",
        className: resolvedStudent.className,
        gradeOrClass: resolvedStudent.className,
        section: resolvedStudent.section,
        rollNo: resolvedStudent.rollNo,
        academicSession: resolvedStudent.userDoc?.academicYear || "2026-2027",
        remarks: remarks || "Recorded via QR Code Scan",
        markedBy: requester._id,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 9. Sync class conduction event if teacher marked it
  if (requester.role === "teacher") {
    try {
      await recordClassConducted(effectiveCampusId, requester._id, {
        date: dateStr,
        classId: classId || null,
        className: resolvedStudent.className,
        section: resolvedStudent.section,
        source: "qr_scan",
        remarks: `QR attendance: ${resolvedStudent.name}`,
      });
    } catch (sessionErr) {
      console.warn("Notice: Class session sync skipped on QR scan:", sessionErr.message);
    }
  }

  return {
    success: true,
    alreadyMarked: false,
    updated: !!existingRecord,
    message: `Attendance confirmed: ${resolvedStudent.name} (${resolvedStudent.rollNo}) marked ${finalStatus}.`,
    student: {
      id: resolvedStudent.studentId,
      studentId: resolvedStudent.studentId,
      name: resolvedStudent.name,
      rollNo: resolvedStudent.rollNo,
      className: resolvedStudent.className,
      section: resolvedStudent.section,
      avatar: resolvedStudent.avatar,
      status: resolvedStudent.status,
    },
    record: {
      id: attendanceDoc._id,
      attendanceId: attendanceDoc._id,
      date: attendanceDoc.dateStr,
      status: attendanceDoc.status,
      method: attendanceDoc.method,
      recordedAt: attendanceDoc.updatedAt || attendanceDoc.createdAt,
      remarks: attendanceDoc.remarks,
    },
  };
}

/**
 * Diagnostic & Health Check for QR Attendance and Card Consistency
 */
export async function getAttendanceSystemDiagnostics(campusId) {
  const query = campusId ? { campusId } : {};

  const totalStudents = await User.countDocuments({ ...query, role: "student" });
  const totalStudentCards = await Student.countDocuments(query);
  const cardsWithStructuredQr = await Student.countDocuments({
    ...query,
    qrCodeData: { $regex: /STUDENT_ATTENDANCE/ },
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendances = await StudentAttendance.find({
    ...query,
    dateStr: todayStr,
  }).lean();

  const presentCount = todayAttendances.filter((a) => a.status?.toLowerCase() === "present").length;
  const absentCount = todayAttendances.filter((a) => a.status?.toLowerCase() === "absent").length;
  const lateCount = todayAttendances.filter((a) => a.status?.toLowerCase() === "late").length;
  const qrScannedCount = todayAttendances.filter((a) => a.method === "qr_scan").length;
  const manualCount = todayAttendances.filter((a) => a.method !== "qr_scan").length;

  // Check duplicate attendance count on todayStr
  const dupes = await StudentAttendance.aggregate([
    { $match: { ...query, dateStr: todayStr } },
    {
      $group: {
        _id: { studentId: "$studentId", campusId: "$campusId" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  return {
    status: dupes.length === 0 ? "healthy" : "warning",
    timestamp: new Date().toISOString(),
    metrics: {
      totalStudents,
      totalStudentCards,
      cardsWithStructuredQr,
      coverageRate: totalStudents > 0 ? Math.round((cardsWithStructuredQr / totalStudents) * 100) : 100,
      todayStr,
      todayLogged: todayAttendances.length,
      presentCount,
      absentCount,
      lateCount,
      qrScannedCount,
      manualCount,
      duplicateRecordsToday: dupes.length,
    },
  };
}

function reqCampusHeader(req) {
  return req?.headers?.["x-campus-id"] || null;
}
