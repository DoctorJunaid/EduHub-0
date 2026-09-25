import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  X,
  Clock,
  Calendar,
  BookOpen,
  User,
  Building,
  Sparkles,
  GraduationCap,
  AlertCircle,
  FileClock,
  Award,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { selectExams } from "@/store/Slices/examsSlice.js";
import { minutes, timeLabel } from "../../../lib/schedule.js";
import { checkCohortDailyExamLimit } from "./examData.js";
import { Spinner } from "@/components/ui/spinner";

const EXAM_SHIFT_PRESETS = [
  { id: "morning", name: "☀️ Morning (09:00 - 12:00)", start: "09:00", end: "12:00", type: "Midterm" },
  { id: "afternoon", name: "🌤️ Afternoon (13:30 - 16:30)", start: "13:30", end: "16:30", type: "Final" },
  { id: "evening", name: "🌙 Evening (16:30 - 19:30)", start: "16:30", end: "19:30", type: "Assessment" },
  { id: "custom", name: "⏱️ Custom Time", start: "", end: "" },
];

const EXAM_TYPES = ["Midterm", "Final", "Quiz", "Practical", "Assessment"];

export default function QuickExamModal({
  isOpen,
  onClose,
  onSave,
  currentClass,
  initialDate = "",
  initialStartTime = "09:00",
  initialEndTime = "12:00",
  options = {},
  isSchool = true,
  editRecord = null,
}) {
  const allExams = useSelector(selectExams) || [];

  const [examType, setExamType] = useState("Midterm");
  const [targetClass, setTargetClass] = useState(
    currentClass?.program || (isSchool ? "Grade 10" : "BS Computer Science")
  );
  const [targetSection, setTargetSection] = useState(currentClass?.section || "A");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(initialDate || new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [room, setRoom] = useState("");
  const [invigilator, setInvigilator] = useState("");
  const [totalMarks, setTotalMarks] = useState(100);
  const [confirmedDualExam, setConfirmedDualExam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editRecord) {
      setExamType(editRecord.examType || "Midterm");
      setTargetClass(
        editRecord.program ||
          editRecord.className ||
          editRecord.gradeOrClass ||
          editRecord.department ||
          currentClass?.program ||
          "Grade 10"
      );
      setTargetSection(editRecord.section || currentClass?.section || "A");
      setSubject(editRecord.subject || "");
      setDate(
        editRecord.date ||
          (editRecord.examDate
            ? new Date(editRecord.examDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0])
      );
      setStartTime(editRecord.startTime || "09:00");
      setEndTime(editRecord.endTime || "12:00");
      setRoom(editRecord.room || editRecord.roomNumber || "");
      setInvigilator(editRecord.invigilator || editRecord.teacherName || "");
      setTotalMarks(Number(editRecord.totalMarks) > 0 ? Number(editRecord.totalMarks) : 100);
    } else {
      setExamType("Midterm");
      setTargetClass(currentClass?.program || (isSchool ? "Grade 10" : "BS Computer Science"));
      setTargetSection(currentClass?.section || "A");
      setSubject("");
      setDate(initialDate || new Date().toISOString().split("T")[0]);
      setStartTime(initialStartTime || "09:00");
      setEndTime(initialEndTime || "12:00");
      setRoom(options?.room?.[0] || (isSchool ? "Exam Hall A" : "Auditorium"));
      setInvigilator(options?.invigilator?.[0] || "");
      setTotalMarks(100);
    }
    setError("");
  }, [isOpen, editRecord, currentClass, initialDate, initialStartTime, initialEndTime, isSchool, options]);

  const durationText = useMemo(() => {
    const sMin = minutes(startTime);
    const eMin = minutes(endTime);
    if (isNaN(sMin) || isNaN(eMin) || eMin <= sMin) return "Custom";
    const diff = eMin - sMin;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs > 0 ? `${hrs} hr${hrs > 1 ? "s" : ""} ` : ""}${mins > 0 ? `${mins} min` : ""}`.trim();
  }, [startTime, endTime]);

  const applyDurationHours = (hrs) => {
    const sMin = minutes(startTime) || 9 * 60;
    const eMin = sMin + Math.round(hrs * 60);
    const h = Math.floor(eMin / 60) % 24;
    const m = eMin % 60;
    setEndTime(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  // Real-time evaluation of cohort daily load
  const dailyCheck = useMemo(() => {
    return checkCohortDailyExamLimit(allExams, {
      program: targetClass,
      section: targetSection,
      date,
      startTime,
      endTime,
      _id: editRecord?._id || editRecord?.id,
    });
  }, [allExams, targetClass, targetSection, date, startTime, endTime, editRecord]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!subject.trim()) {
      setError("Please enter or select a Subject.");
      return;
    }
    if (!date) {
      setError("Please select an Examination Date.");
      return;
    }
    if (minutes(endTime) <= minutes(startTime)) {
      setError("End Time must be strictly later than Start Time.");
      return;
    }
    if (Number(totalMarks) <= 0) {
      setError("Total Marks must be greater than 0.");
      return;
    }

    if (dailyCheck.isBlocked) {
      setError(dailyCheck.reason);
      return;
    }

    if (dailyCheck.isRareCase && !confirmedDualExam && !editRecord) {
      setError("Please check the confirmation box below to acknowledge this rare dual-exam schedule.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        examType,
        program: targetClass.trim(),
        className: targetClass.trim(),
        gradeOrClass: targetClass.trim(),
        department: targetClass.trim(),
        section: targetSection.trim() || "A",
        subject: subject.trim(),
        date,
        examDate: new Date(`${date}T12:00:00.000Z`),
        startTime,
        endTime,
        sessionOrShift: minutes(startTime) < 12 * 60 ? "Morning" : minutes(startTime) < 16 * 60 ? "Afternoon" : "Evening",
        isDualExamDay: dailyCheck.isRareCase,
        room: room.trim() || "Exam Hall A",
        roomNumber: room.trim() || "Exam Hall A",
        invigilator: invigilator.trim() || "Assigned Invigilator",
        totalMarks: Number(totalMarks) || 100,
        examName: `${examType} Examination - ${subject.trim()}`,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to schedule examination.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="qs-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="qs-dialog" role="dialog" aria-modal="true" style={{ maxWidth: "620px" }}>
        {/* 1. Modal Header */}
        <div className="qs-header">
          <div className="qs-header-left">
            <div className="qs-header-icon class-mode">
              <FileClock size={20} />
            </div>
            <div>
              <h3 className="qs-header-title">
                {editRecord ? "Edit Examination Schedule" : "Schedule Examination"}
              </h3>
              <div className="qs-header-meta">
                <span className="qs-header-meta-label">Target Cohort:</span>
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
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Quick Shift & Custom Time Presets */}
        <div className="qs-presets-bar">
          <span className="qs-presets-label">
            <Sparkles size={12} style={{ color: "#f59e0b" }} />
            Presets:
          </span>
          {EXAM_SHIFT_PRESETS.map((p) => {
            const isSelected =
              p.id === "custom"
                ? !EXAM_SHIFT_PRESETS.slice(0, 3).some((s) => s.start === startTime && s.end === endTime)
                : startTime === p.start && endTime === p.end;
            return (
              <button
                key={p.id}
                type="button"
                className={`qs-preset-chip ${isSelected ? "active-class" : ""}`}
                style={{ borderRadius: 0 }}
                onClick={() => {
                  if (p.start && p.end) {
                    setStartTime(p.start);
                    setEndTime(p.end);
                  }
                  if (p.type) setExamType(p.type);
                }}
              >
                <Clock size={11} />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Form Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="qs-body">
            {/* Exam Category */}
            <div className="qs-card-group">
              <div className="qs-card-title-row">
                <span className="qs-card-title">
                  <Award size={13} style={{ color: "#71717a" }} />
                  Examination Category
                </span>
              </div>
              <div className="qs-category-chips">
                {EXAM_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`qs-category-btn ${examType === t ? `active-${t.toLowerCase()}` : ""}`}
                    onClick={() => setExamType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Class & Section */}
            <div className="qs-row-2col">
              <div className="qs-field">
                <label className="qs-label">
                  <span>{isSchool ? "Grade / Class" : "Degree Program"}</span>
                  <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  className="qs-input"
                  list="modal-program-options"
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  placeholder={isSchool ? "e.g. Grade 10" : "e.g. BS Computer Science"}
                  required
                />
                {options?.program?.length > 0 && (
                  <datalist id="modal-program-options">
                    {options.program.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                )}
              </div>

              <div className="qs-field">
                <label className="qs-label">
                  <span>Section / Cohort</span>
                  <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  className="qs-input"
                  list="modal-section-options"
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  placeholder="e.g. A"
                  required
                />
                {options?.section?.length > 0 && (
                  <datalist id="modal-section-options">
                    {options.section.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                )}
              </div>
            </div>

            {/* Subject & Total Marks */}
            <div className="qs-row-2col">
              <div className="qs-field">
                <label className="qs-label">
                  <span>Subject / Paper Title</span>
                  <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  className="qs-input"
                  list="modal-subject-options"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mathematics, Physics..."
                  required
                />
                {options?.subject?.length > 0 && (
                  <datalist id="modal-subject-options">
                    {options.subject.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                )}
              </div>

              <div className="qs-field">
                <label className="qs-label">
                  <span>Total Marks</span>
                  <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="number"
                  className="qs-input"
                  min="1"
                  max="1000"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Date and Time Window */}
            <div className="qs-card-group" style={{ borderRadius: 0 }}>
              <div className="qs-card-title-row">
                <span className="qs-card-title">
                  <Calendar size={13} style={{ color: "#71717a" }} />
                  Exam Date & Time Window
                </span>
                <span className="qs-duration-badge" style={{ borderRadius: 0 }}>
                  <Clock size={11} />
                  <span>Duration: {durationText}</span>
                </span>
              </div>

              {/* Custom Duration Shortcut Pills */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "6px 0 10px 0", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>Quick Duration:</span>
                {[1, 1.5, 2, 2.5, 3].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => applyDurationHours(hrs)}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 cursor-pointer transition-colors shadow-2xs"
                    style={{ borderRadius: 0 }}
                  >
                    +{hrs} {hrs === 1 ? "hr" : "hrs"}
                  </button>
                ))}
              </div>

              <div className="qs-row-2col">
                <div className="qs-field">
                  <label className="qs-label">Examination Date *</label>
                  <input
                    type="date"
                    className="qs-input"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setConfirmedDualExam(false);
                    }}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="qs-field">
                    <label className="qs-label">Start Time *</label>
                    <input
                      type="time"
                      className="qs-time-input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="qs-field">
                    <label className="qs-label">End Time *</label>
                    <input
                      type="time"
                      className="qs-time-input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Daily Exam Load Status Banner */}
              <div style={{ marginTop: "12px" }}>
                {dailyCheck.isBlocked ? (
                  <div className="qs-daily-banner blocked">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#991b1b" }}>
                      <AlertCircle size={15} />
                      <span>Daily Limit Reached (Max 2 Exams/Day)</span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: "11.5px", color: "#b91c1c" }}>
                      {dailyCheck.reason}
                    </p>
                  </div>
                ) : dailyCheck.isRareCase ? (
                  <div className="qs-daily-banner rare">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#92400e" }}>
                      <AlertTriangle size={15} />
                      <span>Dual-Exam Day (Rare Case Schedule)</span>
                    </div>
                    <p style={{ margin: "4px 0 6px 0", fontSize: "11.5px", color: "#b45309" }}>
                      {targetClass} Section {targetSection} already has an exam on this date:{" "}
                      <strong>
                        {dailyCheck.existingExams[0]?.subject} (
                        {dailyCheck.existingExams[0]?.startTime} –{" "}
                        {dailyCheck.existingExams[0]?.endTime})
                      </strong>
                      . This will be the <strong>2nd exam</strong> of the day for this cohort.
                    </p>

                    {dailyCheck.suggestedSlot && (
                      <button
                        type="button"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fde68a",
                          cursor: "pointer",
                          marginBottom: "8px",
                        }}
                        onClick={() => {
                          setStartTime(dailyCheck.suggestedSlot.start);
                          setEndTime(dailyCheck.suggestedSlot.end);
                          setConfirmedDualExam(true);
                        }}
                      >
                        <Clock size={11} />
                        <span>Use Recommended Slot: {dailyCheck.suggestedSlot.start} – {dailyCheck.suggestedSlot.end}</span>
                      </button>
                    )}

                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", fontWeight: 600, color: "#78350f", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={confirmedDualExam}
                        onChange={(e) => setConfirmedDualExam(e.target.checked)}
                      />
                      <span>Confirm rare dual-exam schedule for this day (Theory + Practical / Special Exam)</span>
                    </label>
                  </div>
                ) : (
                  <div className="qs-daily-banner standard">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", fontWeight: 600, color: "#065f46" }}>
                      <CheckCircle2 size={15} style={{ color: "#059669" }} />
                      <span>
                        <strong>Standard Single-Exam Schedule</strong>: 1st exam for {targetClass} • Sec {targetSection} on {date}.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exam Hall / Room Allocation (Teacher name removed) */}
            <div className="qs-field">
              <label className="qs-label">
                <span>Exam Hall / Room</span>
                <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                className="qs-input"
                list="modal-room-options"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Exam Hall A, Room 101, Science Lab"
                required
                style={{ borderRadius: 0 }}
              />
              {options?.room?.length > 0 && (
                <datalist id="modal-room-options">
                  {options.room.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="qs-error-banner">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer (Pinned) */}
          <div className="qs-footer">
            <button
              type="button"
              className="qs-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`qs-btn-submit ${dailyCheck.isRareCase ? "rare-submit" : ""}`}
              disabled={isSubmitting || dailyCheck.isBlocked || (dailyCheck.isRareCase && !confirmedDualExam && !editRecord)}
            >
              {isSubmitting && <Spinner className="mr-2 size-4" />}
              {editRecord
                ? "Save Changes"
                : dailyCheck.isRareCase
                ? "Confirm & Schedule 2nd Exam"
                : "Confirm & Schedule Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
