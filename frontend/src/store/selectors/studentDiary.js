import { createSelector } from "@reduxjs/toolkit";
import { selectDiary, validDiaryEntry } from "../Slices/diarySlice.js";
import { selectStudentCourses } from "./studentCourses.js";
import { selectStudentAssignments } from "./studentAssignments.js";

export const selectStudentDiary = createSelector(
  [selectDiary, selectStudentCourses, selectStudentAssignments],
  (entries, courses, assignments) =>
    entries
      .filter(validDiaryEntry)
      .flatMap((entry) => {
        const course = courses.find((item) =>
          item.routines.some(
            (routine) => String(routine.id) === String(entry.classId),
          ),
        );
        const routine = course?.routines.find(
          (item) => String(item.id) === String(entry.classId),
        );
        const assignment = assignments.find(
          (item) =>
            String(item.id) === String(entry.assignmentId) &&
            String(item.classId) === String(entry.classId),
        );
        return [
          {
            ...entry,
            subject: course?.title || entry.subject || "Class Diary",
            section: course?.section || entry.section || "",
            instructor:
              routine?.instructor || entry.instructor || "Assigned Teacher",
            assignment,
          },
        ];
      })
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
      ),
);

export const filterDiaryBySubject = (entries, subject) =>
  subject ? entries.filter((entry) => entry.subject === subject) : entries;
export const diaryEntriesForDate = (entries, date) =>
  entries.filter((entry) => entry.date === date);
