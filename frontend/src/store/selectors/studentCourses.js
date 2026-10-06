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

const getSubjectCategory = (title) => {
  const t = (title || "").toLowerCase();
  if (t.includes("compulsory") || t.includes("islamic") || t.includes("islamiat") || t.includes("pakistan") || t.includes("mutala") || t.includes("urdu") || t.includes("english")) {
    return "Compulsory";
  }
  if (t.includes("math") || t.includes("physic") || t.includes("chem") || t.includes("bio") || t.includes("computer") || t.includes("science")) {
    return "Science & Technical";
  }
  return "Electives & Arts";
};

const getSubjectCode = (title) => {
  const t = (title || "").toLowerCase();
  if (t.includes("math")) return "MATH-9";
  if (t.includes("physic")) return "PHY-9";
  if (t.includes("chem")) return "CHEM-9";
  if (t.includes("bio")) return "BIO-9";
  if (t.includes("computer") || t.includes("cs")) return "CS-9";
  if (t.includes("urdu")) return "URD-9";
  if (t.includes("english")) return "ENG-9";
  if (t.includes("islamic") || t.includes("islamiat")) return "ISL-9";
  if (t.includes("pakistan")) return "PAK-10";
  if (t.includes("mutala") || t.includes("quran")) return "MQH-9";
  if (t.includes("general science")) return "GSCI-8";
  return (title || "").slice(0, 4).toUpperCase();
};

const getSubjectDescription = (title) => {
  const t = (title || "").toLowerCase();
  if (t.includes("math")) return "BISE Peshawar Board - Secondary Algebra, Geometry, Trigonometry & Matrices";
  if (t.includes("physic")) return "BISE Peshawar Board - Secondary Mechanics, Waves, Electricity & Practical Experiments";
  if (t.includes("chem")) return "BISE Peshawar Board - Secondary Atomic Structure, Chemical Bonding & Lab Experiments";
  if (t.includes("computer") || t.includes("cs")) return "BISE Peshawar Board - Computer Architecture, Programming & CS Labs";
  if (t.includes("bio")) return "BISE Peshawar Board - Cell Biology, Genetics, Enzymes & Lab Experiments";
  if (t.includes("english")) return "BISE Peshawar Board - English Prose, Poetry, Grammar & Composition";
  if (t.includes("urdu")) return "BISE Peshawar Board - Urdu Literature, Qawaid, Nazm & Ghazal";
  if (t.includes("islamic") || t.includes("islamiat")) return "BISE Peshawar Board - Quranic Verses, Hadith Studies & Islamic Morals";
  if (t.includes("pakistan")) return "BISE Peshawar Board - Pakistan Movement, Constitution & Natural Resources";
  if (t.includes("mutala") || t.includes("quran")) return "BISE Peshawar Board - Translation & Understanding of Selected Surahs";
  return "BISE Peshawar Board - Standard Secondary Curriculum";
};

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

      const category = getSubjectCategory(title);
      const code = getSubjectCode(title);
      const description = getSubjectDescription(title);
      const isCore = category === "Compulsory";

      const routines = sessions.map((session) => {
        // Timetable currently stores instructor names, not foreign keys. Do not guess ambiguous matches.
        const teachers = faculty.filter(
          (teacher) =>
            normalized(teacher.name) === normalized(session.instructor),
        );
        return {
          id: session.id,
          schedule: courseScheduleLabel(session),
          room: session.room || "Room 101",
          instructor:
            teachers.length === 1
              ? teachers[0].name
              : session.instructor || "Assigned Faculty",
          teacherObj: teachers.length === 1 ? teachers[0] : null,
        };
      });

      const primaryTeacher = routines.find((r) => r.teacherObj)?.teacherObj ||
        faculty.find((f) => normalized(f.department).includes(normalized(title)) || (f.subjectsTaught && f.subjectsTaught.some(s => normalized(s) === normalized(title)))) || null;

      const attendance = summarizeStudentAttendance(attendanceRows);

      return {
        id: `course-${normalized(title)}`,
        title,
        name: title,
        code,
        description,
        category,
        totalMarks: isCore ? 75 : 75,
        creditHours: 4,
        section: dashboard.student.section,
        grade: dashboard.student.gradeOrClass || dashboard.student.program || "Class 9",
        curriculum: "BISE Peshawar Board Standard",
        routines,
        attendance,
        instructor: routines[0]?.instructor || primaryTeacher?.name || "Assigned Faculty",
        instructorObj: primaryTeacher,
      };
    });
  },
);
