export const qk = {
  // Teaching Performance & Sessions
  campusPerformance: (month) => ['teaching-performance', month],
  teacherTimeline: (teacherId, month) => ['teacher-timeline', teacherId, month],

  // Salary Profiles
  salaryProfiles: (params) => ['salary-profiles', params],
  salaryProfile: (id) => ['salary-profile', id],

  // Payroll & Approvals
  payroll: (params) => ['payroll', params],
  payrollSummary: (params) => ['payroll-summary', params],
  payrollApprovals: (params) => ['payroll-approvals', params],
  payrollReview: (id) => ['payroll-review', id],
  mySalary: (params) => ['my-salary', params],
  myPayslips: (params) => ['my-payslips', params],

  // Faculty & Attendance
  facultyAttendance: (params) => ['faculty-attendance', params],
  teacherAttendanceStats: (params) => ['teacher-attendance-stats', params],
  teacherProfile: (id) => ['teacher-profile', id],
  teacherTimetable: (id) => ['teacher-timetable', id],
  teacherClasses: (id) => ['teacher-classes', id],
  teacherAssignments: (params) => ['teacher-assignments', params],
  teacherGradebook: (params) => ['teacher-gradebook', params],
  teacherCredits: (params) => ['teacher-credits', params],

  // Student Queries
  studentFees: (params) => ['student-fees', params],
  studentDashboard: () => ['student-dashboard'],

  // Dashboard, Stats & System
  campusOverview: (params) => ['campus-overview', params],
  stats: () => ['stats'],
  notifications: () => ['notifications'],
};
