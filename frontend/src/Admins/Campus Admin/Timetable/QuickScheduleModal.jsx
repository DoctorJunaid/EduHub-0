import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Clock,
  Calendar,
  BookOpen,
  User,
  Building,
  Sparkles,
  Coffee,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { minutes } from "../../../lib/schedule.js";

const SCHOOL_PERIOD_PRESETS = [
  { id: "p1", name: "Period 1 (08:00 - 08:50)", start: "08:00", end: "08:50", type: "class" },
  { id: "p2", name: "Period 2 (08:50 - 09:40)", start: "08:50", end: "09:40", type: "class" },
  { id: "p3", name: "Period 3 (09:40 - 10:30)", start: "09:40", end: "10:30", type: "class" },
  { id: "b_recess", name: "Morning Break (10:30 - 11:00)", start: "10:30", end: "11:00", type: "break" },
  { id: "p4", name: "Period 4 (11:00 - 11:50)", start: "11:00", end: "11:50", type: "class" },
  { id: "p5", name: "Period 5 (11:50 - 12:40)", start: "11:50", end: "12:40", type: "class" },
  { id: "b_lunch", name: "Lunch & Prayer (12:40 - 13:20)", start: "12:40", end: "13:20", type: "break" },
  { id: "p6", name: "Period 6 (13:20 - 14:00)", start: "13:20", end: "14:00", type: "class" },
  { id: "p7", name: "Period 7 (14:00 - 14:45)", start: "14:00", end: "14:45", type: "class" },
];

const COLLEGE_SLOT_PRESETS = [
  { id: "c1", name: "Lecture 1 (08:30 - 10:00)", start: "08:30", end: "10:00", type: "class" },
  { id: "c2", name: "Lecture 2 (10:00 - 11:30)", start: "10:00", end: "11:30", type: "class" },
  { id: "c_lunch", name: "Campus Lunch Break (11:30 - 12:15)", start: "11:30", end: "12:15", type: "break" },
  { id: "c3", name: "Lecture 3 (12:15 - 13:45)", start: "12:15", end: "13:45", type: "class" },
  { id: "c4", name: "Lecture 4 (14:00 - 15:30)", start: "14:00", end: "15:30", type: "class" },
  { id: "c5", name: "Lecture 5 (15:30 - 17:00)", start: "15:30", end: "17:00", type: "class" },
];

const WEEKDAY_NAMES = [
  { day: 1, label: "Mon", full: "Monday" },
  { day: 2, label: "Tue", full: "Tuesday" },
  { day: 3, label: "Wed", full: "Wednesday" },
  { day: 4, label: "Thu", full: "Thursday" },
  { day: 5, label: "Fri", full: "Friday" },
  { day: 6, label: "Sat", full: "Saturday" },
];

export default function QuickScheduleModal({
  isOpen,
  onClose,
  onSave,
  currentClass,
  initialDay = 1,
  initialStartTime = "08:00",
  initialEndTime = "08:50",
  options = {},
  isSchool = true,
  editRecord = null,
  initialIsBreak = false,
  includeSaturday = true,
}) {
  const presets = isSchool ? SCHOOL_PERIOD_PRESETS : COLLEGE_SLOT_PRESETS;

  const activeWeekdays = useMemo(() => {
    return includeSaturday ? WEEKDAY_NAMES : WEEKDAY_NAMES.filter((w) => w.day !== 6);
  }, [includeSaturday]);

  // Form Mode: "class" or "break"
  const [mode, setMode] = useState(initialIsBreak ? "break" : "class");

  const [targetClass, setTargetClass] = useState(currentClass?.program || (isSchool ? "Grade 10" : "BS Computer Science"));
  const [targetSection, setTargetSection] = useState(currentClass?.section || "A");
  const [subject, setSubject] = useState("");
  const [instructor, setInstructor] = useState("");
  const [room, setRoom] = useState("");
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [days, setDays] = useState([initialDay]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync state when modal opens or initial props change
  useEffect(() => {
    if (editRecord) {
      const isBreak = Boolean(editRecord.isBreak);
      setMode(isBreak ? "break" : "class");
      setTargetClass(editRecord.program || editRecord.gradeOrClass || currentClass?.program || "Grade 10");
      setTargetSection(editRecord.section || currentClass?.section || "A");
      setSubject(editRecord.subject || editRecord.breakTitle || "");
      setInstructor(editRecord.instructor || editRecord.teacherName || "");
      setRoom(editRecord.room || editRecord.roomNumber || "");
      setStartTime(editRecord.startTime || "08:00");
      setEndTime(editRecord.endTime || "08:50");
      const recordDays = Array.isArray(editRecord.days) && editRecord.days.length ? editRecord.days : [1];
      setDays(recordDays);
    } else {
      const isBreak = Boolean(initialIsBreak);
      setMode(isBreak ? "break" : "class");
      setTargetClass(currentClass?.program || (isSchool ? "Grade 10" : "BS Computer Science"));
      setTargetSection(currentClass?.section || "A");
      setSubject(isBreak ? "Lunch & Prayer Break" : "");
      setInstructor(isBreak ? "Campus Administration" : (options?.instructor?.[0] || ""));
      setRoom(isBreak ? "Campus Cafeteria / Ground" : (options?.room?.[0] || (isSchool ? "Room 101" : "Hall 1")));
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
      setDays([initialDay || 1]);
    }
    setError("");
  }, [isOpen, editRecord, initialDay, initialStartTime, initialEndTime, initialIsBreak]);

  // Calculate duration in minutes
  const durationMinutes = useMemo(() => {
    try {
      const s = minutes(startTime);
      const e = minutes(endTime);
      return e > s ? e - s : 0;
    } catch {
      return 0;
    }
  }, [startTime, endTime]);

  if (!isOpen) return null;

  const handleDayToggle = (dayNum) => {
    if (days.includes(dayNum)) {
      if (days.length === 1) return;
      setDays(days.filter((d) => d !== dayNum));
    } else {
      setDays([...days, dayNum].sort());
    }
  };

  const handleSetDayPattern = (pattern) => {
    if (pattern === "all") {
      setDays(includeSaturday ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5]);
    } else if (pattern === "weekdays") {
      setDays([1, 2, 3, 4, 5]);
    } else if (pattern === "single") {
      setDays([initialDay || 1]);
    }
  };

  const handleApplyPreset = (preset) => {
    setStartTime(preset.start);
    setEndTime(preset.end);
    if (preset.type === "break") {
      setMode("break");
      setSubject(preset.name.split(" (")[0]);
      setRoom("Campus Grounds / Cafeteria");
      setInstructor("Duty Staff");
    } else {
      setMode("class");
      if (subject.includes("Break") || subject.includes("Lunch") || subject.includes("Recess")) {
        setSubject("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError(mode === "break" ? "Please enter a break name (e.g. Lunch & Prayer Break)." : "Please enter a subject name.");
      return;
    }
    if (mode === "class" && !instructor.trim()) {
      setError("Please assign a teacher to this period.");
      return;
    }
    if (endTime <= startTime) {
      setError("End time must be after start time.");
      return;
    }
    if (!days.length) {
      setError("Select at least one weekday.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const isBreak = mode === "break";
      await onSave({
        subject: subject.trim(),
        breakTitle: isBreak ? subject.trim() : "",
        isBreak,
        program: targetClass.trim(),
        section: targetSection.trim(),
        instructor: isBreak ? (instructor.trim() || "Campus Staff") : instructor.trim(),
        room: room.trim() || (isSchool ? "Room 101" : "Hall 1"),
        startTime,
        endTime,
        days,
        institutionType: isSchool ? "School" : "College",
        status: "Active",
      });
      onClose();
    } catch (err) {
      setError(typeof err === "string" ? err : err?.message || "Failed to schedule class");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="qs-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="qs-dialog" role="dialog" aria-modal="true">
        {/* 1. Modal Header */}
        <div className="qs-header">
          <div className="qs-header-left">
            <div className={`qs-header-icon ${mode === "break" ? "break-mode" : "class-mode"}`}>
              {mode === "break" ? <Coffee size={22} /> : <BookOpen size={22} />}
            </div>
            <div>
              <h3 className="qs-header-title">
                {editRecord
                  ? mode === "break"
                    ? "Edit Break Interval"
                    : "Edit Class Period"
                  : mode === "break"
                  ? "Schedule Campus Lunch / Break"
                  : isSchool
                  ? "Schedule Class Period"
                  : "Schedule Lecture Routine"}
              </h3>
              <div className="qs-header-meta">
                <span className="qs-header-meta-label">Target Routine:</span>
                <span className="qs-header-badge">
                  <GraduationCap size={12} style={{ color: "#71717a" }} />
                  {targetClass} • Sec {targetSection}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="qs-close-btn"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Mode Selector (Teaching Period vs Lunch & Break) */}
        <div className="qs-mode-bar">
          <div className="qs-segmented-control">
            <button
              type="button"
              onClick={() => {
                setMode("class");
                if (subject.includes("Break") || subject.includes("Lunch")) setSubject("");
              }}
              className={`qs-segmented-btn ${mode === "class" ? "active-class" : ""}`}
            >
              <BookOpen size={14} />
              Regular Teaching Period
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("break");
                if (!subject) setSubject("Lunch & Prayer Break");
              }}
              className={`qs-segmented-btn ${mode === "break" ? "active-break" : ""}`}
            >
              <Coffee size={14} />
              Lunch & Break Interval
            </button>
          </div>
        </div>

        {/* 3. Quick Period Presets Carousel */}
        <div className="qs-presets-bar">
          <span className="qs-presets-label">
            <Sparkles size={13} style={{ color: "#d97706" }} /> Presets:
          </span>
          {presets.map((p) => {
            const isSelected = startTime === p.start && endTime === p.end;
            const isBreakPreset = p.type === "break";
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`qs-preset-chip ${
                  isBreakPreset
                    ? isSelected
                      ? "active-break"
                      : "is-break-default"
                    : isSelected
                    ? "active-class"
                    : ""
                }`}
              >
                {isBreakPreset && <Coffee size={12} style={{ color: isSelected ? "#ffffff" : "#d97706" }} />}
                {p.name}
              </button>
            );
          })}
        </div>

        {/* 4. Form wrapping Body and Pinned Footer */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}
        >
          {/* Scrollable Form Body */}
          <div className="qs-body">
            {/* Target Class & Section Confirmation Group */}
            <div className="qs-card-group">
              <div className="qs-card-title-row">
                <span className="qs-card-title">
                  <GraduationCap size={14} /> Target Class & Section
                </span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Assigned Routine</span>
              </div>
              <div className="qs-row-2col">
                <div>
                  <label className="qs-label" style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>
                    Class / Grade *
                  </label>
                  <input
                    type="text"
                    required
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    placeholder="e.g. Grade 10"
                    className="qs-input"
                  />
                </div>
                <div>
                  <label className="qs-label" style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>
                    Section *
                  </label>
                  <input
                    type="text"
                    required
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    placeholder="e.g. A"
                    className="qs-input"
                  />
                </div>
              </div>
            </div>

            {/* Subject or Break Name Input */}
            <div>
              <label className="qs-label">
                <span>{mode === "break" ? "Break / Recess Name *" : "Subject / Course Name *"}</span>
                {mode === "break" && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#92400e",
                      background: "#fffbeb",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid #fde68a",
                      fontWeight: 600,
                    }}
                  >
                    Spans Across All Weekday Columns
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                placeholder={
                  mode === "break"
                    ? "e.g. Lunch & Prayer Break, Morning Recess"
                    : "e.g. Mathematics, English Language, Physics, Biology"
                }
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="qs-input"
                style={{ height: "44px", fontSize: "14px" }}
              />
            </div>

            {/* Teacher and Room (Class Mode Only) */}
            {mode === "class" && (
              <div className="qs-row-2col">
                <div>
                  <label className="qs-label">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <User size={13} style={{ color: "#64748b" }} /> Subject Teacher *
                    </span>
                  </label>
                  <input
                    list="teacher-suggestions-list"
                    type="text"
                    required
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="Select or enter teacher name"
                    className="qs-input"
                  />
                  <datalist id="teacher-suggestions-list">
                    {(options?.instructor || []).map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="qs-label">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <Building size={13} style={{ color: "#64748b" }} /> Classroom / Lab *
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 101, Science Lab"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="qs-input"
                  />
                </div>
              </div>
            )}

            {/* Timing Row: Start Time, End Time, Duration Badge */}
            <div className="qs-card-group">
              <div className="qs-card-title-row">
                <span className="qs-card-title">
                  <Clock size={14} /> Period Timing
                </span>
                {durationMinutes > 0 && (
                  <span className="qs-duration-badge">
                    <Sparkles size={11} style={{ color: "#d97706" }} />
                    {durationMinutes} minutes duration
                  </span>
                )}
              </div>

              <div className="qs-time-grid">
                <div className="qs-time-field">
                  <label>Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="qs-time-input"
                  />
                </div>

                <div className="qs-time-field">
                  <label>End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="qs-time-input"
                  />
                </div>
              </div>
            </div>

            {/* Weekday Selection with Mon-Fri & Mon-Sat Quick Toggles */}
            <div className="qs-card-group">
              <div className="qs-card-title-row">
                <span className="qs-card-title">
                  <Calendar size={14} /> Scheduled Days
                </span>
                <div className="qs-quick-patterns">
                  <span style={{ color: "#94a3b8", fontSize: "11px" }}>Quick:</span>
                  <button
                    type="button"
                    onClick={() => handleSetDayPattern("weekdays")}
                    className="qs-pattern-btn"
                  >
                    Mon-Fri
                  </button>
                  {includeSaturday && (
                    <>
                      <span style={{ color: "#cbd5e1" }}>•</span>
                      <button
                        type="button"
                        onClick={() => handleSetDayPattern("all")}
                        className="qs-pattern-btn"
                      >
                        Mon-Sat
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="qs-days-grid">
                {activeWeekdays.map(({ day, label }) => {
                  const isSelected = days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`qs-day-btn ${isSelected ? "selected" : ""}`}
                    >
                      <span>{label}</span>
                      {isSelected ? (
                        <span className="qs-day-check">✓</span>
                      ) : (
                        <span style={{ height: "10px" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="qs-error-banner">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* 5. Fixed Pinned Footer (Never Squished or Clipped) */}
          <div className="qs-footer">
            <button
              type="button"
              onClick={onClose}
              className="qs-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`qs-btn-submit ${mode === "break" ? "break-submit" : "class-submit"}`}
            >
              {isSubmitting ? (
                <span>Saving to routine...</span>
              ) : editRecord ? (
                "Save Routine Changes"
              ) : mode === "break" ? (
                "Confirm & Add Break Interval"
              ) : (
                "Confirm & Schedule Period"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
