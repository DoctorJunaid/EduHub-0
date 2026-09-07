// Explicit illustrative awards, not a grading policy or score-to-GPA mapping.
const awards = [
  [72, 'B', 2.7], [78, 'B+', 3.0], [81, 'A', 3.3],
  [80, 'B+', 3.0], [85, 'A', 3.5], [88, 'A', 3.8],
  [84, 'A', 3.4], [90, 'A+', 4.0], [76, 'B+', 3.0],
  [92, 'A+', 4.0], [88, 'A', 3.8], [68, 'C+', 2.3],
];

export function makeDemoResults(students, exams, year = new Date().getFullYear()) {
  if (!students.length || !exams.length) return [];
  return awards.map(([score, grade, gpa], index) => {
    const periodYear = year - 3 + Math.floor(index / 3);
    return {
      studentId: students[index % Math.min(students.length, 2)].id,
      examId: exams[index % Math.min(exams.length, 3)].id,
      academicYear: `${periodYear} - ${periodYear + 1}`,
      semester: `Fall ${periodYear}`,
      courseCode: `DEMO-${101 + index % 3}`,
      score, totalMarks: 100, grade, gpa,
      remarks: 'Demo result for previewing academic reports. Replace with actual awarded marks.',
    };
  }).filter((row, index, rows) => rows.findIndex((other) => other.studentId === row.studentId && other.examId === row.examId && other.semester === row.semester) === index);
}
