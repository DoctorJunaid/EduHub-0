import { createSelector } from "@reduxjs/toolkit";
import { selectStudentDashboard } from "./studentDashboard.js";
import { selectStudentCourses } from "./studentCourses.js";
import { selectStudentAttendanceHistory } from "../Slices/studentAttendanceSlice.js";

export const selectStudentAttendancePage = createSelector(
  [
    selectStudentDashboard,
    selectStudentCourses,
    selectStudentAttendanceHistory,
  ],
  (dashboard, courses, history) => {
    const sId = String(dashboard.student?._id || dashboard.student?.id || "");
    const rows = dashboard.student
      ? history
          .filter(({ student }) => String(student?._id || student?.id) === sId)
          .sort(
            (a, b) =>
              (b.date || "").localeCompare(a.date || "") ||
              (a.session?.subject || "").localeCompare(b.session?.subject || ""),
          )
      : [];

    let effectiveCourses = courses;
    if ((!effectiveCourses || effectiveCourses.length === 0) && rows.length > 0) {
      const subjectMap = new Map();
      for (const row of rows) {
        const sub = row.session?.subject || "Mathematics";
        if (!subjectMap.has(sub)) {
          subjectMap.set(sub, []);
        }
        subjectMap.get(sub).push(row);
      }
      effectiveCourses = Array.from(subjectMap.entries()).map(([sub, subRows]) => {
        const marked = subRows.length;
        const present = subRows.filter((r) => r.record?.status === "Present").length;
        const rate = marked > 0 ? (present / marked) * 100 : 100;
        return {
          id: `course-${sub.toLowerCase()}`,
          title: sub,
          name: sub,
          attendance: { marked, present, rate, policyPending: false },
        };
      });
    }

    const presentCount = rows.filter(({ record }) => record?.status === "Present").length;
    const totalMarked = rows.length;
    const overallRate = totalMarked > 0 ? (presentCount / totalMarked) * 100 : 100;

    return {
      student: dashboard.student,
      attendance: {
        present: presentCount,
        absent: rows.filter(({ record }) => record?.status === "Absent").length,
        marked: totalMarked,
        rate: overallRate,
        risk: overallRate < 75,
        policyPending: false,
      },
      courses: effectiveCourses,
      rows,
      absent: rows.filter(({ record }) => record?.status === "Absent").length,
      late: rows.filter(({ record }) => record?.status === "Late").length,
      leave: rows.filter(({ record }) => record?.status === "On Leave").length,
    };
  },
);
