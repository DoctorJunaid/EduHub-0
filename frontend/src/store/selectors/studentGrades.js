import { createSelector } from "@reduxjs/toolkit";
import { selectStudentDashboard } from "./studentDashboard.js";
import { selectJoinedResults } from "../Slices/resultsSlice.js";
import { selectExams } from "../Slices/examsSlice.js";

export const selectStudentGrades = createSelector(
  [selectStudentDashboard, selectJoinedResults, selectExams],
  (dashboard, results, exams) => {
    const rows = dashboard.student
      ? results.filter(
          (row) =>
            row.studentId === dashboard.student.id &&
            exams.some(
              (exam) => String(exam.id || exam._id) === String(row.examId),
            ),
        )
      : [];
    const groups = new Map();
    for (const row of rows) {
      const key = JSON.stringify([row.academicYear, row.semester]);
      if (!groups.has(key))
        groups.set(key, {
          key,
          academicYear: row.academicYear,
          semester: row.semester,
          rows: [],
        });
      groups.get(key).rows.push(row);
    }
    const periods = [...groups.values()].sort(
      (a, b) =>
        b.academicYear.localeCompare(a.academicYear, undefined, {
          numeric: true,
        }) || b.semester.localeCompare(a.semester),
    );
    return { student: dashboard.student, cgpa: dashboard.cgpa, periods };
  },
);
