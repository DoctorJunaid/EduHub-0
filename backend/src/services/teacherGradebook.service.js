import mongoose from "mongoose";
import { Performance, ExamSchedule, StudentProfile } from "../models/profile.model.js";
import User from "../models/user.model.js";
import { getTeacherAssignedClasses, resolveTeacherUser } from "./teacherAssignment.service.js";

/**
 * Calculates letter grade and GPA based on percentage score.
 */
export function calculateGradeAndGpa(percentage) {
  const p = Math.round(Number(percentage) * 10) / 10;
  if (p >= 90) return { grade: "A+", gpa: 4.0 };
  if (p >= 85) return { grade: "A", gpa: 3.7 };
  if (p >= 80) return { grade: "A-", gpa: 3.5 };
  if (p >= 75) return { grade: "B+", gpa: 3.3 };
  if (p >= 70) return { grade: "B", gpa: 3.0 };
  if (p >= 65) return { grade: "B-", gpa: 2.7 };
  if (p >= 60) return { grade: "C+", gpa: 2.3 };
  if (p >= 50) return { grade: "C", gpa: 2.0 };
  if (p >= 40) return { grade: "D", gpa: 1.0 };
  return { grade: "F", gpa: 0.0 };
}

/**
 * 1. Get assigned classes for Gradebook dropdown.
 */
export async function getTeacherGradebookClasses(campusId, teacherUserId) {
  return await getTeacherAssignedClasses(campusId, teacherUserId);
}

/**
 * 2. Get students enrolled in a selected class section.
 */
export async function getGradebookStudents(campusId, teacherUserId, { classId, className, section }) {
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

  const studentMap = new Map();

  // 1. Query User collection by gradeOrClass / program and section
  const userQuery = { campusId, role: "student" };

  if (targetClassName) {
    const cleanNum = targetClassName.replace(/[^0-9]/g, "");
    const classRegexes = [
      new RegExp(`^${targetClassName}$`, "i"),
      new RegExp(`^Class\\s*${cleanNum}$`, "i"),
      new RegExp(`^Grade\\s*${cleanNum}$`, "i"),
    ];
    userQuery.$or = [
      { gradeOrClass: { $in: classRegexes } },
      { program: { $in: classRegexes } },
    ];
  }

  if (targetSection && targetSection !== "All" && targetSection !== "All sections") {
    const cleanSec = targetSection.replace(/^Section\s*/i, "").trim();
    userQuery.section = {
      $in: [
        cleanSec,
        `Section ${cleanSec}`,
        cleanSec.toUpperCase(),
        cleanSec.toLowerCase(),
      ],
    };
  }

  const users = await User.find(userQuery)
    .select("_id name email roll rollNo rollNumber gradeOrClass program section avatar isActive")
    .sort({ rollNumber: 1, name: 1 })
    .lean();

  for (const u of users) {
    studentMap.set(u._id.toString(), {
      _id: u._id.toString(),
      id: u._id.toString(),
      studentId: u._id.toString(),
      name: u.name || "Student",
      email: u.email || "",
      rollNumber: u.rollNumber || u.rollNo || u.roll || "—",
      gradeOrClass: u.gradeOrClass || u.program || targetClassName || "Class 10",
      program: u.program || u.gradeOrClass || targetClassName || "Class 10",
      section: u.section || targetSection || "A",
      avatar: u.avatar || "",
    });
  }

  // 2. Query StudentProfile with Grade and Section refs if available
  try {
    const Grade = mongoose.model("Grade");
    const Section = mongoose.model("Section");

    let gradeDoc = null;
    let sectionDoc = null;

    if (targetClassName) {
      gradeDoc = await Grade.findOne({
        campusId,
        name: new RegExp(`^${targetClassName}$`, "i"),
      }).lean();
    }
    if (targetSection) {
      const cleanSec = targetSection.replace(/^Section\s*/i, "").trim();
      sectionDoc = await Section.findOne({
        campusId,
        name: new RegExp(`^${cleanSec}$`, "i"),
      }).lean();
    }

    const profileQuery = { campusId };
    if (gradeDoc) profileQuery.gradeId = gradeDoc._id;
    if (sectionDoc) profileQuery.sectionId = sectionDoc._id;

    if (gradeDoc || sectionDoc) {
      const profiles = await StudentProfile.find(profileQuery)
        .populate("user", "_id name email roll rollNo rollNumber gradeOrClass program section avatar isActive")
        .lean();

      for (const p of profiles) {
        if (p.user && p.user._id) {
          const u = p.user;
          const uId = u._id.toString();
          if (!studentMap.has(uId)) {
            studentMap.set(uId, {
              _id: uId,
              id: uId,
              studentId: uId,
              name: u.name || "Student",
              email: u.email || "",
              rollNumber: p.rollNumber || u.rollNumber || u.rollNo || u.roll || "—",
              gradeOrClass: targetClassName || u.gradeOrClass || "Class 10",
              program: targetClassName || u.program || "Class 10",
              section: targetSection || u.section || "A",
              avatar: u.avatar || "",
            });
          }
        }
      }
    }
  } catch (err) {
    // Non-fatal profile join
  }

  // If no specific class filter was provided, return campus students
  if (studentMap.size === 0 && (!targetClassName || targetClassName === "All")) {
    const generalStudents = await User.find({ campusId, role: "student" })
      .select("_id name email roll rollNo rollNumber gradeOrClass program section avatar")
      .sort({ name: 1 })
      .limit(50)
      .lean();

    for (const u of generalStudents) {
      studentMap.set(u._id.toString(), {
        _id: u._id.toString(),
        id: u._id.toString(),
        studentId: u._id.toString(),
        name: u.name || "Student",
        email: u.email || "",
        rollNumber: u.rollNumber || u.rollNo || u.roll || "—",
        gradeOrClass: u.gradeOrClass || u.program || "Class 10",
        program: u.program || u.gradeOrClass || "Class 10",
        section: u.section || "A",
        avatar: u.avatar || "",
      });
    }
  }

  return Array.from(studentMap.values());
}

/**
 * 3. Get exams and assessments available for a class/subject.
 */
export async function getGradebookExams(campusId, { className, section, subject }) {
  const query = { campusId };
  if (subject) query.subject = new RegExp(subject, "i");

  const exams = await ExamSchedule.find(query)
    .sort({ date: -1, examDate: -1 })
    .lean();

  const standardAssessments = [
    { examName: "Midterm Examination", term: "Midterm", totalMarks: 100 },
    { examName: "Final Term Examination", term: "Final Term", totalMarks: 100 },
    { examName: "Quiz Assessment 1", term: "Term 1", totalMarks: 25 },
    { examName: "Quiz Assessment 2", term: "Term 1", totalMarks: 25 },
    { examName: "Monthly Class Test", term: "Monthly", totalMarks: 50 },
    { examName: "Practical / Lab Evaluation", term: "Practical", totalMarks: 50 },
  ];

  const map = new Map();
  for (const ex of exams) {
    const key = (ex.examName || ex.title || "Exam").toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        _id: ex._id.toString(),
        id: ex._id.toString(),
        examName: ex.examName || ex.title,
        subject: ex.subject || subject || "General",
        term: ex.term || ex.sessionOrShift || "Midterm",
        totalMarks: ex.totalMarks || 100,
        date: ex.date || (ex.examDate ? new Date(ex.examDate).toISOString().split("T")[0] : ""),
      });
    }
  }

  for (const std of standardAssessments) {
    const key = std.examName.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        _id: `std_${std.examName.replace(/\s+/g, "_").toLowerCase()}`,
        id: `std_${std.examName.replace(/\s+/g, "_").toLowerCase()}`,
        examName: std.examName,
        subject: subject || "General",
        term: std.term,
        totalMarks: std.totalMarks,
        date: new Date().toISOString().split("T")[0],
      });
    }
  }

  return Array.from(map.values());
}

/**
 * 4. List Gradebook Results / Performance records with filtering and analytics.
 */
export async function getGradebookResults(campusId, teacherUserId, filters = {}) {
  const query = { campusId };

  if (filters.className && filters.className !== "All") {
    query.$or = [
      { className: new RegExp(`^${filters.className}$`, "i") },
      { gradeOrClass: new RegExp(`^${filters.className}$`, "i") },
    ];
  }

  if (filters.section && filters.section !== "All") {
    query.section = new RegExp(`^${filters.section}$`, "i");
  }

  if (filters.subject && filters.subject !== "All") {
    query.subject = new RegExp(`^${filters.subject}$`, "i");
  }

  if (filters.term && filters.term !== "All") {
    query.term = new RegExp(`^${filters.term}$`, "i");
  }

  if (filters.studentId) {
    query.studentId = filters.studentId;
  }

  const results = await Performance.find(query)
    .populate("studentId", "name email roll rollNo rollNumber gradeOrClass program section avatar")
    .sort({ createdAt: -1, examName: 1 })
    .lean();

  const formatted = results.map((r) => {
    const s = r.studentId || {};
    const percentage = r.percentage || Math.round(((r.marksObtained || 0) / (r.totalMarks || 100)) * 1000) / 10;
    const { grade, gpa } = calculateGradeAndGpa(percentage);

    return {
      _id: r._id.toString(),
      id: r._id.toString(),
      studentId: s._id ? s._id.toString() : (r.studentId ? String(r.studentId) : ""),
      student: {
        _id: s._id ? s._id.toString() : "",
        id: s._id ? s._id.toString() : "",
        name: s.name || "Student",
        email: s.email || "",
        rollNumber: s.rollNumber || s.rollNo || s.roll || "—",
        program: s.program || s.gradeOrClass || r.className || "Class 10",
        section: s.section || r.section || "A",
        avatar: s.avatar || "",
      },
      examName: r.examName || "Assessment",
      subject: r.subject || "General",
      term: r.term || "Midterm",
      className: r.className || s.gradeOrClass || "Class 10",
      section: r.section || s.section || "A",
      marksObtained: r.marksObtained || 0,
      totalMarks: r.totalMarks || 100,
      percentage,
      grade: r.grade || grade,
      gpa: r.gpa !== undefined ? r.gpa : gpa,
      remarks: r.remarks || "",
      isPublished: r.isPublished !== false,
      createdAt: r.createdAt || new Date(),
    };
  });

  // Calculate Aggregates
  let totalEvaluated = formatted.length;
  let totalPctSum = 0;
  let highestScore = 0;
  let lowestScore = totalEvaluated > 0 ? 100 : 0;
  let passCount = 0;
  let failCount = 0;

  for (const item of formatted) {
    totalPctSum += item.percentage;
    if (item.percentage > highestScore) highestScore = item.percentage;
    if (item.percentage < lowestScore) lowestScore = item.percentage;
    if (item.percentage >= 40) passCount++;
    else failCount++;
  }

  const averagePercentage = totalEvaluated > 0 ? Math.round((totalPctSum / totalEvaluated) * 10) / 10 : 0;
  const passRate = totalEvaluated > 0 ? Math.round((passCount / totalEvaluated) * 100) : 0;

  return {
    results: formatted,
    stats: {
      totalEvaluated,
      averagePercentage,
      highestScore,
      lowestScore: totalEvaluated > 0 ? lowestScore : 0,
      passCount,
      failCount,
      passRate,
    },
  };
}

/**
 * 5. Create or Update a student grade / marks record.
 */
export async function saveGradebookResult(campusId, teacherUserId, data) {
  const resolved = await resolveTeacherUser(teacherUserId);
  const markedBy = resolved?._id || teacherUserId;

  const studentId = data.studentId || data.student?._id || data.student?.id;
  if (!studentId || !mongoose.isValidObjectId(studentId)) {
    throw new Error("Valid student ID is required.");
  }

  const examName = (data.examName || data.assessment || "").trim();
  if (!examName) throw new Error("Assessment or exam name is required.");

  const subject = (data.subject || "General").trim();
  const term = (data.term || data.semester || "Midterm").trim();
  const marksObtained = Number(data.marksObtained ?? data.score ?? 0);
  const totalMarks = Number(data.totalMarks || 100);

  if (isNaN(marksObtained) || marksObtained < 0) {
    throw new Error("Marks obtained must be a positive number.");
  }
  if (isNaN(totalMarks) || totalMarks <= 0) {
    throw new Error("Total maximum marks must be greater than 0.");
  }
  if (marksObtained > totalMarks) {
    throw new Error(`Marks obtained (${marksObtained}) cannot exceed total marks (${totalMarks}).`);
  }

  const percentage = Math.round((marksObtained / totalMarks) * 1000) / 10;
  const { grade, gpa } = calculateGradeAndGpa(percentage);

  const studentUser = await User.findById(studentId).select("name email roll rollNo rollNumber gradeOrClass program section").lean();
  const className = data.className || studentUser?.gradeOrClass || studentUser?.program || "Class 10";
  const section = data.section || studentUser?.section || "A";

  const payload = {
    campusId,
    studentId,
    examName,
    subject,
    term,
    className,
    gradeOrClass: className,
    section,
    marksObtained,
    totalMarks,
    percentage,
    grade,
    gpa,
    remarks: (data.remarks || "").trim(),
    isPublished: data.isPublished !== false,
    markedBy,
  };

  let savedDoc;
  if (data._id || data.id) {
    const resultId = data._id || data.id;
    if (mongoose.isValidObjectId(resultId)) {
      savedDoc = await Performance.findOneAndUpdate(
        { _id: resultId, campusId },
        { $set: payload },
        { new: true, runValidators: true }
      );
    }
  }

  if (!savedDoc) {
    // Check if duplicate entry exists for this student + exam + term + subject
    savedDoc = await Performance.findOneAndUpdate(
      {
        campusId,
        studentId,
        examName,
        subject,
        term,
      },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const populated = await Performance.findById(savedDoc._id)
    .populate("studentId", "name email roll rollNo rollNumber gradeOrClass program section avatar")
    .lean();

  return {
    ...populated,
    _id: populated._id.toString(),
    id: populated._id.toString(),
    student: populated.studentId,
  };
}

/**
 * 6. Delete a gradebook marks record.
 */
export async function deleteGradebookResult(campusId, teacherUserId, resultId) {
  if (!mongoose.isValidObjectId(resultId)) {
    throw new Error("Invalid result ID.");
  }
  const deleted = await Performance.findOneAndDelete({ _id: resultId, campusId });
  if (!deleted) throw new Error("Gradebook record not found.");
  return { success: true, message: "Gradebook record deleted successfully." };
}
