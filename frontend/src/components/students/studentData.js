import { campusStudents } from "../campus-overview/campusOverviewData.js";
import { facultyRecords } from "../faculty/facultyData.js";

export const studentStatuses = ["Active", "Pending", "Graduated", "Suspended"];
export const studentPrograms = [
  ...new Set(campusStudents.map((student) => student.program)),
];
export const studentCampuses = [
  ...new Set(facultyRecords.map((teacher) => teacher.campus)),
];

// The two directory reference records; unknown contact values remain blank.
export const studentRecords = campusStudents
  .slice(0, 2)
  .map((student, index) => ({
    ...student,
    id: `student-demo-${index + 1}`,
    email: index === 0 ? "ali.raza@nust.edu.pk" : "",
    studentPhone: index === 0 ? "+92 333 5551234" : "",
    guardianPhone: student.phone,
    semester: "4th Semester",
    subjects:
      index === 0
        ? "Advanced Web Design, Data Structures, AI"
        : "Advanced Web Design, Data Structures",
    campus: "NUST Main Campus (H-12)",
  }));

export function filterStudents(records, { search, program, status }) {
  const query = search.trim().toLowerCase();
  return records.filter(
    (student) =>
      (!query ||
        `${student.name} ${student.roll} ${student.program}`
          .toLowerCase()
          .includes(query)) &&
      (!program || student.program === program) &&
      (!status || student.status === status),
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
