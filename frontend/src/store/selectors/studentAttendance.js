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
    if (!dashboard.student) {
      return {
        student: null,
        attendance: null,
        courses: [],
        rows: [],
        absent: 0,
        late: 0,
        leave: 0,
      };
    }

    const sId = String(dashboard.student?._id || dashboard.student?.id || "");
    const rows = history
      .filter(
        ({ student, record }) =>
          String(student?._id || student?.id) === sId ||
          (record?.studentId && String(record.studentId) === sId),
      )
      .sort(
        (a, b) =>
          (b.date || "").localeCompare(a.date || "") ||
          (a.session?.subject || "").localeCompare(b.session?.subject || ""),
      );

    return {
      student: dashboard.student,
      attendance: dashboard.attendance,
      courses,
      rows,
      absent: rows.filter(({ record }) => record?.status === "Absent").length,
      late: rows.filter(({ record }) => record?.status === "Late").length,
      leave: rows.filter(
        ({ record }) =>
          record?.status === "On Leave" || record?.status === "Excused",
      ).length,
    };
  },
);
