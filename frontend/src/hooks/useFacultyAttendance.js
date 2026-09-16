import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as api from "../api/teacherAttendance.api.js";

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
  const [date, setDate] = useState(() => new Date());
  const [tab, setTab] = useState("daily"); // daily | weekly | history
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
  });
  const [rows, setRows] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [history, setHistory] = useState({
    items: [],
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = formatDateKey(date);

      if (tab === "daily") {
        const [statsRes, listRes] = await Promise.all([
          api.getStats(dateStr),
          api.listAttendance({
            date: dateStr,
            search: filters.search.trim() || undefined,
            department:
              filters.department !== "All Departments"
                ? filters.department
                : undefined,
            status:
              filters.status !== "All Status" ? filters.status : undefined,
          }),
        ]);

        if (statsRes.data?.success) {
          setStats(statsRes.data.data);
        }
        if (listRes.data?.success) {
          setRows(listRes.data.data || []);
        }
      } else if (tab === "weekly") {
        const weeklyRes = await api.getWeekly(dateStr);
        if (weeklyRes.data?.success) {
          setWeekly(weeklyRes.data.data);
        }
      } else if (tab === "history") {
        const historyRes = await api.getHistory({
          page: historyPage,
          limit: historyLimit,
          startDate: historyFilters.startDate || undefined,
          endDate: historyFilters.endDate || undefined,
          status:
            historyFilters.status !== "All Status"
              ? historyFilters.status
              : undefined,
          search: historyFilters.search.trim() || undefined,
        });

        if (historyRes.data?.success) {
          setHistory({
            items: historyRes.data.data || [],
            page: historyRes.data.pagination?.page || 1,
            limit: historyRes.data.pagination?.limit || historyLimit,
            total: historyRes.data.pagination?.total || 0,
            pages: historyRes.data.pagination?.pages || 1,
          });
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to load attendance data";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [
    date,
    tab,
    filters.search,
    filters.department,
    filters.status,
    historyPage,
    historyLimit,
    historyFilters.startDate,
    historyFilters.endDate,
    historyFilters.status,
    historyFilters.search,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const mark = async (payload) => {
    try {
      const res = await api.markAttendance(payload);
      toast.success(res.data?.message || "Attendance recorded successfully");
      await load();
      return res.data;
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Error saving attendance";
      toast.error(msg);
      throw err;
    }
  };

  const update = async (id, payload) => {
    try {
      const res = await api.updateAttendance(id, payload);
      toast.success(res.data?.message || "Attendance updated successfully");
      await load();
      return res.data;
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Error updating attendance";
      toast.error(msg);
      throw err;
    }
  };

  const remove = async (id) => {
    try {
      const res = await api.deleteAttendance(id);
      toast.success(res.data?.message || "Attendance record deleted");
      await load();
      return res.data;
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Error deleting attendance";
      toast.error(msg);
      throw err;
    }
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
    error,
    reload: load,
    mark,
    update,
    remove,
  };
}