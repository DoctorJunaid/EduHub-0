import mongoose from "mongoose";
import StudentLeaveRequest from "../models/studentLeave.model.js";
import {
  StudentAttendance,
  StudentProfile,
  TeacherProfile,
} from "../models/profile.model.js";
import { Section, TeacherAssignment, Grade } from "../models/academic.model.js";
import User from "../models/user.model.js";
import { resolveStudentSubjects } from "../controllers/studentPortal.controller.js";
import { getTeacherAssignedClasses } from "./teacherAssignment.service.js";

function escapeRegex(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Normalize raw date into YYYY-MM-DD dateStr and UTC start/end Date objects
 */
function normalizeDateStr(rawDate) {
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
 * 1. Submit a student leave application
 */
export async function submitStudentLeave({
  studentUser,
  date,
  reason,
  category = "Medical",
  note = "",
  attachmentUrl = "",
  attachmentName = "",
}) {
  if (!studentUser || !studentUser._id) {
    throw new Error("Invalid student authentication.");
  }
  if (!reason || !reason.trim()) {
    throw new Error("Reason for absence is required.");
  }

  let campusId = studentUser.campusId;
  if (!campusId) {
    try {
      const prof = await StudentProfile.findOne({ user: studentUser._id })
        .select("campusId")
        .lean();
      if (prof?.campusId) campusId = prof.campusId;
    } catch {
      // ignore
    }
  }
  if (!campusId) {
    throw new Error("Student is not assigned to a campus.");
  }

  const ALLOWED_CATEGORIES = [
    "Medical",
    "Sick Leave",
    "Casual Leave",
    "Casual",
    "Personal",
    "Family Emergency",
    "Event",
    "Family Event",
    "Urgent",
    "Other",
  ];
  const safeCategory = ALLOWED_CATEGORIES.includes(category)
    ? category
    : "Other";

  const { dateStr, startOfDay } = normalizeDateStr(date);

  // Resolve student's grade/section and assigned class teacher
  let className = studentUser.gradeOrClass || studentUser.program || "Class 10";
  let section = studentUser.section || "A";
  let teacherId = null;
  let teacherName = "";

  try {
    const resolved = await resolveStudentSubjects(studentUser, campusId);
    if (resolved.gradeName) className = resolved.gradeName;
    if (resolved.sectionName) section = resolved.sectionName;
    if (resolved.classTeacher) {
      teacherId = resolved.classTeacher.userId || resolved.classTeacher._id;
      teacherName = resolved.classTeacher.name;
    }
  } catch (err) {
    console.warn(
      "[submitStudentLeave] resolveStudentSubjects fallback:",
      err.message,
    );
  }

  // Fallback: check Section if teacher not resolved
  if (!teacherId) {
    try {
      const secDoc = await Section.findOne({
        campusId,
        $or: [{ name: section }, { name: `Section ${section}` }],
      })
        .populate("classTeacherId")
        .lean();

      if (secDoc?.classTeacherId) {
        const ct = secDoc.classTeacherId;
        teacherId = ct.user || ct._id;
        teacherName = ct.name || "Class Teacher";
      }
    } catch (e) {
      // ignore
    }
  }

  const studentName = studentUser.name || "Student";
  const rollNumber =
    studentUser.rollNumber ||
    studentUser.roll ||
    studentUser.admissionNo ||
    "STD-001";

  // Check if leave request already exists for this date
  let leaveRequest = await StudentLeaveRequest.findOne({
    campusId,
    studentId: studentUser._id,
    dateStr,
  });

  if (leaveRequest) {
    if (leaveRequest.status === "Approved") {
      throw new Error(`Leave for ${dateStr} has already been approved.`);
    }
    // Update existing pending/rejected request
    leaveRequest.reason = reason.trim();
    leaveRequest.category = safeCategory;
    leaveRequest.note = note.trim();
    if (attachmentUrl) leaveRequest.attachmentUrl = attachmentUrl;
    if (attachmentName) leaveRequest.attachmentName = attachmentName;
    leaveRequest.status = "Pending";
    leaveRequest.teacherId = teacherId || leaveRequest.teacherId;
    leaveRequest.teacherName = teacherName || leaveRequest.teacherName;
    leaveRequest.className = className;
    leaveRequest.section = section;
    leaveRequest.rejectionReason = "";
    await leaveRequest.save();
  } else {
    leaveRequest = await StudentLeaveRequest.create({
      campusId,
      instituteId: studentUser.instituteId || null,
      studentId: studentUser._id,
      studentName,
      rollNumber,
      className,
      section,
      teacherId,
      teacherName,
      date: startOfDay,
      dateStr,
      reason: reason.trim(),
      category: safeCategory,
      note: note.trim(),
      attachmentUrl,
      attachmentName,
      status: "Pending",
    });
  }

  // Update or sync student attendance record remarks to note pending application
  try {
    const existingAtt = await StudentAttendance.findOne({
      campusId,
      studentId: studentUser._id,
      $or: [{ dateStr }, { date: startOfDay }],
    });

    if (existingAtt) {
      if (existingAtt.status === "Absent" || existingAtt.status === "absent") {
        existingAtt.remarks = `Leave Application Pending: ${category} - ${reason.trim()}`;
        await existingAtt.save();
      }
    } else {
      // Upsert record with status Absent so it's formally marked
      await StudentAttendance.create({
        campusId,
        instituteId: studentUser.instituteId || null,
        studentId: studentUser._id,
        date: startOfDay,
        dateStr,
        status: "Absent",
        className,
        section,
        remarks: `Leave Application Pending: ${category} - ${reason.trim()}`,
      });
    }
  } catch (attErr) {
    console.warn(
      "[submitStudentLeave] attendance sync notice:",
      attErr.message,
    );
  }

  return leaveRequest;
}

/**
 * 2. Get student's leave requests
 */
export async function getStudentLeaveRequests(campusId, studentId) {
  return await StudentLeaveRequest.find({ campusId, studentId })
    .sort({ date: -1, createdAt: -1 })
    .lean();
}

/**
 * Resolve Section(s) where the user is designated as Class Teacher
 */
export async function findClassTeacherSectionsForUser(teacherUserId, campusId) {
  const possibleIds = [teacherUserId];
  if (mongoose.isValidObjectId(teacherUserId)) {
    const tp = await TeacherProfile.findOne({
      $or: [
        { user: teacherUserId },
        { userId: teacherUserId },
        { _id: teacherUserId },
      ],
    }).lean();

    if (tp) {
      possibleIds.push(tp._id);
      if (tp.classTeacherOf) {
        const sec = await Section.findById(tp.classTeacherOf)
          .populate("gradeId", "name")
          .lean();
        if (sec) return [sec];
      }
    }
  }

  const query = {
    classTeacherId: { $in: possibleIds },
  };
  if (campusId) query.campusId = campusId;

  let sections = await Section.find(query).populate("gradeId", "name").lean();

  if ((!sections || sections.length === 0) && campusId) {
    sections = await Section.find({ classTeacherId: { $in: possibleIds } })
      .populate("gradeId", "name")
      .lean();
  }

  return sections || [];
}

/**
 * 3. Get leave requests visible to a teacher or campus manager
 * STRICT CLASS & SECTION ISOLATION: A Class Teacher can ONLY see leave requests
 * for students in their designated class and section!
 */
export async function getTeacherLeaveRequests(
  campusId,
  teacherUserId,
  filter = {},
) {
  const user = await User.findById(teacherUserId).lean();
  const isElevated =
    user?.role === "campus_admin" ||
    user?.role === "campus_manager" ||
    user?.role === "principal" ||
    user?.role === "super_admin";

  const query = {};

  if (filter.status && filter.status !== "all") {
    query.status = filter.status;
  }

  if (isElevated) {
    if (campusId) query.campusId = campusId;
  } else {
    // Teacher / Faculty: strictly scoped to the class/section where they are the designated Class Teacher
    const assignedSections = await findClassTeacherSectionsForUser(
      teacherUserId,
      campusId,
    );

    // If teacher is NOT assigned as Class Teacher for any section, return empty array immediately
    if (!assignedSections || assignedSections.length === 0) {
      return [];
    }

    const sectionMatchConditions = [];
    const studentFilterConditions = [];

    for (const secDoc of assignedSections) {
      const gName = secDoc.gradeId?.name || "";
      const sName = secDoc.name || "";
      const cleanGrade = gName.replace(/^(class|grade)\s*/i, "").trim();
      const cleanSec = sName.replace(/^section\s*/i, "").trim();

      const gradeRegexList = [
        new RegExp(`^${escapeRegex(gName)}$`, "i"),
        ...(cleanGrade
          ? [new RegExp(`^(class|grade)\\s*${escapeRegex(cleanGrade)}$`, "i")]
          : []),
      ];

      const secRegexList = [
        new RegExp(`^${escapeRegex(sName)}$`, "i"),
        ...(cleanSec
          ? [new RegExp(`^(section\\s*)?${escapeRegex(cleanSec)}$`, "i")]
          : []),
      ];

      sectionMatchConditions.push({
        $and: [
          { $or: gradeRegexList.map((r) => ({ className: r })) },
          { $or: secRegexList.map((r) => ({ section: r })) },
        ],
      });

      studentFilterConditions.push({
        $or: [
          { sectionId: secDoc._id },
          {
            $and: [
              {
                $or: [
                  ...gradeRegexList.map((r) => ({ gradeOrClass: r })),
                  ...gradeRegexList.map((r) => ({ program: r })),
                ],
              },
              {
                $or: secRegexList.map((r) => ({ section: r })),
              },
            ],
          },
        ],
      });
    }

    // Find all student IDs enrolled in the teacher's designated sections
    const studentQuery = {
      role: "student",
      $or: studentFilterConditions,
    };
    if (campusId) studentQuery.campusId = campusId;

    const enrolledStudents = await User.find(studentQuery).select("_id").lean();
    const validStudentIds = enrolledStudents.map((s) => s._id);

    const orRules = [...sectionMatchConditions];
    if (validStudentIds.length > 0) {
      orRules.push({ studentId: { $in: validStudentIds } });
    }

    query.$and = [...(campusId ? [{ campusId }] : []), { $or: orRules }];
  }

  return await StudentLeaveRequest.find(query)
    .populate(
      "studentId",
      "name email rollNumber roll admissionNo gradeOrClass program section avatar",
    )
    .sort({ date: -1, createdAt: -1 })
    .lean();
}

/**
 * 4. Review (Approve or Reject) a leave request
 * Automatically syncs the result to central StudentAttendance database!
 */
export async function reviewLeaveRequest(
  leaveRequestId,
  campusId,
  reviewerUser,
  { status, remarks = "" },
) {
  if (!["Approved", "Rejected"].includes(status)) {
    throw new Error("Invalid review status. Must be 'Approved' or 'Rejected'.");
  }

  let leaveReq = null;
  if (campusId) {
    leaveReq = await StudentLeaveRequest.findOne({
      _id: leaveRequestId,
      campusId,
    });
  }
  if (!leaveReq) {
    leaveReq = await StudentLeaveRequest.findById(leaveRequestId);
  }
  if (!leaveReq) {
    throw new Error("Leave request not found.");
  }

  // Enforce teacher authorization: only the designated Class Teacher can review
  const isElevated =
    reviewerUser?.role === "campus_admin" ||
    reviewerUser?.role === "campus_manager" ||
    reviewerUser?.role === "principal" ||
    reviewerUser?.role === "super_admin";

  if (!isElevated) {
    const assignedSections = await findClassTeacherSectionsForUser(
      reviewerUser._id,
      campusId || leaveReq.campusId,
    );
    if (!assignedSections || assignedSections.length === 0) {
      const err = new Error(
        "Forbidden: You are not designated as a Class Teacher.",
      );
      err.statusCode = 403;
      throw err;
    }

    const studentUser = await User.findById(leaveReq.studentId).lean();
    let belongs = false;

    for (const sec of assignedSections) {
      const gName = sec.gradeId?.name || "";
      const sName = sec.name || "";
      const cleanG = gName
        .replace(/^(class|grade)\s*/i, "")
        .trim()
        .toLowerCase();
      const cleanS = sName
        .replace(/^section\s*/i, "")
        .trim()
        .toLowerCase();

      const lG = (
        leaveReq.className ||
        studentUser?.gradeOrClass ||
        studentUser?.program ||
        ""
      )
        .replace(/^(class|grade)\s*/i, "")
        .trim()
        .toLowerCase();
      const lS = (leaveReq.section || studentUser?.section || "")
        .replace(/^section\s*/i, "")
        .trim()
        .toLowerCase();

      const studentSecId = studentUser?.sectionId
        ? String(studentUser.sectionId)
        : "";
      if (studentSecId && studentSecId === String(sec._id)) {
        belongs = true;
        break;
      }

      if (cleanG && lG && cleanG === lG && (!cleanS || !lS || cleanS === lS)) {
        belongs = true;
        break;
      }
    }

    if (!belongs) {
      const err = new Error(
        "Forbidden: You can only review leave requests for your designated Class and Section.",
      );
      err.statusCode = 403;
      throw err;
    }
  }

  const dateStr = leaveReq.dateStr;
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  leaveReq.status = status;
  leaveReq.reviewedBy = {
    userId: reviewerUser._id,
    name: reviewerUser.name || "Teacher",
    role: reviewerUser.role || "teacher",
  };
  leaveReq.reviewedAt = new Date();

  let syncedAttendance = null;

  if (status === "Approved") {
    leaveReq.approvalRemarks = remarks || "Leave approved by teacher";
    leaveReq.rejectionReason = "";

    const syncRemarks =
      remarks.trim() ||
      `${leaveReq.category || "Medical"} leave application approved`;

    // CENTRAL DATABASE SYNC:
    // Update StudentAttendance record status from "Absent" to "Excused"
    syncedAttendance = await StudentAttendance.findOneAndUpdate(
      {
        campusId: leaveReq.campusId,
        studentId: leaveReq.studentId,
        $or: [{ dateStr }, { date: { $gte: startOfDay, $lte: endOfDay } }],
      },
      {
        $set: {
          campusId: leaveReq.campusId,
          instituteId: leaveReq.instituteId,
          studentId: leaveReq.studentId,
          date: startOfDay,
          dateStr,
          status: "Excused", // Changed from "Absent" to "Excused"
          remarks: syncRemarks,
          className: leaveReq.className,
          gradeOrClass: leaveReq.className,
          section: leaveReq.section,
          markedBy: reviewerUser._id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } else {
    // Rejected
    leaveReq.rejectionReason = remarks || "Leave request rejected";
    leaveReq.approvalRemarks = "";

    // In student attendance, update remarks to reflect rejection
    syncedAttendance = await StudentAttendance.findOneAndUpdate(
      {
        campusId: leaveReq.campusId,
        studentId: leaveReq.studentId,
        $or: [{ dateStr }, { date: { $gte: startOfDay, $lte: endOfDay } }],
      },
      {
        $set: {
          status: "Absent",
          remarks: `Leave request rejected: ${remarks || "Application not approved"}`,
        },
      },
      { new: true },
    );
  }

  await leaveReq.save();

  return {
    leaveRequest: leaveReq,
    syncedAttendance,
  };
}

/**
 * 5. Campus admin / manager fetches all leave requests across campus
 */
export async function getCampusLeaveRequests(campusId, filter = {}) {
  const query = {};
  if (campusId) query.campusId = campusId;
  if (filter.status && filter.status !== "all") {
    query.status = filter.status;
  }

  return await StudentLeaveRequest.find(query)
    .populate(
      "studentId",
      "name email rollNumber roll admissionNo gradeOrClass program section avatar",
    )
    .sort({ date: -1, createdAt: -1 })
    .lean();
}
