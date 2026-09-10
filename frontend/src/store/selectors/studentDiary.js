import { createSelector } from '@reduxjs/toolkit';
import { selectDiary, validDiaryEntry } from '../Slices/diarySlice.js';
import { selectStudentCourses } from './studentCourses.js';
import { selectStudentAssignments } from './studentAssignments.js';

export const selectStudentDiary = createSelector(
  [selectDiary, selectStudentCourses, selectStudentAssignments],
  (entries, courses, assignments) => entries.filter(validDiaryEntry).flatMap((entry) => {
    const course = courses.find((item) => item.routines.some((routine) => routine.id === entry.classId));
    if (!course) return [];
    const routine = course.routines.find((item) => item.id === entry.classId);
    const assignment = assignments.find((item) => item.id === entry.assignmentId && item.classId === entry.classId);
    return [{ ...entry, subject: course.title, section: course.section, instructor: routine.instructor, assignment }];
  }).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title)),
);

export const filterDiaryBySubject = (entries, subject) => subject ? entries.filter((entry) => entry.subject === subject) : entries;
export const diaryEntriesForDate = (entries, date) => entries.filter((entry) => entry.date === date);
