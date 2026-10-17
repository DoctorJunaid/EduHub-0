import { createSelector } from "@reduxjs/toolkit";
import { selectDiary, validDiaryEntry } from "../Slices/diarySlice.js";
import { selectStudentCourses } from "./studentCourses.js";
import { selectStudentAssignments } from "./studentAssignments.js";

const normalize = (value) => String(value || "").trim().toLowerCase();

export const selectStudentDiary = createSelector(
  [selectDiary, selectStudentCourses, selectStudentAssignments],
  (entries, courses, assignments) =>
    (entries || [])
      .filter(validDiaryEntry)
      .map((entry) => {
        const course = (courses || []).find((item) =>
          item.title?.toLowerCase() === entry.subject?.toLowerCase() ||
          item.routines?.some(
            (routine) => String(routine.id || routine._id) === String(entry.classId),
          ),
        );
        const routine = course?.routines?.find(
          (item) => String(item.id || item._id) === String(entry.classId),
        );
        const assignment = (assignments || []).find(
          (item) =>
            String(item.id || item._id) === String(entry.assignmentId) &&
            String(item.classId) === String(entry.classId),
        );
        return {
          ...entry,
          subject: entry.subject || course?.title || "Mathematics",
          section: entry.section || course?.section || "A",
          instructor: routine?.instructor || entry.teacherName || entry.instructor || "Teacher Bilal",
          assignment,
        };
      })
      .sort(
        (a, b) =>
          (b.date || "").localeCompare(a.date || "") ||
          (a.title || "").localeCompare(b.title || ""),
      ),
);

export const filterDiaryBySubject = (entries, subject) =>
  subject ? entries.filter((entry) => entry.subject === subject) : entries;
export const diaryEntriesForDate = (entries, date) =>
  entries.filter((entry) => entry.date === date);


