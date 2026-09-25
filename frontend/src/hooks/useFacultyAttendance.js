import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as api from "../api/teacherAttendance.api.js";
import { qk } from "@/lib/queryKeys";

// Helper to format Date to YYYY-MM-DD in local time
export const formatDateKey = (d) => {
  if (!d) return "";
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return "";
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function useFacultyAttendance() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => new Date());
  const [tab, setTab] = useState("daily"); // daily | weekly | history
  const [filters, setFilters] = useState({
    search: "",
    department: "All Departments",
    status: "All Status",
    section: "All Sections",
  });
  const [historyFilters, setHistoryFilters] = useState({
    startDate: "",
    endDate: "",
    status: "All Status",
    search: "",
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(20);

  const dateStr = formatDateKey(date);

  // Stats query
  const { data: statsData } = useQuery({
    queryKey: qk.teacherAttendanceStats({ date: dateStr }),
    queryFn: async () => {
      const res = await api.getStats(dateStr);
      return res.data?.data || { total: 0, present: 0, late: 0, absent: 0, onLeave: 0 };
    },
    enabled: tab === "daily",
    staleTime: 5 * 60 * 1000,
  });

  // Daily list query
  const {
    data: dailyRowsData,
    isLoading: loadingDaily,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: qk.facultyAttendance({
      date: dateStr,
      search: filters.search.trim() || undefined,
      department: filters.department !== "All Departments" ? filters.department : undefined,
      status: filters.status !== "All Status" ? filters.status : undefined,
    }),
    queryFn: async () => {
      const res = await api.listAttendance({
        date: dateStr,
        search: filters.search.trim() || undefined,
        department: filters.department !== "All Departments" ? filters.department : undefined,
        status: filters.status !== "All Status" ? filters.status : undefined,
      });
      return res.data?.data || [];
    },
    enabled: tab === "daily",
    staleTime: 5 * 60 * 1000,
  });

  // Weekly query
  const {
    data: weeklyData,
    isLoading: loadingWeekly,
    refetch: refetchWeekly,
  } = useQuery({
    queryKey: ["faculty-attendance-weekly", dateStr],
    queryFn: async () => {
      const res = await api.getWeekly(dateStr);
      return res.data?.data || null;
    },
    enabled: tab === "weekly",
    staleTime: 5 * 60 * 1000,
  });

  // History query
  const {
    data: historyDataResult,
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: [
      "faculty-attendance-history",
      {
        page: historyPage,
        limit: historyLimit,
        startDate: historyFilters.startDate,
        endDate: historyFilters.endDate,
        status: historyFilters.status,
        search: historyFilters.search,
      },
    ],
    queryFn: async () => {
      const res = await api.getHistory({
        page: historyPage,
        limit: historyLimit,
        startDate: historyFilters.startDate || undefined,
        endDate: historyFilters.endDate || undefined,
        status: historyFilters.status !== "All Status" ? historyFilters.status : undefined,
        search: historyFilters.search.trim() || undefined,
      });
      return res.data;
    },
    enabled: tab === "history",
    staleTime: 5 * 60 * 1000,
  });

  const stats = statsData || { total: 0, present: 0, late: 0, absent: 0, onLeave: 0 };
  const rows = dailyRowsData || [];
  const weekly = weeklyData || null;
  const history = {
    items: historyDataResult?.data || [],
    page: historyDataResult?.pagination?.page || 1,
    limit: historyDataResult?.pagination?.limit || historyLimit,
    total: historyDataResult?.pagination?.total || 0,
    pages: historyDataResult?.pagination?.pages || 1,
  };

  const loading = (tab === "daily" && loadingDaily) || (tab === "weekly" && loadingWeekly) || (tab === "history" && loadingHistory);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["faculty-attendance"] });
    queryClient.invalidateQueries({ queryKey: ["teacher-attendance-stats"] });
    queryClient.invalidateQueries({ queryKey: ["faculty-attendance-weekly"] });
    queryClient.invalidateQueries({ queryKey: ["faculty-attendance-history"] });
  };

  const markMutation = useMutation({
    mutationFn: (payload) => api.markAttendance(payload),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Attendance recorded successfully");
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Error saving attendance");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.updateAttendance(id, payload),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Attendance updated successfully");
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Error updating attendance");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => api.deleteAttendance(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Attendance record deleted");
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Error deleting attendance");
    },
  });

  const reload = async () => {
    if (tab === "daily") await refetchDaily();
    else if (tab === "weekly") await refetchWeekly();
    else if (tab === "history") await refetchHistory();
  };

  return {
    date,
    setDate,
    tab,
    setTab,
    stats,
    rows,
    weekly,
    history,
    filters,
    setFilters,
    historyFilters,
    setHistoryFilters,
    historyPage,
    setHistoryPage,
    historyLimit,
    setHistoryLimit,
    loading,
    error: null,
    reload,
    mark: (payload) => markMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    remove: (id) => removeMutation.mutateAsync(id),
  };
}