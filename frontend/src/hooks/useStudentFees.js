import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getStudentFeesApi, submitStudentFeePaymentApi } from "@/api/student.api";
import { qk } from "@/lib/queryKeys";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import toast from "react-hot-toast";

/**
 * React Query hook for Student Fees & Challans
 */
export function useStudentFees() {
  const queryClient = useQueryClient();
  const user = useSelector(selectCurrentUser);
  const studentId = user?.id || user?._id;

  const query = useQuery({
    queryKey: qk.studentFees(studentId),
    queryFn: async () => {
      const res = await getStudentFeesApi();
      return res.data || { student: null, vouchers: [], payments: [], summary: {} };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: Boolean(studentId && !String(studentId).startsWith("demo:")),
  });

  const submitPaymentMutation = useMutation({
    mutationFn: async ({ voucherId, data }) => {
      return await submitStudentFeePaymentApi(voucherId, data);
    },
    onSuccess: () => {
      toast.success("Payment submitted successfully! Awaiting finance verification.");
      queryClient.invalidateQueries({ queryKey: qk.studentFees(studentId) });
      queryClient.invalidateQueries({ queryKey: qk.studentPortal(studentId) });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to submit fee payment";
      toast.error(msg);
    },
  });

  return {
    ...query,
    student: query.data?.student || null,
    vouchers: query.data?.vouchers || [],
    payments: query.data?.payments || [],
    summary: query.data?.summary || {
      totalPaid: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      totalWaiver: 0,
    },
    submitPayment: submitPaymentMutation.mutateAsync,
    isSubmittingPayment: submitPaymentMutation.isPending,
  };
}

export default useStudentFees;
