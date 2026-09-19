import { useState } from "react";
import { Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { scheduleStatuses } from "./timetableData.js";
import { weekdays } from "../../../lib/schedule.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";

export default function ScheduleClassForm({
  record,
  defaults,
  options,
  onSave,
  onClose,
}) {
  const [values, setValues] = useState(() => ({
    subject: record?.subject ?? defaults?.subject ?? "",
    program:
      record?.program ?? defaults?.program ?? options.program[0] ?? "",
    section: record?.section ?? defaults?.section ?? "",
    instructor:
      record?.instructor ?? defaults?.instructor ?? options.instructor[0] ?? "",
    room: record?.room ?? defaults?.room ?? options.room[0] ?? "",
    days: record?.days ?? defaults?.days ?? [],
    startTime: record?.startTime ?? defaults?.startTime ?? "",
    endTime: record?.endTime ?? defaults?.endTime ?? "",
    status: record?.status ?? defaults?.status ?? "Active",
  }));
  const [error, setError] = useState("");

  const change = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setError("");
  };

  const submit = (event) => {
    event.preventDefault();
    if (!values.days.length) return setError("Please select at least one weekday.");
    if (values.endTime <= values.startTime)
      return setError("End time must be after start time.");
    onSave(
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() : value,
        ]),
      ),
    );
  };

  return (
    <FullPageFormShell
      title={record ? "Edit Scheduled Class" : "Schedule New Class"}
      subtitle={
        record
          ? `Editing schedule for ${record.subject} (${record.section || "Regular"}).`
          : "Define lecture timings, recurring weekdays, and room allocation for this class."
      }
      parentName="Class Timetable"
      icon={<Calendar size={22} />}
      onBack={onClose}
    >
      <form onSubmit={submit}>
        <div className="activity-form-grid">
          <div className="activity-section-title">Course & Class Assignment</div>

          <div className="activity-form-field span-2">
            <Label htmlFor="tt-subject">Subject / Course Name *</Label>
            <input
              id="tt-subject"
              required
              placeholder="e.g. Advanced Web Design, Data Structures"
              value={values.subject}
              onChange={(e) => change("subject", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-program">Academic Program *</Label>
            <select
              id="tt-program"
              value={values.program}
              onChange={(e) => change("program", e.target.value)}
            >
              {options.program.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-section">Class Section *</Label>
            <input
              id="tt-section"
              required
              placeholder="e.g. CS-4A"
              value={values.section}
              onChange={(e) => change("section", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-instructor">Assigned Instructor *</Label>
            <select
              id="tt-instructor"
              value={values.instructor}
              onChange={(e) => change("instructor", e.target.value)}
            >
              {options.instructor.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-room">Lecture Hall / Lab *</Label>
            <select
              id="tt-room"
              value={values.room}
              onChange={(e) => change("room", e.target.value)}
            >
              {options.room.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-section-title">Timing & Weekly Schedule</div>

          <div className="activity-form-field">
            <Label htmlFor="tt-start">Lecture Start Time *</Label>
            <input
              id="tt-start"
              type="time"
              required
              value={values.startTime}
              onChange={(e) => change("startTime", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-end">Lecture End Time *</Label>
            <input
              id="tt-end"
              type="time"
              required
              value={values.endTime}
              onChange={(e) => change("endTime", e.target.value)}
            />
          </div>

          <div className="activity-form-field span-2">
            <Label>Scheduled Weekdays *</Label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
              {weekdays.map((day, index) => {
                const dayNum = index + 1;
                const isSelected = values.days.includes(dayNum);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      change(
                        "days",
                        isSelected
                          ? values.days.filter((v) => v !== dayNum)
                          : [...values.days, dayNum].sort(),
                      )
                    }
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      border: isSelected ? "1px solid #09090b" : "1px solid #e4e4e7",
                      background: isSelected ? "#09090b" : "#ffffff",
                      color: isSelected ? "#ffffff" : "#09090b",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-status">Class Status</Label>
            <select
              id="tt-status"
              value={values.status}
              onChange={(e) => change("status", e.target.value)}
            >
              {scheduleStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#dc2626",
            }}
          >
            {error}
          </p>
        )}

        <div className="activity-form-actions">
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="activity-submit-btn">
            {record ? "Save Schedule Changes" : "Confirm & Schedule Class"}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
