import { createSelector } from '@reduxjs/toolkit';
import { demoInstitute } from '../../Admins/Institute Admin/instituteData.js';
import { initialCampuses } from '../../Admins/Institute Admin/Campuses/campusData.js';

// Existing records store campus names. Known demo names resolve to their stable
// registry IDs even after a rename; new Institute edits persist the ID explicitly.
export function joinInstituteStudents(students, campuses) {
  return students.flatMap((student) => {
    if (student.instituteId && student.instituteId !== demoInstitute.id) return [];
    const campusId = student.campusId || initialCampuses.find((campus) => campus.name === student.campus)?.id || campuses.find((campus) => campus.name === student.campus && campus.instituteId === demoInstitute.id)?.id;
    const campus = campuses.find((record) => record.id === campusId);
    if (campus && campus.instituteId !== demoInstitute.id) return [];
    if (!student.instituteId && !campus && !initialCampuses.some((record) => record.id === campusId)) return [];
    return [{ ...student, campusId: campusId || '', campus: campus?.name || 'Campus unavailable' }];
  });
}
export const selectInstituteStudents = createSelector(
  [(state) => state.students.records, (state) => state.campuses.records],
  joinInstituteStudents,
);
