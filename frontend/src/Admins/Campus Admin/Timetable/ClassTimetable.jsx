import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Building,
  Users,
  BookOpen,
  School,
  GraduationCap,
  Coffee,
  Check,
  Edit3,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance.js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  selectTimetable,
  selectTimetableStatus,
  fetchSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
  classUpdated,
} from "@/store/Slices/timetableSlice.js";
import { selectFaculty, fetchFaculty } from "@/store/Slices/facultySlice.js";
import { selectStudents, fetchStudents } from "@/store/Slices/studentsSlice.js";
import { getMatrixConfig } from "./timetableData.js";
import { mondayOf, shiftDays, minutes } from "../../../lib/schedule.js";
import { useInstitution } from "@/context/InstitutionContext";
import toast from "react-hot-toast";
import TimetableGrid from "./TimetableGrid";
import ScheduledClasses from "./ScheduledClasses";
import QuickScheduleModal from "./QuickScheduleModal";
import ClassDetailsDialog from "./ClassDetailsDialog";
import usePaginationParams from "@/hooks/usePaginationParams";
import "./ClassTimetable.css";

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function ClassTimetable() {
  const { isSchool } = useInstitution();
  const dispatch = useDispatch();

  // Real database records from Redux
  const rawRecords = useSelector(selectTimetable);
  const timetableStatus = useSelector(selectTimetableStatus);
  const records = useMemo(() => {
    return Array.isArray(rawRecords) ? rawRecords : [];
  }, [rawRecords]);

  const rawFaculty = useSelector(selectFaculty);
  const faculty = useMemo(() => {
    return Array.isArray(rawFaculty) ? rawFaculty : [];
  }, [rawFaculty]);

  const rawStudents = useSelector(selectStudents);
  const students = useMemo(() => {
    return Array.isArray(rawStudents) ? rawStudents : [];
  }, [rawStudents]);

  // Load initial timetable once on mount
  useEffect(() => {
    dispatch(fetchSchedules());
  }, [dispatch]);

  // Lazily load faculty and students if not already populated
  useEffect(() => {
    if (!rawFaculty || rawFaculty.length === 0) {
      dispatch(fetchFaculty());
    }
  }, [dispatch, rawFaculty?.length]);

  useEffect(() => {
    if (!rawStudents || rawStudents.length === 0) {
      dispatch(fetchStudents());
    }
  }, [dispatch, rawStudents?.length]);

  const [view, setView] = useState("week");
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const { page, pageSize, setPage, setPageSize } = usePaginationParams({
    defaultPage: 1,
    defaultPageSize: 20,
  });
  const [educationType, setEducationType] = useState(() => (isSchool ? "School" : "College"));
  const [includeSaturday, setIncludeSaturday] = useState(true);

  useEffect(() => {
    setEducationType(isSchool ? "School" : "College");
  }, [isSchool]);

  // Pre-defined academic data from database
  const [dbGrades, setDbGrades] = useState([]);
  const [dbSections, setDbSections] = useState([]);
  const [isLoadingAcademic, setIsLoadingAcademic] = useState(false);

  // Fetch real grades for campus
  useEffect(() => {
    setIsLoadingAcademic(true);
    axiosInstance
      .get("/academic/grades")
      .then((res) => {
        const grades = Array.isArray(res.data) ? res.data : [];
        setDbGrades(grades);
        if (grades.length > 0 && !selectedClass) {
          setSelectedClass(grades[0].name);
        }
      })
      .catch((err) => console.error("Error fetching grades in timetable:", err))
      .finally(() => setIsLoadingAcademic(false));
  }, []);

  // Custom dynamically added classes and sections by user
  const [customClasses, setCustomClasses] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [isAddingCustomClass, setIsAddingCustomClass] = useState(false);
  const [customClassInput, setCustomClassInput] = useState("");
  const [isAddingCustomSection, setIsAddingCustomSection] = useState(false);
  const [customSectionInput, setCustomSectionInput] = useState("");

  // Derive dynamic list of available Classes/Grades (Prioritizes real database grades!)
  const availableClasses = useMemo(() => {
    const fromGrades = dbGrades.map((g) => g.name).filter(Boolean);
    if (fromGrades.length > 0) {
      const fromRecords = records
        .map((r) => r.program || r.className || r.gradeOrClass)
        .filter(Boolean);
      return [...new Set([...fromGrades, ...customClasses, ...fromRecords])];
    }
    const fromStudents = students.map((s) => s.gradeOrClass || s.program).filter(Boolean);
    const fromRecords = records.map((r) => r.program || r.className || r.gradeOrClass).filter(Boolean);
    const defaults = isSchool
      ? ["Grade 10", "Grade 9", "Grade 8", "Grade 7", "Grade 6"]
      : ["BS Computer Science", "BS Software Engineering", "BBA", "BS Data Science"];
    return [...new Set([...customClasses, ...fromStudents, ...fromRecords, ...defaults])];
  }, [dbGrades, students, records, customClasses, isSchool]);

  // Active Selected Class
  const [selectedClass, setSelectedClass] = useState(() => (isSchool ? "10" : "BS Computer Science"));

  // Fetch pre-defined sections whenever selectedClass changes
  useEffect(() => {
    const normalize = (str) => (str || "").trim().toLowerCase().replace(/^(grade|class)\s+/i, "");
    const matchedGrade = dbGrades.find(
      (g) =>
        g.name?.trim().toLowerCase() === selectedClass?.trim().toLowerCase() ||
        normalize(g.name) === normalize(selectedClass)
    );
    if (matchedGrade?._id) {
      axiosInstance
        .get(`/academic/sections?gradeId=${matchedGrade._id}`)
        .then((res) => {
          const secs = Array.isArray(res.data) ? res.data : [];
          setDbSections(secs);
          if (secs.length > 0) {
            const hasCurrent = secs.some(
              (s) =>
                s.name?.trim().toLowerCase() === selectedSection?.trim().toLowerCase() ||
                s.name?.trim().toLowerCase().replace(/^section\s+/i, "") ===
                  selectedSection?.trim().toLowerCase().replace(/^section\s+/i, "")
            );
            if (!hasCurrent) {
              setSelectedSection(secs[0].name);
            }
          }
        })
        .catch((err) => console.error("Error fetching sections in timetable:", err));
    } else {
      setDbSections([]);
    }
  }, [selectedClass, dbGrades]);

  // Derive dynamic list of Sections (Prioritizes real database sections for active class!)
  const availableSections = useMemo(() => {
    const fromDb = dbSections.map((s) => s.name).filter(Boolean);
    if (fromDb.length > 0) {
      return [...new Set([...fromDb, ...customSections])];
    }
    const fromStudents = students.map((s) => s.section).filter(Boolean);
    const fromRecords = records.map((r) => r.section).filter(Boolean);
    const defaults = ["A", "B", "C", "D"];
    return [...new Set([...customSections, ...fromStudents, ...fromRecords, ...defaults])];
  }, [dbSections, students, records, customSections]);

  const [selectedSection, setSelectedSection] = useState("A");

  // Keep selectedClass synchronized if availableClasses changes and current selection is missing
  useEffect(() => {
    if (availableClasses.length && !availableClasses.includes(selectedClass)) {
      setSelectedClass(availableClasses[0]);
    }
  }, [availableClasses, selectedClass]);

  // Handle adding custom class with backend persistence
  const handleSaveCustomClass = async (e) => {
    e.preventDefault();
    const name = customClassInput.trim();
    if (!name) return;
    try {
      const res = await axiosInstance.post("/academic/grades", { name });
      const newGrade = res.data;
      setDbGrades((prev) => [...prev, newGrade]);
      setSelectedClass(name);
      setCustomClassInput("");
      setIsAddingCustomClass(false);
      toast.success(`Class "${name}" created and saved!`);
    } catch (err) {
      console.warn("Could not persist to /academic/grades, updating locally:", err);
      setCustomClasses((prev) => [...new Set([...prev, name])]);
      setSelectedClass(name);
      setCustomClassInput("");
      setIsAddingCustomClass(false);
      toast.success(`Class "${name}" selected!`);
    }
  };

  // Handle adding custom section with backend persistence
  const handleSaveCustomSection = async (e) => {
    e.preventDefault();
    const secName = customSectionInput.trim();
    if (!secName) return;

    const normalize = (str) => (str || "").trim().toLowerCase().replace(/^(grade|class)\s+/i, "");
    const matchedGrade = dbGrades.find(
      (g) =>
        g.name?.trim().toLowerCase() === selectedClass?.trim().toLowerCase() ||
        normalize(g.name) === normalize(selectedClass)
    );

    if (matchedGrade?._id) {
      try {
        const res = await axiosInstance.post("/academic/sections", {
          name: secName,
          gradeId: matchedGrade._id,
        });
        const newSec = res.data;
        setDbSections((prev) => [...prev, newSec]);
        setSelectedSection(secName);
        setCustomSectionInput("");
        setIsAddingCustomSection(false);
        toast.success(`Section "${secName}" created and saved!`);
        return;
      } catch (err) {
        console.warn("Could not persist section to DB, using local state:", err);
      }
    }
    setCustomSections((prev) => [...new Set([...prev, secName])]);
    setSelectedSection(secName);
    setCustomSectionInput("");
    setIsAddingCustomSection(false);
    toast.success(`Section "${secName}" selected!`);
  };

  // Dynamic Options for form dropdowns from real database
  const options = useMemo(() => {
    const teacherNames = [
      ...new Set(
        faculty
          .map((f) => f.name)
          .concat(records.map((r) => r.instructor || r.teacherName))
          .filter(Boolean)
      ),
    ];
    const roomNames = [
      ...new Set(
        records
          .map((r) => r.room || r.roomNumber)
          .concat(isSchool ? ["Room 101", "Room 102", "Room 103", "Science Lab", "Computer Lab"] : ["Hall A", "Hall B", "Lab 3", "Auditorium"])
          .filter(Boolean)
      ),
    ];

    return {
      program: availableClasses,
      section: availableSections,
      instructor: teacherNames.length
        ? teacherNames
        : [isSchool ? "Ms. Ayesha Khan" : "Dr. Usman Khan"],
      room: roomNames,
    };
  }, [faculty, records, availableClasses, availableSections, isSchool]);

  // Filter real records specifically for the active Class and Section (matches relational IDs and fuzzy names)
  const classRoutineRecords = useMemo(() => {
    const normalizeClass = (str) =>
      (str || "").trim().toLowerCase().replace(/^(grade|class)\s+/i, "");
    const normalizeSec = (str) =>
      (str || "").trim().toLowerCase().replace(/^section\s+/i, "");

    const activeGrade = dbGrades.find(
      (g) =>
        g.name?.trim().toLowerCase() === selectedClass?.trim().toLowerCase() ||
        normalizeClass(g.name) === normalizeClass(selectedClass)
    );
    const activeGradeId = activeGrade?._id;

    const activeSection = dbSections.find(
      (s) =>
        s.name?.trim().toLowerCase() === selectedSection?.trim().toLowerCase() ||
        normalizeSec(s.name) === normalizeSec(selectedSection)
    );
    const activeSectionId = activeSection?._id;

    return records.filter((r) => {
      // Break slots apply across all classes
      if (r.isBreak) return true;

      const rGradeId = r.gradeId?._id || r.gradeId;
      const prog = (r.program || r.gradeOrClass || r.className || "").trim();
      const matchProg =
        !selectedClass ||
        (activeGradeId && rGradeId && String(rGradeId) === String(activeGradeId)) ||
        prog.toLowerCase() === selectedClass.trim().toLowerCase() ||
        normalizeClass(prog) === normalizeClass(selectedClass);

      const rSectionId = r.sectionId?._id || r.sectionId;
      const sec = (r.section || "").trim();
      const matchSec =
        !selectedSection ||
        !sec ||
        (activeSectionId && rSectionId && String(rSectionId) === String(activeSectionId)) ||
        sec.toLowerCase() === selectedSection.trim().toLowerCase() ||
        normalizeSec(sec) === normalizeSec(selectedSection) ||
        normalizeSec(sec) === "all" ||
        normalizeSec(sec) === "all sections";

      return matchProg && matchSec;
    });
  }, [records, selectedClass, selectedSection, dbGrades, dbSections]);

  const matrixConfig = useMemo(
    () => getMatrixConfig(educationType, includeSaturday),
    [educationType, includeSaturday]
  );

  // Modal Dialogs & Actions
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickModalSlot, setQuickModalSlot] = useState({
    days: [1],
    startTime: "08:00",
    endTime: "08:50",
    isBreak: false,
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [fullFormOpen, setFullFormOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Open Quick Schedule Modal
  const handleOpenQuickAdd = (slotDefaults, isBreak = false) => {
    setEditingRecord(null);
    if (slotDefaults) {
      setQuickModalSlot({
        days: slotDefaults.days || [1],
        startTime: slotDefaults.startTime || (isBreak ? "12:30" : "08:00"),
        endTime: slotDefaults.endTime || (isBreak ? "13:15" : "08:50"),
        isBreak,
      });
    } else {
      setQuickModalSlot({
        days: [1],
        startTime: isBreak ? "12:30" : "08:00",
        endTime: isBreak ? "13:15" : "08:50",
        isBreak,
      });
    }
    setQuickModalOpen(true);
  };

  // Action Dispatcher from Grid or List
  const onAction = (mode, id, defaults) => {
    let record = records.find((r) => (r.id || r._id) === id);
    if (!record && defaults && typeof defaults === "object") {
      record = defaults;
    }
    if (mode === "add") {
      handleOpenQuickAdd(defaults);
    } else if (mode === "edit" && record) {
      setEditingRecord(record);
      setQuickModalSlot({
        days: record.days || (record.isBreak ? [1, 2, 3, 4, 5, 6] : [1]),
        startTime: record.startTime,
        endTime: record.endTime,
        isBreak: Boolean(record.isBreak),
      });
      setQuickModalOpen(true);
    } else if (mode === "delete" && record) {
      setDeleteTarget(record);
    } else if (mode === "view" && record) {
      setViewingRecord(record);
    }
  };

  // Save Routine from QuickScheduleModal
  const handleSaveQuickSchedule = async (values) => {
    if (editingRecord) {
      await dispatch(
        updateSchedule({
          ...values,
          id: editingRecord._id || editingRecord.id,
        })
      ).unwrap();
      toast.success(values.isBreak ? "Break interval updated!" : "Schedule routine updated successfully!");
    } else {
      await dispatch(
        addSchedule({
          ...values,
          program: values.program || selectedClass,
          section: values.section || selectedSection,
          institutionType: educationType,
        })
      ).unwrap();
      toast.success(
        values.isBreak
          ? "Break interval added to campus routine!"
          : isSchool
          ? "Class period scheduled successfully!"
          : "Class routine scheduled successfully!"
      );
    }
    dispatch(fetchSchedules(true));
  };

  // Interactive Drag & Drop Handler with Duration Preservation & Optimistic UI
  const handleMoveClass = async (recordId, targetDay, targetStartTime, sourceDay) => {
    const record = records.find((r) => (r.id || r._id) === recordId);
    if (!record) return;

    // 1. Snapshot previous state for rollback if network fails
    const previousDays = Array.isArray(record.days) && record.days.length ? [...record.days] : [1];
    const previousDayOfWeek = record.dayOfWeek;
    const previousStartTime = record.startTime;
    const previousEndTime = record.endTime;

    // 2. Compute exact duration of the dragged class to PRESERVE 1-hr, 50-min, 90-min, etc.
    const origStart = minutes(record.startTime);
    const origEnd = minutes(record.endTime);
    const originalDurationMinutes = origEnd > origStart ? origEnd - origStart : 50;

    // Preserve the original class duration exactly!
    const targetStartMin = minutes(targetStartTime);
    const targetEndMin = targetStartMin + originalDurationMinutes;
    const resolvedEndTime = `${String(Math.floor(targetEndMin / 60)).padStart(2, "0")}:${String(targetEndMin % 60).padStart(2, "0")}`;
    const resolvedDayName = WEEKDAY_NAMES[targetDay - 1] || "Monday";

    // 3. If dragging a single day of a multi-day recurring class to a DIFFERENT time slot:
    // Split: remove the dragged day from the original schedule and create a separate slot for that day
    if (previousDays.length > 1 && targetStartTime !== previousStartTime) {
      const dayToRemove = sourceDay || targetDay;
      const remainingDays = previousDays.filter((d) => d !== dayToRemove);
      try {
        // Update parent routine to remove this day
        await dispatch(
          updateSchedule({
            ...record,
            id: record._id || record.id,
            days: remainingDays,
            dayOfWeek: WEEKDAY_NAMES[remainingDays[0] - 1] || "Monday",
          })
        ).unwrap();

        // Create new single-day slot at the new time
        await dispatch(
          addSchedule({
            program: record.program || selectedClass,
            section: record.section || selectedSection,
            subject: record.subject,
            instructor: record.instructor || record.teacherName,
            room: record.room || record.roomNumber,
            startTime: targetStartTime,
            endTime: resolvedEndTime,
            days: [targetDay],
            dayOfWeek: resolvedDayName,
            isBreak: Boolean(record.isBreak),
            institutionType: educationType,
            status: record.status || "Active",
          })
        ).unwrap();

        dispatch(fetchSchedules());
        toast.success(`Moved ${record.subject} on ${resolvedDayName} to ${targetStartTime} – ${resolvedEndTime}`);
      } catch (err) {
        dispatch(fetchSchedules());
        toast.error(typeof err === "string" ? err : err?.message || "Failed to move period. Reverted to original slot.");
      }
      return;
    }

    let newDays = [...previousDays];
    if (sourceDay && newDays.includes(sourceDay)) {
      newDays = newDays.map((d) => (d === sourceDay ? targetDay : d));
    } else {
      newDays = [targetDay];
    }
    newDays = [...new Set(newDays)].sort((a, b) => a - b);
    const primaryDayName = WEEKDAY_NAMES[newDays[0] - 1] || "Monday";

    // 4. INSTANT SHIFT: Optimistically update local/redux state immediately (0ms lag)
    dispatch(
      classUpdated({
        ...record,
        id: record._id || record.id,
        days: newDays,
        dayOfWeek: primaryDayName,
        startTime: targetStartTime,
        endTime: resolvedEndTime,
      })
    );

    // 5. Fire API call asynchronously in background
    try {
      await dispatch(
        updateSchedule({
          ...record,
          id: record._id || record.id,
          days: newDays,
          dayOfWeek: primaryDayName,
          startTime: targetStartTime,
          endTime: resolvedEndTime,
          program: record.program || selectedClass,
          section: record.section || selectedSection,
          subject: record.subject,
          instructor: record.instructor || record.teacherName,
          room: record.room || record.roomNumber,
        })
      ).unwrap();

      toast.success(`Rescheduled ${record.subject} to ${resolvedDayName} (${targetStartTime} – ${resolvedEndTime})`);
    } catch (err) {
      // IF FAILED: Immediately revert card back to original position!
      dispatch(
        classUpdated({
          ...record,
          id: record._id || record.id,
          days: previousDays,
          dayOfWeek: previousDayOfWeek,
          startTime: previousStartTime,
          endTime: previousEndTime,
        })
      );
      toast.error(typeof err === "string" ? err : err?.message || "Failed to move period. Reverted to original slot.");
    }
  };

  // Overall dynamic stats calculated from real filtered routine records
  const totalPeriodsForClass = classRoutineRecords.filter((r) => !r.isBreak).length;
  const activeInstructorsForClass = new Set(
    classRoutineRecords.map((r) => r.instructor || r.teacherName).filter(Boolean)
  ).size;
  const activeRoomsForClass = new Set(
    classRoutineRecords.map((r) => r.room || r.roomNumber).filter(Boolean)
  ).size;
  const totalWeeklySlots = useMemo(() => {
    return classRoutineRecords.reduce((acc, r) => {
      const dayCount = Array.isArray(r.days) && r.days.length ? r.days.length : 1;
      return acc + dayCount;
    }, 0);
  }, [classRoutineRecords]);

  return (
    <section
      className="campus-tab-page class-timetable"
      aria-label="Class Timetable Management"
    >
      {/* Loading state */}
      {timetableStatus === "loading" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "14px 18px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            marginBottom: "12px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#1d4ed8",
          }}
          role="status"
          aria-live="polite"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ animation: "spin 1s linear infinite" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Loading timetable from database…
        </div>
      )}

      {/* Error / Retry state */}
      {timetableStatus === "failed" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            padding: "12px 18px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            marginBottom: "12px",
          }}
          role="alert"
        >
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#dc2626" }}>
            Failed to load timetable. Check your connection.
          </span>
          <button
            type="button"
            onClick={() => dispatch(fetchSchedules())}
            style={{
              padding: "5px 14px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}
      {/* 1. KPI Cards Row */}
      <div className="campus-kpi-track class-timetable-kpi">
        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <BookOpen size={14} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Active Class Periods" : "Class Schedule Count"}</span>
              <span className="kpi-value">{totalPeriodsForClass}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Users size={14} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Class Teachers" : "Instructors"}</span>
              <span className="kpi-value">{activeInstructorsForClass}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Building size={14} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Allocated Rooms" : "Rooms Used"}</span>
              <span className="kpi-value">{activeRoomsForClass}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Clock size={14} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Weekly Periods" : "Campus Total"}</span>
              <span className="kpi-value">{totalWeeklySlots} slots</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Active Class & Section Selection Header Banner (Selectable & Directly Editable) */}
      <div className="class-routine-header-banner">
        <div className="class-banner-info">
          <span className="class-banner-badge">
            {isSchool ? <School size={13} /> : <GraduationCap size={13} />}
            {isSchool ? "Class Routine & Timetable" : "Academic Schedule Matrix"}
          </span>
          <h2 className="class-banner-title">
            {selectedClass} • {selectedSection.toLowerCase().startsWith("section ") ? selectedSection : `Section ${selectedSection}`}
          </h2>
          <p className="class-banner-sub">
            {totalPeriodsForClass} {totalPeriodsForClass === 1 ? "period" : "periods"} configured • {includeSaturday ? "Mon - Sat (6 Days)" : "Mon - Fri (5 Days)"} • Drag cards to reschedule
          </p>
        </div>

        <div className="class-banner-controls">
          {/* Class / Grade Selector & Editable Custom Input */}
          <div className="class-selector-group">
            <span className="class-selector-label">Grade / Class</span>
            {isAddingCustomClass ? (
              <form onSubmit={handleSaveCustomClass} className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Grade 11"
                  value={customClassInput}
                  onChange={(e) => setCustomClassInput(e.target.value)}
                  className="custom-input-pill"
                />
                <button type="submit" className="px-2 py-1 bg-zinc-900 text-white rounded-md text-xs font-semibold">
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomClass(false)}
                  className="px-2 py-1 bg-zinc-200 text-zinc-700 rounded-md text-xs"
                >
                  ✕
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1">
                <select
                  className="class-header-select"
                  aria-label="Select Class"
                  value={selectedClass}
                  onChange={(e) => {
                    if (e.target.value === "__add_new__") {
                      setIsAddingCustomClass(true);
                    } else {
                      setSelectedClass(e.target.value);
                    }
                  }}
                >
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__add_new__">+ Add New Grade/Class...</option>
                </select>
              </div>
            )}
          </div>

          {/* Section Selector & Editable Custom Input */}
          <div className="class-selector-group">
            <span className="class-selector-label">Section</span>
            {isAddingCustomSection ? (
              <form onSubmit={handleSaveCustomSection} className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Rose"
                  value={customSectionInput}
                  onChange={(e) => setCustomSectionInput(e.target.value)}
                  className="custom-input-pill"
                />
                <button type="submit" className="px-2 py-1 bg-zinc-900 text-white rounded-md text-xs font-semibold">
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomSection(false)}
                  className="px-2 py-1 bg-zinc-200 text-zinc-700 rounded-md text-xs"
                >
                  ✕
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1">
                <select
                  className="class-header-select"
                  aria-label="Select Section"
                  value={selectedSection}
                  onChange={(e) => {
                    if (e.target.value === "__add_new_sec__") {
                      setIsAddingCustomSection(true);
                    } else {
                      setSelectedSection(e.target.value);
                    }
                  }}
                >
                  {availableSections.map((s) => {
                    const label = s.toLowerCase().startsWith("section ")
                      ? s
                      : `Section ${s}`;
                    return (
                      <option key={s} value={s}>
                        {label}
                      </option>
                    );
                  })}
                  <option value="__add_new_sec__">+ Add New Section...</option>
                </select>
              </div>
            )}
          </div>

          {/* Schedule Period Button */}
          <button
            type="button"
            className="banner-add-btn"
            onClick={() => handleOpenQuickAdd()}
          >
            <Plus size={14} />
            {isSchool ? "Schedule Period" : "Schedule Class"}
          </button>

          {/* Add Lunch / Break Quick Button */}
          <button
            type="button"
            className="banner-break-btn"
            onClick={() => handleOpenQuickAdd(undefined, true)}
            title="Add Lunch, Recess, or Prayer Break"
          >
            <Coffee size={14} />
            + Add Lunch / Break
          </button>

          {/* Direct Shortcut to Pre-defined Academic Setup */}
          <Link
            to="/academics"
            title="Configure Pre-defined Classes, Sections & Subjects"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 600,
              background: "#ffffff",
              color: "#334155",
              border: "1.5px solid #cbd5e1",
              textDecoration: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
            }}
          >
            <Settings size={13} style={{ color: "#64748b" }} />
            Academic Setup
          </Link>

          {/* Direct Shortcut to Teacher Assignments */}
          <Link
            to="/teacher-assignments"
            title="Assign Faculty to Subjects & Sections"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 600,
              background: "#ffffff",
              color: "#334155",
              border: "1.5px solid #cbd5e1",
              textDecoration: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
            }}
          >
            <Users size={13} style={{ color: "#64748b" }} />
            Assign Teachers
          </Link>
        </div>
      </div>

      {/* 3. Timetable Views Tabs (Week Matrix & List) */}
      <Tabs
        value={view}
        onValueChange={setView}
        className="class-timetable-tabs"
      >
        <div className="campus-toolbar">
          <div className="toolbar-left">
            <TabsList className="tt-view-tabs">
              <TabsTrigger value="week">Weekly Matrix</TabsTrigger>
              <TabsTrigger value="list">All Scheduled List</TabsTrigger>
            </TabsList>

            {/* 5-Day vs 6-Day (Saturday) Toggle */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                padding: "3px",
                background: "#f4f4f5",
                border: "1px solid #e4e4e7",
                borderRadius: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => setIncludeSaturday(false)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: !includeSaturday ? 700 : 500,
                  color: !includeSaturday ? "#09090b" : "#71717a",
                  background: !includeSaturday ? "#ffffff" : "transparent",
                  boxShadow: !includeSaturday ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                5 Days (Mon-Fri)
              </button>
              <button
                type="button"
                onClick={() => setIncludeSaturday(true)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: includeSaturday ? 700 : 500,
                  color: includeSaturday ? "#09090b" : "#71717a",
                  background: includeSaturday ? "#ffffff" : "transparent",
                  boxShadow: includeSaturday ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                6 Days (+Saturday)
              </button>
            </div>

            <div className="tt-week-nav">
              <button
                type="button"
                className="tt-week-nav-btn"
                aria-label="Previous week"
                onClick={() => setWeek(shiftDays(week, -7))}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="tt-week-range">
                <CalendarDays size={12} aria-hidden="true" />
                {week.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                –{" "}
                {shiftDays(week, includeSaturday ? 5 : 4).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                className="tt-week-nav-btn"
                aria-label="Next week"
                onClick={() => setWeek(shiftDays(week, 7))}
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <button
              type="button"
              className="toolbar-btn toolbar-btn-outline"
              onClick={() => setWeek(mondayOf(new Date()))}
            >
              This Week
            </button>
          </div>

          <div className="toolbar-actions">
            <button
              type="button"
              className="toolbar-btn toolbar-btn-outline"
              onClick={() => setFullFormOpen(true)}
              title="Open full detailed schedule form"
            >
              Detailed Form
            </button>
          </div>
        </div>

        <div className="tt-panel-content">
          <TabsContent value="week">
            <div className="tt-panel-card">
              <div className="tt-template-heading">
                <div>
                  <span className="tt-template-title">
                    {selectedClass} — Section {selectedSection} Routine
                  </span>
                  <small>
                    Big, flexible cells with interactive drag-and-drop. Drag any period to move it to a different day or slot.
                  </small>
                </div>
                <div className="tt-legend tt-legend-inline">
                  <span>
                    <i className="tt-legend-class" />
                    Class Period
                  </span>
                  <span>
                    <i className="tt-legend-break" />
                    Break / Interval
                  </span>
                </div>
              </div>

              {/* Pure Real Data Grid with Big Flexible Cells & Interactive Drag & Drop */}
              <div className="tt-grid-panel">
                <TimetableGrid
                  records={classRoutineRecords}
                  week={week}
                  matrixConfig={matrixConfig}
                  onView={(id) => onAction("view", id)}
                  onAction={onAction}
                  onQuickAdd={(defaults) => handleOpenQuickAdd(defaults)}
                  onMoveClass={handleMoveClass}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="tt-panel-card tt-list-panel">
              <ScheduledClasses
                records={classRoutineRecords}
                page={page}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={setPageSize}
                onAction={onAction}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* 4. Quick Schedule Modal (In-place, fast, presets, Saturday, and break support) */}
      <QuickScheduleModal
        isOpen={quickModalOpen}
        onClose={() => {
          setQuickModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveQuickSchedule}
        currentClass={{ program: selectedClass, section: selectedSection }}
        initialDay={quickModalSlot.days?.[0] || 1}
        initialStartTime={quickModalSlot.startTime}
        initialEndTime={quickModalSlot.endTime}
        options={options}
        isSchool={isSchool}
        editRecord={editingRecord}
        initialIsBreak={Boolean(quickModalSlot.isBreak)}
        includeSaturday={includeSaturday}
        faculty={faculty}
      />

      {/* 5. Full Detailed Form (Optional fallback) */}
      {fullFormOpen && (
        <ScheduleClassForm
          defaults={{
            program: selectedClass,
            section: selectedSection,
          }}
          options={options}
          onSave={async (values) => {
            try {
              await dispatch(
                addSchedule({
                  ...values,
                  institutionType: educationType,
                })
              ).unwrap();
              toast.success("Schedule routine created successfully!");
              setFullFormOpen(false);
              dispatch(fetchSchedules());
            } catch (err) {
              toast.error(typeof err === "string" ? err : err?.message || "Failed to schedule routine");
            }
          }}
          onClose={() => setFullFormOpen(false)}
        />
      )}

      {/* 6. Class Details Dialog */}
      {viewingRecord && (
        <ClassDetailsDialog
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
        />
      )}

      {/* 7. Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Scheduled Period / Break?"
        description={`Are you sure you want to delete ${deleteTarget?.subject || deleteTarget?.breakTitle || "this routine"} from ${selectedClass}? This action will remove it from the database.`}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            try {
              await dispatch(
                deleteSchedule(deleteTarget._id || deleteTarget.id)
              ).unwrap();
              toast.success("Routine removed successfully");
              dispatch(fetchSchedules());
            } catch (err) {
              toast.error("Failed to delete routine");
            }
          }
          setDeleteTarget(null);
        }}
      />
    </section>
  );
}
