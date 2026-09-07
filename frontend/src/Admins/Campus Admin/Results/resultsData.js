export const resultKey = (record) => JSON.stringify([record.studentId, record.examId, record.academicYear, record.semester]);
export function validateResult(record) {
  for (const key of ['studentId', 'examId', 'academicYear', 'semester']) if (typeof record[key] !== 'string' || !record[key].trim()) return 'Select a student and exam, and enter an academic year and semester.';
  if (!Number.isFinite(record.score) || record.score < 0 || !Number.isFinite(record.totalMarks) || record.totalMarks <= 0 || record.score > record.totalMarks) return 'Score must be between zero and the positive total marks.';
  if (record.gpa !== null && (!Number.isFinite(record.gpa) || record.gpa < 0)) return 'Enter a non-negative GPA or leave it blank.';
  if (['grade', 'courseCode', 'remarks'].some((key) => typeof record[key] !== 'string')) return 'Invalid result text fields.';
  return '';
}
export const percentage = (record) => Number.isFinite(record.score) && Number.isFinite(record.totalMarks) && record.totalMarks > 0 ? record.score / record.totalMarks * 100 : null;
export function joinResults(records, students, exams) {
  const people = new Map(students.map((person) => [person.id, person]));
  const assessments = new Map(exams.map((exam) => [exam.id, exam]));
  return records.filter((record) => people.has(record.studentId) && assessments.has(record.examId)).map((record) => ({ ...record, student: people.get(record.studentId), exam: assessments.get(record.examId) }));
}
export function filterResults(rows, filters) {
  const query = (filters.search ?? '').trim().toLowerCase();
  return rows.filter((row) => (!query || [row.student.name, row.student.roll, row.exam.subject].some((value) => value.toLowerCase().includes(query))) &&
    (!filters.academicYear || row.academicYear === filters.academicYear) && (!filters.semester || row.semester === filters.semester) &&
    (!filters.course || row.exam.subject === filters.course) && (!filters.grade || row.grade === filters.grade) &&
    (!filters.gpa || (row.gpa !== null && String(row.gpa) === filters.gpa)) && (!filters.studentId || row.studentId === filters.studentId));
}
export function averageGpa(rows) {
  const values = rows.map((row) => row.gpa).filter((value) => Number.isFinite(value) && value >= 0);
  return values.length ? values.reduce((sum, value) => sum + value / values.length, 0) : null;
}
export function resultsAnalytics(rows) {
  const periods = new Map(), grades = new Map();
  for (const row of rows) {
    const period = JSON.stringify([row.academicYear, row.semester]);
    if (!periods.has(period)) periods.set(period, { label: `${row.semester} · ${row.academicYear}`, date: row.exam.date, rows: [] });
    const group = periods.get(period);
    group.rows.push(row); if (row.exam.date < group.date) group.date = row.exam.date;
    if (row.grade.trim()) grades.set(row.grade, (grades.get(row.grade) ?? 0) + 1);
  }
  return {
    average: averageGpa(rows), students: new Set(rows.map((row) => row.studentId)).size,
    trend: [...periods.values()].sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label)).map((group) => ({ label: group.label, value: averageGpa(group.rows) })).filter((point) => point.value !== null),
    grades: [...grades].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value })),
  };
}
export function resultsExport(rows) {
  return { headers: ['Student Name', 'Roll Number', 'Course / Subject', 'Course Code', 'Academic Year', 'Semester', 'Score', 'Total Marks', 'Percentage', 'Grade', 'GPA', 'Remarks'],
    rows: rows.map((row) => [row.student.name, row.student.roll, row.exam.subject, row.courseCode, row.academicYear, row.semester, row.score, row.totalMarks, percentage(row)?.toFixed(2) ?? '', row.grade, row.gpa ?? '', row.remarks]) };
}
