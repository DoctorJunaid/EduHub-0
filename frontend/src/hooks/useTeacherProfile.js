import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as api from "../api/teacherProfile.api";
import { qk } from "@/lib/queryKeys";

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
      const res = await api.getTeacherProfileApi(teacherId);
      return res.data;
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
      const res = await api.getTeacherClassesApi(teacherId);
      return res.data || [];
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
      const res = await api.getTeacherTimetableApi(teacherId);
      return res.data || null;
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
      const res = await api.getTeacherAttendanceApi(teacherId, 30);
      return res.data || null;
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
      const res = await api.getTeacherPayrollApi(teacherId);
      return res.data || null;
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
      const res = await api.getTeacherSubstitutesApi(teacherId);
      return res.data || null;
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
      const res = await api.getTeacherActivityApi(teacherId);
      return res.data || null;
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
