import { useState, useEffect } from "react";
import { Calendar, School, Clock, Settings } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { scheduleStatuses } from "./timetableData.js";
import { weekdays } from "../../../lib/schedule.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";
import axiosInstance from "@/api/axiosInstance";
import { Link } from "react-router-dom";

export default function ScheduleClassForm({
  record,
  defaults,
  options,
  onSave,
  onClose,
}) {
  const { isSchool } = useInstitution();
  
  // Data states
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]); // Specifically gradeSubjects
  const [teachers, setTeachers] = useState([]); // Specifically assigned teachers for this grade/section/subject
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [values, setValues] = useState(() => ({
    gradeId: record?.gradeId || defaults?.gradeId || "",
    sectionId: record?.sectionId || defaults?.sectionId || "",
    subjectId: record?.subjectId || defaults?.subjectId || "",
    teacherId: record?.teacherId || defaults?.teacherId || "",
    room: record?.room || defaults?.room || options?.room?.[0] || (isSchool ? "Room 101" : "Hall 1"),
    days: record?.days || defaults?.days || (isSchool ? [1, 2, 3, 4, 5] : []),
    startTime: record?.startTime || defaults?.startTime || (isSchool ? "08:30" : "09:00"),
    endTime: record?.endTime || defaults?.endTime || (isSchool ? "09:20" : "10:00"),
    status: record?.status || defaults?.status || "Active",
  }));
  const [error, setError] = useState("");

  // Fetch initial grades
  useEffect(() => {
    axiosInstance.get("/academic/grades").then(res => setGrades(res.data)).catch(console.error);
  }, []);

  // Fetch sections and subjects when grade changes
  useEffect(() => {
    if (!values.gradeId) {
      setSections([]);
      setSubjects([]);
      return;
    }
    axiosInstance.get(`/academic/sections?gradeId=${values.gradeId}`).then(res => setSections(res.data)).catch(console.error);
    axiosInstance.get(`/academic/grade-subjects?gradeId=${values.gradeId}`).then(res => setSubjects(res.data.map(gs => gs.subjectId).filter(Boolean))).catch(console.error);
  }, [values.gradeId]);

  // Fetch assigned teachers when grade, section, subject are all selected
  useEffect(() => {
    if (!values.gradeId || !values.sectionId || !values.subjectId) {
      setTeachers([]);
      return;
    }
    axiosInstance.get(`/academic/teacher-assignments?gradeId=${values.gradeId}&sectionId=${values.sectionId}&subjectId=${values.subjectId}`)
      .then(res => setTeachers(res.data.map(ta => ta.teacherId).filter(Boolean)))
      .catch(console.error);
  }, [values.gradeId, values.sectionId, values.subjectId]);

  const change = (key, value) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      
      // Cascading resets
      if (key === "gradeId") {
        next.sectionId = "";
        next.subjectId = "";
        next.teacherId = "";
      } else if (key === "sectionId" || key === "subjectId") {
        next.teacherId = "";
      }
      
      return next;
    });
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!values.days.length) return setError("Please select at least one weekday.");
    if (values.endTime <= values.startTime) return setError("End time must be after start time.");
    if (!values.gradeId || !values.sectionId || !values.subjectId || !values.teacherId) {
      return setError("Please complete all academic assignments (Grade, Section, Subject, Teacher).");
    }

    try {
      setIsSubmitting(true);
      await onSave({ ...values });
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to save scheduled class");
    } finally {
      setIsSubmitting(false);
    }
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
            ? `Editing period schedule for this subject.`
            : "Define period timings, teacher incharge, grade & section, and classroom allocation."
          : record
            ? `Editing schedule for this course.`
            : "Define lecture timings, recurring weekdays, and room allocation for this class."
      }
      parentName={isSchool ? "Class Routine & Timetable" : "Class Timetable"}
      icon={isSchool ? <School size={22} /> : <Calendar size={22} />}
      onBack={onClose}
    >
      <form onSubmit={submit}>
        <div className="activity-form-grid">
          <div className="activity-section-title flex justify-between items-center">
            <span>{isSchool ? "Subject & Grade Allocation" : "Course & Class Assignment"}</span>
            <Link to="/academics" className="text-xs flex items-center gap-1 text-primary hover:underline">
              <Settings size={14} /> Manage Academics
            </Link>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-program">{isSchool ? "Assigned Class / Grade *" : "Academic Program *"}</Label>
            <select
              id="tt-program"
              value={values.gradeId}
              onChange={(e) => change("gradeId", e.target.value)}
              required
            >
              <option value="" disabled>Select {isSchool ? "Grade" : "Program"}</option>
              {grades.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="tt-section">{isSchool ? "Section *" : "Class Section *"}</Label>
            <select
              id="tt-section"
              value={values.sectionId}
              onChange={(e) => change("sectionId", e.target.value)}
              required
              disabled={!values.gradeId || sections.length === 0}
            >
              <option value="" disabled>{!values.gradeId ? "Select Grade first" : sections.length === 0 ? "No sections configured" : "Select Section"}</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="activity-form-field span-2">
            <Label htmlFor="tt-subject">{isSchool ? "Subject / Period Name *" : "Subject / Course Name *"}</Label>
            <select
              id="tt-subject"
              value={values.subjectId}
              onChange={(e) => change("subjectId", e.target.value)}
              required
              disabled={!values.gradeId || subjects.length === 0}
            >
              <option value="" disabled>{!values.gradeId ? "Select Grade first" : subjects.length === 0 ? "No subjects assigned to this grade" : "Select Subject"}</option>
              {subjects.map((s) => s ? (
                <option key={s._id} value={s._id}>{s.name} {s.code ? `(${s.code})` : ""}</option>
              ) : null)}
            </select>
          </div>

          <div className="activity-form-field">
            <div className="flex justify-between items-center mb-1.5">
              <Label htmlFor="tt-instructor">{isSchool ? "Assigned Teacher *" : "Assigned Instructor *"}</Label>
              <Link to="/teacher-assignments" className="text-xs text-muted-foreground hover:text-primary hover:underline">
                Configure Assignments
              </Link>
            </div>
            <select
              id="tt-instructor"
              value={values.teacherId}
              onChange={(e) => change("teacherId", e.target.value)}
              required
              disabled={!values.gradeId || !values.sectionId || !values.subjectId || teachers.length === 0}
            >
              <option value="" disabled>
                {!values.subjectId ? "Select Subject first" : teachers.length === 0 ? "No teacher assigned for this specific class" : "Select Teacher"}
              </option>
              {teachers.map((inst) => inst ? (
                <option key={inst._id} value={inst._id}>{inst.name}</option>
              ) : null)}
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
          <button
            type="button"
            className="activity-cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="activity-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting && <Spinner className="mr-2 size-4" />}
            {record ? "Save Schedule Changes" : (isSchool ? "Confirm & Schedule Period" : "Confirm & Schedule Class")}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
