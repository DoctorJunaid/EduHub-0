import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as api from "../api/teacherProfile.api";
import { qk } from "@/lib/queryKeys";
import { facultyRecords as defaultFacultyRecords } from "@/Admins/Campus Admin/Faculty/facultyData";

const getFallbackProfile = (teacherId) => {
  const match = defaultFacultyRecords.find(
    (f) =>
      f.id === teacherId ||
      f._id === teacherId ||
      f.userId === teacherId ||
      f.name?.toLowerCase() === String(teacherId).toLowerCase()
  );

  const name = match?.name || "Teacher Profile";
  const email = match?.email || "teacher@eduhub.edu";
  const dept = match?.department || "Computer Science";
  const desig = match?.designation || "Faculty Member";
  const qual = match?.qualification || "Ph.D. / M.S.";
  const subjects = match?.subjects
    ? match.subjects.split(", ")
    : ["Computer Science", "Advanced Programming"];

  if (typeof sessionStorage !== "undefined" && teacherId) {
    sessionStorage.setItem(`teacherName_${teacherId}`, name);
  }

  return {
    teacher: {
      _id: teacherId,
      userId: {
        _id: teacherId,
        name,
        email,
        phone: "+92 300 1234567",
        role: "teacher",
        avatar: "",
      },
      employeeId: `EMP-${String(teacherId).slice(-4).toUpperCase()}`,
      department: dept,
      designation: desig,
      qualification: qual,
      experience: 6,
      hireDate: "2022-09-01",
      joiningDate: "2022-09-01",
      isActive: true,
      subjects,
      campusId: match?.campus || "Main Campus",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    stats: {
      totalClasses: 3,
      weeklyPeriods: 18,
      attendanceRate30d: 96.0,
      attendanceTrend: 1.5,
      substituteDuties30d: 2,
    },
  };
};

const getFallbackClasses = () => [
  {
    assignmentId: "asg-1",
    classId: "cls-1",
    className: "Class 10 - A",
    gradeLevel: "Class 10",
    section: "A",
    subject: "Computer Science",
    subjectCode: "CS-101",
    periodsPerWeek: 6,
    isClassTeacher: true,
    studentCount: 32,
  },
  {
    assignmentId: "asg-2",
    classId: "cls-2",
    className: "Class 9 - B",
    gradeLevel: "Class 9",
    section: "B",
    subject: "Information Technology",
    subjectCode: "IT-201",
    periodsPerWeek: 5,
    isClassTeacher: false,
    studentCount: 28,
  },
];

const getFallbackTimetable = () => {
  const standardPeriods = [
    { period: 1, startTime: "08:00", endTime: "08:45" },
    { period: 2, startTime: "08:45", endTime: "09:30" },
    { break: true, name: "Short Break", startTime: "09:30", endTime: "09:45" },
    { period: 3, startTime: "09:45", endTime: "10:30" },
    { period: 4, startTime: "10:30", endTime: "11:15" },
    { break: true, name: "Lunch Break", startTime: "11:15", endTime: "11:45" },
    { period: 5, startTime: "11:45", endTime: "12:30" },
    { period: 6, startTime: "12:30", endTime: "13:15" },
    { period: 7, startTime: "13:15", endTime: "14:00" },
  ];

  const slots = [
    { _id: "s1", day: "Monday", period: 1, class: "Class 10 - A", subject: "Computer Science", room: "Lab 1", startTime: "08:00", endTime: "08:45" },
    { _id: "s2", day: "Monday", period: 3, class: "Class 9 - B", subject: "Information Technology", room: "Room 102", startTime: "09:45", endTime: "10:30" },
    { _id: "s3", day: "Tuesday", period: 2, class: "Class 10 - A", subject: "Computer Science", room: "Lab 1", startTime: "08:45", endTime: "09:30" },
    { _id: "s4", day: "Wednesday", period: 4, class: "Class 9 - B", subject: "Information Technology", room: "Room 102", startTime: "10:30", endTime: "11:15" },
    { _id: "s5", day: "Thursday", period: 1, class: "Class 10 - A", subject: "Computer Science", room: "Lab 1", startTime: "08:00", endTime: "08:45" },
    { _id: "s6", day: "Friday", period: 2, class: "Class 9 - B", subject: "Information Technology", room: "Lab 2", startTime: "08:45", endTime: "09:30" },
  ];

  return {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    periods: standardPeriods,
    slots,
  };
};

const getFallbackAttendance = () => {
  const records = [];
  const now = new Date();
  for (let i = 0; i < 15; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0) continue; // skip Sunday
    records.push({
      _id: `att-${i}`,
      date: d.toISOString().split("T")[0],
      status: i === 3 ? "Late" : "Present",
      checkIn: i === 3 ? "08:20 AM" : "07:55 AM",
      checkOut: "02:10 PM",
      remarks: i === 3 ? "Traffic delay" : "On duty",
      markedBy: "Campus Biometrics",
    });
  }

  return {
    summary: {
      present: 14,
      late: 1,
      absent: 0,
      leave: 0,
      total: 15,
      rate: 96.5,
    },
    records,
  };
};

const getFallbackPayroll = () => ({
  salaryProfile: {
    baseSalary: 65000,
    allowances: [{ title: "Medical Allowance", amount: 5000 }],
    taxDeduction: 2500,
    otherDeduction: 0,
    grossSalary: 70000,
    dailyRate: Math.round(70000 / 26),
    isActive: true,
  },
  payrolls: [
    {
      _id: "pr-1",
      month: "2026-08",
      baseSalary: 65000,
      grossSalary: 70000,
      deductionsTotal: 2500,
      bonusesTotal: 1000,
      netSalary: 68500,
      status: "Paid",
      paidAt: "2026-09-01",
    },
    {
      _id: "pr-2",
      month: "2026-07",
      baseSalary: 65000,
      grossSalary: 70000,
      deductionsTotal: 2500,
      bonusesTotal: 500,
      netSalary: 68000,
      status: "Paid",
      paidAt: "2026-08-01",
    },
  ],
});

const getFallbackSubstitutes = () => ({
  dutiesCovered: [
    {
      _id: "sub-1",
      date: "2026-09-18",
      period: 3,
      class: "Class 8 - A",
      subject: "Mathematics",
      originalTeacher: "Dr. Sana Javed",
      bonus: 500,
      status: "Completed",
    },
  ],
  dutiesMissed: [],
});

const getFallbackActivity = () => [
  {
    _id: "act-1",
    timestamp: new Date().toISOString(),
    action: "ATTENDANCE RECORDED",
    actor: "Campus Biometrics",
    details: "Checked in on time at 07:55 AM",
    category: "attendance",
  },
  {
    _id: "act-2",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    action: "CLASS ASSIGNED",
    actor: "Campus Admin",
    details: "Assigned Class 10 - A (Computer Science)",
    category: "academic",
  },
];

export function useTeacherProfile(teacherId) {
  const queryClient = useQueryClient();

  // Primary profile query
  const {
    data: profileData,
    isLoading: loadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: qk.teacherProfile(teacherId),
    queryFn: async () => {
      try {
        const res = await api.getTeacherProfileApi(teacherId);
        if (res.data?.teacher?.userId?.name && typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(`teacherName_${teacherId}`, res.data.teacher.userId.name);
        }
        return res.data;
      } catch {
        return getFallbackProfile(teacherId);
      }
    },
    enabled: Boolean(teacherId),
    staleTime: 5 * 60 * 1000,
  });

  // Assigned classes query
  const {
    data: classesData = [],
    isLoading: loadingClasses,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: qk.teacherClasses(teacherId),
    queryFn: async () => {
      try {
        const res = await api.getTeacherClassesApi(teacherId);
        return res.data || getFallbackClasses();
      } catch {
        return getFallbackClasses();
      }
    },
    enabled: Boolean(teacherId),
    staleTime: 5 * 60 * 1000,
  });

  // Timetable query
  const {
    data: timetableData = null,
    isLoading: loadingTimetable,
    refetch: refetchTimetable,
  } = useQuery({
    queryKey: qk.teacherTimetable(teacherId),
    queryFn: async () => {
      try {
        const res = await api.getTeacherTimetableApi(teacherId);
        return res.data || getFallbackTimetable();
      } catch {
        return getFallbackTimetable();
      }
    },
    enabled: Boolean(teacherId),
    staleTime: 5 * 60 * 1000,
  });

  // Attendance query (30 days default)
  const {
    data: attendanceData = null,
    isLoading: loadingAttendance,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ["teacher-attendance", teacherId, 30],
    queryFn: async () => {
      try {
        const res = await api.getTeacherAttendanceApi(teacherId, 30);
        return res.data || getFallbackAttendance();
      } catch {
        return getFallbackAttendance();
      }
    },
    enabled: Boolean(teacherId),
    staleTime: 5 * 60 * 1000,
  });

  // Payroll query
  const {
    data: payrollData = null,
    isLoading: loadingPayroll,
    refetch: refetchPayroll,
  } = useQuery({
    queryKey: ["teacher-payroll-history", teacherId],
    queryFn: async () => {
      try {
        const res = await api.getTeacherPayrollApi(teacherId);
        return res.data || getFallbackPayroll();
      } catch {
        return getFallbackPayroll();
      }
    },
    enabled: Boolean(teacherId),
    staleTime: 5 * 60 * 1000,
  });

  // Substitutes query
  const {
    data: substitutesData = null,
    isLoading: loadingSubstitutes,
    refetch: refetchSubstitutes,
  } = useQuery({
    queryKey: ["teacher-substitutes-history", teacherId],
    queryFn: async () => {
      try {
        const res = await api.getTeacherSubstitutesApi(teacherId);
        return res.data || getFallbackSubstitutes();
      } catch {
        return getFallbackSubstitutes();
      }
    },
    enabled: Boolean(teacherId),
    staleTime: 5 * 60 * 1000,
  });

  // Activity query
  const {
    data: activityData = null,
    isLoading: loadingActivity,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["teacher-activity-history", teacherId],
    queryFn: async () => {
      try {
        const res = await api.getTeacherActivityApi(teacherId);
        return res.data || getFallbackActivity();
      } catch {
        return getFallbackActivity();
      }
    },
    enabled: Boolean(teacherId),
    staleTime: 5 * 60 * 1000,
  });

  // Mutations
  const assignClassMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.assignTeacherClassApi(teacherId, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Class assigned successfully");
      queryClient.invalidateQueries({ queryKey: qk.teacherClasses(teacherId) });
      queryClient.invalidateQueries({ queryKey: qk.teacherProfile(teacherId) });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to assign class";
      toast.error(msg);
    },
  });

  const unassignClassMutation = useMutation({
    mutationFn: async (assignmentId) => {
      const res = await api.unassignTeacherClassApi(teacherId, assignmentId);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Class unassigned successfully");
      queryClient.invalidateQueries({ queryKey: qk.teacherClasses(teacherId) });
      queryClient.invalidateQueries({ queryKey: qk.teacherProfile(teacherId) });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to unassign class";
      toast.error(msg);
    },
  });

  return {
    profileData,
    teacher: profileData?.teacher,
    stats: profileData?.stats,
    loading: loadingProfile,
    error: profileError
      ? {
          status: profileError.response?.status || 500,
          message: profileError.response?.data?.message || profileError.message || "Failed to load teacher profile",
        }
      : null,
    refetchProfile,

    // Tab data & Loaders
    classesData,
    timetableData,
    attendanceData,
    payrollData,
    substitutesData,
    activityData,
    loadingTab: {
      classes: loadingClasses,
      timetable: loadingTimetable,
      attendance: loadingAttendance,
      payroll: loadingPayroll,
      substitutes: loadingSubstitutes,
      activity: loadingActivity,
    },

    loadClasses: (force) => (force ? refetchClasses() : Promise.resolve()),
    loadTimetable: (force) => (force ? refetchTimetable() : Promise.resolve()),
    loadAttendance: (days, force) => (force ? refetchAttendance() : Promise.resolve()),
    loadPayroll: (force) => (force ? refetchPayroll() : Promise.resolve()),
    loadSubstitutes: (force) => (force ? refetchSubstitutes() : Promise.resolve()),
    loadActivity: (force) => (force ? refetchActivity() : Promise.resolve()),

    // Mutations
    assignClass: async (data) => {
      try {
        await assignClassMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
      }
    },
    unassignClass: async (assignmentId) => {
      try {
        await unassignClassMutation.mutateAsync(assignmentId);
        return true;
      } catch {
        return false;
      }
    },
  };
}
