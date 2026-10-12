import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as resultApi from "@/api/result.api";
import { qk } from "@/lib/queryKeys";
import toast from "react-hot-toast";

/**
 * React Query hook for Class Results Compilation Grid
 */
export function useClassResults(
  classId = null,
  examName = "Midterm Examination",
  term = "Midterm"
) {
  const queryClient = useQueryClient();
  const queryKey = qk.teacherClassResults(classId || "active", `${examName}-${term}`);

  const {
    data: gridData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await resultApi.getClassResultsGrid({
        classId,
        examName,
        term,
      });
      return res.data || null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: Boolean(classId),
  });

  const compileMutation = useMutation({
    mutationFn: async () => {
      const targetClassId = classId || gridData?.classInfo?.classId;
      return await resultApi.compileClassResults({
        classId: targetClassId,
        examName,
        term,
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message || "Class results compiled successfully!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message || err.message || "Failed to compile results";
      toast.error(msg);
    },
  });

  const remarksMutation = useMutation({
    mutationFn: async ({ studentId, remarks }) => {
      const targetClassId = classId || gridData?.classInfo?.classId;
      return await resultApi.saveStudentRemarks(studentId, {
        classId: targetClassId,
        examName,
        term,
        remarks,
      });
    },
    onSuccess: () => {
      toast.success("Remarks saved!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message || err.message || "Failed to save remarks";
      toast.error(msg);
    },
  });

  const submitApprovalMutation = useMutation({
    mutationFn: async () => {
      const targetClassId = classId || gridData?.classInfo?.classId;
      return await resultApi.submitClassResultsForApproval({
        classId: targetClassId,
        examName,
        term,
      });
    },
    onSuccess: (res) => {
      toast.success(
        res?.message || "Results submitted to Campus Admin for approval!"
      );
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message || err.message || "Failed to submit results";
      toast.error(msg);
    },
  });

  const remindTeacherMutation = useMutation({
    mutationFn: async ({ teacherId, subject }) => {
      const targetClassId = classId || gridData?.classInfo?.classId;
      return await resultApi.remindSubjectTeacher(teacherId, {
        classId: targetClassId,
        subject,
        examName,
      });
    },
    onSuccess: (res, vars) => {
      toast.success(res?.message || `Reminder sent for ${vars.subject}!`);
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message || err.message || "Failed to send reminder";
      toast.error(msg);
    },
  });

  return {
    loading,
    gridData,
    isCompiling: compileMutation.isPending,
    isSubmitting: submitApprovalMutation.isPending,
    error: error?.message || null,
    refresh: refetch,
    compileResults: compileMutation.mutateAsync,
    saveRemarks: (studentId, remarks) =>
      remarksMutation.mutateAsync({ studentId, remarks }),
    submitForApproval: submitApprovalMutation.mutateAsync,
    remindTeacher: (teacherId, subject) =>
      remindTeacherMutation.mutateAsync({ teacherId, subject }),
  };
}

export default useClassResults;
