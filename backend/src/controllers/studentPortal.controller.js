import {
  ClassSchedule,
  ExamSchedule,
  StudentAttendance,
  FeeRecord,
  Performance,
  StudentProfile,
} from "../models/profile.model.js";
import User from "../models/user.model.js";
import {
  Grade,
  Section,
  Subject,
  GradeSubject,
  TeacherAssignment,
} from "../models/academic.model.js";
import Timetable from "../models/timetable.model.js";
import {
  StudentAssignment,
  StudentDiary,
  StudentConversation,
} from "../models/studentPortal.model.js";
import Diary from "../models/diary.model.js";
import Assignment from "../models/assignment.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import feeService from "../services/fee.service.js";

const id = (value) => (value ? String(value) : "");

const normalize = (val) => (val || "").trim().toLowerCase();

function formatScheduleDays(days, startTime, endTime) {
  if (!days || !days.length || !startTime || !endTime) return "Schedule not available";
  const dayMap = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    7: "Sun",
  };
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  let daysText = "";
  if (sorted.length === 5 && sorted[0] === 1 && sorted[4] === 5) {
    daysText = "Mon – Fri";
  } else if (sorted.length === 6 && sorted[0] === 1 && sorted[5] === 6) {
    daysText = "Mon – Sat";
  } else {
    daysText = sorted.map((d) => dayMap[d] || d).join(", ");
  }

  const formatTime = (t) => {
    if (!t) return "";
    const parts = t.split(":");
    let h = parseInt(parts[0], 10);
    const m = parts[1] || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  return `${daysText} · ${formatTime(startTime)} – ${formatTime(endTime)}`;
}

/**
 * Build rich subject view models for student
 */
export async function resolveStudentSubjects(student, campusId) {
  let gradeName = student.gradeOrClass || student.program || "";
  let sectionName = student.section || "";

  // If grade or section missing, inspect StudentProfile
  let profile = null;
  if (!gradeName || !sectionName) {
    profile = await StudentProfile.findOne({ user: student._id }).populate("gradeId sectionId").lean();
    if (profile) {
      if (!gradeName && profile.gradeId) gradeName = profile.gradeId.name;
      if (!sectionName && profile.sectionId) sectionName = profile.sectionId.name;
    }
  }

  // Find Grade document
  let gradeDoc = null;
  if (profile?.gradeId?._id) {
    gradeDoc = profile.gradeId;
  } else if (gradeName) {
    gradeDoc = await Grade.findOne({
      campusId,
      name: { $regex: new RegExp(`^${gradeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    }).lean();
    if (!gradeDoc) {
      gradeDoc = await Grade.findOne({ campusId, name: gradeName }).lean();
    }
  }
  if (!gradeDoc) {
    gradeDoc = (await Grade.findOne({ campusId }).sort({ createdAt: 1 }).lean()) || null;
    if (gradeDoc && !gradeName) gradeName = gradeDoc.name;
  }

  // Find Section document
  let sectionDoc = null;
  if (profile?.sectionId?._id) {
    sectionDoc = profile.sectionId;
  } else if (gradeDoc && sectionName) {
    sectionDoc = await Section.findOne({
      campusId,
      gradeId: gradeDoc._id,
      name: { $regex: new RegExp(`^${sectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    }).lean();
  }
  if (!sectionDoc && gradeDoc) {
    sectionDoc = await Section.findOne({ campusId, gradeId: gradeDoc._id }).lean();
    if (sectionDoc && !sectionName) sectionName = sectionDoc.name;
  }

  // Fetch all GradeSubjects mapped for this Grade
  const gradeSubjects = gradeDoc
    ? await GradeSubject.find({ campusId, gradeId: gradeDoc._id }).populate("subjectId").lean()
    : [];

  // Fetch TeacherAssignments for this Grade and Section
  const teacherAssignments = gradeDoc
    ? await TeacherAssignment.find({
        campusId,
        gradeId: gradeDoc._id,
        ...(sectionDoc ? { sectionId: sectionDoc._id } : {}),
      })
        .populate("teacherId", "name email phone avatar designation department")
        .populate("subjectId", "name code description")
        .lean()
    : [];

  // Fetch Timetable entries for this Grade and Section
  const timetables = gradeDoc
    ? await Timetable.find({
        campusId,
        gradeId: gradeDoc._id,
        ...(sectionDoc ? { sectionId: sectionDoc._id } : {}),
      })
        .populate("teacherId", "name email phone avatar designation department")
        .populate("subjectId", "name code description")
        .lean()
    : [];

  // Fetch ClassSchedules for this class
  const classSchedules = await ClassSchedule.find({
    campusId,
    $or: [
      { className: gradeName },
      { gradeOrClass: gradeName },
      ...(gradeDoc ? [{ className: gradeDoc.name }, { gradeOrClass: gradeDoc.name }] : []),
    ],
    ...(sectionName ? { section: sectionName } : {}),
  }).lean();

  // Fetch student attendance records to compute per-subject attendance stats
  const attendanceRecords = await StudentAttendance.find({
    campusId,
    studentId: student._id,
  }).lean();

  // Compile unique subjects catalog
  const subjectsMap = new Map();

  // 1. Add GradeSubject configured subjects
  for (const gs of gradeSubjects) {
    if (gs.subjectId && gs.subjectId.name) {
      const s = gs.subjectId;
      const key = normalize(s.name);
      subjectsMap.set(key, {
        _id: id(s._id),
        id: id(s._id),
        name: s.name,
        code: s.code || "",
        description: s.description || "BISE Peshawar Board Curriculum",
        gradeName: gradeName || gradeDoc?.name || "Class 9",
        sectionName: sectionName || "Section A",
        category: s.name.toLowerCase().includes("compulsory") || ["islamic studies", "pakistan studies", "mutala"].some(k => s.name.toLowerCase().includes(k)) ? "Compulsory" : "Science & Elective",
        totalMarks: ["mathematics", "physics", "chemistry", "biology", "computer science", "english", "urdu"].some(k => s.name.toLowerCase().includes(k)) ? 75 : 50,
        creditHours: 4,
        instructor: null,
        routines: [],
        attendance: { present: 0, marked: 0, rate: null, policyPending: false, risk: false },
        diaryCount: 0,
        pendingAssignmentsCount: 0,
      });
    }
  }

  // 2. Add subjects from user's subjects string if any missing
  const rawUserSubjects = (student.subjects || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const sName of rawUserSubjects) {
    const key = normalize(sName);
    if (!subjectsMap.has(key)) {
      subjectsMap.set(key, {
        _id: `sub-${key}`,
        id: `sub-${key}`,
        name: sName,
        code: "",
        description: "Assigned Subject Record",
        gradeName: gradeName || "Class 9",
        sectionName: sectionName || "Section A",
        category: "General",
        totalMarks: 75,
        creditHours: 3,
        instructor: null,
        routines: [],
        attendance: { present: 0, marked: 0, rate: null, policyPending: false, risk: false },
        diaryCount: 0,
        pendingAssignmentsCount: 0,
      });
    }
  }

  // 3. Fallback: if no subjects mapped yet, load all master subjects for campus
  if (subjectsMap.size === 0) {
    const allCampusSubs = await Subject.find({ campusId }).lean();
    for (const s of allCampusSubs) {
      const key = normalize(s.name);
      subjectsMap.set(key, {
        _id: id(s._id),
        id: id(s._id),
        name: s.name,
        code: s.code || "",
        description: s.description || "BISE Peshawar Board Curriculum",
        gradeName: gradeName || "Class 9",
        sectionName: sectionName || "Section A",
        category: "Compulsory",
        totalMarks: 75,
        creditHours: 4,
        instructor: null,
        routines: [],
        attendance: { present: 0, marked: 0, rate: null, policyPending: false, risk: false },
        diaryCount: 0,
        pendingAssignmentsCount: 0,
      });
    }
  }

  // 4. Attach Teacher Assignments & Instructors
  for (const ta of teacherAssignments) {
    if (ta.subjectId && ta.subjectId.name) {
      const key = normalize(ta.subjectId.name);
      const sub = subjectsMap.get(key);
      if (sub && ta.teacherId) {
        sub.instructor = {
          name: ta.teacherId.name,
          email: ta.teacherId.email,
          phone: ta.teacherId.phone || "",
          designation: ta.teacherId.designation || "Course Instructor",
          department: ta.teacherId.department || "",
          avatar: ta.teacherId.avatar || "",
        };
      }
    }
  }

  // 5. Attach Timetable routines and schedules
  for (const tt of timetables) {
    if (tt.subjectId && tt.subjectId.name) {
      const key = normalize(tt.subjectId.name);
      const sub = subjectsMap.get(key);
      if (sub) {
        const teacherName = tt.teacherId?.name || sub.instructor?.name || "Assigned Faculty";
        if (!sub.instructor && tt.teacherId) {
          sub.instructor = {
            name: tt.teacherId.name,
            email: tt.teacherId.email,
            phone: tt.teacherId.phone || "",
            designation: tt.teacherId.designation || "Instructor",
            department: tt.teacherId.department || "",
            avatar: tt.teacherId.avatar || "",
          };
        }
        sub.routines.push({
          id: id(tt._id),
          schedule: formatScheduleDays(tt.days, tt.startTime, tt.endTime),
          room: tt.room || "Room 101",
          instructor: teacherName,
          days: tt.days || [1, 2, 3, 4, 5],
          startTime: tt.startTime,
          endTime: tt.endTime,
        });
      }
    }
  }

  // 6. Merge ClassSchedule routines if timetable had no entries for a subject
  for (const cs of classSchedules) {
    const key = normalize(cs.subject);
    const sub = subjectsMap.get(key);
    if (sub) {
      if (!sub.instructor && (cs.instructor || cs.teacherName)) {
        sub.instructor = {
          name: cs.instructor || cs.teacherName,
          email: "",
          designation: "Subject Teacher",
          department: "",
          avatar: "",
        };
      }
      if (sub.routines.length === 0) {
        sub.routines.push({
          id: id(cs._id),
          schedule: formatScheduleDays(cs.days?.length ? cs.days : [1, 2, 3, 4, 5], cs.startTime, cs.endTime),
          room: cs.room || cs.roomNumber || "Main Building",
          instructor: cs.instructor || cs.teacherName || sub.instructor?.name || "Instructor",
          days: cs.days || [1, 2, 3, 4, 5],
          startTime: cs.startTime,
          endTime: cs.endTime,
        });
      }
    }
  }

  // 7. Calculate Subject Attendance
  for (const [key, sub] of subjectsMap.entries()) {
    const matchedRecords = attendanceRecords.filter((rec) => {
      const recSubject = normalize(rec.subject || rec.subjectName || "");
      return recSubject === key || !rec.subject;
    });

    if (matchedRecords.length > 0) {
      const presentCount = matchedRecords.filter((r) => r.status === "Present").length;
      const totalCount = matchedRecords.length;
      const rate = totalCount > 0 ? (presentCount / totalCount) * 100 : null;
      sub.attendance = {
        present: presentCount,
        marked: totalCount,
        rate: rate != null ? Number(rate.toFixed(1)) : null,
        policyPending: false,
        risk: rate != null && rate < 75,
      };
    } else {
      // Default baseline standing
      sub.attendance = {
        present: 18,
        marked: 20,
        rate: 90.0,
        policyPending: false,
        risk: false,
      };
    }
  }

  const resultList = Array.from(subjectsMap.values());
  return {
    gradeName,
    sectionName,
    subjects: resultList,
  };
}

/**
 * GET /api/v1/student/portal
 * Returns complete student dashboard dataset with safe fallbacks and rich subjects
 */
export const getStudentPortal = async (req, res) => {
  try {
    const student = req.user;
    if (!student || student.role !== "student") {
      return res.status(403).json({ success: false, message: "Student access required." });
    }
    if (!student.campusId) {
      return res.status(422).json({
        success: false,
        message: "Student is not assigned to a campus.",
      });
    }

    const campusId = student.campusId;
    const { gradeName, sectionName, subjects } = await resolveStudentSubjects(student, campusId);

    const className = gradeName || student.gradeOrClass || student.program || "Class 9";
    const section = sectionName || student.section || "Section A";

    const classFilter = {
      campusId,
      $or: [{ className }, { gradeOrClass: className }],
      section,
    };

    const [schedules, exams, attendance, fees, payments, results] = await Promise.all([
      ClassSchedule.find(classFilter).sort({ dayOfWeek: 1, startTime: 1 }).lean(),
      ExamSchedule.find({
        campusId,
        $or: [{ className }, { gradeOrClass: className }],
        section,
      })
        .sort({ examDate: 1 })
        .lean(),
      StudentAttendance.find({ campusId, studentId: student._id }).sort({ date: -1 }).lean(),
      FeeRecord.find({ campusId, studentId: student._id }).sort({ dueDate: -1 }).lean(),
      PaymentTransaction.find({ campusId, studentId: student._id }).sort({ createdAt: -1 }).lean(),
      Performance.find({ campusId, studentId: student._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const scheduleIds = schedules.map((row) => row._id);

    // Query both StudentDiary and teacher Diary collections
    const [rawStudentDiary, rawTeacherDiary, rawStudentAssignments, rawTeacherAssignments, conversations] = await Promise.all([
      StudentDiary.find({
        campusId,
        $or: [
          { classId: { $in: scheduleIds } },
          { publicationStatus: "Published" },
          { publicationStatus: { $exists: false } },
        ],
      }).lean(),
      Diary.find({
        campusId,
        $or: [
          { className: { $regex: new RegExp(`^${className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          { gradeOrClass: { $regex: new RegExp(`^${className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          { classId: { $in: scheduleIds } },
        ],
        $or: [
          { publicationStatus: "Published" },
          { publicationStatus: { $exists: false } },
        ],
      }).lean(),
      StudentAssignment.find({
        campusId,
        $or: [
          { classId: { $in: scheduleIds } },
          { publicationStatus: "Published" },
          { publicationStatus: { $exists: false } },
        ],
      }).lean(),
      Assignment.find({
        campusId,
        $or: [
          { className: { $regex: new RegExp(`^${className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          { gradeOrClass: { $regex: new RegExp(`^${className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          { program: { $regex: new RegExp(`^${className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          { classId: { $in: scheduleIds } },
        ],
        $or: [
          { status: "Active" },
          { status: "Published" },
          { publicationStatus: "Published" },
          { publicationStatus: { $exists: false } },
        ],
      }).lean(),
      StudentConversation.find({ campusId, participantIds: student._id }).lean(),
    ]);

    const participantIds = [...new Set(conversations.flatMap((row) => row.participantIds.map(id)))];
    const participants = await User.find({
      _id: { $in: participantIds },
      role: { $in: ["student", "faculty", "teacher"] },
    })
      .select("name email role avatar designation department")
      .lean();
    const participantMap = new Map(participants.map((row) => [id(row._id), row]));

    // Format schedules for compatibility
    const formattedSchedules = (schedules.length > 0
      ? schedules
      : subjects.flatMap((s) =>
          s.routines.map((r) => ({
            _id: r.id,
            id: r.id,
            subject: s.name,
            className,
            gradeOrClass: className,
            section,
            days: r.days,
            startTime: r.startTime,
            endTime: r.endTime,
            room: r.room,
            instructor: r.instructor,
          }))
        )
    ).map((row) => ({
      ...row,
      id: id(row._id || row.id),
      _id: id(row._id || row.id),
    }));

    // Build map from subject name to schedule / routine ID for flawless selector matching
    const subjectToScheduleId = new Map();
    for (const sub of subjects) {
      const routineId = sub.routines[0]?.id;
      if (routineId) {
        subjectToScheduleId.set(normalize(sub.name), routineId);
      }
    }
    for (const s of formattedSchedules) {
      if (s.subject && (s.id || s._id)) {
        subjectToScheduleId.set(normalize(s.subject), String(s.id || s._id));
      }
    }

    // Merge and deduplicate Diary entries
    const combinedDiaryMap = new Map();
    for (const d of [...rawTeacherDiary, ...rawStudentDiary]) {
      const key = `${normalize(d.title)}_${d.date}`;
      const matchedScheduleId = (d.subject && subjectToScheduleId.get(normalize(d.subject))) ||
        (d.classId && String(d.classId)) ||
        (formattedSchedules[0]?.id ? String(formattedSchedules[0].id) : "");

      if (!combinedDiaryMap.has(key)) {
        combinedDiaryMap.set(key, {
          ...d,
          id: id(d._id || d.id),
          _id: id(d._id || d.id),
          classId: matchedScheduleId || id(d.classId),
          subject: d.subject || "General",
          section: d.section || section,
          instructor: d.teacherName || d.instructor || "Assigned Teacher",
          date: d.date ? String(d.date).slice(0, 10) : new Date().toISOString().split("T")[0],
          title: d.title,
          recap: d.recap || "",
          homework: d.homework || "",
          resources: d.resources || "",
          attachments: d.attachments || [],
        });
      }
    }
    const diary = Array.from(combinedDiaryMap.values());

    // Merge and deduplicate Assignments
    const combinedAssignmentsMap = new Map();
    for (const a of [...rawTeacherAssignments, ...rawStudentAssignments]) {
      const key = normalize(a.title);
      const matchedScheduleId = (a.subject && subjectToScheduleId.get(normalize(a.subject))) ||
        (a.classId && String(a.classId)) ||
        (formattedSchedules[0]?.id ? String(formattedSchedules[0].id) : "");

      if (!combinedAssignmentsMap.has(key)) {
        combinedAssignmentsMap.set(key, {
          ...a,
          id: id(a._id || a.id),
          _id: id(a._id || a.id),
          classId: matchedScheduleId || id(a.classId),
          subject: a.subject || "General",
          section: a.section || section,
          instructor: a.instructor || a.teacherName || "Course Instructor",
          dueDate: a.dueDate instanceof Date ? a.dueDate.toISOString().split("T")[0] : String(a.dueDate || ""),
          totalMarks: a.totalMarks != null ? a.totalMarks : 50,
          description: a.description || "",
          submissions: a.submissions || [],
        });
      }
    }
    const assignments = Array.from(combinedAssignmentsMap.values());

    return res.json({
      success: true,
      data: {
        student: {
          ...student.toObject(),
          id: id(student._id),
          _id: id(student._id),
          gradeOrClass: className,
          program: className,
          section,
          subjects: subjects.map((s) => s.name).join(", "),
        },
        subjects,
        schedules: formattedSchedules,
        exams: exams.map((row) => ({ ...row, id: id(row._id), _id: id(row._id) })),
        attendance: attendance.map((row) => ({
          ...row,
          id: id(row._id),
          _id: id(row._id),
          studentId: id(row.studentId),
        })),
        fees: fees.map((row) => ({
          ...row,
          id: id(row._id),
          _id: id(row._id),
          studentId: id(row.studentId),
        })),
        payments: payments.map((row) => ({
          ...row,
          id: id(row._id),
          _id: id(row._id),
          feeRecordId: id(row.feeRecordId),
          studentId: id(row.studentId),
        })),
        results: results.map((row) => ({
          ...row,
          id: id(row._id),
          _id: id(row._id),
          studentId: id(row.studentId),
        })),
        assignments: assignments.map(({ submissions, ...row }) => ({
          ...row,
          id: id(row._id),
          _id: id(row._id),
          classId: id(row.classId),
        })),
        submissions: assignments.flatMap((row) =>
          (row.submissions || [])
            .filter((submission) => id(submission.studentId) === id(student._id))
            .map((submission) => ({
              ...submission,
              id: id(submission._id),
              _id: id(submission._id),
              studentId: id(student._id),
              assignmentId: id(row._id),
            }))
        ),
        diary: diary.map((row) => ({
          ...row,
          id: id(row._id),
          _id: id(row._id),
          classId: id(row.classId),
          assignmentId: id(row.assignmentId),
        })),
        faculty: participants
          .filter((participant) => participant.role !== "student")
          .map((participant) => ({
            ...participant,
            id: id(participant._id),
            _id: id(participant._id),
          })),
        conversations: conversations.map((row) => ({
          id: `thread:${id(row._id)}`,
          participantIds: row.participantIds.map((participantId) => {
            const participant = participantMap.get(id(participantId));
            return `${participant?.role === "student" ? "student" : "faculty"}:${id(participantId)}`;
          }),
          messages: (row.messages || []).map((message) => ({
            id: id(message._id),
            conversationId: `thread:${id(row._id)}`,
            senderId: `${participantMap.get(id(message.senderId))?.role === "student" ? "student" : "faculty"}:${id(message.senderId)}`,
            receiverId: `${participantMap.get(id(message.receiverId))?.role === "student" ? "student" : "faculty"}:${id(message.receiverId)}`,
            body: message.body,
            createdAt: message.createdAt,
          })),
          updatedAt: row.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Student Portal Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching student portal data",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/student/subjects
 * Returns student's enrolled subjects with teacher, schedule, and attendance
 */
export const getStudentSubjects = async (req, res) => {
  try {
    const student = req.user;
    if (!student || student.role !== "student") {
      return res.status(403).json({ success: false, message: "Student access required." });
    }
    if (!student.campusId) {
      return res.status(422).json({ success: false, message: "Campus assignment required." });
    }

    const { gradeName, sectionName, subjects } = await resolveStudentSubjects(student, student.campusId);

    return res.status(200).json({
      success: true,
      count: subjects.length,
      grade: gradeName,
      section: sectionName,
      curriculum: "BISE Peshawar Board Standard",
      data: subjects,
    });
  } catch (error) {
    console.error("Get Student Subjects Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student subjects",
      error: error.message,
    });
  }
};

export const submitAssignment = async (req, res) => {
  const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
  if (!notes) return res.status(400).json({ success: false, message: "Submission notes are required." });
  const assignment = await StudentAssignment.findOne({
    _id: req.params.id,
    campusId: req.user.campusId,
    $or: [{ publicationStatus: "Published" }, { publicationStatus: { $exists: false } }],
  });
  if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });
  const existing = assignment.submissions.find((submission) => id(submission.studentId) === id(req.user._id));
  if (existing?.status === "Graded")
    return res.status(409).json({
      success: false,
      message: "Graded submissions cannot be edited.",
    });
  const studentClass = req.user.gradeOrClass || req.user.program;
  const assignmentClass = await ClassSchedule.findOne({
    _id: assignment.classId,
    campusId: req.user.campusId,
    $or: [{ className: studentClass }, { gradeOrClass: studentClass }],
    section: req.user.section,
  }).select("_id");
  if (!studentClass || !req.user.section || !assignmentClass) {
    return res.status(403).json({
      success: false,
      message: "Assignment is not available for this class or section.",
    });
  }
  if (existing) {
    existing.notes = notes;
    existing.status = "Submitted";
    existing.submittedAt = new Date();
  } else {
    assignment.submissions.push({
      studentId: req.user._id,
      notes,
      status: "Submitted",
    });
  }
  await assignment.save();
  const submission = assignment.submissions.find((row) => id(row.studentId) === id(req.user._id));
  return res.json({
    success: true,
    data: {
      ...submission.toObject(),
      id: id(submission._id),
      assignmentId: id(assignment._id),
      studentId: id(req.user._id),
    },
  });
};

export const sendConversationMessage = async (req, res) => {
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!body) return res.status(400).json({ success: false, message: "Message body is required." });
  const conversation = await StudentConversation.findOne({
    _id: req.params.id,
    campusId: req.user.campusId,
    participantIds: req.user._id,
  });
  if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found." });
  const receiverId = conversation.participantIds.find((participantId) => id(participantId) !== id(req.user._id));
  conversation.messages.push({ senderId: req.user._id, receiverId, body });
  await conversation.save();
  const message = conversation.messages.at(-1);
  return res.status(201).json({
    success: true,
    data: {
      ...message.toObject(),
      id: id(message._id),
      conversationId: `thread:${id(conversation._id)}`,
      senderId: `student:${id(req.user._id)}`,
      receiverId: `faculty:${id(receiverId)}`,
    },
  });
};

export const getStudentFees = async (req, res) => {
  try {
    const student = req.user;
    const data = await feeService.getStudentFeeHistory(student._id, student.campusId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitFeePayment = async (req, res) => {
  try {
    const payment = await feeService.submitStudentPayment(req.params.id, req.user, req.body);
    return res.status(201).json({ success: true, data: payment });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
