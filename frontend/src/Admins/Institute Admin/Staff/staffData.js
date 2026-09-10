import { createSelector } from '@reduxjs/toolkit';
import { demoInstitute } from '../instituteData.js';
import { initialCampuses } from '../Campuses/campusData.js';

// Resolve legacy campus names and retain owned records when a campus is removed.
export function joinInstituteFaculty(records, campuses) {
  return records.flatMap((teacher) => {
    if (teacher.instituteId && teacher.instituteId !== demoInstitute.id) return [];
    const campusId = teacher.campusId || initialCampuses.find((campus) => campus.name === teacher.campus)?.id || campuses.find((campus) => campus.name === teacher.campus && campus.instituteId === demoInstitute.id)?.id;
    const campus = campuses.find((record) => record.id === campusId);
    if (campus && campus.instituteId !== demoInstitute.id) return [];
    if (!teacher.instituteId && !campus && !initialCampuses.some((record) => record.id === campusId)) return [];
    return [{ ...teacher, campusId: campusId || '', campus: campus?.name || 'Campus unavailable' }];
  });
}

export const selectInstituteFaculty = createSelector(
  [(state) => state.faculty.records, (state) => state.campuses.records],
  joinInstituteFaculty,
);
