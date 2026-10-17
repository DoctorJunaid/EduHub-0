import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import * as classTeacherApi from "@/api/classTeacher.api";
import { qk } from "@/lib/queryKeys";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import toast from "react-hot-toast";

/**
 * React Query hook for Teacher Class Workspace
 */
export function useMyClass(options = {}) {
  const queryClient = useQueryClient();
  const user = useSelector(selectCurrentUser);
  const teacherId = user?.id || user?._id;

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.teacherMyClass(teacherId),
    queryFn: async () => {
      const assignmentRes = await classTeacherApi.getMyClassAssignment();
      if (!assignmentRes?.data?.isClassTeacher) {
        return {
          isClassTeacher: false,
          classInfo: null,
          students: [],
          attendance: null,
          stats: null,
        };
      }

      const classInfo = assignmentRes.data.classInfo;

      const [studentsRes, attendanceRes, statsRes] = await Promise.allSettled([
        classTeacherApi.getMyClassStudents(),
        classTeacherApi.getMyClassAttendance(),
        classTeacherApi.getMyClassStats(),
      ]);

      return {
        isClassTeacher: true,
        classInfo,
        students:
          studentsRes.status === "fulfilled"
            ? (studentsRes.value?.data?.students || (Array.isArray(studentsRes.value?.data) ? studentsRes.value?.data : []) || studentsRes.value?.students || [])
            : [],
        attendance:
          attendanceRes.status === "fulfilled" ? (attendanceRes.value?.data ?? attendanceRes.value) : null,
        stats:
          statsRes.status === "fulfilled" ? (statsRes.value?.data ?? statsRes.value) : null,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...options,
    enabled: Boolean(teacherId) && (options.enabled !== undefined ? options.enabled : true),
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async ({ records, date }) => {
      const classId = data?.classInfo?.classId || data?.classInfo?._id;
      return await classTeacherApi.markClassAttendance({
        date,
        records,
        classId,
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message || "Attendance saved successfully!");
      queryClient.invalidateQueries({ queryKey: qk.teacherMyClass(teacherId) });
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message || err.message || "Failed to save attendance";
      toast.error(msg);
    },
  });

  const saveAttendance = async (records, date = null) => {
    return await saveAttendanceMutation.mutateAsync({ records, date });
  };

  return {
    loading,
    isClassTeacher: data?.isClassTeacher || false,
    classInfo: data?.classInfo || null,
    students: data?.students || [],
    attendance: data?.attendance || null,
    stats: data?.stats || null,
    error: error?.message || null,
    refresh: refetch,
    saveAttendance,
    isSavingAttendance: saveAttendanceMutation.isPending,
  };
}

export default useMyClass;
