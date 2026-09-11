import { createSelector } from "@reduxjs/toolkit";
import {
  selectStudentDashboard,
  summarizeStudentAttendance,
} from "./studentDashboard.js";
import { selectStudentAttendanceHistory } from "../Slices/studentAttendanceSlice.js";
import { selectFaculty } from "../Slices/facultySlice.js";
import { dayLabel, timeLabel } from "../../lib/schedule.js";

const normalized = (value) => (value || "").trim().toLowerCase();
export function courseScheduleLabel(session) {
  const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (
    !Array.isArray(session.days) ||
    !session.days.length ||
    !session.days.every(
      (day) => Number.isInteger(day) && day >= 1 && day <= 5,
    ) ||
    !validTime.test(session.startTime) ||
    !validTime.test(session.endTime) ||
    session.startTime >= session.endTime
  )
    return "Schedule not available";
  return `${dayLabel([...new Set(session.days)])} · ${timeLabel(session.startTime)} – ${timeLabel(session.endTime)}`;
}

// Read-only view models: no course/enrollment records are created or persisted here.
export const selectStudentCourses = createSelector(
  [selectStudentDashboard, selectStudentAttendanceHistory, selectFaculty],
  (dashboard, attendanceHistory, faculty) => {
    if (!dashboard.student) return [];
    return dashboard.courses.map((title) => {
      const sessions = dashboard.timetable.filter(
        (session) => normalized(session.subject) === normalized(title),
      );
      const classIds = new Set(sessions.map((session) => session.id));
      const attendanceRows = attendanceHistory.filter(
        ({ student, session }) =>
          student.id === dashboard.student.id && classIds.has(session.id),
      );
      return {
        title,
        creditHours:
          sessions.find((session) => Number.isFinite(session.creditHours))
            ?.creditHours ??
          dashboard.student.courseCredits?.[title] ??
          null,
        section: dashboard.student.section,
        semester: dashboard.student.semester,
        routines: sessions.map((session) => {
          // Timetable currently stores instructor names, not foreign keys. Do not guess ambiguous matches.
          const teachers = faculty.filter(
            (teacher) =>
              normalized(teacher.name) === normalized(session.instructor),
          );
          return {
            id: session.id,
            schedule: courseScheduleLabel(session),
            room: session.room || "Location not available",
            instructor:
              teachers.length === 1
                ? teachers[0].name
                : session.instructor || "Instructor not assigned",
          };
        }),
        attendance: summarizeStudentAttendance(attendanceRows),
      };
    });
  },
);
