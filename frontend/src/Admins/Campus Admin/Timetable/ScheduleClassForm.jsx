import { useState } from "react";
import { Calendar, School, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { scheduleStatuses } from "./timetableData.js";
import { weekdays } from "../../../lib/schedule.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";

const SCHOOL_GRADE_OPTIONS = [
  "Grade 10",
  "Grade 9",
  "Grade 8",
  "Grade 7",
  "Grade 6",
  "Grade 5",
  "Grade 4",
  "Grade 3",
  "Grade 2",
  "Grade 1",
];

export default function ScheduleClassForm({
  record,
  options,
  onSave,
  onClose,
}) {
  const { isSchool } = useInstitution();
  const programList = isSchool
    ? SCHOOL_GRADE_OPTIONS
    : (options?.program?.length ? options.program : ["BS Computer Science"]);

  const [values, setValues] = useState(() => ({
    subject: record?.subject ?? "",
    program: record?.program ?? programList[0] ?? "",
    section: record?.section ?? (isSchool ? "A" : ""),
    instructor: record?.instructor ?? options?.instructor?.[0] ?? "",
    room: record?.room ?? options?.room?.[0] ?? (isSchool ? "Room 101" : "Hall 1"),
    days: record?.days ?? [1, 2, 3, 4, 5],
    startTime: record?.startTime ?? (isSchool ? "08:30" : "09:00"),
    endTime: record?.endTime ?? (isSchool ? "09:20" : "10:00"),
    status: record?.status ?? "Active",
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
      title={
        isSchool
          ? record ? "Edit Scheduled Period" : "Schedule Class Period"
          : record ? "Edit Scheduled Class" : "Schedule New Class"
      }
      subtitle={
        isSchool
          ? record
            ? `Editing period schedule for ${record.subject} (${record.section || "Section A"}).`
            : "Define period timings, teacher incharge, grade & section, and classroom allocation."
          : record
            ? `Editing schedule for ${record.subject} (${record.section || "Regular"}).`
            : "Define lecture timings, recurring weekdays, and room allocation for this class."
      }
      parentName={isSchool ? "Class Routine & Timetable" : "Class Timetable"}
      icon={isSchool ? <School size={22} /> : <Calendar size={22} />}
      onBack={onClose}
    >
      <form onSubmit={submit}>
        <div className="activity-form-grid">
          <div className="activity-section-title">
            {isSchool ? "Subject & Grade Allocation" : "Course & Class Assignment"}
          </div>

          <div className="activity-form-field span-2">
            <Label htmlFor="tt-subject">{isSchool ? "Subject / Period Name *" : "Subject / Course Name *"}</Label>
            <input
              id="tt-subject"
              required
              placeholder={
                isSchool
                  ? "e.g. Mathematics, English Language, Physics, Urdu, Computer Studies"
                  : "e.g. Advanced Web Design, Data Structures"
              }
              value={values.subject}
              onChange={(e) => change("subject", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-program">{isSchool ? "Assigned Class / Grade *" : "Academic Program *"}</Label>
            <select
              id="tt-program"
              value={values.program}
              onChange={(e) => change("program", e.target.value)}
            >
              {programList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-section">{isSchool ? "Section (A, B, C) *" : "Class Section *"}</Label>
            <input
              id="tt-section"
              required
              placeholder={isSchool ? "e.g. Section A" : "e.g. CS-4A"}
              value={values.section}
              onChange={(e) => change("section", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-instructor">{isSchool ? "Assigned Teacher *" : "Assigned Instructor *"}</Label>
            <select
              id="tt-instructor"
              value={values.instructor}
              onChange={(e) => change("instructor", e.target.value)}
            >
              {(options?.instructor || ["Ms. Ayesha Khan", "Mr. Bilal Raza"]).map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-room">{isSchool ? "Classroom / Laboratory *" : "Lecture Hall / Lab *"}</Label>
            <select
              id="tt-room"
              value={values.room}
              onChange={(e) => change("room", e.target.value)}
            >
              {(options?.room || ["Room 101", "Room 102", "Science Lab", "IT Lab", "Art Studio"]).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-section-title">
            {isSchool ? "Period Timing & Weekdays" : "Timing & Weekly Schedule"}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-start">{isSchool ? "Period Start Time *" : "Lecture Start Time *"}</Label>
            <input
              id="tt-start"
              type="time"
              required
              value={values.startTime}
              onChange={(e) => change("startTime", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-end">{isSchool ? "Period End Time *" : "Lecture End Time *"}</Label>
            <input
              id="tt-end"
              type="time"
              required
              value={values.endTime}
              onChange={(e) => change("endTime", e.target.value)}
            />
          </div>

          <div className="activity-form-field span-2">
            <Label>{isSchool ? "Scheduled School Days *" : "Scheduled Weekdays *"}</Label>
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
            <Label htmlFor="tt-status">{isSchool ? "Period Status" : "Class Status"}</Label>
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
            {record ? "Save Schedule Changes" : (isSchool ? "Confirm & Schedule Period" : "Confirm & Schedule Class")}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
