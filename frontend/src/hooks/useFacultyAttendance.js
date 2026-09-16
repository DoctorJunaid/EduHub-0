import { useCallback, useEffect, useState } from "react";
import * as api from "../api/teacherAttendance.api.js";

export default function useFacultyAttendance() {
  const [date, setDate] = useState(new Date());
  const [tab, setTab] = useState("daily"); // daily | weekly | history
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0, onLeave: 0 });
  const [rows, setRows] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [history, setHistory] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: "",
    department: "All Departments",
    status: "All Status",
    section: "All Sections",
  });
  const [loading, setLoading] = useState(false);

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = fmt(date);
      if (tab === "daily") {
        const [s, l] = await Promise.all([
          api.getStats(dateStr),
          api.listAttendance({ date: dateStr, ...filters }),
        ]);
        setStats(s.data.data);
        setRows(l.data.data);
      } else if (tab === "weekly") {
        const r = await api.getWeekly(dateStr);
        setWeekly(r.data.data);
      } else {
        const r = await api.getHistory(history.page, 20);
        setHistory(r.data);
      }
    } finally {
      setLoading(false);
    }
  }, [date, tab, filters, history.page]);

  useEffect(() => { load(); }, [load]);

  const mark = async (payload) => {
    await api.markAttendance(payload);
    load();
  };

  const update = async (id, payload) => {
    await api.updateAttendance(id, payload);
    load();
  };

  const remove = async (id) => {
    await api.deleteAttendance(id);
    load();
  };

  return {
    date, setDate,
    tab, setTab,
    stats, rows, weekly, history,
    filters, setFilters,
    loading,
    reload: load,
    mark, update, remove,
  };
}