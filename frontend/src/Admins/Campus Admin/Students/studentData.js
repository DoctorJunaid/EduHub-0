export const studentStatuses = ["Active", "Pending", "Graduated", "Suspended"];
export const studentPrograms = [];
export const studentCampuses = [];
export const studentSemesters = [];
export const studentRecords = [];

export function filterStudents(records = [], { search = "", program = "", status = "", semester = "" } = {}) {
  const query = (search || "").trim().toLowerCase();
  return records.filter(
    (student) =>
      (!query ||
        `${student.name || ""} ${student.roll || ""} ${student.program || student.class || student.gradeOrClass || ""} ${student.email || ""} ${student.section || ""} ${student.guardian || ""}`
          .toLowerCase()
          .includes(query)) &&
      (!program || student.program === program || student.class === program || student.gradeOrClass === program) &&
      (!status || student.status === status) &&
      (!semester || student.semester === semester || student.section === semester || student.session === semester),
  );
}

export function paginateStudents(records = [], page = 1, pageSize = 10) {
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
