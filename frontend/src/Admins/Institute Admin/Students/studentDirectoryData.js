export function searchInstituteStudents(students, search) {
  const query = search.trim().toLowerCase();
  return students.filter((student) =>
    [
      student.name,
      student.roll,
      student.program,
      student.section,
      student.subjects,
      student.campus,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
}
