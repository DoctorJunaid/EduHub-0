import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import api from "../../api/axiosInstance";
import { toast } from "react-hot-toast";
import FullPageFormShell from "@/components/common/FullPageFormShell";

const STANDARD_PERIODS = [
  { period: 1, label: "Period 1 (08:00 AM – 08:45 AM)", startTime: "08:00", endTime: "08:45" },
  { period: 2, label: "Period 2 (08:45 AM – 09:30 AM)", startTime: "08:45", endTime: "09:30" },
  { period: 3, label: "Period 3 (09:45 AM – 10:30 AM)", startTime: "09:45", endTime: "10:30" },
  { period: 4, label: "Period 4 (10:30 AM – 11:15 AM)", startTime: "10:30", endTime: "11:15" },
  { period: 5, label: "Period 5 (11:30 AM – 12:15 PM)", startTime: "11:30", endTime: "12:15" },
  { period: 6, label: "Period 6 (12:15 PM – 01:00 PM)", startTime: "12:15", endTime: "13:00" },
  { period: 7, label: "Period 7 (01:00 PM – 01:45 PM)", startTime: "13:00", endTime: "13:45" },
  { period: 8, label: "Period 8 (01:45 PM – 02:30 PM)", startTime: "13:45", endTime: "14:30" },
];

const FALLBACK_GRADES = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "10",
  "9",
  "Grade 9",
  "Grade 10",
];

const FALLBACK_SUBJECTS = [
  "Mathematics",
  "Maths",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English Language",
  "Pakistan Studies",
  "Islamic Studies",
  "General Science",
];

const INITIAL_CAMPUS_FACULTY = [
  { _id: "6aae6108c17cbca684346902", name: "Shahzad Habib", department: "Sciences & Mathematics" },
  { _id: "6aae611ac17cbca684346903", name: "zaid shaheen", department: "Primary Wing (Grade 1-5)" },
  { _id: "6aae6683b95cec22be2a1102", name: "Idrees ud din", department: "Primary Wing (Grade 1-5)" },
  { _id: "6aae6a9360bc1d0478fc6838", name: "idrees khan", department: "Primary Wing (Grade 1-5)" },
];

const getTeacherDisplayName = (t) => {
  if (!t) return "Teacher";
  if (t.name) return t.name;
  if (t.user && typeof t.user === "object" && t.user.name) return t.user.name;
  if (t.employeeId) return `Teacher (${t.employeeId})`;
  return "Teacher";
};

const getTeacherId = (t) => {
  if (!t) return "";
  if (t.user && typeof t.user === "object" && t.user._id) return String(t.user._id);
  if (t._id) return String(t._id);
  return "";
};

const AssignSubstituteDialog = ({
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
}) => {
  const [formData, setFormData] = useState({
    date: selectedDate || new Date().toISOString().split("T")[0],
    period: 1,
    startTime: "08:00",
    endTime: "08:45",
    className: "10",
    subject: "Maths",
    section: "A",
    originalTeacherId: "",
    substituteTeacherId: "",
    reason: "Teacher Absent",
    notes: "",
  });

  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState(INITIAL_CAMPUS_FACULTY);
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Merged available classes (from backend + standard grades)
  const availableClasses = React.useMemo(() => {
    const list = grades.map((g) => g.name);
    FALLBACK_GRADES.forEach((fg) => {
      if (!list.includes(fg)) list.push(fg);
    });
    return list;
  }, [grades]);

  // Merged available sections
  const availableSections = React.useMemo(() => {
    const list = sections.map((s) => s.name);
    ["A", "B", "C", "D", "Section A", "Section B", "Section C"].forEach((sec) => {
      if (!list.includes(sec)) list.push(sec);
    });
    return list;
  }, [sections]);

  // Merged available subjects
  const availableSubjects = React.useMemo(() => {
    const list = subjects.map((s) => s.name);
    FALLBACK_SUBJECTS.forEach((fs) => {
      if (!list.includes(fs)) list.push(fs);
    });
    return list;
  }, [subjects]);

  // Initialize and load data on open
  useEffect(() => {
    if (!isOpen) return;

    setFormData((current) => ({
      ...current,
      date: selectedDate || current.date,
    }));

    // Fetch teachers across all valid endpoints
    const fetchTeachers = async () => {
      try {
        const facRes = await api.get("/campus-admin/faculty");
        if (facRes.data?.success && Array.isArray(facRes.data.data) && facRes.data.data.length > 0) {
          setAllTeachers(facRes.data.data);
          return;
        }
      } catch {
        // Continue to fallback
      }

      try {
        const sugRes = await api.get("/campus/substitutes/suggest", {
          params: { date: selectedDate || new Date().toISOString().split("T")[0], period: 1 },
        });
        if (sugRes.data?.success && Array.isArray(sugRes.data.data) && sugRes.data.data.length > 0) {
          setAllTeachers(sugRes.data.data);
          return;
        }
      } catch {
        // Continue to fallback
      }

      try {
        const facRes2 = await api.get("/campus/faculty");
        if (facRes2.data?.success && Array.isArray(facRes2.data.data) && facRes2.data.data.length > 0) {
          setAllTeachers(facRes2.data.data);
          return;
        }
      } catch {
        // Continue to fallback
      }

      try {
        const teachRes = await api.get("/campus-admin/teachers");
        if (teachRes.data?.success && Array.isArray(teachRes.data.data) && teachRes.data.data.length > 0) {
          setAllTeachers(teachRes.data.data);
        }
      } catch {
        // Kept INITIAL_CAMPUS_FACULTY
      }
    };

    // Fetch academic grades and subjects for dropdowns
    const fetchAcademics = async () => {
      try {
        const [gradesRes, subjectsRes] = await Promise.allSettled([
          api.get("/academic/grades"),
          api.get("/academic/subjects"),
        ]);
        if (gradesRes.status === "fulfilled" && Array.isArray(gradesRes.value?.data)) {
          setGrades(gradesRes.value.data);
        }
        if (subjectsRes.status === "fulfilled" && Array.isArray(subjectsRes.value?.data)) {
          setSubjects(subjectsRes.value.data);
        }
      } catch (err) {
        console.warn("Failed to load academic grades or subjects:", err);
      }
    };

    fetchTeachers();
    fetchAcademics();
  }, [isOpen, selectedDate]);

  // Synchronize allTeachers if availableTeachers returns candidates and allTeachers was empty
  useEffect(() => {
    if (allTeachers.length === 0 && availableTeachers.length > 0) {
      setAllTeachers(availableTeachers);
    }
  }, [availableTeachers, allTeachers.length]);

  // Fetch sections when grade selection changes
  useEffect(() => {
    if (!selectedGradeId) {
      setSections([]);
      return;
    }

    const fetchSections = async () => {
      try {
        const res = await api.get(`/academic/sections?gradeId=${selectedGradeId}`);
        if (Array.isArray(res.data)) {
          setSections(res.data);
        }
      } catch (err) {
        console.warn("Could not load sections for selected grade:", err);
      }
    };

    fetchSections();
  }, [selectedGradeId]);

  // Sync selectedGradeId when className changes or is preset
  useEffect(() => {
    if (grades.length > 0 && formData.className && !selectedGradeId) {
      const match = grades.find((g) => g.name.toLowerCase() === formData.className.toLowerCase());
      if (match) setSelectedGradeId(match._id);
    }
  }, [grades, formData.className, selectedGradeId]);

  // Fetch suggestions when date, period, class, section, or original teacher changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!formData.date || !formData.period) {
        setAvailableTeachers([]);
        return;
      }

      try {
        setLoadingSuggestions(true);
        const res = await api.get("/campus/substitutes/suggest", {
          params: {
            date: formData.date,
            period: formData.period,
            className: formData.className,
            section: formData.section,
            startTime: formData.startTime,
            endTime: formData.endTime,
          },
        });

        if (res.data?.success && Array.isArray(res.data.data)) {
          const filtered = res.data.data.filter(
            (t) => getTeacherId(t) !== String(formData.originalTeacherId)
          );
          setAvailableTeachers(filtered);

          // Reset substitute selection if selected teacher is no longer available
          if (
            formData.substituteTeacherId &&
            !filtered.some((t) => getTeacherId(t) === String(formData.substituteTeacherId))
          ) {
            setFormData((curr) => ({ ...curr, substituteTeacherId: "" }));
          }
        }
      } catch {
        // Silently handle
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [
    formData.date,
    formData.period,
    formData.className,
    formData.section,
    formData.originalTeacherId,
    formData.startTime,
    formData.endTime,
  ]);

  const change = (event) =>
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const handlePeriodChange = (e) => {
    const pNum = Number(e.target.value);
    const found = STANDARD_PERIODS.find((p) => p.period === pNum);
    setFormData((curr) => ({
      ...curr,
      period: pNum,
      startTime: found ? found.startTime : curr.startTime,
      endTime: found ? found.endTime : curr.endTime,
    }));
  };

  const handleClassChange = (e) => {
    const chosenName = e.target.value;
    const foundGrade = grades.find((g) => g.name === chosenName);
    setSelectedGradeId(foundGrade ? foundGrade._id : "");
    setFormData((curr) => ({
      ...curr,
      className: chosenName,
      section: "", // reset section when class changes
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!formData.originalTeacherId || !formData.substituteTeacherId) {
      return toast.error("Please select both original and substitute teachers.", {
        id: "substitute-select-error",
      });
    }

    if (String(formData.originalTeacherId) === String(formData.substituteTeacherId)) {
      return toast.error("A teacher cannot substitute for themselves.", {
        id: "substitute-self-error",
      });
    }

    try {
      setSubmitting(true);
      const res = await api.post("/campus/substitutes", formData);
      if (res.data?.success) {
        toast.success(res.data.message || "Substitute assigned successfully.");
        if (res.data.warning) {
          toast(res.data.warning, { icon: "⚠️", duration: 5000 });
        }
        onSuccess();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to assign substitute.",
        { id: "substitute-submit-error" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;
  const ready = formData.originalTeacherId && formData.substituteTeacherId;

  return (
    <div className="substitute-assignment-form">
      <FullPageFormShell
        title="Assign Substitute"
        subtitle="Set class coverage details and select an available teacher for the period."
        parentName="Substitute Assignments"
        icon={<UsersRound size={22} />}
        onBack={onClose}
        maxWidth={1250}
        hideTitleRow={true}
        hideBackButton={true}
      >
        <form onSubmit={submit}>
          <div className="activity-form-grid substitute-form-grid">
            <div className="activity-section-title">Class Schedule</div>

            {/* Date Field */}
            <div className="activity-form-field">
              <label htmlFor="substitute-date">Date *</label>
              <input
                id="substitute-date"
                type="date"
                name="date"
                value={formData.date}
                onChange={change}
                required
              />
            </div>

            {/* Period Dropdown */}
            <div className="activity-form-field">
              <label htmlFor="substitute-period">Period *</label>
              <select
                id="substitute-period"
                name="period"
                value={formData.period}
                onChange={handlePeriodChange}
                required
              >
                {STANDARD_PERIODS.map((p) => (
                  <option key={p.period} value={p.period}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time Field */}
            <div className="activity-form-field">
              <label htmlFor="substitute-start">Start Time *</label>
              <input
                id="substitute-start"
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={change}
                required
              />
            </div>

            {/* End Time Field */}
            <div className="activity-form-field">
              <label htmlFor="substitute-end">End Time *</label>
              <input
                id="substitute-end"
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={change}
                required
              />
            </div>

            <div className="activity-section-title">Class &amp; Teacher Details</div>

            {/* Class / Grade Dropdown */}
            <div className="activity-form-field">
              <label htmlFor="substitute-class">Class *</label>
              <select
                id="substitute-class"
                name="className"
                value={formData.className}
                onChange={handleClassChange}
                required
              >
                <option value="">Select class</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Dropdown */}
            <div className="activity-form-field">
              <label htmlFor="substitute-section">Section</label>
              <select
                id="substitute-section"
                name="section"
                value={formData.section}
                onChange={change}
              >
                <option value="">Select section</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Dropdown */}
            <div className="activity-form-field">
              <label htmlFor="substitute-subject">Subject *</label>
              <select
                id="substitute-subject"
                name="subject"
                value={formData.subject}
                onChange={change}
                required
              >
                <option value="">Select subject</option>
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Original Teacher Dropdown */}
            <div className="activity-form-field">
              <label htmlFor="substitute-original">Original Teacher *</label>
              <select
                id="substitute-original"
                name="originalTeacherId"
                value={formData.originalTeacherId}
                onChange={change}
                required
              >
                <option value="">Select original teacher</option>
                {allTeachers.map((teacher) => {
                  const tId = getTeacherId(teacher);
                  return (
                    <option key={tId} value={tId}>
                      {getTeacherDisplayName(teacher)}{" "}
                      {teacher.department ? `(${teacher.department})` : teacher.employeeId ? `(${teacher.employeeId})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Reason Dropdown */}
            <div className="activity-form-field substitute-reason-field">
              <label htmlFor="substitute-reason">Reason *</label>
              <select
                id="substitute-reason"
                name="reason"
                value={formData.reason}
                onChange={change}
              >
                <option>Teacher Absent</option>
                <option>On Leave</option>
                <option>Training</option>
                <option>Emergency</option>
                <option>Other</option>
              </select>
            </div>

            {/* Direct Substitute Teacher Dropdown */}
            <div className="activity-form-field substitute-dropdown-row">
              <label htmlFor="substitute-teacher-select">Substitute Teacher (Dropdown) *</label>
              <select
                id="substitute-teacher-select"
                name="substituteTeacherId"
                value={formData.substituteTeacherId}
                onChange={change}
                required
              >
                <option value="">Select substitute teacher</option>
                {allTeachers
                  .filter((t) => getTeacherId(t) !== String(formData.originalTeacherId))
                  .map((teacher) => {
                    const tId = getTeacherId(teacher);
                    const isAvail = availableTeachers.some((at) => getTeacherId(at) === tId);
                    const name = getTeacherDisplayName(teacher);
                    return (
                      <option key={tId} value={tId}>
                        {name} {teacher.department ? `(${teacher.department})` : ""} {isAvail ? "— (Available)" : "— (Busy)"}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="activity-section-title">
              Available Substitute Teachers
            </div>

            {/* Interactive Candidate Cards (Synced with Dropdown) */}
            <div className="activity-form-field substitute-candidates">
              {loadingSuggestions ? (
                <p className="substitute-form-notice">
                  <Spinner className="size-4 text-zinc-700" /> Finding available
                  teachers…
                </p>
              ) : availableTeachers.length === 0 ? (
                <p className="substitute-form-warning">
                  <AlertCircle size={16} /> No teachers are currently available for
                  this period.
                </p>
              ) : (
                <div className="substitute-candidate-grid">
                  {availableTeachers.map((teacher) => {
                    const tId = getTeacherId(teacher);
                    const selected = String(formData.substituteTeacherId) === String(tId);
                    const name = getTeacherDisplayName(teacher);
                    const initials = name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2);

                    return (
                      <label
                        key={tId}
                        className={`substitute-candidate ${
                          selected ? "is-selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="substituteTeacherId"
                          value={tId}
                          checked={selected}
                          onChange={change}
                        />
                        <span className="substitute-candidate-avatar">
                          {initials}
                        </span>
                        <span>
                          <strong>{name}</strong>
                          <small>
                            {teacher.department || "General"}
                            {teacher.subjects?.length
                              ? ` · ${teacher.subjects.join(", ")}`
                              : ""}
                          </small>
                        </span>
                        {teacher.warning && (
                          <span className="substitute-load-warning">High load</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="activity-form-field substitute-notes">
              <label htmlFor="substitute-notes">
                Notes <span>(Optional)</span>
              </label>
              <textarea
                id="substitute-notes"
                name="notes"
                rows={3}
                maxLength={300}
                placeholder="Add instructions or context for the substitute teacher…"
                value={formData.notes}
                onChange={change}
              />
            </div>
          </div>

          <div className="activity-form-actions">
            <span
              className={
                ready ? "substitute-ready is-ready" : "substitute-ready"
              }
            >
              {ready ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {ready
                ? "Ready to assign coverage"
                : "Select both the original and substitute teacher"}
            </span>
            <div className="activity-form-action-buttons">
              <button
                type="button"
                className="activity-cancel-btn"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="activity-submit-btn"
                disabled={submitting || !ready}
              >
                {submitting ? (
                  <Spinner className="mr-2 size-4" />
                ) : (
                  <UserPlus size={15} />
                )}
                Assign Substitute
              </button>
            </div>
          </div>
        </form>
      </FullPageFormShell>
    </div>
  );
};

export default AssignSubstituteDialog;
