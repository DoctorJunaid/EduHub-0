import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  Coffee,
  CheckCircle2,
  CalendarDays,
  List,
  LayoutGrid,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import {
  mondayOf,
  shiftDays,
  minutes,
  timeLabel,
} from "@/lib/schedule.js";

const PX_PER_HOUR = 104;
const PX_PER_MIN = PX_PER_HOUR / 60;
const TIME_COL_PX = 72;

const ALL_WEEKDAYS = [
  { index: 1, label: "Monday", short: "Mon" },
  { index: 2, label: "Tuesday", short: "Tue" },
  { index: 3, label: "Wednesday", short: "Wed" },
  { index: 4, label: "Thursday", short: "Thu" },
  { index: 5, label: "Friday", short: "Fri" },
  { index: 6, label: "Saturday", short: "Sat" },
];

function formatCardTime(startTime, endTime) {
  const s = timeLabel(startTime);
  const e = timeLabel(endTime);
  const sm = s.slice(-2);
  const em = e.slice(-2);
  if (sm === em) return `${s.slice(0, -3)} – ${e}`;
  return `${s} – ${e}`;
}

function calculateDayLanes(records, day) {
  if (!Array.isArray(records)) return [];
  const dayRecords = records
    .filter((record) => record && Array.isArray(record.days) && record.days.includes(day))
    .sort((a, b) => minutes(a.startTime) - minutes(b.startTime));

  if (dayRecords.length === 0) return [];

  // Group into overlapping clusters so non-overlapping periods get full width (laneCount: 1)
  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -1;

  for (const record of dayRecords) {
    const start = minutes(record.startTime);
    const end = minutes(record.endTime);

    if (currentCluster.length === 0) {
      currentCluster.push(record);
      clusterEnd = end;
    } else if (start < clusterEnd) {
      currentCluster.push(record);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      clusters.push(currentCluster);
      currentCluster = [record];
      clusterEnd = end;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Assign lanes per cluster
  const result = [];
  for (const cluster of clusters) {
    if (cluster.length === 1) {
      result.push({
        record: cluster[0],
        lane: 0,
        laneCount: 1,
      });
    } else {
      const lanes = [];
      const clusterBlocks = cluster.map((record) => {
        const start = minutes(record.startTime);
        let lane = lanes.findIndex((laneEnd) => laneEnd <= start);
        if (lane === -1) {
          lane = lanes.length;
        }
        lanes[lane] = minutes(record.endTime);
        return { record, lane };
      });
      const clusterLaneCount = Math.max(1, lanes.length);
      for (const b of clusterBlocks) {
        result.push({
          record: b.record,
          lane: b.lane,
          laneCount: clusterLaneCount,
        });
      }
    }
  }

  return result;
}

export default function StudentTimetable() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [studentScope, setStudentScope] = useState({
    className: "Class 9",
    sectionName: "Section A",
  });
  const [error, setError] = useState(null);

  // View Controls
  const [viewMode, setViewMode] = useState("matrix"); // "matrix" | "list"
  const [includeSaturday, setIncludeSaturday] = useState(true);
  const [week, setWeek] = useState(() => mondayOf(new Date()));

  // Fetch real database timetable for authenticated student
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    axiosInstance
      .get("/student/timetable")
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data || [];
        setRecords(Array.isArray(data) ? data : []);
        if (res.data?.studentScope) {
          setStudentScope(res.data.studentScope);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load student timetable:", err);
        setError("Unable to load timetable routine. Please try again.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeDays = useMemo(() => {
    return includeSaturday ? ALL_WEEKDAYS : ALL_WEEKDAYS.slice(0, 5);
  }, [includeSaturday]);

  // Separate class periods vs breaks
  const classRecords = useMemo(() => {
    return records.filter((r) => !r.isBreak && r.slotType !== "break");
  }, [records]);

  const breakRecords = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      const isB = r.isBreak || r.slotType === "break" || r.subject?.toLowerCase().includes("break") || r.subject?.toLowerCase().includes("lunch");
      if (!isB) continue;
      const key = `${r.startTime}-${r.endTime}`;
      if (!map.has(key)) {
        map.set(key, {
          ...r,
          subject: r.breakTitle || r.subject || "Break / Recess",
          daysSet: new Set(Array.isArray(r.days) && r.days.length ? r.days : [1]),
        });
      } else {
        (Array.isArray(r.days) && r.days.length ? r.days : [1]).forEach((d) => map.get(key).daysSet.add(d));
      }
    }
    return Array.from(map.values()).map((b) => ({ ...b, days: Array.from(b.daysSet) }));
  }, [records]);

  // ── Grid bounds (active school hours: e.g. 8:00 AM to 3:30 / 4:00 PM) ──────
  const { gridStart, gridEnd } = useMemo(() => {
    if (!records.length) return { gridStart: 8 * 60, gridEnd: 16 * 60 };
    const allStarts = records.map((r) => minutes(r.startTime)).filter((m) => !isNaN(m));
    const allEnds = records.map((r) => minutes(r.endTime)).filter((m) => !isNaN(m));
    const minT = allStarts.length ? Math.min(...allStarts) : 8 * 60;
    const maxT = allEnds.length ? Math.max(...allEnds) : 16 * 60;

    // Start at earliest class rounded down to hour (max 8:00 AM)
    const startHour = Math.min(8, Math.floor(minT / 60));
    // End at latest class rounded up to hour (e.g., 3:30 PM -> 16:00 / 4:00 PM, at least startHour + 6)
    const endHour = Math.max(startHour + 6, Math.ceil(maxT / 60));

    return {
      gridStart: startHour * 60,
      gridEnd: endHour * 60,
    };
  }, [records]);

  const gridHeight = (gridEnd - gridStart) * PX_PER_MIN;

  const hourMarks = useMemo(() => {
    const list = [];
    for (let t = gridStart; t <= gridEnd; t += 60) list.push(t);
    return list;
  }, [gridStart, gridEnd]);

  // Current weekday index (1=Mon ... 7=Sun)
  const currentWeekday = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  }, []);

  // ── KPIs for Student ───────────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    // 1. Weekly Class Periods: count of all scheduled period occurrences
    const totalWeeklyPeriods = classRecords.reduce((acc, r) => {
      const daysCount = Array.isArray(r.days) && r.days.length ? r.days.length : 1;
      return acc + daysCount;
    }, 0);

    // 2. Enrolled Subjects
    const uniqueSubjectNames = new Set(
      classRecords.map((r) => (r.subjectName || r.subject || "").trim().toLowerCase()).filter(Boolean)
    );

    // 3. Subject Teachers
    const uniqueTeacherNames = new Set(
      classRecords.map((r) => (r.teacherName || r.instructor || "").trim().toLowerCase()).filter(Boolean)
    );

    // 4. Today's Classes
    const todayClassesCount = classRecords.filter((r) => {
      const days = Array.isArray(r.days) && r.days.length ? r.days : [1];
      return days.includes(currentWeekday);
    }).length;

    return {
      weeklyPeriods: totalWeeklyPeriods,
      enrolledSubjects: uniqueSubjectNames.size,
      subjectTeachers: uniqueTeacherNames.size,
      todayClasses: todayClassesCount,
    };
  }, [classRecords, currentWeekday]);

  // ── Bottom Subject & Faculty Allocation Table ──────────────────────────────
  const subjectAllocations = useMemo(() => {
    const map = new Map();
    for (const r of classRecords) {
      const subName = (r.subjectName || r.subject || "").trim();
      if (!subName) continue;
      const key = subName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          subject: subName,
          teacher: r.teacherName || r.instructor || "Assigned Faculty",
          count: 0,
          daysSet: new Set(),
        });
      }
      const entry = map.get(key);
      const rDays = Array.isArray(r.days) && r.days.length ? r.days : [1];
      entry.count += rDays.length;
      for (const d of rDays) entry.daysSet.add(d);
      if ((!entry.teacher || entry.teacher === "Assigned Faculty") && (r.teacherName || r.instructor)) {
        entry.teacher = r.teacherName || r.instructor;
      }
    }

    const abbrs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return Array.from(map.values()).map((item) => ({
      ...item,
      daysFormatted: Array.from(item.daysSet)
        .sort((a, b) => a - b)
        .map((d) => abbrs[d - 1] || `Day ${d}`)
        .join(", "),
    }));
  }, [classRecords]);

  // Week label formatting: e.g. "Oct 12 – Oct 17, 2026"
  const weekLabel = useMemo(() => {
    const mon = shiftDays(week, 0);
    const sat = shiftDays(week, includeSaturday ? 5 : 4);
    const monMonth = mon.toLocaleDateString("en-US", { month: "short" });
    const satMonth = sat.toLocaleDateString("en-US", { month: "short" });
    const monDay = mon.getDate();
    const satDay = sat.getDate();
    const year = sat.getFullYear();

    if (monMonth === satMonth) {
      return `${monMonth} ${monDay} – ${satDay}, ${year}`;
    }
    return `${monMonth} ${monDay} – ${satMonth} ${satDay}, ${year}`;
  }, [week, includeSaturday]);

  return (
    <div className="space-y-6 pb-12">
      {error && (
        <div
          className="bg-neutral-50 border border-neutral-300 text-neutral-700 text-xs rounded-xl flex items-center justify-between"
          style={{ padding: "12px 16px" }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-neutral-500 hover:text-neutral-800 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Top 4 Summary KPI Cards Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ gap: "16px" }}>
        {/* KPI 1: Weekly Class Periods */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between"
          style={{ padding: "20px 24px", boxSizing: "border-box" }}
        >
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Weekly Class Periods
            </span>
            <div className="text-2xl font-bold text-neutral-900 mt-1">
              {loading ? "..." : kpiData.weeklyPeriods}
            </div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Total active slots / week</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
            <BookOpen size={18} />
          </div>
        </div>

        {/* KPI 2: Enrolled Subjects */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between"
          style={{ padding: "20px 24px", boxSizing: "border-box" }}
        >
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Enrolled Subjects
            </span>
            <div className="text-2xl font-bold text-neutral-900 mt-1">
              {loading ? "..." : kpiData.enrolledSubjects}
            </div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">In your class routine</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
            <CalendarDays size={18} />
          </div>
        </div>

        {/* KPI 3: Subject Teachers */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between"
          style={{ padding: "20px 24px", boxSizing: "border-box" }}
        >
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Subject Teachers
            </span>
            <div className="text-2xl font-bold text-neutral-900 mt-1">
              {loading ? "..." : kpiData.subjectTeachers}
            </div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Assigned to your section</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
        </div>

        {/* KPI 4: Today's Classes */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between"
          style={{ padding: "20px 24px", boxSizing: "border-box" }}
        >
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Today's Classes
            </span>
            <div className="text-2xl font-bold text-neutral-900 mt-1">
              {loading ? "..." : kpiData.todayClasses}
            </div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Scheduled for today</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
        </div>
      </div>

      {/* ── Read-Only Context Bar & View Switcher (NO ADMIN BUTTONS) ─────── */}
      <div
        className="bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ padding: "16px 20px", boxSizing: "border-box" }}
      >
        {/* Left Side: Scope Identity */}
        <div>
          <div className="flex items-center flex-wrap" style={{ marginBottom: "8px", gap: "8px" }}>
            <span
              className="rounded-md text-xs font-medium inline-flex items-center bg-neutral-100 text-neutral-800 border border-neutral-200"
              style={{ padding: "4px 10px", gap: "5px" }}
            >
              {studentScope.className} • {studentScope.sectionName}
            </span>
            <span
              className="rounded-md text-xs font-medium inline-flex items-center bg-neutral-100 text-neutral-800 border border-neutral-200"
              style={{ padding: "4px 10px", gap: "5px" }}
            >
              <CheckCircle2 size={13} className="text-neutral-600" />
              <span>Published Routine</span>
            </span>
          </div>
          <h1
            className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight"
            style={{ fontSize: "17px", lineHeight: "1.35", marginBottom: "2px" }}
          >
            {studentScope.className} — {studentScope.sectionName} Routine
          </h1>
          <p
            className="text-xs text-neutral-500"
            style={{ fontSize: "12px" }}
          >
            Official Weekly Class Routine • Read-Only View
          </p>
        </div>

        {/* Right Side: View Controls with Segmented Containers */}
        <div
          className="flex flex-wrap items-center"
          style={{ gap: "10px" }}
        >
          {/* Group 1: View Mode Toggle */}
          <div
            className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-100"
            style={{ padding: "4px", gap: "4px" }}
          >
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`inline-flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "matrix"
                  ? "bg-white text-neutral-900 shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              style={{ padding: "6px 12px", gap: "6px" }}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Weekly Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-neutral-900 shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              style={{ padding: "6px 12px", gap: "6px" }}
            >
              <List className="w-3.5 h-3.5" />
              <span>All Scheduled List</span>
            </button>
          </div>

          {/* Group 2: Day Range Toggle */}
          <div
            className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-100"
            style={{ padding: "4px", gap: "4px" }}
          >
            <button
              type="button"
              onClick={() => setIncludeSaturday(false)}
              className={`inline-flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                !includeSaturday
                  ? "bg-white text-neutral-900 shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              style={{ padding: "6px 12px" }}
            >
              5 Days (Mon–Fri)
            </button>
            <button
              type="button"
              onClick={() => setIncludeSaturday(true)}
              className={`inline-flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                includeSaturday
                  ? "bg-white text-neutral-900 shadow-xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              style={{ padding: "6px 12px" }}
            >
              6 Days (+Sat)
            </button>
          </div>

          {/* Group 3: Week Date Navigator */}
          <div
            className="inline-flex items-center rounded-lg border border-neutral-200 bg-white"
            style={{ padding: "4px 8px", gap: "8px", height: "36px" }}
          >
            <button
              type="button"
              onClick={() => setWeek((prev) => shiftDays(prev, -7))}
              className="rounded hover:bg-neutral-100 text-neutral-600 inline-flex items-center justify-center cursor-pointer"
              style={{ padding: "4px" }}
              title="Previous week"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span
              className="text-xs font-medium text-neutral-800 whitespace-nowrap select-none"
              style={{ padding: "0 4px" }}
            >
              {weekLabel}
            </span>
            <button
              type="button"
              onClick={() => setWeek((prev) => shiftDays(prev, 7))}
              className="rounded hover:bg-neutral-100 text-neutral-600 inline-flex items-center justify-center cursor-pointer"
              style={{ padding: "4px" }}
              title="Next week"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Group 4: This Week Button */}
          <button
            type="button"
            onClick={() => setWeek(mondayOf(new Date()))}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-800 transition-colors cursor-pointer"
            style={{ padding: "0 14px", height: "36px" }}
          >
            This Week
          </button>
        </div>
      </div>

      {/* ── Content View: Matrix vs List ─────────────────────────────────── */}
      {loading ? (
        <div
          className="bg-white border border-neutral-200 rounded-xl text-center shadow-xs"
          style={{ padding: "48px 24px", boxSizing: "border-box" }}
        >
          <div className="w-8 h-8 border-2 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-neutral-600">Loading published timetable routine...</p>
        </div>
      ) : records.length === 0 ? (
        /* ── Clean Empty State (When Campus Admin Has Not Published Routine) ── */
        <div
          className="bg-white border border-neutral-200 rounded-xl text-center shadow-xs"
          style={{ padding: "48px 24px", boxSizing: "border-box" }}
        >
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto mb-3">
            <Calendar size={22} />
          </div>
          <h3 className="text-base font-bold text-neutral-900 mb-1">No Timetable Published Yet</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Your Campus Administrator has not published a class schedule for your grade and section yet.
          </p>
        </div>
      ) : viewMode === "matrix" ? (
        /* ── Weekly Time-Grid Matrix (Scroll-Free Full-Width Layout) ───────── */
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs"
          style={{ height: "auto", maxHeight: "none", overflow: "visible", width: "100%", boxSizing: "border-box" }}
        >
          <div
            className="select-none"
            style={{ height: "auto", maxHeight: "none", overflow: "visible", width: "100%" }}
          >
            <div style={{ width: "100%", height: "auto", overflow: "visible" }}>
              {/* Matrix Header Row: Time Axis Header + Weekday Columns */}
              <div
                className="grid border-b border-neutral-200 bg-neutral-50 rounded-t-xl"
                style={{
                  gridTemplateColumns: `${TIME_COL_PX}px repeat(${activeDays.length}, minmax(0, 1fr))`,
                }}
              >
                {/* Time Axis Column Top Label */}
                <div
                  className="border-r border-neutral-200 text-center flex items-center justify-center text-[10.5px] font-bold text-neutral-400 uppercase tracking-wider"
                  style={{ padding: "10px 4px" }}
                >
                  Time
                </div>

                {/* Day Columns Headers with Date Sub-label */}
                {activeDays.map((day, idx) => {
                  const dayDate = shiftDays(week, idx);
                  const dateStr = dayDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const isToday = currentWeekday === day.index;

                  return (
                    <div
                      key={day.index}
                      className={`text-center border-r last:border-r-0 border-neutral-200 ${
                        isToday ? "bg-neutral-100/70" : ""
                      }`}
                      style={{ padding: "10px 8px" }}
                    >
                      <div className="text-xs font-bold text-neutral-900 flex items-center justify-center gap-1.5">
                        {day.label}
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 inline-block" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-neutral-500 block mt-0.5">
                        {dateStr}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Matrix Body with Hour Grid Lines */}
              <div
                className="relative grid"
                style={{
                  gridTemplateColumns: `${TIME_COL_PX}px repeat(${activeDays.length}, minmax(0, 1fr))`,
                  height: `${gridHeight}px`,
                }}
              >
                {/* Horizontal Hour Lines across entire grid */}
                {hourMarks.map((m) => {
                  const top = (m - gridStart) * PX_PER_MIN;
                  return (
                    <div
                      key={`h-${m}`}
                      className="absolute left-0 right-0 border-t border-neutral-200/80 pointer-events-none"
                      style={{ top: `${top}px` }}
                    />
                  );
                })}

                {/* Leftmost Time Axis Column */}
                <div className="relative border-r border-neutral-200 bg-neutral-50/50">
                  {hourMarks.map((m) => {
                    const top = (m - gridStart) * PX_PER_MIN;
                    const h = Math.floor(m / 60);
                    const ampm = h >= 12 ? "PM" : "AM";
                    const displayH = h % 12 || 12;

                    return (
                      <div
                        key={`t-${m}`}
                        className="absolute left-0 right-0 text-center text-[10.5px] font-semibold text-neutral-500 transform -translate-y-1/2"
                        style={{ top: `${top}px` }}
                      >
                        {displayH}:00 {ampm}
                      </div>
                    );
                  })}
                </div>

                {/* Day Columns */}
                {activeDays.map((day) => {
                  const dayNum = day.index;
                  const isToday = currentWeekday === dayNum;
                  const blocks = calculateDayLanes(classRecords, dayNum);

                  return (
                    <div
                      key={day.index}
                      className={`relative border-r last:border-r-0 border-neutral-200 ${
                        isToday ? "bg-neutral-50/30" : ""
                      }`}
                    >
                      {/* Break Slots for this Day */}
                      {breakRecords
                        .filter((b) => b.days.includes(dayNum))
                        .map((bRecord, bIdx) => {
                          const sMin = minutes(bRecord.startTime);
                          const eMin = minutes(bRecord.endTime);
                          const bTop = (sMin - gridStart) * PX_PER_MIN;
                          const bHeight = (eMin - sMin) * PX_PER_MIN;

                          return (
                            <div
                              key={`break-${bIdx}-${dayNum}`}
                              className="absolute rounded-lg border border-neutral-300 border-l-4 border-l-neutral-400 bg-neutral-100/90 shadow-2xs z-[3] overflow-hidden flex flex-col justify-center cursor-default"
                              style={{
                                top: `${bTop + 3}px`,
                                height: `${Math.max(bHeight - 6, 34)}px`,
                                left: "6px",
                                width: "calc(100% - 12px)",
                                padding: "8px 12px",
                                boxSizing: "border-box",
                              }}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Coffee size={12} className="text-neutral-500 shrink-0" />
                                <span className="text-xs font-bold text-neutral-800 truncate">
                                  {bRecord.subject || "Break / Recess"}
                                </span>
                              </div>
                              <span className="text-[11px] font-medium text-neutral-500 block truncate mt-0.5">
                                {formatCardTime(bRecord.startTime, bRecord.endTime)}
                              </span>
                            </div>
                          );
                        })}

                      {/* Class Period Cards */}
                      {blocks.map(({ record, lane, laneCount }) => {
                        const id = record._id || record.id;
                        const startMin = minutes(record.startTime);
                        const durMin = minutes(record.endTime) - startMin;
                        const cardTop = (startMin - gridStart) * PX_PER_MIN;
                        const cardH = durMin * PX_PER_MIN;

                        const isFullWidth = laneCount === 1;
                        const cardStyle = isFullWidth
                          ? {
                              top: `${cardTop + 3}px`,
                              height: `${Math.max(cardH - 6, 64)}px`,
                              minHeight: "64px",
                              left: "6px",
                              width: "calc(100% - 12px)",
                              padding: "10px 12px",
                              boxSizing: "border-box",
                            }
                          : {
                              top: `${cardTop + 3}px`,
                              height: `${Math.max(cardH - 6, 64)}px`,
                              minHeight: "64px",
                              left: `calc(${(lane / laneCount) * 100}% + 4px)`,
                              width: `calc(${100 / laneCount}% - 8px)`,
                              padding: "10px 12px",
                              boxSizing: "border-box",
                            };

                        return (
                          <div
                            key={id}
                            draggable={false}
                            className="absolute rounded-lg border border-neutral-200 border-l-4 border-l-neutral-800 bg-neutral-50 shadow-xs z-[5] overflow-hidden flex flex-col justify-start cursor-default hover:bg-neutral-100/80 transition-colors"
                            style={cardStyle}
                          >
                            {/* 1. Subject Title */}
                            <span
                              className="text-xs font-bold text-neutral-900 leading-tight truncate block"
                              title={record.subjectName || record.subject}
                            >
                              {record.subjectName || record.subject}
                            </span>

                            {/* 2. Time Range */}
                            <span className="text-[11px] font-medium text-neutral-500 mt-1 whitespace-nowrap block">
                              {formatCardTime(record.startTime, record.endTime)}
                            </span>

                            {/* 3. Assigned Teacher Name */}
                            {(record.teacherName || record.instructor) && (
                              <span className="text-[11px] text-neutral-600 mt-1 truncate block font-medium">
                                {record.teacherName || record.instructor}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── All Scheduled List View ─────────────────────────────────────── */
        <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider">
                  <th style={{ padding: "12px 16px" }}>Day</th>
                  <th style={{ padding: "12px 16px" }}>Time Slot</th>
                  <th style={{ padding: "12px 16px" }}>Subject / Activity</th>
                  <th style={{ padding: "12px 16px" }}>Assigned Teacher</th>
                  <th style={{ padding: "12px 16px" }}>Room</th>
                  <th style={{ padding: "12px 16px" }}>Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {records
                  .slice()
                  .sort((a, b) => {
                    const dayA = Array.isArray(a.days) && a.days[0] ? a.days[0] : 1;
                    const dayB = Array.isArray(b.days) && b.days[0] ? b.days[0] : 1;
                    if (dayA !== dayB) return dayA - dayB;
                    return minutes(a.startTime) - minutes(b.startTime);
                  })
                  .map((item, idx) => {
                    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                    const itemDays = Array.isArray(item.days) && item.days.length ? item.days : [1];
                    const daysStr = itemDays.map((d) => dayNames[d - 1] || `D${d}`).join(", ");
                    const isB = item.isBreak || item.slotType === "break";

                    return (
                      <tr key={item._id || idx} className="hover:bg-neutral-50/70 transition-colors">
                        <td style={{ padding: "12px 16px" }} className="font-semibold text-neutral-800">
                          {daysStr}
                        </td>
                        <td style={{ padding: "12px 16px" }} className="font-medium text-neutral-600">
                          {formatCardTime(item.startTime, item.endTime)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="font-bold text-neutral-900">
                            {item.subjectName || item.subject || item.breakTitle}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }} className="text-neutral-600">
                          {isB ? "—" : item.teacherName || item.instructor || "Assigned Faculty"}
                        </td>
                        <td style={{ padding: "12px 16px" }} className="text-neutral-500">
                          {item.room || item.roomNumber || "Main Classroom"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isB
                                ? "bg-neutral-200 text-neutral-800"
                                : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                            }`}
                          >
                            {isB ? "Break / Recess" : "Class Period"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Bottom Summary Table: SUBJECT & FACULTY ALLOCATION ──────────── */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        <div
          className="flex items-center justify-between border-b border-neutral-200"
          style={{ padding: "16px 20px" }}
        >
          <div className="flex items-center" style={{ gap: "12px" }}>
            <div
              className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
              style={{ width: "36px", height: "36px" }}
            >
              <BookOpen className="w-4 h-4 text-neutral-700" />
            </div>
            <div className="flex flex-col" style={{ gap: "2px" }}>
              <h3
                className="font-bold text-neutral-900 tracking-tight uppercase m-0"
                style={{ fontSize: "14px", lineHeight: "1.3" }}
              >
                Subject &amp; Faculty Allocation
              </h3>
              <p
                className="text-neutral-500 m-0"
                style={{ fontSize: "12px", lineHeight: "1.3" }}
              >
                Assigned subject teachers and weekly class sessions for your section
              </p>
            </div>
          </div>
          <span
            className="rounded-md bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-800 whitespace-nowrap"
            style={{ padding: "4px 10px" }}
          >
            {subjectAllocations.length} {subjectAllocations.length === 1 ? "Subject" : "Subjects"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider">
                <th style={{ padding: "14px 20px" }} className="align-middle">Subject / Course</th>
                <th style={{ padding: "14px 20px" }} className="align-middle">Assigned Teacher</th>
                <th style={{ padding: "14px 20px" }} className="align-middle">Weekly Sessions</th>
                <th style={{ padding: "14px 20px" }} className="align-middle">Scheduled Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {subjectAllocations.map((item) => (
                <tr key={item.subject} className="hover:bg-neutral-50/70 transition-colors">
                  <td style={{ padding: "14px 20px" }} className="font-bold text-neutral-900 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-neutral-800 shrink-0" />
                      <span>{item.subject}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }} className="align-middle">
                    <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                      <Users size={12} className="text-neutral-400 shrink-0" />
                      <span>{item.teacher}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }} className="align-middle">
                    <span
                      className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-medium inline-flex items-center whitespace-nowrap"
                      style={{ padding: "4px 10px" }}
                    >
                      {item.count} {item.count === 1 ? "Period" : "Periods"}/wk
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }} className="text-neutral-600 font-medium text-[11px] align-middle">
                    {item.daysFormatted}
                  </td>
                </tr>
              ))}
              {!subjectAllocations.length && (
                <tr>
                  <td colSpan={4} style={{ padding: "24px 20px" }} className="text-center text-neutral-400 text-xs align-middle">
                    No subject allocations available for this section yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
