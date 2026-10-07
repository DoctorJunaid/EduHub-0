import mongoose from "mongoose";
import StudentResult from "../models/studentResult.model.js";
import ReportCard from "../models/reportCard.model.js";
import { Grade, Section, Subject, GradeSubject, TeacherAssignment } from "../models/academic.model.js";
import { TeacherProfile, Performance, StudentAttendance } from "../models/profile.model.js";
import User from "../models/user.model.js";
import { calculateGrade, calculateRanks } from "../utils/gradeCalculator.js";
import { createNotification } from "./notification.service.js";
import { getMyClassAssignment } from "./classTeacher.service.js";

/**
 * 1. Get Class Results Grid (Full Matrix of Students × Subjects)
 */
export async function getClassResultsGrid(
  campusId,
  teacherUserId,
  { classId, examName = "Midterm Examination", term = "Midterm" }
) {
  let gradeName = "";
  let sectionName = "";
  let targetClassId = classId;
  let sectionDoc = null;

  if (targetClassId) {
    sectionDoc = await Section.findById(targetClassId).populate("gradeId", "name");
    if (sectionDoc) {
      gradeName = sectionDoc.gradeId?.name || "";
      sectionName = sectionDoc.name || "";
    }
  }

  if (!gradeName) {
    const myClass = await getMyClassAssignment(campusId, teacherUserId);
    if (myClass.isClassTeacher && myClass.classInfo) {
      targetClassId = myClass.classInfo.classId;
      gradeName = myClass.classInfo.gradeName;
      sectionName = myClass.classInfo.sectionName;
      sectionDoc = await Section.findById(targetClassId).populate("gradeId", "name");
    }
  }

  if (!gradeName) {
    throw new Error("Class section not found or you are not a Class Teacher.");
  }

  const className = `${gradeName} - ${sectionName}`;

  // 1. Find all students in this class
  const students = await User.find({
    campusId,
    role: "student",
    $or: [
      {
        $and: [
          {
            $or: [
              { gradeOrClass: new RegExp(`^${gradeName}$`, "i") },
              { program: new RegExp(`^${gradeName}$`, "i") },
            ],
          },
          {
            section: {
              $in: [
                sectionName,
                `Section ${sectionName}`,
                sectionName.toUpperCase(),
                sectionName.toLowerCase(),
              ],
            },
          },
        ],
      },
    ],
  })
    .select("_id name email roll rollNo rollNumber avatar")
    .sort({ rollNumber: 1, name: 1 })
    .lean();

  // 2. Discover all subjects for this class
  const subjectList = [];
  const subjectMap = new Map();

  // From GradeSubjects
  if (sectionDoc?.gradeId?._id) {
    const gradeSubjects = await GradeSubject.find({
      gradeId: sectionDoc.gradeId._id,
      campusId,
    }).populate("subjectId", "name code");

    for (const gs of gradeSubjects) {
      if (gs.subjectId?.name && !subjectMap.has(gs.subjectId.name.toLowerCase())) {
        subjectMap.set(gs.subjectId.name.toLowerCase(), {
          id: gs.subjectId._id.toString(),
          name: gs.subjectId.name,
          code: gs.subjectId.code || "",
        });
      }
    }
  }

  // From TeacherAssignments for this class
  const assignments = await TeacherAssignment.find({
    campusId,
    $or: [
      { sectionId: targetClassId },
      { gradeId: sectionDoc?.gradeId?._id },
    ],
  })
    .populate("subjectId", "name code")
    .populate("teacherId", "name email phone")
    .lean();

  const teacherBySubject = new Map();
  for (const a of assignments) {
    if (a.subjectId?.name) {
      const subName = a.subjectId.name;
      const key = subName.toLowerCase();
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          id: a.subjectId._id.toString(),
          name: subName,
          code: a.subjectId.code || "",
        });
      }
      if (a.teacherId) {
        teacherBySubject.set(key, {
          teacherUserId: a.teacherId._id?.toString(),
          teacherName: a.teacherId.name || "Teacher",
          teacherEmail: a.teacherId.email || "",
        });
      }
    }
  }

  // Fallback standard subjects if none configured
  if (subjectMap.size === 0) {
    const defaultSubs = [
      "Mathematics",
      "English",
      "Science",
      "Urdu",
      "Islamiat",
      "Computer Science",
      "Social Studies",
    ];
    for (const sub of defaultSubs) {
      subjectMap.set(sub.toLowerCase(), { id: sub, name: sub, code: "" });
    }
  }

  const subjects = Array.from(subjectMap.values());

  // 3. Fetch all marks entered for this exam & class (from Performance and StudentResult)
  const performanceRecords = await Performance.find({
    campusId,
    $or: [
      { className: new RegExp(`^${gradeName}$`, "i"), section: new RegExp(`^${sectionName}$`, "i") },
      { gradeOrClass: new RegExp(`^${gradeName}$`, "i"), section: new RegExp(`^${sectionName}$`, "i") },
    ],
    $or: [
      { examName: new RegExp(`^${examName}$`, "i") },
      { term: new RegExp(`^${term}$`, "i") },
    ],
  })
    .populate("markedBy", "name email")
    .lean();

  // Also query existing compiled StudentResult for this class
  const compiledResults = await StudentResult.find({
    campusId,
    classId: targetClassId,
    examName,
    term,
  }).lean();

  const compiledMap = new Map();
  for (const c of compiledResults) {
    compiledMap.set(String(c.studentId), c);
  }

  const perfMap = new Map();
  for (const p of performanceRecords) {
    const key = `${String(p.studentId)}_${(p.subject || "").toLowerCase()}`;
    perfMap.set(key, p);
  }

  // 4. Build grid for each student
  let completedSubjectSets = 0;
  const pendingSubjectTeachers = new Map();

  const studentRows = students.map((s, idx) => {
    const studentIdStr = s._id.toString();
    const compiledDoc = compiledMap.get(studentIdStr);

    let totalObtained = 0;
    let totalMax = 0;
    let hasAllMarks = true;

    const studentSubjectMarks = subjects.map((sub) => {
      const subKey = sub.name.toLowerCase();
      const perf = perfMap.get(`${studentIdStr}_${subKey}`);
      const compiledSub = compiledDoc?.subjects?.find(
        (cs) => cs.subject.toLowerCase() === subKey
      );

      let marks = null;
      let maxMarks = 100;
      let status = "Pending";
      let grade = "—";
      let gpa = 0;
      let teacherInfo = teacherBySubject.get(subKey) || null;

      if (perf) {
        marks = perf.marksObtained;
        maxMarks = perf.totalMarks || 100;
        status = "Entered";
        const gradeCalc = calculateGrade((marks / maxMarks) * 100);
        grade = gradeCalc.grade;
        gpa = gradeCalc.gpa;
      } else if (compiledSub) {
        marks = compiledSub.marks;
        maxMarks = compiledSub.totalMarks || 100;
        status = compiledSub.status || "Entered";
        grade = compiledSub.grade || "—";
        gpa = compiledSub.gpa || 0;
      }

      if (status === "Pending") {
        hasAllMarks = false;
        if (teacherInfo && !pendingSubjectTeachers.has(subKey)) {
          pendingSubjectTeachers.set(subKey, {
            subject: sub.name,
            ...teacherInfo,
          });
        }
      } else if (status === "Entered" && marks !== null) {
        totalObtained += Number(marks);
        totalMax += Number(maxMarks);
      }

      return {
        subjectId: sub.id,
        subject: sub.name,
        code: sub.code,
        marks,
        totalMarks: maxMarks,
        status,
        grade,
        gpa,
        teacher: teacherInfo,
      };
    });

    const percentage =
      totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
    const overallGradeCalc = calculateGrade(percentage);

    return {
      _id: studentIdStr,
      studentId: studentIdStr,
      name: s.name || "Student",
      rollNo: s.rollNumber || s.rollNo || `${sectionName}-${String(idx + 1).padStart(3, "0")}`,
      avatar: s.avatar || "",
      subjects: studentSubjectMarks,
      totalMarks: totalMax,
      obtainedMarks: totalObtained,
      percentage,
      overallGrade: overallGradeCalc.grade,
      gpa: overallGradeCalc.gpa,
      classRank: compiledDoc?.classRank || null,
      classTeacherRemarks: compiledDoc?.classTeacherRemarks || "",
      status: compiledDoc?.status || "Draft",
    };
  });

  // Calculate completeness
  let totalCells = students.length * subjects.length;
  let enteredCells = 0;
  for (const row of studentRows) {
    for (const sub of row.subjects) {
      if (sub.status === "Entered" || sub.status === "Absent") enteredCells++;
    }
  }

  const completenessPercentage =
    totalCells > 0 ? Math.round((enteredCells / totalCells) * 100) : 0;
  const isFullyComplete = enteredCells === totalCells && totalCells > 0;

  // Current class submission status
  const overallStatus =
    compiledResults.length > 0 ? compiledResults[0].status : "Draft";

  return {
    classInfo: {
      classId: targetClassId,
      className,
      gradeName,
      sectionName,
    },
    examName,
    term,
    status: overallStatus,
    rejectionReason: compiledResults[0]?.rejectionReason || "",
    completeness: {
      totalSubjects: subjects.length,
      totalStudents: students.length,
      totalCells,
      enteredCells,
      percentage: completenessPercentage,
      isFullyComplete,
      pendingTeachers: Array.from(pendingSubjectTeachers.values()),
    },
    subjects,
    students: studentRows,
  };
}

/**
 * 2. Send In-App Reminder to Subject Teacher
 */
export async function remindSubjectTeacher(
  campusId,
  fromTeacherUserId,
  { targetTeacherId, classId, subject, examName = "Midterm Examination" }
) {
  const fromUser = await User.findById(fromTeacherUserId).select("name").lean();
  const classDoc = await Section.findById(classId).populate("gradeId", "name");
  const className = classDoc
    ? `${classDoc.gradeId?.name || "Class"} - ${classDoc.name}`
    : "your class";

  const targetUser = await User.findById(targetTeacherId);
  if (!targetUser) {
    throw new Error("Target teacher not found.");
  }

  await createNotification({
    userId: targetUser._id,
    title: `Marks Entry Reminder — ${subject}`,
    message: `${fromUser?.name || "The Class Teacher"} requested you to enter ${subject} marks for ${className} (${examName}).`,
    type: "warning",
    severity: "warning",
    link: "/teacher/gradebook",
    metadata: {
      classId,
      subject,
      examName,
      remindedBy: fromUser?.name,
    },
    sendEmail: false,
  });

  return {
    success: true,
    message: `Reminder sent to ${targetUser.name} for ${subject} marks entry.`,
  };
}

/**
 * 3. Compile Class Results (Class Teacher Action)
 */
export async function compileClassResults(
  campusId,
  teacherUserId,
  { classId, examName = "Midterm Examination", term = "Midterm", academicYear = "2026-2027" }
) {
  const gridData = await getClassResultsGrid(campusId, teacherUserId, {
    classId,
    examName,
    term,
  });

  const { classInfo, students: studentRows, subjects } = gridData;
  if (!studentRows || studentRows.length === 0) {
    throw new Error("No students found in this class to compile results.");
  }

  // Calculate ranks
  const rankedStudents = calculateRanks(
    studentRows.map((s) => ({
      ...s,
      percentage: s.percentage,
      obtainedMarks: s.obtainedMarks,
    }))
  );

  const teacherProfile = await TeacherProfile.findOne({ user: teacherUserId });

  // Fetch attendance snapshot for the class
  const attendanceDocs = await StudentAttendance.find({
    campusId,
    $or: [
      { className: new RegExp(`^${classInfo.gradeName}$`, "i") },
      { gradeOrClass: new RegExp(`^${classInfo.gradeName}$`, "i") },
    ],
  }).lean();

  const attendanceByStudent = new Map();
  for (const att of attendanceDocs) {
    const sId = String(att.studentId);
    if (!attendanceByStudent.has(sId)) {
      attendanceByStudent.set(sId, { present: 0, absent: 0, late: 0, excused: 0, total: 0 });
    }
    const stat = attendanceByStudent.get(sId);
    stat.total++;
    const st = (att.status || "").toLowerCase();
    if (st === "present") stat.present++;
    else if (st === "absent") stat.absent++;
    else if (st === "late") stat.late++;
    else stat.excused++;
  }

  const savedResults = [];

  for (const s of rankedStudents) {
    const att = attendanceByStudent.get(s.studentId) || {
      present: 27,
      absent: 1,
      late: 1,
      excused: 1,
      total: 30,
    };
    const attPct =
      att.total > 0
        ? Math.round(((att.present + att.late) / att.total) * 100)
        : 95;

    const subjectsPayload = s.subjects.map((sub) => ({
      subject: sub.subject,
      subjectCode: sub.code || "",
      marks: sub.marks || 0,
      totalMarks: sub.totalMarks || 100,
      percentage:
        sub.totalMarks > 0
          ? Math.round(((sub.marks || 0) / sub.totalMarks) * 1000) / 10
          : 0,
      grade: sub.grade || "Pending",
      gpa: sub.gpa || 0,
      teacherName: sub.teacher?.teacherName || "",
      teacherUserId: sub.teacher?.teacherUserId || null,
      status: sub.status,
    }));

    const resultDoc = await StudentResult.findOneAndUpdate(
      {
        campusId,
        classId: classInfo.classId,
        studentId: s.studentId,
        term,
        examName,
      },
      {
        $set: {
          campusId,
          classId: classInfo.classId,
          className: classInfo.className,
          section: classInfo.sectionName,
          studentId: s.studentId,
          term,
          examName,
          academicYear,
          subjects: subjectsPayload,
          totalMarks: s.totalMarks,
          obtainedMarks: s.obtainedMarks,
          percentage: s.percentage,
          overallGrade: s.overallGrade,
          gpa: s.gpa,
          classRank: s.classRank,
          totalStudentsInClass: rankedStudents.length,
          classTeacherId: teacherProfile?._id || null,
          classTeacherUserId: teacherUserId,
          classTeacherRemarks: s.classTeacherRemarks || "Good performance.",
          attendanceSummary: {
            presentDays: att.present,
            absentDays: att.absent,
            lateDays: att.late,
            excusedDays: att.excused,
            totalDays: att.total,
            percentage: attPct,
          },
          status: "Draft",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    savedResults.push(resultDoc);
  }

  return {
    success: true,
    message: `Results successfully compiled for ${rankedStudents.length} students in ${classInfo.className}.`,
    compiledCount: savedResults.length,
    results: savedResults,
  };
}

/**
 * 4. Save Class Teacher remarks for an individual student
 */
export async function saveStudentRemarks(
  campusId,
  teacherUserId,
  { studentId, classId, examName = "Midterm Examination", term = "Midterm", remarks = "" }
) {
  const result = await StudentResult.findOneAndUpdate(
    {
      campusId,
      studentId,
      $or: [{ classId }, { examName }],
    },
    {
      $set: {
        classTeacherRemarks: remarks.trim(),
        classTeacherUserId: teacherUserId,
      },
    },
    { new: true }
  );

  return {
    success: true,
    message: "Class Teacher remarks saved successfully.",
    result,
  };
}

/**
 * 5. Submit Compiled Results to Campus Admin for Approval
 */
export async function submitClassResultsForApproval(
  campusId,
  teacherUserId,
  { classId, examName = "Midterm Examination", term = "Midterm" }
) {
  const now = new Date();
  const teacherUser = await User.findById(teacherUserId).select("name email").lean();

  const sec = await Section.findById(classId).populate("gradeId", "name");
  const className = sec
    ? `${sec.gradeId?.name || "Class"} - ${sec.name}`
    : "Class Section";

  const updated = await StudentResult.updateMany(
    {
      campusId,
      classId,
      term,
      examName,
    },
    {
      $set: {
        status: "Pending Approval",
        classTeacherSubmittedAt: now,
        classTeacherSubmittedBy: teacherUserId,
      },
    }
  );

  // Notify Campus Admins
  const admins = await User.find({
    campusId,
    role: { $in: ["campus_admin", "principal", "campus_manager"] },
  }).select("_id");

  for (const admin of admins) {
    await createNotification({
      userId: admin._id,
      title: `Result Approval Pending — ${className}`,
      message: `${teacherUser?.name || "Class Teacher"} has submitted the compiled results for ${className} (${examName}) for your review and approval.`,
      type: "info",
      severity: "info",
      link: "/results",
      metadata: {
        classId,
        className,
        examName,
        term,
        submittedBy: teacherUser?.name,
      },
      sendEmail: false,
    });
  }

  return {
    success: true,
    message: `Results for ${className} submitted to Campus Admin for approval.`,
    updatedCount: updated.modifiedCount,
  };
}

/**
 * 6. Campus Admin: Get Pending Approvals
 */
export async function getPendingApprovals(campusId) {
  const pendingResults = await StudentResult.aggregate([
    {
      $match: {
        campusId: new mongoose.Types.ObjectId(campusId),
        status: "Pending Approval",
      },
    },
    {
      $group: {
        _id: {
          classId: "$classId",
          examName: "$examName",
          term: "$term",
          className: "$className",
          section: "$section",
        },
        studentCount: { $sum: 1 },
        avgPercentage: { $avg: "$percentage" },
        submittedAt: { $first: "$classTeacherSubmittedAt" },
        classTeacherUserId: { $first: "$classTeacherUserId" },
      },
    },
    { $sort: { submittedAt: -1 } },
  ]);

  const populated = [];
  for (const item of pendingResults) {
    const teacher = item.classTeacherUserId
      ? await User.findById(item.classTeacherUserId).select("name email phone").lean()
      : null;

    populated.push({
      classId: item._id.classId?.toString(),
      className: item._id.className || "Class Section",
      section: item._id.section || "A",
      examName: item._id.examName,
      term: item._id.term,
      studentCount: item.studentCount,
      avgPercentage: Math.round((item.avgPercentage || 0) * 10) / 10,
      submittedAt: item.submittedAt || new Date(),
      classTeacher: teacher
        ? { name: teacher.name, email: teacher.email }
        : null,
    });
  }

  return populated;
}

/**
 * 7. Campus Admin: Approve Results
 */
export async function approveClassResults(
  campusId,
  adminUserId,
  { classId, examName = "Midterm Examination", term = "Midterm" }
) {
  const now = new Date();

  await StudentResult.updateMany(
    { campusId, classId, examName, term },
    {
      $set: {
        status: "Approved",
        approvedBy: adminUserId,
        approvedAt: now,
      },
    }
  );

  // Notify Class Teacher
  const firstDoc = await StudentResult.findOne({ campusId, classId, examName, term });
  if (firstDoc?.classTeacherUserId) {
    await createNotification({
      userId: firstDoc.classTeacherUserId,
      title: `Results Approved — ${firstDoc.className}`,
      message: `Campus Admin has approved the ${examName} results for ${firstDoc.className}.`,
      type: "success",
      severity: "info",
      link: "/teacher/my-class",
      sendEmail: false,
    });
  }

  return {
    success: true,
    message: `Results approved for ${firstDoc?.className || "Class"}.`,
  };
}

/**
 * 8. Campus Admin: Reject Results
 */
export async function rejectClassResults(
  campusId,
  adminUserId,
  { classId, examName = "Midterm Examination", term = "Midterm", rejectionReason = "" }
) {
  await StudentResult.updateMany(
    { campusId, classId, examName, term },
    {
      $set: {
        status: "Rejected",
        rejectionReason: rejectionReason || "Please review subject marks and resubmit.",
      },
    }
  );

  const firstDoc = await StudentResult.findOne({ campusId, classId, examName, term });
  if (firstDoc?.classTeacherUserId) {
    await createNotification({
      userId: firstDoc.classTeacherUserId,
      title: `Results Revision Requested — ${firstDoc.className}`,
      message: `Campus Admin returned results with note: "${rejectionReason || "Needs revision"}".`,
      type: "warning",
      severity: "warning",
      link: "/teacher/my-class",
      sendEmail: false,
    });
  }

  return {
    success: true,
    message: "Results returned for revision.",
  };
}

/**
 * 9. Campus Admin: Publish Results
 */
export async function publishClassResults(
  campusId,
  adminUserId,
  { classId, examName = "Midterm Examination", term = "Midterm" }
) {
  const now = new Date();

  const results = await StudentResult.find({
    campusId,
    classId,
    examName,
    term,
  }).lean();

  if (!results.length) {
    throw new Error("No results found for this class and exam.");
  }

  // Update status to Published
  await StudentResult.updateMany(
    { campusId, classId, examName, term },
    {
      $set: {
        status: "Published",
        publishedBy: adminUserId,
        publishedAt: now,
      },
    }
  );

  // Generate / Update ReportCard snapshots
  for (const r of results) {
    await ReportCard.findOneAndUpdate(
      {
        campusId,
        studentId: r.studentId,
        term: r.term,
        examName: r.examName,
      },
      {
        $set: {
          campusId,
          classId: r.classId,
          studentId: r.studentId,
          studentProfileId: r.studentProfileId,
          studentResultId: r._id,
          term: r.term,
          examName: r.examName,
          academicYear: r.academicYear || "2026-2027",
          publishedAt: now,
          publishedBy: adminUserId,
          reportSnapshot: r,
        },
        $inc: { version: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Notify student
    await createNotification({
      userId: r.studentId,
      title: `Report Card Published — ${r.examName}`,
      message: `Your report card for ${r.examName} (${r.term}) is now available to view!`,
      type: "info",
      severity: "info",
      link: "/student/grades",
      sendEmail: false,
    });
  }

  return {
    success: true,
    message: `Report cards published successfully for ${results.length} students.`,
    publishedCount: results.length,
  };
}

/**
 * 10. Get Student's Published Report Cards (For Student / Parent Portal)
 */
export async function getStudentReportCards(campusId, studentUserId, term = null) {
  const query = { campusId, studentId: studentUserId };
  if (term && term !== "All") query.term = new RegExp(`^${term}$`, "i");

  const cards = await ReportCard.find(query)
    .populate("studentId", "name email roll rollNo rollNumber gradeOrClass section")
    .populate("studentResultId")
    .sort({ publishedAt: -1 })
    .lean();

  return cards.map((c) => ({
    _id: c._id.toString(),
    id: c._id.toString(),
    term: c.term,
    examName: c.examName,
    academicYear: c.academicYear,
    version: c.version,
    publishedAt: c.publishedAt,
    result: c.studentResultId || c.reportSnapshot,
  }));
}

export default {
  getClassResultsGrid,
  remindSubjectTeacher,
  compileClassResults,
  saveStudentRemarks,
  submitClassResultsForApproval,
  getPendingApprovals,
  approveClassResults,
  rejectClassResults,
  publishClassResults,
  getStudentReportCards,
};
