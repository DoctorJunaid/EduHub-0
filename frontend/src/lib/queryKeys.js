export const qk = {
  // Teacher Portal Specific Keys
  teacherTodayClasses: () => ["teacher", "today-classes"],
  teacherSummary: (params) => ["teacher", "summary", params],
  teacherSessions: (params) => ["teacher", "sessions", params],
  teacherCredits: (params) => ["teacher", "credits", params],
  teacherClasses: () => ["teacher", "classes"],
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

  // Teaching Performance & Sessions (Campus Admin)
  campusPerformance: (month) => ["teaching-performance", month],
  teacherTimeline: (teacherId, month) => ["teacher-timeline", teacherId, month],

  // Salary Profiles
  salaryProfiles: (params) => ["salary-profiles", params],
  salaryProfile: (id) => ["salary-profile", id],

  // Payroll & Approvals
  payroll: (params) => ["payroll", params],
  payrollSummary: (params) => ["payroll-summary", params],
  payrollApprovals: (params) => ["payroll-approvals", params],
  payrollReview: (id) => ["payroll-review", id],
  mySalary: (params) => ["my-salary", params],
  myPayslips: (params) => ["my-payslips", params],

  // Faculty & Attendance
  facultyAttendance: (params) => ["faculty-attendance", params],
  teacherAttendanceStats: (params) => ["teacher-attendance-stats", params],
  teacherProfile: (id) => ["teacher-profile", id],
  teacherTimetable: (id) => ["teacher-timetable", id],
  teacherGradebook: (params) => ["teacher-gradebook", params],

  // Student Queries
  studentFees: (params) => ["student-fees", params],
  studentDashboard: () => ["student-dashboard"],

  // Dashboard, Stats & System
  campusOverview: (params) => ["campus-overview", params],
  stats: () => ["stats"],
  supportBadge: () => ["support", "badge"],
  notifications: () => ["notifications"],
};
