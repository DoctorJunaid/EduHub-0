import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  History,
  Plus,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AttendanceDateNavigator from "@/components/common/AttendanceDateNavigator";
import { fetchFaculty, selectFaculty } from "@/store/Slices/facultySlice.js";
import {
  selectAttendance,
  selectAttendanceSummary,
  attendanceSaved,
} from "@/store/Slices/attendanceSlice.js";
import { dateKey, parseDate, longDate } from "@/lib/dates";
import { mondayOf, shiftDays } from "@/lib/schedule";
import { downloadCsv } from "@/lib/csv";
import * as attendanceApi from "@/api/teacherAttendance.api.js";
import { fetchActivityLogs } from "@/store/Slices/activityLogSlice.js";
import {
  attendanceRows,
  attendanceStatuses,
  filterPeople,
  weeklySummary,
  attendanceExport,
} from "./attendanceData.js";
import AttendanceTable from "./AttendanceTable";
import AttendanceForm from "./AttendanceForm";
import AttendanceDetails from "./AttendanceDetails";
import "../Timetable/ClassTimetable.css";
import "./FacultyAttendance.css";

const initialFilters = {
  search: "",
  department: "",
  status: "",
  facultyId: "",
  from: "",
  to: "",
};

const getPakistanDate = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce((res, p) => ({ ...res, [p.type]: p.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const pakistanDateTime = (value) => {
  if (!value) return null;
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(timestamp)
    .reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
};

const pakistanTime = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)) {
    return value.slice(0, 5);
  }
  const parts = pakistanDateTime(value);
  return parts ? `${parts.hour}:${parts.minute}` : "";
};

export default function FacultyAttendance() {
  const dispatch = useDispatch();
  const rawFaculty = useSelector(selectFaculty);
  const faculty = useMemo(() => {
    return (rawFaculty || []).map((person) => ({
      ...person,
      id: String(person.id || person._id || ""),
      name: person.name || `${person.firstName || ""} ${person.lastName || ""}`.trim() || person.email || "Faculty Member",
    }));
  }, [rawFaculty]);

  const reduxRecords = useSelector(selectAttendance);
  const [date, setDate] = useState(() => getPakistanDate());

  // Attendance actions must reflect actual records. Fabricated fallback records
  // made every row look checked in/out and therefore disabled both buttons.
  const records = reduxRecords || [];

  useEffect(() => {
    // Refresh the persisted directory so action IDs always belong to this campus.
    dispatch(fetchFaculty());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    const fetchAttendance = () => {
      attendanceApi
        .listAttendance({ date })
        .then((response) => {
          if (cancelled) return;
          for (const row of response.data?.data || []) {
            if (!row.attendanceId || !row.status) continue;
            dispatch(
              attendanceSaved({
                id: String(row.attendanceId),
                facultyId: String(row.teacherProfileId),
                date,
                checkInTime: pakistanTime(row.checkInTime),
                checkOutTime: pakistanTime(row.checkOutTime),
                status: row.status,
              }),
            );
          }
        })
        .catch(() => {
          // Keep the page usable when a temporary list refresh fails.
        });
    };

    fetchAttendance();
    const interval = setInterval(fetchAttendance, 10000);
    const onFocus = () => fetchAttendance();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [date, dispatch]);

  const summary = useSelector((state) => selectAttendanceSummary(state, date));
  const [view, setView] = useState("daily");
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  const departments = useMemo(() => {
    return [...new Set(faculty.map((person) => person.department).filter(Boolean))].sort();
  }, [faculty]);

  const rows = useMemo(() => {
    const matching = attendanceRows(records, faculty, date, view, filters);
    return view === "weekly"
      ? weeklySummary(matching, filterPeople(faculty, filters), filters.status)
      : matching;
  }, [records, faculty, date, view, filters]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const selected = records.find((record) => record.id === modal?.recordId);
  const person = faculty.find(
    (member) => member.id === (selected?.facultyId ?? modal?.facultyId),
  );

  const changeDate = (value) => {
    setDate(value);
    setPage(1);
    setNotice("");
  };

  const changeFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
    setNotice("");
  };

  const close = () => setModal(null);
  const onAction = (mode, facultyId, recordId) =>
    setModal({ mode, facultyId, recordId });

  const quickAttendanceAction = async (action, facultyId) => {
    if (pendingAction) return;
    setPendingAction(`${action}:${facultyId}`);
    try {
      const response = await attendanceApi[action](facultyId, date);
      const saved = response.data?.data;
      if (!saved) throw new Error("Attendance response was empty.");
      const timestampParts = pakistanDateTime(
        saved.checkInTime || saved.checkOutTime,
      );
      const savedDate = timestampParts
        ? `${timestampParts.year}-${timestampParts.month}-${timestampParts.day}`
        : date;
      dispatch(
        attendanceSaved({
          id: String(saved._id),
          facultyId: String(saved.teacherProfileId?._id || saved.teacherProfileId || facultyId),
          date: savedDate,
          checkInTime: pakistanTime(saved.checkInTime),
          checkOutTime: pakistanTime(saved.checkOutTime),
          status: saved.status,
        }),
      );
      setDate(savedDate);
      setView("daily");
      toast.success(
        `${action === "checkIn" ? "Check-in" : "Check-out"} recorded successfully!`,
      );
      dispatch(fetchActivityLogs({ page: 1, limit: 8, append: false }));

      // Re-fetch attendance list to maintain 100% backend synchronization
      try {
        const refreshRes = await attendanceApi.listAttendance({ date: savedDate });
        for (const row of refreshRes.data?.data || []) {
          if (!row.attendanceId || !row.status) continue;
          dispatch(
            attendanceSaved({
              id: String(row.attendanceId),
              facultyId: String(row.teacherProfileId),
              date: savedDate,
              checkInTime: pakistanTime(row.checkInTime),
              checkOutTime: pakistanTime(row.checkOutTime),
              status: row.status,
            }),
          );
        }
      } catch {
        // Background sync non-fatal
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Could not update attendance.",
      );
      // Immediately refresh list on error/conflict so UI catches up with other PCs
      try {
        const refreshRes = await attendanceApi.listAttendance({ date });
        for (const row of refreshRes.data?.data || []) {
          if (!row.attendanceId || !row.status) continue;
          dispatch(
            attendanceSaved({
              id: String(row.attendanceId),
              facultyId: String(row.teacherProfileId),
              date,
              checkInTime: pakistanTime(row.checkInTime),
              checkOutTime: pakistanTime(row.checkOutTime),
              status: row.status,
            }),
          );
        }
      } catch {
        // Sync non-fatal
      }
    } finally {
      setPendingAction(null);
    }
  };

  const week = mondayOf(parseDate(date));

  const save = async (values) => {
    try {
      const payload = {
        teacherProfileId: values.facultyId,
        date: values.date,
        status: values.status,
        checkInTime: values.checkInTime ? new Date(`${values.date}T${values.checkInTime}:00+05:00`).toISOString() : "",
        checkOutTime: values.checkOutTime ? new Date(`${values.date}T${values.checkOutTime}:00+05:00`).toISOString() : "",
        remarks: values.remarks || "",
      };
      if (values.id) {
        await attendanceApi.updateAttendance(values.id, payload);
      } else {
        await attendanceApi.markAttendance(payload);
      }
      dispatch(attendanceSaved(values));
      setDate(values.date);
      setView("daily");
      setFilters(initialFilters);
      setPage(
        Math.floor(
          Math.max(
            0,
            faculty.findIndex((member) => member.id === values.facultyId),
          ) / pageSize,
        ) + 1,
      );
      toast.success("Attendance saved successfully!");
      dispatch(fetchActivityLogs({ page: 1, limit: 8, append: false }));

      try {
        const refreshRes = await attendanceApi.listAttendance({ date: values.date });
        for (const row of refreshRes.data?.data || []) {
          if (!row.attendanceId || !row.status) continue;
          dispatch(
            attendanceSaved({
              id: String(row.attendanceId),
              facultyId: String(row.teacherProfileId),
              date: values.date,
              checkInTime: pakistanTime(row.checkInTime),
              checkOutTime: pakistanTime(row.checkOutTime),
              status: row.status,
            }),
          );
        }
      } catch {
        // Sync non-fatal
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save attendance");
    }
    close();
  };

  const exportReport = () => {
    const data = attendanceExport(rows, view === "weekly", [
      dateKey(week),
      dateKey(shiftDays(week, 6)),
    ]);
    downloadCsv(
      `faculty-attendance-${view}-${date}.csv`,
      data.headers,
      data.rows,
    );
    setNotice(
      `Exported ${rows.length} ${view === "weekly" ? "weekly summaries" : "rows"}.`,
    );
  };

  // Metric counts (derived accurately from active database records)
  const totalCount = faculty.length;
  const presentCount = records.filter(r => r.date === date && (r.status === 'Present' || r.status === 'Late')).length;
  const lateCount = records.filter(r => r.date === date && r.status === 'Late').length;
  const absentCount = records.filter(r => r.date === date && r.status === 'Absent').length;

  return (
    <section
      className="campus-tab-page faculty-attendance"
      aria-label="Faculty Attendance Management"
    >
      {/* 1. Top Thin KPI Cards (Flush Border-to-Border, 56px) */}
      <div className="campus-kpi-track">
        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Users size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Total Faculty &amp; Staff</span>
              <span className="kpi-value">{totalCount}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <CircleCheck size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{date === dateKey(new Date()) ? "Present Today" : "Present Selected"}</span>
              <span className="kpi-value">{presentCount}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Clock size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Late Check-ins</span>
              <span className="kpi-value">{lateCount}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <CircleX size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Absent Records</span>
              <span className="kpi-value">{absentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contiguous Toolbar (No Overlap, Strict 34px Buttons) */}
      <Tabs
        value={view}
        onValueChange={(next) => {
          setView(next);
          if (next !== "history")
            setFilters((previous) => ({
              ...previous,
              facultyId: "",
              from: "",
              to: "",
            }));
          setPage(1);
          setNotice("");
        }}
        style={{ width: "100%", display: "flex", flexDirection: "column" }}
      >
        <div className="campus-toolbar">
          <div className="toolbar-left">
            <div className="toolbar-search" style={{ width: "130px", maxWidth: "145px" }}>
              <Search size={13} />
              <input
                type="search"
                placeholder="Search teacher..."
                value={filters.search}
                onChange={(e) => changeFilter("search", e.target.value)}
                aria-label="Search teacher, email, department"
              />
            </div>

            <TabsList style={{ height: "32px", padding: "2px", background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "6px", flexShrink: 0, display: "inline-flex", alignItems: "center" }}>
              {[
                ["daily", CalendarDays, "Daily"],
                ["weekly", CalendarDays, "Weekly"],
                ["history", History, "History"],
              ].map(([val, Icon, lbl]) => (
                <TabsTrigger key={val} value={val} style={{ height: "26px", fontSize: "11px", fontWeight: "600", padding: "0 8px", borderRadius: "4px" }}>
                  <Icon size={12} style={{ marginRight: "3px" }} />
                  {lbl}
                </TabsTrigger>
              ))}
            </TabsList>

            <AttendanceDateNavigator
              date={date}
              onChange={changeDate}
              markedDates={records.map((record) => record.date)}
            />

            <select
              className="toolbar-select"
              aria-label="Filter by department"
              style={{ maxWidth: "110px" }}
              value={filters.department}
              onChange={(e) => changeFilter("department", e.target.value)}
            >
              <option value="">All Depts</option>
              {departments.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>

            <select
              className="toolbar-select"
              aria-label="Filter by status"
              style={{ maxWidth: "90px" }}
              value={filters.status}
              onChange={(e) => changeFilter("status", e.target.value)}
            >
              <option value="">All Status</option>
              {attendanceStatuses.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div className="toolbar-actions">
            <button
              type="button"
              className="toolbar-btn toolbar-btn-outline"
              onClick={() => onAction("edit")}
              disabled={!faculty.length}
            >
              <Plus size={13} />
              Take Attendance
            </button>
            <button
              type="button"
              className="toolbar-btn toolbar-btn-primary"
              onClick={exportReport}
            >
              <Download size={13} />
              Export CSV
            </button>
          </div>
        </div>

        {view === "history" && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 20px", background: "#fafafa", borderBottom: "1px solid #e4e4e7", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "600" }}>
              Teacher:
              <select
                className="toolbar-select"
                value={filters.facultyId}
                onChange={(e) => changeFilter("facultyId", e.target.value)}
              >
                <option value="">All Faculty &amp; Staff</option>
                {faculty.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "600" }}>
              From:
              <Input
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(e) => changeFilter("from", e.target.value)}
                style={{ height: "34px", width: "130px", fontSize: "11px", background: "#ffffff" }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "600" }}>
              To:
              <Input
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(e) => changeFilter("to", e.target.value)}
                style={{ height: "34px", width: "130px", fontSize: "11px", background: "#ffffff" }}
              />
            </label>
          </div>
        )}

        {/* 3. Frameless Table View */}
        <div style={{ width: "100%", background: "#ffffff" }}>
          <TabsContent value={view} style={{ margin: 0, padding: 0 }}>
            <div className="campus-table-container">
              <AttendanceTable
                rows={rows}
                view={view}
                page={current}
                pageSize={pageSize}
                onAction={onAction}
                onQuickAction={quickAttendanceAction}
                pendingAction={pendingAction}
              />
            </div>
          </TabsContent>
        </div>

        {/* 4. Frameless Consistent Footer */}
        <div className="campus-footer">
          <div className="footer-info">
            {notice && <span style={{ color: "#16a34a", marginRight: "12px", fontWeight: "600" }}>{notice}</span>}
            Showing {rows.length > 0 ? (current - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(current * pageSize, rows.length)} of {rows.length} {view === "history" ? "records" : "staff members"}
          </div>

          <div className="footer-pagination">
            <button
              type="button"
              className="pagination-btn"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="pagination-page">
              {current} of {pageCount}
            </span>
            <button
              type="button"
              className="pagination-btn"
              disabled={current === pageCount}
              onClick={() => setPage(current + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </Tabs>

      {/* Full-Page Stack Activity Forms */}
      {modal?.mode === "edit" && (
        <AttendanceForm
          record={selected}
          faculty={faculty}
          facultyId={modal.facultyId}
          records={records}
          date={date}
          onSave={save}
          onClose={close}
        />
      )}
      {modal?.mode === "view" && selected && person && (
        <AttendanceDetails
          record={selected}
          person={person}
          onEdit={(facultyId, recordId) => onAction("edit", facultyId, recordId)}
          onClose={close}
        />
      )}
    </section>
  );
}
