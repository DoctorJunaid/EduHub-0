import mongoose from "mongoose";
import Assignment from "../models/assignment.model.js";
import Timetable from "../models/timetable.model.js";
import { ClassSchedule, TeacherProfile, StudentProfile } from "../models/profile.model.js";
import { TeacherAssignment, Grade, Section, Subject } from "../models/academic.model.js";
import User from "../models/user.model.js";
import Alert from "../models/alert.model.js";
import { StudentAssignment } from "../models/studentPortal.model.js";
import TeacherClassSession from "../models/teacherClassSession.model.js";

/**
 * Resolves teacher user ID if passed TeacherProfile ID or User ID.
 */
export async function resolveTeacherUser(id) {
  if (!id) return null;
  const user = await User.findById(id).select("_id name email campusId role").lean();
  if (user) return user;
  const profile = await TeacherProfile.findById(id).populate("user", "_id name email campusId role").lean();
  if (profile?.user) return profile.user;
  return null;
}

/**
 * Get all classes/courses assigned to a teacher.
 * Merges Timetable slots, ClassSchedule, and TeacherAssignment records.
 */
export async function getTeacherAssignedClasses(campusId, teacherUserId) {
  const resolved = await resolveTeacherUser(teacherUserId);
  const uId = resolved?._id || teacherUserId;

  // 1. Fetch from Timetable
  const timetables = await Timetable.find({
    campusId,
    teacherId: uId,
    status: { $ne: "Cancelled" },
    isBreak: false,
  })
    .populate("gradeId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .lean();

  // 2. Fetch from Academic TeacherAssignment
  const academicAssignments = await TeacherAssignment.find({
    campusId,
    teacherId: uId,
  })
    .populate("gradeId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .lean();

  // 3. Fetch from ClassSchedule (legacy)
  const legacySchedules = await ClassSchedule.find({
    campusId,
    $or: [{ teacherId: uId }, { instructor: resolved?.name }],
    isBreak: false,
  }).lean();

  // Deduplicate and aggregate classes
  const classMap = new Map();

  for (const slot of timetables) {
    const className = slot.gradeId?.name || slot.program || "Class 10";
    const section = slot.sectionId?.name || slot.section || "A";
    const subject = slot.subjectId?.name || slot.subject || "General";
    const key = `${className}_${section}_${subject}`.toLowerCase();

    if (!classMap.has(key)) {
      classMap.set(key, {
        _id: slot._id,
        id: slot._id.toString(),
        classId: slot._id.toString(),
        timetableId: slot._id,
        gradeId: slot.gradeId?._id || null,
        sectionId: slot.sectionId?._id || null,
        subjectId: slot.subjectId?._id || null,
        className,
        gradeOrClass: className,
        program: className,
        section,
        subject,
        subjectCode: slot.subjectId?.code || "",
        room: slot.room || "Room 101",
        days: slot.days || [],
        startTime: slot.startTime,
        endTime: slot.endTime,
        teacherId: uId,
        teacherName: resolved?.name || "Teacher",
        source: "timetable",
      });
    }
  }

  for (const item of academicAssignments) {
    const className = item.gradeId?.name || "Class 10";
    const section = item.sectionId?.name || "A";
    const subject = item.subjectId?.name || "General";
    const key = `${className}_${section}_${subject}`.toLowerCase();

    if (!classMap.has(key)) {
      classMap.set(key, {
        _id: item._id,
        id: item._id.toString(),
        classId: item._id.toString(),
        gradeId: item.gradeId?._id || null,
        sectionId: item.sectionId?._id || null,
        subjectId: item.subjectId?._id || null,
        className,
        gradeOrClass: className,
        program: className,
        section,
        subject,
        subjectCode: item.subjectId?.code || "",
        room: "Classroom",
        days: [1, 2, 3, 4, 5],
        startTime: "09:00",
        endTime: "10:00",
        teacherId: uId,
        teacherName: resolved?.name || "Teacher",
        source: "academic",
      });
    }
  }

  for (const leg of legacySchedules) {
    const className = leg.className || leg.gradeOrClass || "Class 10";
    const section = leg.section || "A";
    const subject = leg.subject || leg.title || "General";
    const key = `${className}_${section}_${subject}`.toLowerCase();

    if (!classMap.has(key)) {
      classMap.set(key, {
        _id: leg._id,
        id: leg._id.toString(),
        classId: leg._id.toString(),
        className,
        gradeOrClass: className,
        program: className,
        section,
        subject,
        subjectCode: "",
        room: leg.roomNumber || leg.room || "Room 101",
        days: leg.days || [],
        dayOfWeek: leg.dayOfWeek || "",
        startTime: leg.startTime,
        endTime: leg.endTime,
        teacherId: uId,
        teacherName: leg.instructor || leg.teacherName || resolved?.name || "Teacher",
        source: "legacy",
      });
    }
  }

  // 4. Fetch from TeacherClassSession
  const sessions = await TeacherClassSession.find({
    campusId,
    $or: [{ originalTeacherId: uId }, { actualTeacherId: uId }],
  }).lean();

  for (const s of sessions) {
    const className = s.className || "Class 10";
    const section = s.section || "A";
    const subject = s.subject || "General";
    const key = `${className}_${section}_${subject}`.toLowerCase();

    if (!classMap.has(key)) {
      classMap.set(key, {
        _id: s._id,
        id: s._id.toString(),
        classId: s._id.toString(),
        className,
        gradeOrClass: className,
        program: className,
        section,
        subject,
        subjectCode: "",
        room: s.room || "Room 101",
        days: [1, 2, 3, 4, 5],
        startTime: s.startTime || "09:00",
        endTime: s.endTime || "10:00",
        teacherId: uId,
        teacherName: resolved?.name || "Teacher",
        source: "session",
      });
    }
  }

  // 5. Fallback: query distinct grades and sections from Grade model or Student Users
  if (classMap.size === 0) {
    const grades = await Grade.find({ campusId }).lean();
    const sections = await Section.find({ campusId }).lean();
    const subjects = await Subject.find({ campusId }).lean();

    if (grades.length) {
      for (const g of grades) {
        const gradeSecs = sections.filter((s) => String(s.gradeId) === String(g._id));
        const sub = subjects[0]?.name || "General";
        const secList = gradeSecs.length ? gradeSecs : [{ name: "A", _id: g._id }];
        for (const sec of secList) {
          const key = `${g.name}_${sec.name}_${sub}`.toLowerCase();
          if (!classMap.has(key)) {
            classMap.set(key, {
              _id: g._id,
              id: `${g._id}_${sec._id || sec.name}`,
              classId: `${g._id}_${sec._id || sec.name}`,
              gradeId: g._id,
              sectionId: sec._id || null,
              className: g.name,
              gradeOrClass: g.name,
              program: g.name,
              section: sec.name || "A",
              subject: sub,
              subjectCode: "",
              room: "Classroom 101",
              days: [1, 2, 3, 4, 5],
              startTime: "09:00",
              endTime: "10:00",
              teacherId: uId,
              teacherName: resolved?.name || "Teacher",
              source: "campus_default",
            });
          }
        }
      }
    } else {
      // Check if student accounts have class/section defined
      const studentClasses = await User.aggregate([
        { $match: { campusId, role: "student" } },
        {
          $group: {
            _id: {
              className: { $ifNull: ["$gradeOrClass", "$program"] },
              section: { $ifNull: ["$section", "A"] },
            },
          },
        },
      ]);

      if (studentClasses.length > 0) {
        for (const sc of studentClasses) {
          const cName = sc._id.className || "Class 10";
          const sec = sc._id.section || "A";
          const sub = "General";
          const key = `${cName}_${sec}_${sub}`.toLowerCase();
          if (!classMap.has(key)) {
            const tempId = new mongoose.Types.ObjectId();
            classMap.set(key, {
              _id: tempId,
              id: tempId.toString(),
              classId: tempId.toString(),
              className: cName,
              gradeOrClass: cName,
              program: cName,
              section: sec,
              subject: sub,
              subjectCode: "",
              room: "Classroom 101",
              days: [1, 2, 3, 4, 5],
              startTime: "09:00",
              endTime: "10:00",
              teacherId: uId,
              teacherName: resolved?.name || "Teacher",
              source: "students_roster",
            });
          }
        }
      } else {
        // Standard academic grade options as guaranteed fallback
        const standardClasses = [
          { className: "Class 10", section: "A", subject: "Mathematics" },
          { className: "Class 10", section: "B", subject: "Physics" },
          { className: "Class 9", section: "A", subject: "Computer Science" },
          { className: "Class 9", section: "B", subject: "English" },
          { className: "Grade 11", section: "A", subject: "Chemistry" },
        ];

        for (const sc of standardClasses) {
          const key = `${sc.className}_${sc.section}_${sc.subject}`.toLowerCase();
          const tempId = new mongoose.Types.ObjectId();
          classMap.set(key, {
            _id: tempId,
            id: tempId.toString(),
            classId: tempId.toString(),
            className: sc.className,
            gradeOrClass: sc.className,
            program: sc.className,
            section: sc.section,
            subject: sc.subject,
            subjectCode: "",
            room: "Room 101",
            days: [1, 2, 3, 4, 5],
            startTime: "09:00",
            endTime: "10:00",
            teacherId: uId,
            teacherName: resolved?.name || "Teacher",
            source: "standard_catalog",
          });
        }
      }
    }
  }

  const result = Array.from(classMap.values());

  // Attach student count for each class
  for (const cls of result) {
    const count = await User.countDocuments({
      campusId,
      role: "student",
      $or: [
        { gradeOrClass: cls.className, section: cls.section },
        { program: cls.className, section: cls.section },
      ],
    });
    cls.enrolledStudentsCount = count || 0;
  }

  return result;
}

/**
 * List assignments for a teacher with full aggregated submission stats.
 */
export async function getTeacherAssignments(campusId, teacherUserId, filters = {}) {
  const resolved = await resolveTeacherUser(teacherUserId);
  const uId = resolved?._id || teacherUserId;

  const query = { campusId };

  if (filters.teacherOnly !== false) {
    query.$or = [
      { teacherId: uId },
      { instructorId: uId },
      { instructor: resolved?.name },
    ];
  }

  if (filters.classId) {
    query.classId = filters.classId;
  }
  if (filters.className) {
    query.className = new RegExp(filters.className, "i");
  }
  if (filters.section) {
    query.section = filters.section;
  }
  if (filters.subject) {
    query.subject = new RegExp(filters.subject, "i");
  }
  if (filters.status && filters.status !== "All") {
    query.status = filters.status;
  }

  const assignments = await Assignment.find(query)
    .populate("teacherId", "name email role")
    .sort({ createdAt: -1 })
    .lean();

  return assignments.map((a) => {
    const subs = a.submissions || [];
    const submissionsCount = subs.length;
    const gradedCount = subs.filter((s) => s.status === "Graded").length;
    const pendingCount = subs.filter((s) => s.status === "Submitted" || s.status === "Late" || s.status === "Pending").length;
    const scores = subs.filter((s) => s.status === "Graded" && typeof s.score === "number").map((s) => s.score);
    const avgScore = scores.length ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length) : null;

    return {
      ...a,
      id: a._id.toString(),
      submissionsCount,
      gradedCount,
      pendingCount,
      avgScore,
    };
  });
}

/**
 * Create a new assignment.
 */
export async function createTeacherAssignment(campusId, teacherUser, payload) {
  const {
    title,
    description = "",
    classId,
    className,
    gradeOrClass,
    section,
    subject,
    dueDate,
    totalMarks = 100,
    status = "Active",
    publicationStatus = "Published",
  } = payload;

  if (!title || !title.trim()) {
    const err = new Error("Assignment title is required.");
    err.statusCode = 400;
    throw err;
  }
  if (!subject || !subject.trim()) {
    const err = new Error("Subject is required.");
    err.statusCode = 400;
    throw err;
  }
  if (!dueDate) {
    const err = new Error("Due date is required.");
    err.statusCode = 400;
    throw err;
  }

  const finalClassName = className || gradeOrClass || "Class 10";
  const finalSection = section || "A";

  const assignment = new Assignment({
    campusId,
    instituteId: teacherUser.instituteId || null,
    classId: classId || null,
    title: title.trim(),
    description: description.trim(),
    subject: subject.trim(),
    className: finalClassName,
    gradeOrClass: finalClassName,
    program: finalClassName,
    section: finalSection,
    teacherId: teacherUser._id,
    instructorId: teacherUser._id,
    instructor: teacherUser.name,
    dueDate: new Date(dueDate),
    totalMarks: Number(totalMarks) || 100,
    status,
    publicationStatus,
    submissions: [],
  });

  await assignment.save();

  // Also sync to StudentAssignment for student portal integration
  try {
    if (classId) {
      await StudentAssignment.create({
        campusId,
        classId,
        title: title.trim(),
        description: description.trim(),
        dueDate: new Date(dueDate).toISOString().split("T")[0],
        totalMarks: Number(totalMarks) || 100,
        publicationStatus,
        submissions: [],
      });
    }
  } catch (e) {
    // Non-fatal if student portal legacy model already created or unique
  }

  // Create notification for class students
  const students = await User.find({
    campusId,
    role: "student",
    $or: [
      { gradeOrClass: finalClassName, section: finalSection },
      { program: finalClassName, section: finalSection },
    ],
  }).select("_id");

  for (const st of students) {
    await Alert.create({
      instituteId: teacherUser.instituteId || campusId,
      campusId,
      severity: "Info",
      title: "New Assignment Posted",
      message: `${teacherUser.name} posted a new assignment: "${title}" for ${subject}. Due on ${new Date(dueDate).toLocaleDateString()}.`,
      createdBy: teacherUser._id,
    }).catch(() => {});
  }

  return assignment;
}

/**
 * Update an existing assignment.
 */
export async function updateTeacherAssignment(assignmentId, campusId, teacherUser, payload) {
  const assignment = await Assignment.findOne({ _id: assignmentId, campusId });
  if (!assignment) {
    const err = new Error("Assignment not found.");
    err.statusCode = 404;
    throw err;
  }

  if (
    teacherUser.role === "teacher" ||
    teacherUser.role === "faculty"
  ) {
    const isOwner =
      String(assignment.teacherId) === String(teacherUser._id) ||
      String(assignment.instructorId) === String(teacherUser._id);
    if (!isOwner) {
      const err = new Error("Access denied. You can only update your own assignments.");
      err.statusCode = 403;
      throw err;
    }
  }

  if (payload.title) assignment.title = payload.title.trim();
  if (payload.description !== undefined) assignment.description = payload.description.trim();
  if (payload.subject) assignment.subject = payload.subject.trim();
  if (payload.className) {
    assignment.className = payload.className;
    assignment.gradeOrClass = payload.className;
  }
  if (payload.section) assignment.section = payload.section;
  if (payload.dueDate) assignment.dueDate = new Date(payload.dueDate);
  if (payload.totalMarks) assignment.totalMarks = Number(payload.totalMarks);
  if (payload.status) assignment.status = payload.status;
  if (payload.publicationStatus) assignment.publicationStatus = payload.publicationStatus;

  await assignment.save();
  return assignment;
}

/**
 * Delete an assignment.
 */
export async function deleteTeacherAssignment(assignmentId, campusId, teacherUser) {
  const assignment = await Assignment.findOne({ _id: assignmentId, campusId });
  if (!assignment) {
    const err = new Error("Assignment not found.");
    err.statusCode = 404;
    throw err;
  }

  if (teacherUser.role === "teacher" || teacherUser.role === "faculty") {
    const isOwner =
      String(assignment.teacherId) === String(teacherUser._id) ||
      String(assignment.instructorId) === String(teacherUser._id);
    if (!isOwner) {
      const err = new Error("Access denied. You can only delete your own assignments.");
      err.statusCode = 403;
      throw err;
    }
  }

  await Assignment.findByIdAndDelete(assignmentId);
  return { success: true, message: "Assignment deleted successfully." };
}

/**
 * Get all submissions for an assignment, merged with the full student roster.
 */
export async function getAssignmentSubmissions(assignmentId, campusId) {
  const assignment = await Assignment.findOne({ _id: assignmentId, campusId })
    .populate("submissions.studentId", "name email rollNumber phone avatar")
    .populate("submissions.gradedBy", "name email")
    .lean();

  if (!assignment) {
    const err = new Error("Assignment not found.");
    err.statusCode = 404;
    throw err;
  }

  // Find all enrolled students in the class/section
  const students = await User.find({
    campusId,
    role: "student",
    $or: [
      { gradeOrClass: assignment.className, section: assignment.section },
      { program: assignment.className, section: assignment.section },
      { gradeOrClass: assignment.gradeOrClass, section: assignment.section },
    ],
  })
    .select("_id name email rollNumber avatar phone")
    .lean();

  const submissionMap = new Map();
  (assignment.submissions || []).forEach((sub) => {
    const stId = String(sub.studentId?._id || sub.studentId);
    submissionMap.set(stId, sub);
  });

  const mergedRoster = students.map((st) => {
    const stId = String(st._id);
    const existing = submissionMap.get(stId);

    if (existing) {
      return {
        _id: existing._id,
        submissionId: existing._id,
        assignmentId: assignment._id,
        studentId: stId,
        studentName: st.name,
        rollNumber: st.rollNumber || "—",
        email: st.email,
        avatar: st.avatar || "",
        status: existing.status,
        score: existing.score,
        feedback: existing.feedback,
        notes: existing.notes || "",
        attachmentUrl: existing.attachmentUrl || "",
        submittedAt: existing.submittedAt,
        gradedAt: existing.gradedAt,
        gradedBy: existing.gradedBy?.name || "",
      };
    }

    return {
      _id: `missing_${stId}`,
      submissionId: null,
      assignmentId: assignment._id,
      studentId: stId,
      studentName: st.name,
      rollNumber: st.rollNumber || "—",
      email: st.email,
      avatar: st.avatar || "",
      status: "Missing",
      score: null,
      feedback: "",
      notes: "No submission recorded yet.",
      attachmentUrl: "",
      submittedAt: null,
      gradedAt: null,
      gradedBy: "",
    };
  });

  const addedStudentIds = new Set(students.map((s) => String(s._id)));

  (assignment.submissions || []).forEach((sub) => {
    const stId = String(sub.studentId?._id || sub.studentId);
    if (!addedStudentIds.has(stId)) {
      addedStudentIds.add(stId);
      mergedRoster.push({
        _id: sub._id,
        submissionId: sub._id,
        assignmentId: assignment._id,
        studentId: stId,
        studentName: sub.studentId?.name || sub.studentName || "Student",
        rollNumber: sub.studentId?.rollNumber || sub.rollNumber || "—",
        email: sub.studentId?.email || "",
        avatar: sub.studentId?.avatar || "",
        status: sub.status,
        score: sub.score,
        feedback: sub.feedback,
        notes: sub.notes || "",
        attachmentUrl: sub.attachmentUrl || "",
        submittedAt: sub.submittedAt,
        gradedAt: sub.gradedAt,
        gradedBy: sub.gradedBy?.name || "",
      });
    }
  });

  return {
    assignment: {
      ...assignment,
      id: assignment._id.toString(),
    },
    submissions: mergedRoster,
  };
}

/**
 * Grade a student's submission.
 */
export async function gradeSubmission(assignmentId, campusId, teacherUser, { submissionId, studentId, score, feedback = "" }) {
  const assignment = await Assignment.findOne({ _id: assignmentId, campusId });
  if (!assignment) {
    const err = new Error("Assignment not found.");
    err.statusCode = 404;
    throw err;
  }

  const numScore = Number(score);
  if (isNaN(numScore) || numScore < 0) {
    const err = new Error("Valid score is required (0 or greater).");
    err.statusCode = 400;
    throw err;
  }
  if (numScore > assignment.totalMarks) {
    const err = new Error(`Score cannot exceed total marks (${assignment.totalMarks}).`);
    err.statusCode = 400;
    throw err;
  }

  let submission = null;
  const subIdStr = submissionId ? String(submissionId) : "";
  if (subIdStr && !subIdStr.startsWith("missing_")) {
    submission = assignment.submissions.id(submissionId);
  } else if (studentId) {
    submission = assignment.submissions.find(
      (s) => String(s.studentId) === String(studentId)
    );
  }

  if (submission) {
    submission.score = numScore;
    submission.feedback = feedback.trim();
    submission.status = "Graded";
    submission.gradedAt = new Date();
    submission.gradedBy = teacherUser._id;
  } else if (studentId) {
    const studentUser = await User.findById(studentId).lean();
    assignment.submissions.push({
      studentId,
      studentName: studentUser?.name || "Student",
      rollNumber: studentUser?.rollNumber || "",
      score: numScore,
      feedback: feedback.trim(),
      status: "Graded",
      submittedAt: new Date(),
      gradedAt: new Date(),
      gradedBy: teacherUser._id,
      notes: "Graded directly by teacher",
    });
    submission = assignment.submissions[assignment.submissions.length - 1];
  } else {
    const err = new Error("Submission or student not found.");
    err.statusCode = 404;
    throw err;
  }

  await assignment.save();

  // Notify the student
  const stId = submission.studentId;
  if (stId) {
    await Alert.create({
      instituteId: teacherUser.instituteId || campusId,
      campusId,
      severity: "Info",
      title: "Assignment Graded",
      message: `Your submission for "${assignment.title}" has been graded: ${numScore}/${assignment.totalMarks}. Feedback: "${feedback.trim() || "Good effort."}"`,
      createdBy: teacherUser._id,
    }).catch(() => {});
  }

  return {
    assignment,
    submission,
  };
}

/**
 * Student submits work for an assignment.
 */
export async function submitStudentAssignment(assignmentId, studentUser, { notes = "", attachmentUrl = "" }) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    const err = new Error("Assignment not found.");
    err.statusCode = 404;
    throw err;
  }

  const existingSub = assignment.submissions.find(
    (s) => String(s.studentId) === String(studentUser._id)
  );

  const isLate = new Date() > new Date(assignment.dueDate);
  const status = isLate ? "Late" : "Submitted";

  if (existingSub) {
    existingSub.notes = notes.trim();
    existingSub.attachmentUrl = attachmentUrl.trim();
    existingSub.submittedAt = new Date();
    existingSub.status = existingSub.status === "Graded" ? "Graded" : status;
  } else {
    assignment.submissions.push({
      studentId: studentUser._id,
      studentName: studentUser.name,
      rollNumber: studentUser.rollNumber || "",
      notes: notes.trim(),
      attachmentUrl: attachmentUrl.trim(),
      submittedAt: new Date(),
      status,
    });
  }

  await assignment.save();
  return assignment;
}

export default {
  getTeacherAssignedClasses,
  getTeacherAssignments,
  createTeacherAssignment,
  updateTeacherAssignment,
  deleteTeacherAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  submitStudentAssignment,
};
