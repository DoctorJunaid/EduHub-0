/**
 * Centralized React Query Keys
 * Unified dictionary of query keys for cache isolation, parallel fetching, and clean invalidations.
 */
export const qk = {
  // Teacher Portal Specific Keys
  teacherProfile: (id) => ["teacher", id || "me", "profile"],
  teacherTimetable: (id) => ["teacher", id || "me", "timetable"],
  teacherClasses: (id) => (id ? ["teacher", id, "classes"] : ["teacher", "classes"]),
  teacherStudents: (id) => ["teacher", id || "me", "students"],
  teacherAttendance: (id, month) => ["teacher", id || "me", "attendance", month],
  teacherSubstitutes: (id) => ["teacher", id || "me", "substitutes"],
  teacherPayslips: (id) => ["teacher", id || "me", "payslips"],
  teacherNotices: (id) => ["teacher", id || "me", "notices"],
  teacherMyClass: (id) => ["teacher", id || "me", "my-class"],
  teacherClassResults: (id, examId) => ["teacher", id || "me", "results", examId || "all"],

  teacherTodayClasses: () => ["teacher", "today-classes"],
  teacherSummary: (params) => ["teacher", "summary", params],
  teacherSessions: (params) => ["teacher", "sessions", params],
  teacherCredits: (params) => ["teacher", "credits", params],
  teacherAssignments: (params) => ["teacher", "assignments", params],
  teacherAssignmentSubmissions: (id) => ["teacher", "assignment-submissions", id],
  teacherAttendanceClasses: () => ["teacher", "attendance", "classes"],
  teacherAttendanceRoster: (params) => ["teacher", "attendance", "roster", params],
  teacherDiaryClasses: () => ["teacher", "diary", "classes"],
  teacherDiaryEntries: (params) => ["teacher", "diary", "entries", params],
  teacherGradebookClasses: () => ["teacher", "gradebook", "classes"],
  teacherGradebookStudents: (params) => ["teacher", "gradebook", "students", params],
  teacherGradebookExams: (params) => ["teacher", "gradebook", "exams", params],
  teacherGradebookResults: (params) => ["teacher", "gradebook", "results", params],
  teacherGradebook: (params) => ["teacher-gradebook", params],

  // Student Queries
  studentProfile: (id) => ["student", id || "me", "profile"],
  studentPortal: (id) => ["student", id || "me", "portal"],
  studentSubjects: (id) => ["student", id || "me", "subjects"],
  studentTimetable: (id) => ["student", id || "me", "timetable"],
  studentAttendance: (id, month) => ["student", id || "me", "attendance", month],
  studentMarks: (id, term) => ["student", id || "me", "marks", term],
  studentResults: (id) => ["student", id || "me", "results"],
  studentFees: (id) => (typeof id === "object" ? ["student-fees", id] : ["student", id || "me", "fees"]),
  studentNotices: (id) => ["student", id || "me", "notices"],
  studentLibrary: (id) => ["student", id || "me", "library"],
  studentSupport: (id) => ["student", id || "me", "support"],
  studentDashboard: () => ["student-dashboard"],

  // Teaching Performance & Sessions (Campus Admin)
  campusPerformance: (month) => ["teaching-performance", month],
  teacherTimeline: (teacherId, month) => ["teacher-timeline", teacherId, month],

  // Salary Profiles & Payroll
  salaryProfiles: (params) => ["salary-profiles", params],
  salaryProfile: (id) => ["salary-profile", id],
  payroll: (params) => ["payroll", params],
  payrollSummary: (params) => ["payroll-summary", params],
  payrollApprovals: (params) => ["payroll-approvals", params],
  payrollReview: (id) => ["payroll-review", id],
  mySalary: (params) => ["my-salary", params],
  myPayslips: (params) => ["my-payslips", params],

  // Faculty & Attendance
  facultyAttendance: (params) => ["faculty-attendance", params],
  teacherAttendanceStats: (params) => ["teacher-attendance-stats", params],

  // Shared & System
  campusOverview: (params) => ["campus-overview", params],
  stats: (role) => (role ? ["stats", role] : ["stats"]),
  supportBadge: () => ["support", "badge"],
  notifications: () => ["notifications"],
};

export default qk;
