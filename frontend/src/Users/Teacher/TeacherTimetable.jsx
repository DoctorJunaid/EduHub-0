import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Coffee,
  CheckCircle2,
  CalendarDays,
  List,
  LayoutGrid,
  Filter,
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

function formatClassSection(className, sectionName) {
  const cls = (className || "").trim() || "Class";
  let sec = (sectionName || "").trim() || "A";
  sec = sec.replace(/^(section\s*|sec\s*|\.\s*)/i, "").trim() || "A";
  return `${cls} • Section ${sec}`;
}

export default function TeacherTimetable() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState({
    name: "Teacher",
    isClassTeacher: false,
    classTeacherSection: null,
  });
  const [error, setError] = useState(null);

  // View Controls
  const [viewMode, setViewMode] = useState("matrix"); // "matrix" | "list"
  const [includeSaturday, setIncludeSaturday] = useState(true);
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [selectedClassFilter, setSelectedClassFilter] = useState("ALL");

  // Fetch real database timetable for authenticated teacher
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    axiosInstance
      .get("/teacher/timetable")
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data || [];
        setRecords(Array.isArray(data) ? data : []);
        if (res.data?.teacher) {
          setTeacherInfo(res.data.teacher);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load teacher timetable:", err);
        setError("Unable to load teaching schedule. Please try again.");
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

  // Derive unique classes/sections taught by this teacher for filter pills
  const availableClasses = useMemo(() => {
    const set = new Set();
    for (const r of records) {
      if (r.isBreak || r.slotType === "break") continue;
      const formatted = formatClassSection(r.className || r.program, r.sectionName || r.section);
      if (formatted) set.add(formatted);
    }
    return Array.from(set);
  }, [records]);

  // Separate class periods vs breaks, applying class filter if selected
  const filteredClassRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.isBreak || r.slotType === "break") return false;
      if (selectedClassFilter === "ALL") return true;
      const formatted = formatClassSection(r.className || r.program, r.sectionName || r.section);
      const c = r.className || r.program || "";
      return formatted === selectedClassFilter || c === selectedClassFilter;
    });
  }, [records, selectedClassFilter]);

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

  // ── KPIs for Teacher ───────────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    // 1. Assigned Periods / Wk
    const totalWeeklyPeriods = filteredClassRecords.reduce((acc, r) => {
      const daysCount = Array.isArray(r.days) && r.days.length ? r.days.length : 1;
      return acc + daysCount;
    }, 0);

    // 2. Classes & Sections taught
    const classCombos = new Set(
      filteredClassRecords.map((r) =>
        formatClassSection(r.className || r.program, r.sectionName || r.section)
      ).filter(Boolean)
    );

    // 3. Subjects Taught
    const uniqueSubjects = new Set(
      filteredClassRecords.map((r) => (r.subjectName || r.subject || "").trim().toLowerCase()).filter(Boolean)
    );

    // 4. Today's Sessions
    const todaySessions = filteredClassRecords.filter((r) => {
      const days = Array.isArray(r.days) && r.days.length ? r.days : [1];
      return days.includes(currentWeekday);
    }).length;

    return {
      assignedPeriods: totalWeeklyPeriods,
      classesAndSections: classCombos.size,
      subjectsTaught: uniqueSubjects.size,
      todaySessions,
    };
  }, [filteredClassRecords, currentWeekday]);

  // ── Bottom Summary Table: TEACHING LOAD BREAKDOWN ──────────────────────────
  const teachingLoadBreakdown = useMemo(() => {
    const map = new Map();
    for (const r of filteredClassRecords) {
      const subName = (r.subjectName || r.subject || "").trim();
      const classSecStr = formatClassSection(r.className || r.program, r.sectionName || r.section);
      if (!subName) continue;
      const key = `${subName}__${classSecStr}`.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          subject: subName,
          classSection: classSecStr,
          count: 0,
          daysSet: new Set(),
        });
      }
      const entry = map.get(key);
      const rDays = Array.isArray(r.days) && r.days.length ? r.days : [1];
      entry.count += rDays.length;
      for (const d of rDays) entry.daysSet.add(d);
    }

    const abbrs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return Array.from(map.values()).map((item) => ({
      ...item,
      daysFormatted: Array.from(item.daysSet)
        .sort((a, b) => a - b)
        .map((d) => abbrs[d - 1] || `Day ${d}`)
        .join(", "),
    }));
  }, [filteredClassRecords]);

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
    <div className="space-y-6 pb-12 p-6 lg:p-7 min-h-full bg-slate-50/60 box-border">
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
      {/* ── Top 4 Summary KPI Cards Row ─────────────────────────────────── */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 w-full"
        style={{ gap: "12px", marginBottom: "20px" }}
      >
        {[
          {
            label: "Assigned Periods / Wk",
            value: loading ? "..." : kpiData.assignedPeriods,
            subtitle: "Total teaching sessions / wk",
            icon: <BookOpen size={16} />,
          },
          {
            label: "Classes & Sections",
            value: loading ? "..." : kpiData.classesAndSections,
            subtitle: "Active assigned cohorts",
            icon: <GraduationCap size={16} />,
          },
          {
            label: "Subjects Taught",
            value: loading ? "..." : kpiData.subjectsTaught,
            subtitle: "Unique course allocations",
            icon: <CalendarDays size={16} />,
          },
          {
            label: "Today's Sessions",
            value: loading ? "..." : kpiData.todaySessions,
            subtitle: "Scheduled for today",
            icon: <Clock size={16} />,
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col justify-between min-w-0 p-3.5 sm:p-5"
            style={{ padding: "14px 16px", gap: "8px", boxSizing: "border-box" }}
          >
            <div className="flex items-start justify-between w-full" style={{ gap: "8px" }}>
              <div className="flex flex-col min-w-0 flex-1" style={{ gap: "4px" }}>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-500 leading-snug">
                  {card.label}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight whitespace-nowrap">
                  {card.value}
                </span>
              </div>
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0"
                style={{ width: "34px", height: "34px" }}
              >
                {card.icon}
              </div>
            </div>
            {card.subtitle && (
              <span className="text-[11px] text-neutral-500 truncate block w-full leading-tight">
                {card.subtitle}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Read-Only Context Bar & View Switcher (NO ADMIN BUTTONS) ─────── */}
      <div
        className="bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{ padding: "16px 20px", boxSizing: "border-box" }}
      >
        {/* Left Side: Scope Identity & Class Filter Pills */}
        <div>
          {/* Header Badges */}
          <div className="flex flex-wrap items-center" style={{ gap: "6px", marginBottom: "6px" }}>
            <span
              className="inline-flex items-center rounded-md text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200 whitespace-nowrap"
              style={{ padding: "4px 10px", gap: "6px" }}
            >
              Faculty Schedule
            </span>
            {teacherInfo.isClassTeacher && teacherInfo.classTeacherSection && (
              <span
                className="inline-flex items-center rounded-md text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200 whitespace-nowrap"
                style={{ padding: "4px 10px", gap: "6px" }}
              >
                <CheckCircle2 size={13} className="text-neutral-600 shrink-0" /> Class Teacher:{" "}
                {teacherInfo.classTeacherSection.gradeName || "Class"} •{" "}
                {teacherInfo.classTeacherSection.sectionName || "Section"}
              </span>
            )}
          </div>
          <h1
            className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight"
            style={{ fontSize: "17px", lineHeight: "1.35", marginBottom: "2px" }}
          >
            My Teaching Timetable
          </h1>
          <p
            className="text-xs text-neutral-500 mb-2"
            style={{ fontSize: "12px" }}
          >
            Assigned Weekly Teaching Schedule Across Classes & Sections • Read-Only View
          </p>

          {/* Filter Pills for Multiple Classes */}
          {availableClasses.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1 mr-1">
                <Filter size={11} /> Filter:
              </span>
              <button
                type="button"
                onClick={() => setSelectedClassFilter("ALL")}
                className={`rounded-md text-[11px] font-semibold transition-colors cursor-pointer border whitespace-nowrap ${
                  selectedClassFilter === "ALL"
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                }`}
                style={{ padding: "4px 10px" }}
              >
                All My Classes ({records.filter((r) => !r.isBreak).length})
              </button>
              {availableClasses.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClassFilter(cls)}
                  className={`rounded-md text-[11px] font-semibold transition-colors cursor-pointer border whitespace-nowrap ${
                    selectedClassFilter === cls
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                  }`}
                  style={{ padding: "4px 10px" }}
                >
                  {cls}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: View Controls with Segmented Containers */}
        <div
          className="flex flex-wrap items-center w-full lg:w-auto"
          style={{ gap: "10px" }}
        >
          <div className="flex flex-wrap items-center w-full sm:w-auto" style={{ gap: "8px" }}>
            {/* Group 1: View Mode Toggle */}
            <div
              className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-100"
              style={{ padding: "4px", gap: "4px" }}
            >
              <button
                type="button"
                onClick={() => setViewMode("matrix")}
                className={`inline-flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === "matrix"
                    ? "bg-white text-neutral-900 shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                style={{ height: "36px", padding: "0 12px", gap: "6px" }}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Weekly Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === "list"
                    ? "bg-white text-neutral-900 shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                style={{ height: "36px", padding: "0 12px", gap: "6px" }}
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
                className={`inline-flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  !includeSaturday
                    ? "bg-white text-neutral-900 shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                style={{ height: "36px", padding: "0 12px" }}
              >
                5 Days (Mon–Fri)
              </button>
              <button
                type="button"
                onClick={() => setIncludeSaturday(true)}
                className={`inline-flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  includeSaturday
                    ? "bg-white text-neutral-900 shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                style={{ height: "36px", padding: "0 12px" }}
              >
                6 Days (+Sat)
              </button>
            </div>
          </div>

          {/* Group 3 & 4: Date Navigator & This Week in a single row */}
          <div className="flex items-center w-full sm:w-auto" style={{ gap: "8px" }}>
            {/* Date Range Navigator */}
            <div
              className="flex-1 sm:flex-initial inline-flex items-center justify-between rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-800"
              style={{ height: "36px", padding: "0 8px", minWidth: "170px", boxSizing: "border-box" }}
            >
              <button
                type="button"
                onClick={() => setWeek((prev) => shiftDays(prev, -7))}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-600 inline-flex items-center justify-center cursor-pointer"
                title="Previous week"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-neutral-600" />
              </button>
              <span className="whitespace-nowrap px-2 text-xs font-semibold text-neutral-800 select-none">
                {weekLabel}
              </span>
              <button
                type="button"
                onClick={() => setWeek((prev) => shiftDays(prev, 7))}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-600 inline-flex items-center justify-center cursor-pointer"
                title="Next week"
              >
                <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
              </button>
            </div>

            {/* This Week Button */}
            <button
              type="button"
              onClick={() => setWeek(mondayOf(new Date()))}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
              style={{ height: "36px", padding: "0 14px", boxSizing: "border-box" }}
            >
              This Week
            </button>
          </div>
        </div>
      </div>

      {/* ── Content View: Matrix vs List ─────────────────────────────────── */}
      {loading ? (
        <div
          className="bg-white border border-neutral-200 rounded-xl text-center shadow-xs"
          style={{ padding: "48px 24px", boxSizing: "border-box" }}
        >
          <div className="w-8 h-8 border-2 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-neutral-600">Loading your teaching schedule...</p>
        </div>
      ) : records.length === 0 ? (
        /* ── Clean Empty State (When Campus Admin Has Not Assigned Periods) ── */
        <div
          className="bg-white border border-neutral-200 rounded-xl text-center shadow-xs"
          style={{ padding: "48px 24px", boxSizing: "border-box" }}
        >
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto mb-3">
            <Calendar size={22} />
          </div>
          <h3 className="text-base font-bold text-neutral-900 mb-1">No Timetable Published Yet</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            No teaching periods have been assigned to your schedule by the Campus Administrator yet.
          </p>
        </div>
      ) : viewMode === "matrix" ? (
        /* ── Weekly Time-Grid Matrix (Scroll-Free Full-Width Layout) ───────── */
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-x-auto w-full"
          style={{ width: "100%", boxSizing: "border-box", WebkitOverflowScrolling: "touch" }}
        >
          <div
            className="select-none"
            style={{ width: "100%", minWidth: `${TIME_COL_PX + activeDays.length * 165}px` }}
          >
            <div style={{ width: "100%", height: "auto", overflow: "visible" }}>
              {/* Matrix Header Row: Time Axis Header + Weekday Columns */}
              <div
                className="grid border-b border-neutral-200 bg-neutral-50 rounded-t-xl"
                style={{
                  gridTemplateColumns: `${TIME_COL_PX}px repeat(${activeDays.length}, minmax(165px, 1fr))`,
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
                      style={{ padding: "10px 8px", minWidth: "165px" }}
                    >
                      <div className="text-xs font-bold text-neutral-900 flex items-center justify-center gap-1.5 whitespace-nowrap">
                        {day.label}
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 inline-block" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-neutral-500 block mt-0.5 whitespace-nowrap">
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
                  gridTemplateColumns: `${TIME_COL_PX}px repeat(${activeDays.length}, minmax(165px, 1fr))`,
                  height: `${gridHeight + 36}px`,
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
                        className="absolute left-0 right-0 text-center text-[10.5px] font-semibold text-neutral-500 transform -translate-y-1/2 whitespace-nowrap"
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
                  const dayBreaks = breakRecords.filter((b) => b.days.includes(dayNum));
                  const dayPeriods = filteredClassRecords.filter(
                    (r) => Array.isArray(r.days) && r.days.includes(dayNum)
                  );

                  return (
                    <div
                      key={day.index}
                      className={`relative border-r last:border-r-0 border-neutral-200 ${
                        isToday ? "bg-neutral-50/30" : ""
                      }`}
                      style={{ minWidth: "165px" }}
                    >
                      {hourMarks.slice(0, -1).map((m) => {
                        const hourStart = m;
                        const hourEnd = m + 60;
                        const breaksInHour = dayBreaks.filter((b) => {
                          const s = minutes(b.startTime);
                          return s >= hourStart && s < hourEnd;
                        });
                        const periodsInHour = dayPeriods.filter((p) => {
                          const s = minutes(p.startTime);
                          return s >= hourStart && s < hourEnd;
                        });

                        if (!breaksInHour.length && !periodsInHour.length) return null;

                        const topOffset = (hourStart - gridStart) * PX_PER_MIN;

                        return (
                          <div
                            key={`slot-${dayNum}-${m}`}
                            className="absolute left-0 right-0"
                            style={{
                              top: `${topOffset}px`,
                              width: "100%",
                              zIndex: 5,
                            }}
                          >
                            <div
                              className="flex flex-col w-full"
                              style={{
                                gap: "6px",
                                padding: "6px",
                                position: "relative",
                                boxSizing: "border-box",
                              }}
                            >
                              {/* Break Slots */}
                              {breaksInHour.map((bRecord, bIdx) => (
                                <div
                                  key={`break-${bIdx}`}
                                  className="w-full rounded-lg border border-neutral-300 border-l-4 border-l-neutral-400 bg-neutral-100/90 shadow-2xs overflow-hidden flex flex-col justify-center cursor-default shrink-0"
                                  style={{
                                    padding: "5px 8px",
                                    boxSizing: "border-box",
                                  }}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Coffee size={11} className="text-neutral-500 shrink-0" />
                                    <span className="text-[11px] font-bold text-neutral-800 truncate">
                                      {bRecord.subject || "Break / Recess"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-medium text-neutral-500 block truncate mt-0.5">
                                    {formatCardTime(bRecord.startTime, bRecord.endTime)}
                                  </span>
                                </div>
                              ))}

                              {/* Class Period Cards */}
                              {periodsInHour.map((record) => {
                                const id = record._id || record.id || `${record.startTime}-${record.endTime}`;
                                const classBadge = formatClassSection(
                                  record.className || record.program,
                                  record.sectionName || record.section
                                );

                                return (
                                  <div
                                    key={id}
                                    draggable={false}
                                    className="w-full rounded-xl bg-white border border-neutral-200 border-l-4 border-l-neutral-900 shadow-xs flex flex-col justify-between hover:bg-neutral-50 transition-colors cursor-default shrink-0"
                                    style={{
                                      padding: "8px 10px",
                                      gap: "3px",
                                      boxSizing: "border-box",
                                    }}
                                  >
                                    <span
                                      className="text-xs font-bold text-neutral-900 truncate block"
                                      title={record.subjectName || record.subject}
                                    >
                                      {record.subjectName || record.subject}
                                    </span>
                                    <span className="text-[11px] font-medium text-neutral-600 whitespace-nowrap block">
                                      {formatCardTime(record.startTime, record.endTime)}
                                    </span>
                                    <span className="text-[11px] text-neutral-500 truncate block">
                                      {classBadge}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
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
          <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider">
                  <th style={{ padding: "12px 16px" }} className="whitespace-nowrap">Day</th>
                  <th style={{ padding: "12px 16px" }} className="whitespace-nowrap">Time Slot</th>
                  <th style={{ padding: "12px 16px" }} className="whitespace-nowrap">Subject / Course</th>
                  <th style={{ padding: "12px 16px" }} className="whitespace-nowrap">Class & Section</th>
                  <th style={{ padding: "12px 16px" }} className="whitespace-nowrap">Room</th>
                  <th style={{ padding: "12px 16px" }} className="whitespace-nowrap">Type</th>
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
                        <td style={{ padding: "12px 16px" }} className="font-semibold text-neutral-800 whitespace-nowrap">
                          {daysStr}
                        </td>
                        <td style={{ padding: "12px 16px" }} className="font-medium text-neutral-600 whitespace-nowrap">
                          {formatCardTime(item.startTime, item.endTime)}
                        </td>
                        <td style={{ padding: "12px 16px" }} className="whitespace-nowrap">
                          <span className="font-bold text-neutral-900">
                            {item.subjectName || item.subject || item.breakTitle}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }} className="text-neutral-700 font-semibold whitespace-nowrap">
                          {isB
                            ? "All Classes"
                            : formatClassSection(item.className || item.program, item.sectionName || item.section)}
                        </td>
                        <td style={{ padding: "12px 16px" }} className="text-neutral-500 whitespace-nowrap">
                          {item.room || item.roomNumber || "Main Room"}
                        </td>
                        <td style={{ padding: "12px 16px" }} className="whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                              isB
                                ? "bg-neutral-200 text-neutral-800"
                                : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                            }`}
                          >
                            {isB ? "Break / Recess" : "Teaching Period"}
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

      {/* ── Bottom Summary Table: TEACHING LOAD BREAKDOWN ────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 gap-3"
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
                Teaching Load Breakdown
              </h3>
              <p
                className="text-neutral-500 m-0"
                style={{ fontSize: "12px", lineHeight: "1.3" }}
              >
                Assigned subjects, cohorts, and weekly teaching loads
              </p>
            </div>
          </div>
          <span
            className="rounded-md bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-800 whitespace-nowrap self-start sm:self-auto"
            style={{ padding: "4px 10px" }}
          >
            {teachingLoadBreakdown.length}{" "}
            {teachingLoadBreakdown.length === 1 ? "Subject Cohort" : "Subject Cohorts"}
          </span>
        </div>

        <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full min-w-[650px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider">
                <th style={{ padding: "12px 16px" }} className="align-middle whitespace-nowrap">Subject / Course</th>
                <th style={{ padding: "12px 16px" }} className="align-middle whitespace-nowrap">Class & Section</th>
                <th style={{ padding: "12px 16px" }} className="align-middle whitespace-nowrap">Weekly Sessions</th>
                <th style={{ padding: "12px 16px" }} className="align-middle whitespace-nowrap">Scheduled Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {teachingLoadBreakdown.map((item) => (
                <tr key={`${item.subject}-${item.classSection}`} className="hover:bg-neutral-50/70 transition-colors">
                  <td style={{ padding: "12px 16px" }} className="font-bold text-neutral-900 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-neutral-800 shrink-0" />
                      <span>{item.subject}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }} className="align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-neutral-800 font-semibold whitespace-nowrap">
                      <GraduationCap size={13} className="text-neutral-400 shrink-0" />
                      <span>{item.classSection}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }} className="align-middle whitespace-nowrap">
                    <span
                      className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-medium inline-flex items-center whitespace-nowrap"
                      style={{ padding: "4px 10px" }}
                    >
                      {item.count} {item.count === 1 ? "Period" : "Periods"}/wk
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }} className="text-neutral-600 font-medium text-[11px] align-middle whitespace-nowrap">
                    {item.daysFormatted}
                  </td>
                </tr>
              ))}
              {!teachingLoadBreakdown.length && (
                <tr>
                  <td colSpan={4} style={{ padding: "24px 20px" }} className="text-center text-neutral-400 text-xs align-middle">
                    No teaching loads assigned to your account yet.
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
