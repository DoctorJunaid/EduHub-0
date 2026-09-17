import { campusStudents } from "../Dashboard/campusOverviewData.js";
import { facultyRecords } from "../Faculty/facultyData.js";

export const studentStatuses = ["Active", "Pending", "Graduated", "Suspended"];
export const studentPrograms = [
  ...new Set(campusStudents.map((student) => student.program)),
];
export const studentCampuses = [
  ...new Set(facultyRecords.map((teacher) => teacher.campus)),
];

export const studentSemesters = [
  ...new Set(campusStudents.map((student) => student.semester).filter(Boolean)),
];

// The directory reference records; unknown contact values remain blank.
export const studentRecords = campusStudents.map((student) => ({
  ...student,
}));

export function filterStudents(records, { search, program, status, semester }) {
  const query = search.trim().toLowerCase();
  return records.filter(
    (student) =>
      (!query ||
        `${student.name} ${student.roll} ${student.program} ${student.email || ""} ${student.section || ""}`
          .toLowerCase()
          .includes(query)) &&
      (!program || student.program === program) &&
      (!status || student.status === status) &&
      (!semester || student.semester === semester),
  );
}

export function paginateStudents(records, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const start = (currentPage - 1) * pageSize;
  return {
    pageCount,
    currentPage,
    start,
    records: records.slice(start, start + pageSize),
  };
}
