// Demonstration display data from the supplied faculty-directory reference.
export const facultyStatuses = ['Active', 'Pending', 'Inactive'];
export const facultyRecords = [
  {
    name: "Dr. Usman Khan",
    initials: "UK",
    email: "dr.usman@nust.edu.pk",
    designation: "Associate Professor",
    qualification: "Ph.D. Computer Science",
    department: "Computer Science",
    subjects: "Advanced Web Design, Data Structures",
    campus: "NUST Main Campus (H-12)",
    status: "Active",
  },
];

export function filterFaculty(
  records,
  { search, department, designation, status },
) {
  const query = search.trim().toLowerCase();
  return records.filter(
    (teacher) =>
      (!query ||
        `${teacher.name} ${teacher.department} ${teacher.designation}`
          .toLowerCase()
          .includes(query)) &&
      (!department || teacher.department === department) &&
      (!designation || teacher.designation === designation) &&
      (!status || teacher.status === status),
  );
}
