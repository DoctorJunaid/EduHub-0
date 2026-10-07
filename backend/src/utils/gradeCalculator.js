/**
 * Grade and GPA Calculator utility for EduHub.
 */

export function calculateGrade(percentage) {
  const p = Math.round(Number(percentage) * 10) / 10;
  if (p >= 90) return { grade: "A+", gpa: 4.0, remark: "Outstanding" };
  if (p >= 80) return { grade: "A", gpa: 3.7, remark: "Excellent" };
  if (p >= 70) return { grade: "B+", gpa: 3.3, remark: "Very Good" };
  if (p >= 60) return { grade: "B", gpa: 3.0, remark: "Good" };
  if (p >= 50) return { grade: "C", gpa: 2.0, remark: "Satisfactory" };
  if (p >= 40) return { grade: "D", gpa: 1.0, remark: "Pass" };
  return { grade: "F", gpa: 0.0, remark: "Needs Improvement / Fail" };
}

export function calculateRanks(studentSummaries) {
  // Sort by percentage descending, then totalMarks / obtainedMarks
  const sorted = [...studentSummaries].sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    return (b.obtainedMarks || 0) - (a.obtainedMarks || 0);
  });

  return sorted.map((student, index) => ({
    ...student,
    classRank: index + 1,
    totalStudentsInClass: studentSummaries.length,
  }));
}

export default {
  calculateGrade,
  calculateRanks,
};
