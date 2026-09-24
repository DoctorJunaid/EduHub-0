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
  ExternalLink,
} from "lucide-react";
import { minutes } from "../../../lib/schedule.js";
import axiosInstance from "@/api/axiosInstance.js";
import { useSelector } from "react-redux";
import { selectFaculty } from "@/store/Slices/facultySlice.js";

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
  faculty = [],
}) {
  const presets = isSchool ? SCHOOL_PERIOD_PRESETS : COLLEGE_SLOT_PRESETS;
  const reduxFaculty = useSelector(selectFaculty);

  const activeWeekdays = useMemo(() => {
    return includeSaturday ? WEEKDAY_NAMES : WEEKDAY_NAMES.filter((w) => w.day !== 6);
  }, [includeSaturday]);

  // Form Mode: "class" or "break"
  const [mode, setMode] = useState(initialIsBreak ? "break" : "class");

  // Pre-defined academic data fetched from database
  const [dbGrades, setDbGrades] = useState([]);
  const [dbSections, setDbSections] = useState([]);
  const [dbGradeSubjects, setDbGradeSubjects] = useState([]);
  const [dbAssignedTeachers, setDbAssignedTeachers] = useState([]);
  const [allFaculty, setAllFaculty] = useState(() => {
    if (Array.isArray(faculty) && faculty.length > 0) return faculty;
    if (Array.isArray(reduxFaculty) && reduxFaculty.length > 0) return reduxFaculty;
    return [];
  });

  // Sync with redux or prop if updated
  useEffect(() => {
    const list =
      Array.isArray(faculty) && faculty.length > 0
        ? faculty
        : Array.isArray(reduxFaculty) && reduxFaculty.length > 0
        ? reduxFaculty
        : null;
    if (list && list.length > 0) {
      setAllFaculty((prev) => (prev.length === 0 ? list : prev));
    }
  }, [faculty, reduxFaculty]);

  // Form selections
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [subjectText, setSubjectText] = useState("");
  const [room, setRoom] = useState("");
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [days, setDays] = useState([initialDay]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 1. Fetch initial grades and campus faculty once when modal is open
  useEffect(() => {
    if (!isOpen) return;

    axiosInstance
      .get("/academic/grades")
      .then((res) => {
        setDbGrades(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error("Error fetching grades:", err));

    axiosInstance
      .get("/campus-admin/faculty")
      .then((res) => {
        const facList = res.data?.data || res.data || [];
        if (Array.isArray(facList) && facList.length > 0) {
          setAllFaculty(facList);
        }
      })
      .catch((err) => {
        console.error("Error fetching faculty from /campus-admin/faculty:", err);
        // Fallback: try /campus-admin/teachers
        axiosInstance
          .get("/campus-admin/teachers")
          .then((res) => {
            const list = res.data?.data || res.data || [];
            if (Array.isArray(list) && list.length > 0) {
              const mapped = list.map((t) => ({
                _id: t._id,
                name: t.user?.name || t.name,
                department: t.department || t.user?.department || "Faculty",
              }));
              setAllFaculty((prev) => (prev.length === 0 ? mapped : prev));
            }
          })
          .catch((e) => console.error("Error fetching teachers fallback:", e));
      });
  }, [isOpen]);

  // 2. Sync state when modal opens or editRecord changes
  useEffect(() => {
    if (!isOpen) return;

    if (editRecord) {
      const isBreak = Boolean(editRecord.isBreak);
      setMode(isBreak ? "break" : "class");

      const gId = editRecord.gradeId?._id || editRecord.gradeId || "";
      const sId = editRecord.sectionId?._id || editRecord.sectionId || "";
      const subId = editRecord.subjectId?._id || editRecord.subjectId || "";
      const tId = editRecord.teacherId?._id || editRecord.teacherId || "";

      setSelectedGradeId(gId);
      setSelectedSectionId(sId);
      setSelectedSubjectId(subId);
      setSelectedTeacherId(tId);
      setSubjectText(editRecord.subject || editRecord.breakTitle || "");
      setRoom(editRecord.room || editRecord.roomNumber || (isSchool ? "Room 101" : "Hall 1"));
      setStartTime(editRecord.startTime || "08:00");
      setEndTime(editRecord.endTime || "08:50");
      const recordDays = Array.isArray(editRecord.days) && editRecord.days.length ? editRecord.days : [1];
      setDays(recordDays);
    } else {
      const isBreak = Boolean(initialIsBreak);
      setMode(isBreak ? "break" : "class");

      // Match currentClass if provided
      const matchedGrade = dbGrades.find(
        (g) => g.name?.trim().toLowerCase() === currentClass?.program?.trim().toLowerCase()
      );
      const gId = matchedGrade?._id || (dbGrades[0]?._id ?? "");

      setSelectedGradeId(gId);
      setSelectedSectionId("");
      setSelectedSubjectId("");
      setSelectedTeacherId("");
      setSubjectText(isBreak ? "Lunch & Prayer Break" : "");
      setRoom(isBreak ? "Campus Grounds / Cafeteria" : (options?.room?.[0] || (isSchool ? "Room 101" : "Hall 1")));
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
      setDays([initialDay || 1]);
    }
    setError("");
  }, [isOpen, editRecord, initialDay, initialStartTime, initialEndTime, initialIsBreak, dbGrades.length]);

  // 3. Whenever selectedGradeId changes, load sections and grade-subjects
  useEffect(() => {
    if (!selectedGradeId) {
      setDbSections([]);
      setDbGradeSubjects([]);
      return;
    }

    axiosInstance
      .get(`/academic/sections?gradeId=${selectedGradeId}`)
      .then((res) => {
        const secs = Array.isArray(res.data) ? res.data : [];
        setDbSections(secs);
        // Default section if currentClass section matches
        if (!selectedSectionId) {
          const matchSec = secs.find(
            (s) => s.name?.trim().toLowerCase() === currentClass?.section?.trim().toLowerCase()
          );
          if (matchSec) setSelectedSectionId(matchSec._id);
          else if (secs.length > 0) setSelectedSectionId(secs[0]._id);
        }
      })
      .catch((err) => console.error("Error fetching sections:", err));

    axiosInstance
      .get(`/academic/grade-subjects?gradeId=${selectedGradeId}`)
      .then((res) => {
        const gsList = Array.isArray(res.data) ? res.data : [];
        setDbGradeSubjects(gsList);
      })
      .catch((err) => console.error("Error fetching grade subjects:", err));
  }, [selectedGradeId]);

  // 4. Whenever selectedGradeId, selectedSectionId, or selectedSubjectId change, load assigned teachers
  useEffect(() => {
    if (!selectedGradeId || !selectedSectionId || !selectedSubjectId) {
      setDbAssignedTeachers([]);
      return;
    }

    axiosInstance
      .get(
        `/academic/teacher-assignments?gradeId=${selectedGradeId}&sectionId=${selectedSectionId}&subjectId=${selectedSubjectId}`
      )
      .then((res) => {
        const assignments = Array.isArray(res.data) ? res.data : [];
        const teachers = assignments.map((a) => a.teacherId).filter(Boolean);
        setDbAssignedTeachers(teachers);
        if (teachers.length > 0 && !selectedTeacherId) {
          setSelectedTeacherId(teachers[0]._id);
        }
      })
      .catch((err) => console.error("Error fetching assigned teachers:", err));
  }, [selectedGradeId, selectedSectionId, selectedSubjectId]);

  // Filter out already-assigned teachers from general campus faculty to avoid duplicate options
  const displayFaculty = useMemo(() => {
    if (!allFaculty || !allFaculty.length) return [];
    if (!dbAssignedTeachers.length) return allFaculty;
    const assignedIds = new Set(dbAssignedTeachers.map((t) => String(t._id || t.id)));
    return allFaculty.filter((f) => !assignedIds.has(String(f._id || f.id)));
  }, [allFaculty, dbAssignedTeachers]);

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
      setSubjectText(preset.name.split(" (")[0]);
      setRoom("Campus Grounds / Cafeteria");
    } else {
      setMode("class");
    }
  };

  const handleGradeChange = (gradeId) => {
    setSelectedGradeId(gradeId);
    setSelectedSectionId("");
    setSelectedSubjectId("");
    setSelectedTeacherId("");
    setError("");
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSectionId(sectionId);
    setSelectedTeacherId("");
    setError("");
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    setSelectedTeacherId("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "class") {
      if (!selectedGradeId) {
        setError("Please select a pre-defined Grade/Class.");
        return;
      }
      if (!selectedSectionId) {
        setError("Please select a Section.");
        return;
      }
      if (!selectedSubjectId) {
        setError("Please select a Subject assigned to this Grade.");
        return;
      }
      if (!selectedTeacherId) {
        setError("Please select a Teacher for this subject.");
        return;
      }
    } else {
      if (!subjectText.trim()) {
        setError("Please enter or select a break interval name.");
        return;
      }
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

      // Resolve human-readable names for UI grid compatibility
      const targetGradeObj = dbGrades.find((g) => g._id === selectedGradeId);
      const targetSectionObj = dbSections.find((s) => s._id === selectedSectionId);
      const targetGradeSub = dbGradeSubjects.find((gs) => gs.subjectId?._id === selectedSubjectId);
      const targetTeacherObj =
        dbAssignedTeachers.find((t) => (t._id || t.id) === selectedTeacherId || t.name === selectedTeacherId) ||
        allFaculty.find((f) => (f._id || f.id) === selectedTeacherId || f.name === selectedTeacherId);

      const resolvedProgram = targetGradeObj?.name || currentClass?.program || (isSchool ? "Grade 10" : "BS Computer Science");
      const resolvedSection = targetSectionObj?.name || currentClass?.section || "A";
      const resolvedSubject = isBreak ? subjectText.trim() : (targetGradeSub?.subjectId?.name || "Subject");
      const resolvedInstructor = isBreak
        ? "Duty Staff"
        : (targetTeacherObj?.name || selectedTeacherId || "Assigned Faculty");
      const resolvedTeacherId = isBreak
        ? null
        : (targetTeacherObj?._id || targetTeacherObj?.id || (selectedTeacherId && selectedTeacherId.length === 24 ? selectedTeacherId : null));

      await onSave({
        gradeId: isBreak ? null : selectedGradeId,
        sectionId: isBreak ? null : selectedSectionId,
        subjectId: isBreak ? null : selectedSubjectId,
        teacherId: resolvedTeacherId,
        program: resolvedProgram,
        section: resolvedSection,
        subject: resolvedSubject,
        breakTitle: isBreak ? subjectText.trim() : "",
        isBreak,
        instructor: resolvedInstructor,
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

  const activeGradeName = dbGrades.find((g) => g._id === selectedGradeId)?.name || currentClass?.program || "Class";
  const activeSectionName = dbSections.find((s) => s._id === selectedSectionId)?.name || currentClass?.section || "A";

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
                  {activeGradeName} • Sec {activeSectionName}
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
                if (!subjectText) setSubjectText("Lunch & Prayer Break");
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
            {mode === "class" ? (
              <>
                {/* Predefined Dynamic Dropdowns: Grade & Section */}
                <div className="qs-card-group">
                  <div className="qs-card-title-row">
                    <span className="qs-card-title">
                      <GraduationCap size={14} /> Academic Class & Section (Pre-defined)
                    </span>
                    <a
                      href="/academics"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "11px", color: "#2563eb", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}
                    >
                      Academic Setup <ExternalLink size={11} />
                    </a>
                  </div>

                  <div className="qs-row-2col">
                    <div>
                      <label className="qs-label" style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>
                        Grade / Class *
                      </label>
                      <select
                        required
                        value={selectedGradeId}
                        onChange={(e) => handleGradeChange(e.target.value)}
                        className="qs-input"
                      >
                        <option value="">-- Select Grade / Class --</option>
                        {dbGrades.map((g) => (
                          <option key={g._id} value={g._id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="qs-label" style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>
                        Section *
                      </label>
                      <select
                        required
                        value={selectedSectionId}
                        onChange={(e) => handleSectionChange(e.target.value)}
                        disabled={!selectedGradeId}
                        className="qs-input"
                      >
                        <option value="">
                          {!selectedGradeId ? "-- Choose Grade First --" : dbSections.length === 0 ? "No sections found" : "-- Select Section --"}
                        </option>
                        {dbSections.map((s) => (
                          <option key={s._id} value={s._id}>
                            Section {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Predefined Dynamic Dropdown: Subject */}
                <div>
                  <label className="qs-label">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <BookOpen size={13} style={{ color: "#64748b" }} /> Subject / Course (Configured for Class) *
                    </span>
                  </label>
                  <select
                    required
                    value={selectedSubjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    disabled={!selectedGradeId}
                    className="qs-input"
                    style={{ height: "44px", fontSize: "14px" }}
                  >
                    <option value="">
                      {!selectedGradeId
                        ? "-- Select Grade First --"
                        : dbGradeSubjects.length === 0
                        ? "No subjects mapped to this grade yet"
                        : "-- Select Subject --"}
                    </option>
                    {dbGradeSubjects.map((gs) => (
                      <option key={gs.subjectId?._id} value={gs.subjectId?._id}>
                        {gs.subjectId?.name} {gs.subjectId?.code ? `(${gs.subjectId.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Predefined Dynamic Dropdown: Teacher & Classroom */}
                <div className="qs-row-2col">
                  <div>
                    <label className="qs-label">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <User size={13} style={{ color: "#64748b" }} /> Subject Teacher *
                      </span>
                    </label>
                    <select
                      required
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      disabled={!selectedSubjectId}
                      className="qs-input"
                    >
                      <option value="">
                        {!selectedSubjectId
                          ? "-- Select Subject First --"
                          : dbAssignedTeachers.length > 0
                          ? "-- Select Assigned Teacher --"
                          : "-- Select Campus Teacher --"}
                      </option>
                      {dbAssignedTeachers.length > 0 && (
                        <optgroup label="✓ Assigned to This Subject">
                          {dbAssignedTeachers.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.name} (Assigned)
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {displayFaculty.length > 0 && (
                        <optgroup label={dbAssignedTeachers.length > 0 ? "Other Faculty" : "Campus Faculty"}>
                          {displayFaculty.map((f) => (
                            <option key={f._id || f.id} value={f._id || f.id}>
                              {f.name} ({f.department || "Faculty"})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {dbAssignedTeachers.length === 0 && displayFaculty.length === 0 && Array.isArray(options?.instructor) && options.instructor.length > 0 && (
                        <optgroup label="Available Faculty">
                          {options.instructor.map((inst, idx) => (
                            <option key={`opt-inst-${idx}`} value={inst}>
                              {inst}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {dbAssignedTeachers.length === 0 && displayFaculty.length === 0 && (!options?.instructor || options.instructor.length === 0) && (
                        <option value="" disabled>
                          No teachers registered yet
                        </option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="qs-label">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Building size={13} style={{ color: "#64748b" }} /> Classroom / Lab *
                      </span>
                    </label>
                    <input
                      list="qs-room-suggestions"
                      type="text"
                      required
                      placeholder="e.g. Room 101, Science Lab"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="qs-input"
                    />
                    <datalist id="qs-room-suggestions">
                      {(options?.room || ["Room 101", "Room 102", "Room 103", "Science Lab", "Computer Lab"]).map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </>
            ) : (
              /* Break Interval Mode */
              <div>
                <label className="qs-label">
                  <span>Break / Recess Interval Name *</span>
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
                    Spans Across Campus Routine
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lunch & Prayer Break, Morning Recess"
                  value={subjectText}
                  onChange={(e) => setSubjectText(e.target.value)}
                  className="qs-input"
                  style={{ height: "44px", fontSize: "14px" }}
                />
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

          {/* 5. Fixed Pinned Footer */}
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
