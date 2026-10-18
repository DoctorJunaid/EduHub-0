import { createSelector } from "@reduxjs/toolkit";
import { selectStudentDashboard } from "./studentDashboard.js";
import { selectJoinedResults } from "../Slices/resultsSlice.js";
import { selectExams } from "../Slices/examsSlice.js";

export const selectStudentGrades = createSelector(
  [selectStudentDashboard, selectJoinedResults, selectExams],
  (dashboard, results, exams) => {
    const sId = String(dashboard.student?._id || dashboard.student?.id || "");
    const rows = dashboard.student
      ? results.filter((row) => {
          const rowSid = String(row.studentId?._id || row.studentId?.id || row.studentId || "");
          const studentMatch = !sId || !rowSid || rowSid === sId;
          const examMatch =
            !exams.length ||
            !row.examId ||
            exams.some((exam) => String(exam.id || exam._id) === String(row.examId));
          return studentMatch && examMatch;
        })
      : [];
    const groups = new Map();
    for (const row of rows) {
      const year = row.academicYear || "2026-2027";
      const sem = row.academicTerm || row.term || row.semester || "Midterm";
      const key = JSON.stringify([year, sem]);
      if (!groups.has(key))
        groups.set(key, {
          key,
          academicYear: year,
          academicTerm: sem,
          semester: sem,
          term: sem,
          rows: [],
        });
      groups.get(key).rows.push({
        ...row,
        score: row.marksObtained ?? row.score ?? 0,
        totalMarks: row.totalMarks || 100,
        subject: row.subject || row.courseName || "General",
        courseName: row.subject || row.courseName || "General",
        grade: row.grade || (row.percentage >= 80 ? "A+" : "A"),
      });
    }
    const periods = [...groups.values()].sort(
      (a, b) =>
        (b.academicYear || "").localeCompare(a.academicYear || "", undefined, {
          numeric: true,
        }) || (b.semester || "").localeCompare(a.semester || ""),
    );
    return { student: dashboard.student, cgpa: dashboard.cgpa, periods };
  },
);
