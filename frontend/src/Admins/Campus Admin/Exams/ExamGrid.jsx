import React, { useState, useRef, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Award,
  Lock,
  Sun,
  Sunset,
  Moon,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import { shiftDays, timeLabel } from "../../../lib/schedule.js";
import { dateKey } from "./examData.js";

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatCardTime(startTime, endTime) {
  const startStr = timeLabel(startTime);
  const endStr = timeLabel(endTime);
  const startMeridiem = startStr.slice(-2);
  const endMeridiem = endStr.slice(-2);
  if (startMeridiem === endMeridiem) {
    return `${startStr.slice(0, -3)} – ${endStr}`;
  }
  return `${startStr} – ${endStr}`;
}

function getSubjectTheme(subjectName = "") {
  const lower = (subjectName || "").toLowerCase();
  if (lower.includes("math") || lower.includes("algebra") || lower.includes("calculus") || lower.includes("geom")) {
    return { borderLeft: "#2563eb", bg: "#eff6ff", hoverBg: "#dbeafe", text: "#1e40af", badgeBg: "#dbeafe", badgeText: "#1e40af" };
  }
  if (lower.includes("sci") || lower.includes("phys") || lower.includes("chem") || lower.includes("bio")) {
    return { borderLeft: "#059669", bg: "#ecfdf5", hoverBg: "#d1fae5", text: "#065f46", badgeBg: "#d1fae5", badgeText: "#065f46" };
  }
  if (lower.includes("eng") || lower.includes("urdu") || lower.includes("lang") || lower.includes("lit")) {
    return { borderLeft: "#d97706", bg: "#fffbeb", hoverBg: "#fef3c7", text: "#92400e", badgeBg: "#fef3c7", badgeText: "#92400e" };
  }
  if (lower.includes("comp") || lower.includes("it") || lower.includes("prog") || lower.includes("code") || lower.includes("ai")) {
    return { borderLeft: "#7c3aed", bg: "#f5f3ff", hoverBg: "#ede9fe", text: "#5b21b6", badgeBg: "#ede9fe", badgeText: "#5b21b6" };
  }
  if (lower.includes("hist") || lower.includes("social") || lower.includes("islam") || lower.includes("geog") || lower.includes("pak")) {
    return { borderLeft: "#0d9488", bg: "#f0fdfa", hoverBg: "#ccfbf1", text: "#115e59", badgeBg: "#ccfbf1", badgeText: "#115e59" };
  }
  if (lower.includes("art") || lower.includes("music") || lower.includes("pe") || lower.includes("sport") || lower.includes("draw")) {
    return { borderLeft: "#e11d48", bg: "#fff1f2", hoverBg: "#ffe4e6", text: "#9f1239", badgeBg: "#ffe4e6", badgeText: "#9f1239" };
  }
  return { borderLeft: "#18181b", bg: "#f4f4f5", hoverBg: "#e4e4e7", text: "#18181b", badgeBg: "#e4e4e7", badgeText: "#18181b" };
}

export default function ExamGrid({
  records = [],
  allRecords = [],
  week,
  onView,
  onAction,
  onQuickAdd,
  onMoveExam,
  currentClass,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const isDragGesture = useRef(false);

  const weekStartStr = dateKey(week);
  const weekEndStr = dateKey(shiftDays(week, 6));

  // Records for this active week
  const visibleRecords = useMemo(() => {
    return records.filter((r) => {
      const rDate = r.date || (r.examDate ? String(r.examDate).slice(0, 10) : "");
      return rDate >= weekStartStr && rDate <= weekEndStr;
    });
  }, [records, weekStartStr, weekEndStr]);

  const todayStr = dateKey(new Date());

  // Handle Drag & Drop
  const handleDrop = (e, dateStr, shiftStart, shiftEnd, isDayLocked) => {
    e.preventDefault();
    const examId = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDragOverKey(null);

    if (!examId) return;
    if (isDayLocked) return;

    onMoveExam?.(examId, dateStr, shiftStart, shiftEnd);
  };

  return (
    <div className="datesheet-matrix-wrap">
      <div className="datesheet-grid">
        {WEEKDAY_NAMES.map((dayName, index) => {
          const dayDate = shiftDays(week, index);
          const dateStr = dateKey(dayDate);
          const isToday = dateStr === todayStr;

          // Exams on this specific day
          const dayExams = visibleRecords.filter((r) => {
            const rDate = r.date || (r.examDate ? String(r.examDate).slice(0, 10) : "");
            return rDate === dateStr;
          });

          const dailyCount = dayExams.length;
          const isDayLocked = currentClass && currentClass !== "ALL" ? dailyCount >= 2 : false;

          // Categorize by session
          const morningExams = dayExams.filter((r) => {
            const s = r.startTime || "09:00";
            const h = parseInt(s.split(":")[0], 10);
            return h < 13 || r.sessionOrShift === "Morning";
          });

          const afternoonExams = dayExams.filter((r) => {
            const s = r.startTime || "13:30";
            const h = parseInt(s.split(":")[0], 10);
            return (h >= 13 && h < 17) || r.sessionOrShift === "Afternoon";
          });

          const eveningExams = dayExams.filter((r) => {
            const s = r.startTime || "17:00";
            const h = parseInt(s.split(":")[0], 10);
            return h >= 17 || r.sessionOrShift === "Evening";
          });

          return (
            <div
              key={dayName}
              className={`datesheet-day-col ${isToday ? "is-today" : ""}`}
            >
              {/* Day Header */}
              <div className={`datesheet-day-header ${isToday ? "is-today" : ""}`}>
                <div className="datesheet-day-top">
                  <span className="datesheet-day-title">{dayName.slice(0, 3)}</span>
                  <span className="datesheet-day-date">
                    {dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>

                {/* Daily Load Status Pill */}
                {dailyCount === 0 ? (
                  <span className="exam-day-pill empty">No Exams</span>
                ) : dailyCount === 1 ? (
                  <span className="exam-day-pill standard">1 Paper</span>
                ) : (
                  <span className={`exam-day-pill ${isDayLocked || dailyCount === 2 ? "dual" : "standard"}`}>
                    {(isDayLocked || dailyCount === 2) && <AlertTriangle size={10} />}
                    {isDayLocked ? "2 Papers (Max)" : `${dailyCount} Papers`}
                  </span>
                )}
              </div>

              {/* Day Body with Structured Sessions */}
              <div className="datesheet-day-body">
                {/* 1. Morning Shift (09:00 - 12:00) */}
                <div className="datesheet-session-slot">
                  <div className="datesheet-session-tag morning">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Sun size={11} /> Morning Shift
                    </span>
                    <span>09:00 – 12:00</span>
                  </div>

                  {morningExams.map((record) => {
                    const theme = getSubjectTheme(record.subject);
                    const thisId = record._id || record.id;
                    const isDragging = draggingId === thisId;

                    return (
                      <div
                        key={thisId}
                        draggable={true}
                        onDragStart={(e) => {
                          isDragGesture.current = true;
                          e.dataTransfer.setData("text/plain", thisId);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingId(thisId);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOverKey(null);
                          setTimeout(() => {
                            isDragGesture.current = false;
                          }, 50);
                        }}
                        onClick={() => {
                          if (!isDragGesture.current) onView?.(thisId);
                        }}
                        className={`datesheet-card group ${isDragging ? "is-dragging" : ""}`}
                        style={{
                          borderRadius: 0,
                          backgroundColor: isDragging ? "#e0e7ff" : theme.bg,
                          borderLeft: `4px solid ${theme.borderLeft}`,
                          borderBottom: "1px solid #cbd5e1",
                          borderRight: "1px solid #cbd5e1",
                          borderTop: "1px solid #e2e8f0",
                          boxSizing: "border-box",
                          padding: "8px 10px",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          if (!isDragging) e.currentTarget.style.backgroundColor = theme.hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          if (!isDragging) e.currentTarget.style.backgroundColor = theme.bg;
                        }}
                      >
                        {/* Hover action buttons matching Class Timetable */}
                        {onAction && (
                          <div
                            className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 flex items-center gap-0.5 bg-white/95 p-0.5 border border-zinc-200 shadow-2xs z-10"
                            style={{ borderRadius: 0 }}
                          >
                            <button
                              type="button"
                              className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer transition-colors"
                              title="View"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAction("view", thisId, record);
                              }}
                            >
                              <Eye size={11} />
                            </button>
                            <button
                              type="button"
                              className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer transition-colors"
                              title="Edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAction("edit", thisId, record);
                              }}
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              type="button"
                              className="p-1 text-zinc-600 hover:text-red-600 hover:bg-zinc-100 cursor-pointer transition-colors"
                              title="Delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAction("delete", thisId, record);
                              }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}

                        <span
                          className="font-extrabold text-zinc-900 block leading-tight tracking-tight text-center w-full"
                          style={{ fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                          title={record.subject}
                        >
                          {record.subject}
                        </span>

                        <span
                          className="font-semibold text-zinc-600 block mt-0.5 text-center w-full"
                          style={{ fontSize: "10.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}
                        >
                          {formatCardTime(record.startTime, record.endTime)}
                        </span>

                        <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
                          <span
                            className="px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-white/90 border border-zinc-200 text-zinc-700 shadow-2xs"
                            style={{ borderRadius: 0 }}
                          >
                            {record.examType || "Exam"}
                          </span>
                          <span
                            className="px-1.5 py-0.5 text-[9.5px] font-bold bg-white/90 border border-zinc-200 text-zinc-700 shadow-2xs"
                            style={{ borderRadius: 0 }}
                          >
                            {record.room || record.roomNumber || "Hall A"}
                          </span>
                          <span
                            className="px-1.5 py-0.5 text-[9.5px] font-bold bg-white/90 border border-zinc-200 text-zinc-700 shadow-2xs"
                            style={{ borderRadius: 0 }}
                          >
                            {record.totalMarks ?? 100} pts
                          </span>
                          {(record.isDualExamDay || afternoonExams.length > 0) && (
                            <span
                              className="px-1.5 py-0.5 text-[9.5px] font-bold bg-amber-100 border border-amber-300 text-amber-900 shadow-2xs"
                              style={{ borderRadius: 0 }}
                            >
                              Paper 1/2
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty Morning Slot */}
                  {morningExams.length === 0 && !isDayLocked && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverKey(`${dateStr}-morning`);
                      }}
                      onDragLeave={() => {
                        setDragOverKey(null);
                      }}
                      onDrop={(e) => handleDrop(e, dateStr, "09:00", "12:00", isDayLocked)}
                      onClick={() =>
                        onQuickAdd?.({
                          date: dateStr,
                          startTime: "09:00",
                          endTime: "12:00",
                        })
                      }
                      className={`datesheet-empty-slot ${
                        dragOverKey === `${dateStr}-morning` ? "is-drag-over" : ""
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      <Plus size={13} />
                      <span>+ Morning Paper</span>
                      <span style={{ fontSize: "9.5px", color: "#94a3b8" }}>09:00 – 12:00</span>
                    </div>
                  )}
                </div>

                {/* 2. Afternoon Shift (13:30 - 16:30) */}
                <div className="datesheet-session-slot">
                  <div className="datesheet-session-tag afternoon">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Sunset size={11} /> Afternoon Shift
                    </span>
                    <span>13:30 – 16:30</span>
                  </div>

                  {afternoonExams.map((record) => {
                    const theme = getSubjectTheme(record.subject);
                    const thisId = record._id || record.id;
                    const isDragging = draggingId === thisId;

                    return (
                      <div
                        key={thisId}
                        draggable={true}
                        onDragStart={(e) => {
                          isDragGesture.current = true;
                          e.dataTransfer.setData("text/plain", thisId);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingId(thisId);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOverKey(null);
                          setTimeout(() => {
                            isDragGesture.current = false;
                          }, 50);
                        }}
                        onClick={() => {
                          if (!isDragGesture.current) onView?.(thisId);
                        }}
                        className={`datesheet-card group ${isDragging ? "is-dragging" : ""}`}
                        style={{
                          borderRadius: 0,
                          backgroundColor: isDragging ? "#e0e7ff" : theme.bg,
                          borderLeft: `4px solid ${theme.borderLeft}`,
                          borderBottom: "1px solid #cbd5e1",
                          borderRight: "1px solid #cbd5e1",
                          borderTop: "1px solid #e2e8f0",
                          boxSizing: "border-box",
                          padding: "8px 10px",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          if (!isDragging) e.currentTarget.style.backgroundColor = theme.hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          if (!isDragging) e.currentTarget.style.backgroundColor = theme.bg;
                        }}
                      >
                        {/* Hover action buttons */}
                        {onAction && (
                          <div
                            className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 flex items-center gap-0.5 bg-white/95 p-0.5 border border-zinc-200 shadow-2xs z-10"
                            style={{ borderRadius: 0 }}
                          >
                            <button
                              type="button"
                              className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer transition-colors"
                              title="View"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAction("view", thisId, record);
                              }}
                            >
                              <Eye size={11} />
                            </button>
                            <button
                              type="button"
                              className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer transition-colors"
                              title="Edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAction("edit", thisId, record);
                              }}
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              type="button"
                              className="p-1 text-zinc-600 hover:text-red-600 hover:bg-zinc-100 cursor-pointer transition-colors"
                              title="Delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAction("delete", thisId, record);
                              }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}

                        <span
                          className="font-extrabold text-zinc-900 block leading-tight tracking-tight text-center w-full"
                          style={{ fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                          title={record.subject}
                        >
                          {record.subject}
                        </span>

                        <span
                          className="font-semibold text-zinc-600 block mt-0.5 text-center w-full"
                          style={{ fontSize: "10.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}
                        >
                          {formatCardTime(record.startTime, record.endTime)}
                        </span>

                        <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
                          <span
                            className="px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-white/90 border border-zinc-200 text-zinc-700 shadow-2xs"
                            style={{ borderRadius: 0 }}
                          >
                            {record.examType || "Practical"}
                          </span>
                          <span
                            className="px-1.5 py-0.5 text-[9.5px] font-bold bg-white/90 border border-zinc-200 text-zinc-700 shadow-2xs"
                            style={{ borderRadius: 0 }}
                          >
                            {record.room || record.roomNumber || "Hall B"}
                          </span>
                          <span
                            className="px-1.5 py-0.5 text-[9.5px] font-bold bg-white/90 border border-zinc-200 text-zinc-700 shadow-2xs"
                            style={{ borderRadius: 0 }}
                          >
                            {record.totalMarks ?? 100} pts
                          </span>
                          {(record.isDualExamDay || morningExams.length > 0) && (
                            <span
                              className="px-1.5 py-0.5 text-[9.5px] font-bold bg-amber-100 border border-amber-300 text-amber-900 shadow-2xs"
                              style={{ borderRadius: 0 }}
                            >
                              Paper 2/2 (Rare)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty Afternoon Slot */}
                  {afternoonExams.length === 0 && !isDayLocked && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverKey(`${dateStr}-afternoon`);
                      }}
                      onDragLeave={() => {
                        setDragOverKey(null);
                      }}
                      onDrop={(e) => handleDrop(e, dateStr, "13:30", "16:30", isDayLocked)}
                      onClick={() =>
                        onQuickAdd?.({
                          date: dateStr,
                          startTime: "13:30",
                          endTime: "16:30",
                        })
                      }
                      className={`datesheet-empty-slot ${
                        morningExams.length > 0 ? "rare-add" : ""
                      } ${dragOverKey === `${dateStr}-afternoon` ? "is-drag-over" : ""}`}
                      style={{ borderRadius: 0 }}
                    >
                      <Plus size={13} />
                      <span>
                        {morningExams.length > 0 ? "+ Add 2nd Exam (Rare Case)" : "+ Afternoon Paper"}
                      </span>
                      <span style={{ fontSize: "9.5px", color: morningExams.length > 0 ? "#b45309" : "#94a3b8" }}>
                        13:30 – 16:30
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Evening / Other Exams (if any exist) */}
                {eveningExams.length > 0 && (
                  <div className="datesheet-session-slot">
                    <div className="datesheet-session-tag" style={{ color: "#7c3aed" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Moon size={11} /> Evening Shift
                      </span>
                      <span>16:30 – 19:30</span>
                    </div>
                    {eveningExams.map((record) => {
                      const theme = getSubjectTheme(record.subject);
                      const thisId = record._id || record.id;
                      return (
                        <div
                          key={thisId}
                          onClick={() => onView?.(thisId)}
                          className="datesheet-card"
                          style={{
                            borderRadius: 0,
                            backgroundColor: theme.bg,
                            borderLeft: `4px solid ${theme.borderLeft}`,
                            borderBottom: "1px solid #cbd5e1",
                            borderRight: "1px solid #cbd5e1",
                            borderTop: "1px solid #e2e8f0",
                            boxSizing: "border-box",
                            padding: "8px 10px",
                          }}
                        >
                          <span
                            className="font-extrabold text-zinc-900 block leading-tight tracking-tight text-center w-full"
                            style={{ fontSize: "13px" }}
                          >
                            {record.subject}
                          </span>
                          <span
                            className="font-semibold text-zinc-600 block mt-0.5 text-center w-full"
                            style={{ fontSize: "10.5px" }}
                          >
                            {formatCardTime(record.startTime, record.endTime)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. Quick Custom Time Button */}
                {!isDayLocked && (
                  <button
                    type="button"
                    onClick={() =>
                      onQuickAdd?.({
                        date: dateStr,
                        startTime: "10:00",
                        endTime: "13:00",
                        isCustom: true,
                      })
                    }
                    className="datesheet-custom-btn"
                    title="Enter custom time for this exam paper"
                    style={{ borderRadius: 0 }}
                  >
                    <Clock size={11} />
                    <span>+ Custom Time Paper</span>
                  </button>
                )}

                {/* Day Locked Indicator if already 2 exams */}
                {isDayLocked && (
                  <div className="datesheet-day-locked">
                    <Lock size={12} />
                    <span>Daily Limit Reached (2/2)</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
