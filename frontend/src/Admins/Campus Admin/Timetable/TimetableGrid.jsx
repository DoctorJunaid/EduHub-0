import React, { useState, useRef, useMemo } from "react";
import {
  Coffee,
  Pencil,
  Plus,
  Trash2,
  User,
  MapPin,
  BookOpen,
} from "lucide-react";
import {
  shiftDays,
  dayBlocks,
  minutes,
  timeLabel,
} from "../../../lib/schedule.js";

export const SLOT_HEIGHT_PX = 95;
const TIME_COLUMN_PX = 85;

const DEFAULT_GRID_START = 8 * 60;
const DEFAULT_GRID_END = 14 * 60 + 30;

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

function getSubjectTheme(subjectName = "", isBreak = false) {
  const lower = (subjectName || "").toLowerCase();
  if (isBreak || lower.includes("break") || lower.includes("lunch")) {
    return {
      borderLeft: "#d97706",
      bg: "#fef3c7",
      hoverBg: "#fde68a",
      text: "#92400e",
    };
  }
  if (
    lower.includes("math") ||
    lower.includes("algebra") ||
    lower.includes("calculus") ||
    lower.includes("geom")
  ) {
    return {
      borderLeft: "#2563eb",
      bg: "#eff6ff",
      hoverBg: "#dbeafe",
      text: "#1e40af",
    };
  }
  if (
    lower.includes("sci") ||
    lower.includes("phys") ||
    lower.includes("chem") ||
    lower.includes("bio")
  ) {
    return {
      borderLeft: "#059669",
      bg: "#ecfdf5",
      hoverBg: "#d1fae5",
      text: "#065f46",
    };
  }
  if (
    lower.includes("eng") ||
    lower.includes("urdu") ||
    lower.includes("lang") ||
    lower.includes("lit")
  ) {
    return {
      borderLeft: "#d97706",
      bg: "#fffbeb",
      hoverBg: "#fef3c7",
      text: "#92400e",
    };
  }
  if (
    lower.includes("comp") ||
    lower.includes("it") ||
    lower.includes("prog") ||
    lower.includes("code") ||
    lower.includes("ai")
  ) {
    return {
      borderLeft: "#7c3aed",
      bg: "#f5f3ff",
      hoverBg: "#ede9fe",
      text: "#5b21b6",
    };
  }
  if (
    lower.includes("hist") ||
    lower.includes("social") ||
    lower.includes("islam") ||
    lower.includes("geog") ||
    lower.includes("pak")
  ) {
    return {
      borderLeft: "#0d9488",
      bg: "#f0fdfa",
      hoverBg: "#ccfbf1",
      text: "#115e59",
    };
  }
  if (
    lower.includes("art") ||
    lower.includes("music") ||
    lower.includes("pe") ||
    lower.includes("sport") ||
    lower.includes("draw")
  ) {
    return {
      borderLeft: "#e11d48",
      bg: "#fff1f2",
      hoverBg: "#ffe4e6",
      text: "#9f1239",
    };
  }
  return {
    borderLeft: "#18181b",
    bg: "#f4f4f5",
    hoverBg: "#e4e4e7",
    text: "#18181b",
  };
}

// Check if a slot overlaps with ANY record EXCEPT the one currently being dragged
function slotOccupiedExcept(records, dayNum, slot, draggingId) {
  const slotStart = minutes(slot.start);
  const slotEnd = minutes(slot.end);
  return records.some(
    (record) =>
      record.id !== draggingId &&
      record._id !== draggingId &&
      record.days.includes(dayNum) &&
      minutes(record.startTime) < slotEnd &&
      minutes(record.endTime) > slotStart,
  );
}

function topForTime(startMinutes, gridStart) {
  return ((startMinutes - gridStart) / 60) * SLOT_HEIGHT_PX;
}

function heightForRange(startTime, endTime) {
  return ((minutes(endTime) - minutes(startTime)) / 60) * SLOT_HEIGHT_PX;
}

export default function TimetableGrid({
  records = [],
  week,
  matrixConfig,
  onView,
  onAction,
  onQuickAdd,
  onMoveClass,
}) {
  const days = matrixConfig?.days ?? [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const schedulableSlots = useMemo(() => {
    return matrixConfig?.timeSlots ?? [];
  }, [matrixConfig]);

  // Deduplicate break records by time slot — DB may store one doc per day,
  // so merge them into a single banner record spanning all their days.
  const breakRecords = useMemo(() => {
    const breakMap = new Map();
    for (const r of records) {
      const isBreakRecord =
        r.isBreak ||
        r.subject?.toLowerCase().includes("break") ||
        r.subject?.toLowerCase().includes("lunch");
      if (!isBreakRecord) continue;
      const key = `${r.startTime}-${r.endTime}`;
      if (!breakMap.has(key)) {
        breakMap.set(key, {
          ...r,
          subject: r.breakTitle || r.subject || "Break Interval",
          daysSet: new Set(
            Array.isArray(r.days) && r.days.length ? r.days : [1],
          ),
        });
      } else {
        const entry = breakMap.get(key);
        (Array.isArray(r.days) && r.days.length ? r.days : [1]).forEach((d) =>
          entry.daysSet.add(d),
        );
      }
    }
    return Array.from(breakMap.values()).map((b) => ({
      ...b,
      days: Array.from(b.daysSet),
    }));
  }, [records]);

  // Regular class cards — everything that isn't a break
  const classRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          !r.isBreak &&
          !r.subject?.toLowerCase().includes("break") &&
          !r.subject?.toLowerCase().includes("lunch"),
      ),
    [records],
  );

  // Dynamic grid bounds
  const { start, end } = useMemo(() => {
    if (!records.length) {
      return { start: DEFAULT_GRID_START, end: DEFAULT_GRID_END };
    }
    const recordStarts = records
      .map((r) => minutes(r.startTime))
      .filter((m) => !isNaN(m));
    const recordEnds = records
      .map((r) => minutes(r.endTime))
      .filter((m) => !isNaN(m));
    const minTime = Math.min(DEFAULT_GRID_START, ...recordStarts);
    const maxTime = Math.max(DEFAULT_GRID_END, ...recordEnds);
    return {
      start: Math.floor(minTime / 60) * 60,
      end: Math.ceil(maxTime / 60) * 60,
    };
  }, [records]);

  const height = ((end - start) / 60) * SLOT_HEIGHT_PX;

  const timeMarks = useMemo(() => {
    const marks = [];
    for (let t = start; t <= end; t += 60) marks.push(t);
    return marks;
  }, [start, end]);

  // Subject allocation reference table
  const uniqueSubjects = useMemo(() => {
    const map = new Map();
    for (const r of classRecords) {
      const key = (r.subject || "").trim().toLowerCase();
      if (!key || r.isBreak || key.includes("break") || key.includes("lunch"))
        continue;
      if (!map.has(key)) {
        map.set(key, {
          subject: r.subject,
          instructor: r.instructor || r.teacherName || "Assigned Teacher",
          room: r.room || r.roomNumber || "Room 101",
          count: 0,
          daysSet: new Set(),
          timesSet: new Set(),
          representativeRecordId: r.id || r._id,
          firstRecord: r,
        });
      }
      const entry = map.get(key);
      const recordDays = Array.isArray(r.days) && r.days.length ? r.days : [1];
      entry.count += recordDays.length;
      for (const d of recordDays) entry.daysSet.add(d);
      entry.timesSet.add(formatCardTime(r.startTime, r.endTime));
      if (r.instructor && entry.instructor === "Assigned Teacher")
        entry.instructor = r.instructor;
      if (r.room && entry.room === "Room 101") entry.room = r.room;
    }
    const dayAbbrs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return Array.from(map.values()).map((item) => ({
      ...item,
      daysFormatted: Array.from(item.daysSet)
        .sort((a, b) => a - b)
        .map((d) => dayAbbrs[d - 1] || `Day ${d}`)
        .join(", "),
      timesFormatted: Array.from(item.timesSet).join(", "),
    }));
  }, [classRecords]);

  // ─── Drag & Drop State ────────────────────────────────────────────────────
  const [draggingId, setDraggingId] = useState(null);
  const [dragOver, setDragOver] = useState(null); // { dayNum, slotId }
  // Track whether we're in a drag gesture to suppress the click-to-view on drop
  const isDragGesture = useRef(false);

  const gridColumns = `${TIME_COLUMN_PX}px repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-x-auto min-w-0 pb-4 select-none">
      {/* Main Timetable Matrix */}
      <div
        className="min-w-[850px] w-full border border-zinc-300 bg-white shadow-xs"
        style={{ borderRadius: 0 }}
        role="region"
        aria-label="Weekly class timetable"
      >
        {/* Day Headers */}
        <div
          className="grid min-h-[48px] bg-zinc-100 border-b border-zinc-300"
          style={{ gridTemplateColumns: gridColumns, borderRadius: 0 }}
        >
          <div className="w-[85px] text-center py-2.5 text-[11px] font-bold text-zinc-600 uppercase tracking-wider flex items-center justify-center border-r border-zinc-300">
            Time
          </div>
          {days.map((day, index) => (
            <div
              key={day}
              className="flex flex-col items-center justify-center gap-0.5 border-r last:border-r-0 border-zinc-300 py-2.5 bg-zinc-100"
            >
              <div className="flex items-center gap-1">
                <strong className="text-[12.5px] font-bold text-zinc-900">
                  {day}
                </strong>
              </div>
              <span className="text-[10px] font-medium text-zinc-500">
                {shiftDays(week, index).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div
          className="relative grid"
          style={{
            height: `${height}px`,
            gridTemplateColumns: gridColumns,
            borderRadius: 0,
          }}
        >
          {/* Hour guide lines */}
          {timeMarks.map((mark) => (
            <div
              key={`hour-guide-${mark}`}
              className="absolute left-0 right-0 border-b border-zinc-200/60 pointer-events-none z-0"
              style={{ top: `${topForTime(mark, start)}px` }}
            />
          ))}

          {/* Time Column */}
          <div
            className="relative border-r border-zinc-300 w-[85px] bg-zinc-50/70"
            style={{ borderRadius: 0 }}
          >
            {timeMarks.map((mark) => (
              <span
                key={mark}
                className="absolute left-0 right-0 text-center text-[10.5px] font-bold text-zinc-500 -translate-y-1/2 first:translate-y-0 first:top-[2px] last:-translate-y-full px-1"
                style={{ top: `${topForTime(mark, start)}px` }}
              >
                {timeLabel(
                  `${String(Math.floor(mark / 60)).padStart(2, "0")}:${String(mark % 60).padStart(2, "0")}`,
                )}
              </span>
            ))}
          </div>

          {/* Break banners */}
          {breakRecords.map((bRecord) => {
            const breakTop = topForTime(minutes(bRecord.startTime), start);
            const breakHeight = heightForRange(
              bRecord.startTime,
              bRecord.endTime,
            );
            return (
              <div
                key={bRecord.id || bRecord._id || `break-${bRecord.startTime}`}
                className="absolute z-10 right-0 flex items-center justify-between px-5 text-amber-950 pointer-events-auto transition-all group select-none shadow-xs"
                style={{
                  top: `${breakTop}px`,
                  height: `${breakHeight}px`,
                  left: `${TIME_COLUMN_PX}px`,
                  borderRadius: 0,
                  borderTop: "2px solid #f59e0b",
                  borderBottom: "2px solid #f59e0b",
                  background:
                    "repeating-linear-gradient(45deg, #fffbeb, #fffbeb 12px, #fef3c7 12px, #fef3c7 24px)",
                  boxSizing: "border-box",
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-8 h-8 bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs"
                    style={{ borderRadius: 0 }}
                  >
                    <Coffee size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <strong className="text-[13.5px] font-extrabold tracking-tight text-amber-950 truncate">
                        {bRecord.subject || "Campus Break Interval"}
                      </strong>
                      <span
                        className="text-[11.5px] font-bold text-amber-900 bg-white/95 border border-amber-300 px-2.5 py-0.5 shrink-0 shadow-2xs whitespace-nowrap"
                        style={{ borderRadius: 0 }}
                      >
                        {formatCardTime(bRecord.startTime, bRecord.endTime)}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-amber-800 hidden sm:inline-block mt-0.5">
                      Campus-Wide Scheduled Interval • All Teaching Sessions
                      Paused
                    </span>
                  </div>
                </div>
                {onAction && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 shrink-0 ml-3">
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 text-[11.5px] font-bold hover:bg-amber-100 cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                      style={{ borderRadius: 0 }}
                      onClick={() =>
                        onAction("edit", bRecord.id || bRecord._id, bRecord)
                      }
                    >
                      <Pencil size={12} />
                      <span>Edit Break</span>
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-white border border-red-200 text-red-700 text-[11.5px] font-bold hover:bg-red-50 cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                      style={{ borderRadius: 0 }}
                      onClick={() =>
                        onAction("delete", bRecord.id || bRecord._id, bRecord)
                      }
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Weekday Columns */}
          {days.map((day, index) => {
            const dayNum = index + 1;
            return (
              <div
                className="relative border-r last:border-r-0 border-zinc-300"
                key={day}
                style={{ borderRadius: 0 }}
              >
                {/* Drop Targets — all schedulable slots, excluding occupied ones (except the dragged card's own slot) */}
                {schedulableSlots.map((slot) => {
                  const isOccupied = slotOccupiedExcept(
                    classRecords,
                    dayNum,
                    slot,
                    draggingId,
                  );
                  const isInBreak = breakRecords.some((b) => {
                    const bStart = minutes(b.startTime);
                    const bEnd = minutes(b.endTime);
                    const sStart = minutes(slot.start);
                    const sEnd = minutes(slot.end);
                    return Math.max(bStart, sStart) < Math.min(bEnd, sEnd);
                  });

                  const isDragging = draggingId !== null;
                  if (isOccupied || isInBreak) return null;

                  const isOver =
                    dragOver?.dayNum === dayNum && dragOver?.slotId === slot.id;
                  const slotTop = topForTime(minutes(slot.start), start);
                  const slotHeight = heightForRange(slot.start, slot.end);

                  return (
                    <div
                      key={`${day}-${slot.id}`}
                      onDragEnter={(e) => e.preventDefault()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (
                          dragOver?.dayNum !== dayNum ||
                          dragOver?.slotId !== slot.id
                        ) {
                          setDragOver({ dayNum, slotId: slot.id, slot });
                        }
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          if (
                            dragOver?.dayNum === dayNum &&
                            dragOver?.slotId === slot.id
                          ) {
                            setDragOver(null);
                          }
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const data = e.dataTransfer.getData("text/plain");
                        let recordId = data;
                        let sourceDay = dayNum;
                        if (data && data.includes("|")) {
                          const parts = data.split("|");
                          recordId = parts[0];
                          sourceDay = parseInt(parts[1], 10);
                        } else if (!data) {
                          recordId = draggingId;
                        }
                        setDraggingId(null);
                        setDragOver(null);
                        if (recordId) {
                          onMoveClass?.(
                            recordId,
                            dayNum,
                            slot.start,
                            sourceDay,
                          );
                        }
                      }}
                      className={`absolute left-0 right-0 transition-all flex items-center justify-center group ${
                        isOver
                          ? "border-2 border-blue-500 bg-blue-50/90 shadow-inner z-20"
                          : isDragging
                            ? "border border-dashed border-blue-200 bg-blue-50/30 z-10 cursor-copy"
                            : isOccupied
                              ? "z-0 pointer-events-none"
                              : "border-b border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80 cursor-pointer z-0"
                      }`}
                      style={{
                        top: `${slotTop}px`,
                        height: `${slotHeight}px`,
                        borderRadius: 0,
                        boxSizing: "border-box",
                      }}
                      onClick={() => {
                        if (!isDragging && !isOccupied && onQuickAdd) {
                          onQuickAdd({
                            days: [dayNum],
                            startTime: slot.start,
                            endTime: slot.end,
                          });
                        }
                      }}
                    >
                      {isOver && (
                        <div className="flex flex-col items-center gap-0.5 pointer-events-none">
                          <span className="text-[11px] font-bold text-blue-700 animate-pulse whitespace-nowrap">
                            Move to {day}
                          </span>
                          <span className="text-[9.5px] text-blue-600 font-medium whitespace-nowrap">
                            {timeLabel(slot.start)}
                          </span>
                        </div>
                      )}
                      {!isOver && !isDragging && !isOccupied && onQuickAdd && (
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-300 text-zinc-800 text-[11px] font-bold hover:bg-zinc-900 hover:text-white hover:border-zinc-900 cursor-pointer shadow-2xs whitespace-nowrap"
                          style={{ borderRadius: 0 }}
                          aria-label={`Schedule on ${day} ${slot.start}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickAdd({
                              days: [dayNum],
                              startTime: slot.start,
                              endTime: slot.end,
                            });
                          }}
                        >
                          <Plus size={12} />
                          <span>Schedule</span>
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Class Period Cards */}
                {dayBlocks(classRecords, dayNum).map(
                  ({ record, lane, laneCount }) => {
                    const theme = getSubjectTheme(
                      record.subject,
                      record.isBreak,
                    );
                    const thisId = record.id || record._id;
                    const isThisDragging = draggingId === thisId;
                    const cardTop = topForTime(
                      minutes(record.startTime),
                      start,
                    );
                    const cardHeight = heightForRange(
                      record.startTime,
                      record.endTime,
                    );
                    const leftPercent = (lane / laneCount) * 100;
                    const widthPercent = 100 / laneCount;

                    return (
                      <div
                        key={thisId}
                        draggable={true}
                        onDragStart={(e) => {
                          isDragGesture.current = true;
                          e.dataTransfer.setData(
                            "text/plain",
                            `${thisId}|${dayNum}`,
                          );
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingId(thisId);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOver(null);
                          setTimeout(() => {
                            isDragGesture.current = false;
                          }, 50);
                        }}
                        className={`absolute group transition-all select-none ${
                          isThisDragging
                            ? "opacity-40 shadow-lg cursor-grabbing z-30 pointer-events-none"
                            : "cursor-grab active:cursor-grabbing hover:z-30 z-[2]"
                        }`}
                        style={{
                          top: `${cardTop}px`,
                          height: `${cardHeight}px`,
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          borderRadius: 0,
                        }}
                        onClick={() => {
                          if (!isDragGesture.current) {
                            onView?.(thisId);
                          }
                        }}
                      >
                        <div
                          className="w-full h-full flex flex-col items-center justify-center text-center overflow-hidden transition-all shadow-xs hover:shadow-md relative"
                          style={{
                            borderRadius: 0,
                            backgroundColor: isThisDragging
                              ? "#e0e7ff"
                              : theme.bg,
                            borderLeft: `4px solid ${theme.borderLeft}`,
                            borderBottom: "1px solid #cbd5e1",
                            borderRight: "1px solid #cbd5e1",
                            boxSizing: "border-box",
                            padding: "6px 12px",
                            opacity: isThisDragging ? 0.5 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!isThisDragging)
                              e.currentTarget.style.backgroundColor =
                                theme.hoverBg;
                          }}
                          onMouseLeave={(e) => {
                            if (!isThisDragging)
                              e.currentTarget.style.backgroundColor = theme.bg;
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
                                title="Edit Period"
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
                                title="Remove Period"
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
                            style={{
                              fontSize: "13px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={record.subject}
                          >
                            {record.subject}
                          </span>
                          <span
                            className="font-semibold text-zinc-500 block mt-1 text-center w-full"
                            style={{
                              fontSize: "10.5px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: 1.2,
                            }}
                          >
                            {formatCardTime(record.startTime, record.endTime)}
                          </span>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!records.length && (
        <div
          className="p-8 text-center bg-white border border-dashed border-zinc-300 mt-4 shadow-xs"
          style={{ borderRadius: 0 }}
        >
          <p className="text-sm font-bold text-zinc-800">
            No scheduled periods for this class yet.
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Click any empty period cell above or use the "＋ Schedule Period"
            button to build this class routine.
          </p>
        </div>
      )}

      {/* Subject & Teacher Allocation Reference Table */}
      <div
        className="mt-6 border border-zinc-300 bg-white shadow-xs"
        style={{ borderRadius: 0 }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-50 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 bg-zinc-900 text-white flex items-center justify-center text-xs font-bold"
              style={{ borderRadius: 0 }}
            >
              <BookOpen size={14} />
            </div>
            <div>
              <h4 className="text-[12px] font-extrabold text-zinc-900 uppercase tracking-wider m-0">
                Subject & Faculty Allocation Directory
              </h4>
              <span className="text-[11px] text-zinc-500 font-medium">
                Reference map for assigned subject teachers, classrooms, and
                weekly teaching loads
              </span>
            </div>
          </div>
          <span
            className="text-[11px] font-bold px-2.5 py-1 bg-zinc-200 text-zinc-900"
            style={{ borderRadius: 0 }}
          >
            {uniqueSubjects.length}{" "}
            {uniqueSubjects.length === 1 ? "Subject" : "Subjects"} Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/70 text-[10.5px] font-extrabold text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Subject / Course</th>
                <th className="py-2.5 px-4">Assigned Teacher</th>
                <th className="py-2.5 px-4">Classroom / Lab</th>
                <th className="py-2.5 px-4">Weekly Sessions</th>
                <th className="py-2.5 px-4">Scheduled Days</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {uniqueSubjects.map((item) => {
                const theme = getSubjectTheme(item.subject);
                return (
                  <tr
                    key={item.subject}
                    className="hover:bg-zinc-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 shrink-0"
                          style={{ backgroundColor: theme.borderLeft }}
                        />
                        <span className="font-extrabold text-[12.5px] text-zinc-900">
                          {item.subject}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-700 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-zinc-400 shrink-0" />
                        <span className="font-bold text-zinc-800">
                          {item.instructor}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-700 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-zinc-400 shrink-0" />
                        <span
                          className="px-2 py-0.5 bg-zinc-100 border border-zinc-300 font-bold text-zinc-800 text-[11px]"
                          style={{ borderRadius: 0 }}
                        >
                          {item.room}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-700 font-bold">
                      <span
                        className="px-2.5 py-0.5 bg-zinc-100 text-zinc-900 font-bold text-[11px] border border-zinc-200"
                        style={{ borderRadius: 0 }}
                      >
                        {item.count} {item.count === 1 ? "Period" : "Periods"} /
                        week
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 font-medium text-[11px]">
                      <span className="font-semibold text-zinc-800">
                        {item.daysFormatted}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onAction?.(
                            "edit",
                            item.representativeRecordId,
                            item.firstRecord,
                          )
                        }
                        className="px-2.5 py-1 text-[11px] font-bold bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 cursor-pointer shadow-2xs transition-colors"
                        style={{ borderRadius: 0 }}
                      >
                        <Pencil size={11} className="inline mr-1" />
                        Edit Period
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!uniqueSubjects.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-zinc-400 text-xs"
                  >
                    No subjects scheduled for this routine yet. Add periods
                    above to populate this directory.
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
