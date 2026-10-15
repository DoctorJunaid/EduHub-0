import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  Coffee,
  Pencil,
  Plus,
  Trash2,
  User,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import {
  shiftDays,
  dayBlocks,
  minutes,
  timeLabel,
} from "../../../lib/schedule.js";

// ─── Constants ────────────────────────────────────────────────────────────────
export const PX_PER_HOUR = 96;
export const PX_PER_MIN = PX_PER_HOUR / 60;
export const SNAP_MINUTES = 5;
export const TIME_COL_PX = 72;

const DEFAULT_GRID_START = 8 * 60;
const DEFAULT_GRID_END   = 17 * 60;

// ─── Utilities ────────────────────────────────────────────────────────────────
function minToTop(m, gridStart) {
  return (m - gridStart) * PX_PER_MIN;
}

function minToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function heightForDuration(durationMin) {
  return durationMin * PX_PER_MIN;
}

function formatCardTime(startTime, endTime) {
  const s = timeLabel(startTime);
  const e = timeLabel(endTime);
  const sm = s.slice(-2);
  const em = e.slice(-2);
  if (sm === em) return `${s.slice(0, -3)} – ${e}`;
  return `${s} – ${e}`;
}

// ─── Subject colour theming ───────────────────────────────────────────────────
const THEMES = [
  { borderLeft: "#2563eb", bg: "rgba(239,246,255,0.92)", hoverBg: "rgba(219,234,254,0.97)", text: "#1e40af" },
  { borderLeft: "#059669", bg: "rgba(236,253,245,0.92)", hoverBg: "rgba(209,250,229,0.97)", text: "#065f46" },
  { borderLeft: "#7c3aed", bg: "rgba(245,243,255,0.92)", hoverBg: "rgba(237,233,254,0.97)", text: "#5b21b6" },
  { borderLeft: "#d97706", bg: "rgba(255,251,235,0.92)", hoverBg: "rgba(254,243,199,0.97)", text: "#92400e" },
  { borderLeft: "#e11d48", bg: "rgba(255,241,242,0.92)", hoverBg: "rgba(255,228,230,0.97)", text: "#9f1239" },
  { borderLeft: "#0d9488", bg: "rgba(240,253,250,0.92)", hoverBg: "rgba(204,251,241,0.97)", text: "#115e59" },
  { borderLeft: "#db2777", bg: "rgba(253,242,248,0.92)", hoverBg: "rgba(251,228,245,0.97)", text: "#9d174d" },
  { borderLeft: "#6366f1", bg: "rgba(238,242,255,0.92)", hoverBg: "rgba(224,231,255,0.97)", text: "#3730a3" },
];

const subjectThemeCache = new Map();
function getSubjectTheme(subjectName = "", isBreak = false) {
  if (isBreak) return { borderLeft: "#d97706", bg: "rgba(255,251,235,0.88)", hoverBg: "rgba(254,243,199,0.97)", text: "#92400e" };
  const key = (subjectName || "").trim().toLowerCase();
  if (!subjectThemeCache.has(key)) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
    subjectThemeCache.set(key, THEMES[Math.abs(hash) % THEMES.length]);
  }
  return subjectThemeCache.get(key);
}

// ─── Overlap detection ────────────────────────────────────────────────────────
function findConflicts(records) {
  const conflictIds = new Set();
  for (let i = 0; i < records.length; i++) {
    const a = records[i];
    if (a.isBreak) continue;
    const aStart = minutes(a.startTime);
    const aEnd   = minutes(a.endTime);
    const aDays  = Array.isArray(a.days) && a.days.length ? a.days : [];
    for (let j = i + 1; j < records.length; j++) {
      const b = records[j];
      if (b.isBreak) continue;
      const bStart = minutes(b.startTime);
      const bEnd   = minutes(b.endTime);
      const bDays  = Array.isArray(b.days) && b.days.length ? b.days : [];
      const sharedDays = aDays.filter(d => bDays.includes(d));
      if (!sharedDays.length) continue;
      const overlaps = Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
      if (overlaps) {
        conflictIds.add(a._id || a.id);
        conflictIds.add(b._id || b.id);
      }
    }
  }
  return conflictIds;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TimetableGrid({
  records = [],
  week,
  matrixConfig,
  onView,
  onAction,
  onQuickAdd,
  onMoveClass,
}) {
  const days = matrixConfig?.days ?? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const gridColumns = `${TIME_COL_PX}px repeat(${days.length}, minmax(0, 1fr))`;

  // ── Break records ──────────────────────────────────────────────────────────
  const breakRecords = useMemo(() => {
    const m = new Map();
    for (const r of records) {
      const isB = r.isBreak || r.subject?.toLowerCase().includes("break") || r.subject?.toLowerCase().includes("lunch");
      if (!isB) continue;
      const key = `${r.startTime}-${r.endTime}`;
      if (!m.has(key)) {
        m.set(key, { ...r, subject: r.breakTitle || r.subject || "Break", daysSet: new Set(Array.isArray(r.days) && r.days.length ? r.days : [1]) });
      } else {
        (Array.isArray(r.days) && r.days.length ? r.days : [1]).forEach(d => m.get(key).daysSet.add(d));
      }
    }
    return Array.from(m.values()).map(b => ({ ...b, days: Array.from(b.daysSet) }));
  }, [records]);

  // ── Class records ──────────────────────────────────────────────────────────
  const classRecords = useMemo(() =>
    records.filter(r => !r.isBreak && !r.subject?.toLowerCase().includes("break") && !r.subject?.toLowerCase().includes("lunch")),
    [records]
  );

  // ── Grid bounds ────────────────────────────────────────────────────────────
  const { gridStart, gridEnd } = useMemo(() => {
    if (!records.length) return { gridStart: DEFAULT_GRID_START, gridEnd: DEFAULT_GRID_END };
    const allStarts = records.map(r => minutes(r.startTime)).filter(m => !isNaN(m));
    const allEnds   = records.map(r => minutes(r.endTime)).filter(m => !isNaN(m));
    const minT = allStarts.length ? Math.min(DEFAULT_GRID_START, ...allStarts) : DEFAULT_GRID_START;
    const maxT = allEnds.length   ? Math.max(DEFAULT_GRID_END,   ...allEnds)   : DEFAULT_GRID_END;
    return {
      gridStart: Math.floor(minT / 60) * 60,
      gridEnd:   Math.ceil(maxT  / 60) * 60,
    };
  }, [records]);

  const gridHeight = (gridEnd - gridStart) * PX_PER_MIN;

  const hourMarks = useMemo(() => {
    const m = [];
    for (let t = gridStart; t <= gridEnd; t += 60) m.push(t);
    return m;
  }, [gridStart, gridEnd]);

  const halfHourMarks = useMemo(() => {
    const m = [];
    for (let t = gridStart + 30; t < gridEnd; t += 60) m.push(t);
    return m;
  }, [gridStart, gridEnd]);

  // ── Conflict detection ─────────────────────────────────────────────────────
  const conflictIds = useMemo(() => findConflicts(classRecords), [classRecords]);

  // ── Subject allocation table ───────────────────────────────────────────────
  const uniqueSubjects = useMemo(() => {
    const map = new Map();
    for (const r of classRecords) {
      const key = (r.subject || "").trim().toLowerCase();
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          subject: r.subject,
          instructor: r.instructor || r.teacherName || "—",
          count: 0,
          daysSet: new Set(),
          timesSet: new Set(),
          representativeRecordId: r.id || r._id,
          firstRecord: r,
        });
      }
      const entry = map.get(key);
      const rDays = Array.isArray(r.days) && r.days.length ? r.days : [1];
      entry.count += rDays.length;
      for (const d of rDays) entry.daysSet.add(d);
      entry.timesSet.add(formatCardTime(r.startTime, r.endTime));
      if (r.instructor && entry.instructor === "—") entry.instructor = r.instructor;
    }
    const abbrs = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    return Array.from(map.values()).map(item => ({
      ...item,
      daysFormatted: Array.from(item.daysSet).sort((a,b) => a-b).map(d => abbrs[d-1] || `D${d}`).join(", "),
      timesFormatted: Array.from(item.timesSet).join(", "),
    }));
  }, [classRecords]);

  // ── 5-minute pointer drag-and-drop ────────────────────────────────────────
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos]   = useState(null);
  const colRefs = useRef({});
  const isDragGesture = useRef(false);

  const handleCardPointerDown = useCallback((e, record, dayNum) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const id = record._id || record.id;
    const startMin = minutes(record.startTime);
    const durMin   = Math.max(minutes(record.endTime) - startMin, SNAP_MINUTES);
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetMin = ((e.clientY - rect.top) / PX_PER_MIN);
    isDragGesture.current = true;
    setDragging({ id, dayNum, durMin, offsetMin: Math.min(offsetMin, durMin - SNAP_MINUTES), record });
    setDragPos(null);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handleGridPointerMove = useCallback((e, colIdx) => {
    if (!dragging) return;
    e.preventDefault();
    const ref = colRefs.current[colIdx];
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const rawMin = (relY - dragging.offsetMin * PX_PER_MIN) / PX_PER_MIN + gridStart;
    const snapped = Math.round(rawMin / SNAP_MINUTES) * SNAP_MINUTES;
    const clampedStart = Math.max(gridStart, Math.min(snapped, gridEnd - dragging.durMin));
    setDragPos({ dayNum: colIdx + 1, snappedStartMin: clampedStart });
  }, [dragging, gridStart, gridEnd]);

  const handleGridPointerUp = useCallback(() => {
    if (!dragging || !dragPos) {
      setDragging(null);
      setDragPos(null);
      setTimeout(() => { isDragGesture.current = false; }, 50);
      return;
    }
    const targetStartTime = minToTime(dragPos.snappedStartMin);
    onMoveClass?.(dragging.id, dragPos.dayNum, targetStartTime, dragging.dayNum);
    setDragging(null);
    setDragPos(null);
    setTimeout(() => { isDragGesture.current = false; }, 50);
  }, [dragging, dragPos, onMoveClass]);

  const handleCellClick = useCallback((e, dayNum) => {
    if (dragging || isDragGesture.current) return;
    const ref = colRefs.current[dayNum - 1];
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const rawMin = relY / PX_PER_MIN + gridStart;
    const snapped = Math.round(rawMin / SNAP_MINUTES) * SNAP_MINUTES;
    onQuickAdd?.({ days: [dayNum], startTime: minToTime(snapped), endTime: minToTime(snapped + 50) });
  }, [dragging, gridStart, onQuickAdd]);

  return (
    <div className="overflow-x-auto min-w-0 pb-4 select-none">
      {/* Conflict banner */}
      {conflictIds.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 16px",
            background: "rgba(254,226,226,0.95)",
            border: "1.5px solid #fca5a5",
            borderRadius: "10px",
            marginBottom: "10px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#b91c1c",
          }}
          role="alert"
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>
            {conflictIds.size} period{conflictIds.size > 1 ? "s have" : " has"} overlapping time conflicts — highlighted in red below. Please resolve before publishing.
          </span>
        </div>
      )}

      {/* Main grid */}
      <div
        className="min-w-[780px] w-full border border-zinc-200 bg-white/80 shadow-sm"
        style={{ backdropFilter: "blur(6px)", borderRadius: "12px", overflow: "hidden" }}
        role="region"
        aria-label="Weekly class timetable"
      >
        {/* Day headers */}
        <div
          className="grid border-b border-zinc-200"
          style={{ gridTemplateColumns: gridColumns, background: "rgba(249,250,251,0.9)" }}
        >
          <div
            className="flex items-center justify-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-200"
            style={{ width: TIME_COL_PX, padding: "12px 0" }}
          >
            Time
          </div>
          {days.map((day, idx) => (
            <div
              key={day}
              className="flex flex-col items-center justify-center py-3 border-r last:border-r-0 border-zinc-200"
            >
              <strong className="text-[13px] font-bold text-zinc-800">{day}</strong>
              <span className="text-[10.5px] text-zinc-400 font-medium mt-0.5">
                {shiftDays(week, idx).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div
          className="grid relative"
          style={{ height: `${gridHeight}px`, gridTemplateColumns: gridColumns }}
          onPointerUp={dragging ? handleGridPointerUp : undefined}
          onPointerCancel={() => { setDragging(null); setDragPos(null); isDragGesture.current = false; }}
        >
          {/* Hour lines */}
          {hourMarks.map(mark => (
            <div
              key={`h-${mark}`}
              className="absolute left-0 right-0 border-t border-zinc-200 pointer-events-none z-0"
              style={{ top: `${minToTop(mark, gridStart)}px` }}
            />
          ))}
          {/* Half-hour dashed lines */}
          {halfHourMarks.map(mark => (
            <div
              key={`hh-${mark}`}
              className="absolute left-0 right-0 pointer-events-none z-0"
              style={{ top: `${minToTop(mark, gridStart)}px`, borderTop: "1px dashed rgba(0,0,0,0.06)" }}
            />
          ))}

          {/* Time labels */}
          <div
            className="relative border-r border-zinc-200"
            style={{ width: TIME_COL_PX, background: "rgba(249,250,251,0.7)", flexShrink: 0 }}
          >
            {hourMarks.map(mark => (
              <span
                key={mark}
                className="absolute left-0 right-0 text-center text-[10px] font-bold text-zinc-400 -translate-y-1/2 px-1"
                style={{ top: `${minToTop(mark, gridStart)}px` }}
              >
                {timeLabel(`${String(Math.floor(mark / 60)).padStart(2,"0")}:00`)}
              </span>
            ))}
          </div>

          {/* Break banners */}
          {breakRecords.map(bRecord => {
            const bTop = minToTop(minutes(bRecord.startTime), gridStart);
            const bH   = heightForDuration(minutes(bRecord.endTime) - minutes(bRecord.startTime));
            return (
              <div
                key={bRecord.id || bRecord._id || `break-${bRecord.startTime}`}
                className="absolute z-10 flex items-center justify-between px-4 pointer-events-auto group"
                style={{
                  top:    `${bTop}px`,
                  height: `${bH}px`,
                  left:   `${TIME_COL_PX}px`,
                  right:  0,
                  background: "repeating-linear-gradient(45deg,rgba(255,251,235,0.95),rgba(255,251,235,0.95) 12px,rgba(254,243,199,0.9) 12px,rgba(254,243,199,0.9) 24px)",
                  borderTop:    "2px solid #f59e0b",
                  borderBottom: "2px solid #f59e0b",
                  boxSizing: "border-box",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Coffee size={15} />
                  </div>
                  <div className="min-w-0">
                    <strong className="text-[13px] font-extrabold text-amber-900 truncate block">{bRecord.subject || "Break"}</strong>
                    <span className="text-[10.5px] font-semibold text-amber-700">{formatCardTime(bRecord.startTime, bRecord.endTime)}</span>
                  </div>
                </div>
                {onAction && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onAction("edit", bRecord.id || bRecord._id, bRecord)}
                      className="px-2.5 py-1 bg-white border border-amber-300 text-amber-800 text-[11px] font-bold rounded-md hover:bg-amber-50 cursor-pointer flex items-center gap-1"
                    >
                      <Pencil size={11} /><span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction("delete", bRecord.id || bRecord._id, bRecord)}
                      className="px-2.5 py-1 bg-white border border-red-200 text-red-600 text-[11px] font-bold rounded-md hover:bg-red-50 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={11} /><span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Day columns */}
          {days.map((day, idx) => {
            const dayNum = idx + 1;
            const isDropTarget = dragPos?.dayNum === dayNum;
            return (
              <div
                key={day}
                ref={el => { colRefs.current[idx] = el; }}
                className="relative border-r last:border-r-0 border-zinc-200"
                style={{ cursor: dragging ? "grabbing" : "default" }}
                onPointerMove={dragging ? (e) => handleGridPointerMove(e, idx) : undefined}
                onClick={(e) => {
                  if (!dragging && !isDragGesture.current) handleCellClick(e, dayNum);
                }}
              >
                {/* Ghost drop preview */}
                {dragging && isDropTarget && dragPos && (
                  <div
                    className="absolute left-1 right-1 rounded-lg border-2 border-blue-400 bg-blue-50/80 flex items-center justify-center z-20 pointer-events-none"
                    style={{
                      top:    `${minToTop(dragPos.snappedStartMin, gridStart)}px`,
                      height: `${heightForDuration(dragging.durMin)}px`,
                    }}
                  >
                    <span className="text-[11px] font-bold text-blue-600 animate-pulse">
                      {minToTime(dragPos.snappedStartMin)} → {minToTime(dragPos.snappedStartMin + dragging.durMin)}
                    </span>
                  </div>
                )}

                {/* Hover "+" quick-add */}
                {!dragging && onQuickAdd && (
                  <div className="absolute top-2 right-2 z-10 opacity-0 hover:opacity-100 transition-opacity group/col pointer-events-none">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-zinc-300 text-zinc-600 text-[10px] font-bold rounded-md hover:bg-zinc-900 hover:text-white shadow-xs cursor-pointer pointer-events-auto"
                      onClick={(e) => { e.stopPropagation(); onQuickAdd({ days: [dayNum], startTime: "08:00", endTime: "08:50" }); }}
                      aria-label={`Add class on ${day}`}
                    >
                      <Plus size={10} /> Add
                    </button>
                  </div>
                )}

                {/* Class cards */}
                {dayBlocks(classRecords, dayNum).map(({ record, lane, laneCount }) => {
                  const id       = record._id || record.id;
                  const startMin = minutes(record.startTime);
                  const durMin   = minutes(record.endTime) - startMin;
                  const theme    = getSubjectTheme(record.subject, record.isBreak);
                  const isDraggingThis = dragging?.id === id;
                  const hasConflict   = conflictIds.has(id);
                  const leftPct  = (lane / laneCount) * 100;
                  const widthPct = 100 / laneCount;
                  const cardTop  = minToTop(startMin, gridStart);
                  const cardH    = heightForDuration(Math.max(durMin, SNAP_MINUTES));

                  return (
                    <div
                      key={id}
                      className={`absolute group transition-shadow select-none rounded-lg ${isDraggingThis ? "opacity-30 z-50 cursor-grabbing" : "z-[5] cursor-grab active:cursor-grabbing hover:z-20 hover:shadow-md"}`}
                      style={{
                        top:    `${cardTop}px`,
                        height: `${cardH}px`,
                        left:   `calc(${leftPct}% + 3px)`,
                        width:  `calc(${widthPct}% - 6px)`,
                        touchAction: "none",
                      }}
                      onPointerDown={e => { e.stopPropagation(); handleCardPointerDown(e, record, dayNum); }}
                      onPointerUp={e => { e.stopPropagation(); handleGridPointerUp(); }}
                      onClick={() => { if (!isDragGesture.current) onView?.(id); }}
                    >
                      <div
                        className="w-full h-full flex flex-col items-start justify-start overflow-hidden relative"
                        style={{
                          borderRadius: "8px",
                          backgroundColor: isDraggingThis ? "rgba(224,231,255,0.9)" : theme.bg,
                          borderLeft: `3px solid ${hasConflict ? "#ef4444" : theme.borderLeft}`,
                          outline: hasConflict ? "1.5px solid rgba(239,68,68,0.4)" : "1px solid rgba(0,0,0,0.06)",
                          boxSizing: "border-box",
                          padding: cardH < 36 ? "2px 8px" : "5px 9px",
                          backdropFilter: "blur(4px)",
                          transition: "background-color 0.1s ease",
                        }}
                        onMouseEnter={e => { if (!isDraggingThis) e.currentTarget.style.backgroundColor = theme.hoverBg; }}
                        onMouseLeave={e => { if (!isDraggingThis) e.currentTarget.style.backgroundColor = theme.bg; }}
                      >
                        {/* Action buttons */}
                        {onAction && (
                          <div
                            className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 flex items-center gap-0.5 bg-white/95 p-0.5 rounded border border-zinc-200 shadow-xs z-10"
                            onPointerDown={e => e.stopPropagation()}
                          >
                            <button type="button" title="Edit"
                              className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded cursor-pointer"
                              onClick={e => { e.stopPropagation(); onAction("edit", id, record); }}>
                              <Pencil size={10} />
                            </button>
                            <button type="button" title="Delete"
                              className="p-1 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 rounded cursor-pointer"
                              onClick={e => { e.stopPropagation(); onAction("delete", id, record); }}>
                              <Trash2 size={10} />
                            </button>
                          </div>
                        )}
                        <span
                          className="font-extrabold text-zinc-900 block leading-tight"
                          style={{ fontSize: cardH < 40 ? "10.5px" : "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}
                          title={record.subject}
                        >
                          {hasConflict && <AlertTriangle size={9} className="inline mr-1 text-red-500" />}
                          {record.subject}
                        </span>
                        {cardH >= 44 && (
                          <span
                            className="block mt-0.5 text-zinc-500 font-semibold"
                            style={{ fontSize: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}
                          >
                            {formatCardTime(record.startTime, record.endTime)}
                          </span>
                        )}
                        {cardH >= 62 && (record.instructor || record.teacherName) && (
                          <span
                            className="block mt-0.5 text-zinc-400 font-medium"
                            style={{ fontSize: "9.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}
                          >
                            {record.instructor || record.teacherName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {!records.length && (
        <div className="p-10 text-center bg-white/60 border border-dashed border-zinc-300 mt-4 rounded-xl">
          <BookOpen size={28} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-sm font-bold text-zinc-700">No periods scheduled for this class yet.</p>
          <p className="text-xs text-zinc-400 mt-1">Click any empty slot in the grid above or use the "+ Schedule Period" button to build this timetable.</p>
        </div>
      )}

      {/* Subject & Teacher Allocation Table */}
      <div className="mt-6 border border-zinc-200 bg-white/80 rounded-xl shadow-xs" style={{ backdropFilter: "blur(6px)" }}>
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-50/80 border-b border-zinc-200 rounded-t-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-zinc-900 text-white flex items-center justify-center text-xs font-bold rounded-lg">
              <BookOpen size={14} />
            </div>
            <div>
              <h4 className="text-[12px] font-extrabold text-zinc-900 uppercase tracking-wider m-0">Subject & Faculty Allocation</h4>
              <span className="text-[11px] text-zinc-500 font-medium">Assigned subject teachers and weekly teaching loads</span>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-zinc-200 text-zinc-900 rounded-md">
            {uniqueSubjects.length} {uniqueSubjects.length === 1 ? "Subject" : "Subjects"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/60 text-[10.5px] font-extrabold text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Subject / Course</th>
                <th className="py-2.5 px-4">Assigned Teacher</th>
                <th className="py-2.5 px-4">Weekly Sessions</th>
                <th className="py-2.5 px-4">Scheduled Days</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {uniqueSubjects.map(item => {
                const theme = getSubjectTheme(item.subject);
                return (
                  <tr key={item.subject} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.borderLeft }} />
                        <span className="font-extrabold text-[12px] text-zinc-900">{item.subject}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-zinc-400 shrink-0" />
                        <span className="font-bold text-zinc-800">{item.instructor}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 font-bold text-zinc-800 text-[11px] rounded-md">
                        {item.count} {item.count === 1 ? "Period" : "Periods"}/wk
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 font-semibold text-[11px]">{item.daysFormatted}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onAction?.("edit", item.representativeRecordId, item.firstRecord)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 cursor-pointer shadow-xs transition-colors rounded-md inline-flex items-center gap-1"
                      >
                        <Pencil size={10} />Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!uniqueSubjects.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-400 text-xs">
                    No subjects scheduled yet. Add periods above to populate this directory.
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
