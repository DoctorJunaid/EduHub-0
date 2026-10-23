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
  UserCheck,
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
  moveScheduleDay,
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
import ScheduleClassForm from "./ScheduleClassForm";
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
  const [educationType, setEducationType] = useState(() =>
    isSchool ? "School" : "College",
  );
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
    const fromStudents = students
      .map((s) => s.gradeOrClass || s.program)
      .filter(Boolean);
    const fromRecords = records
      .map((r) => r.program || r.className || r.gradeOrClass)
      .filter(Boolean);
    const defaults = isSchool
      ? ["Grade 10", "Grade 9", "Grade 8", "Grade 7", "Grade 6"]
      : [
          "BS Computer Science",
          "BS Software Engineering",
          "BBA",
          "BS Data Science",
        ];
    return [
      ...new Set([
        ...customClasses,
        ...fromStudents,
        ...fromRecords,
        ...defaults,
      ]),
    ];
  }, [dbGrades, students, records, customClasses, isSchool]);

  // Active Selected Class
  const [selectedClass, setSelectedClass] = useState(() =>
    isSchool ? "10" : "BS Computer Science",
  );

  // Fetch pre-defined sections whenever selectedClass changes
  useEffect(() => {
    const normalize = (str) =>
      (str || "")
        .trim()
        .toLowerCase()
        .replace(/^(grade|class)\s+/i, "");
    const matchedGrade = dbGrades.find(
      (g) =>
        g.name?.trim().toLowerCase() === selectedClass?.trim().toLowerCase() ||
        normalize(g.name) === normalize(selectedClass),
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
                s.name?.trim().toLowerCase() ===
                  selectedSection?.trim().toLowerCase() ||
                s.name
                  ?.trim()
                  .toLowerCase()
                  .replace(/^section\s+/i, "") ===
                  selectedSection
                    ?.trim()
                    .toLowerCase()
                    .replace(/^section\s+/i, ""),
            );
            if (!hasCurrent) {
              setSelectedSection(secs[0].name);
            }
          }
        })
        .catch((err) =>
          console.error("Error fetching sections in timetable:", err),
        );
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
    return [
      ...new Set([
        ...customSections,
        ...fromStudents,
        ...fromRecords,
        ...defaults,
      ]),
    ];
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
      console.warn(
        "Could not persist to /academic/grades, updating locally:",
        err,
      );
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

    const normalize = (str) =>
      (str || "")
        .trim()
        .toLowerCase()
        .replace(/^(grade|class)\s+/i, "");
    const matchedGrade = dbGrades.find(
      (g) =>
        g.name?.trim().toLowerCase() === selectedClass?.trim().toLowerCase() ||
        normalize(g.name) === normalize(selectedClass),
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
        console.warn(
          "Could not persist section to DB, using local state:",
          err,
        );
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
          .filter(Boolean),
      ),
    ];

    return {
      program: availableClasses,
      section: availableSections,
      instructor: teacherNames.length
        ? teacherNames
        : [isSchool ? "Ms. Ayesha Khan" : "Dr. Usman Khan"],
    };
  }, [faculty, records, availableClasses, availableSections, isSchool]);

  // Filter real records specifically for the active Class and Section (matches relational IDs and fuzzy names)
  const classRoutineRecords = useMemo(() => {
    const normalizeClass = (str) =>
      (str || "")
        .trim()
        .toLowerCase()
        .replace(/^(grade|class)\s+/i, "");
    const normalizeSec = (str) =>
      (str || "")
        .trim()
        .toLowerCase()
        .replace(/^section\s+/i, "");

    const activeGrade = dbGrades.find(
      (g) =>
        g.name?.trim().toLowerCase() === selectedClass?.trim().toLowerCase() ||
        normalizeClass(g.name) === normalizeClass(selectedClass),
    );
    const activeGradeId = activeGrade?._id;

    const activeSection = dbSections.find(
      (s) =>
        s.name?.trim().toLowerCase() ===
          selectedSection?.trim().toLowerCase() ||
        normalizeSec(s.name) === normalizeSec(selectedSection),
    );
    const activeSectionId = activeSection?._id;

    return records.filter((r) => {
      const rGradeId = r.gradeId?._id || r.gradeId;
      const rSectionId = r.sectionId?._id || r.sectionId;
      const prog = (r.program || r.gradeOrClass || r.className || "").trim();
      const sec = (r.section || "").trim();

      if (r.isBreak) {
        // Only include breaks tied to this grade (or campus-wide breaks with no grade)
        if (rGradeId) {
          if (!activeGradeId || String(rGradeId) !== String(activeGradeId))
            return false;
        } else if (prog) {
          const matchProg =
            prog.toLowerCase() === selectedClass.trim().toLowerCase() ||
            normalizeClass(prog) === normalizeClass(selectedClass);
          if (!matchProg) return false;
        }
        // Only include breaks tied to this section (or section-wide breaks)
        if (rSectionId) {
          if (
            !activeSectionId ||
            String(rSectionId) !== String(activeSectionId)
          )
            return false;
        } else if (
          sec &&
          !["all", "all sections", ""].includes(sec.toLowerCase())
        ) {
          const matchSec =
            sec.toLowerCase() === selectedSection.trim().toLowerCase() ||
            normalizeSec(sec) === normalizeSec(selectedSection);
          if (!matchSec) return false;
        }
        return true;
      }

      const matchProg =
        !selectedClass ||
        (activeGradeId &&
          rGradeId &&
          String(rGradeId) === String(activeGradeId)) ||
        prog.toLowerCase() === selectedClass.trim().toLowerCase() ||
        normalizeClass(prog) === normalizeClass(selectedClass);

      const matchSec =
        !selectedSection ||
        !sec ||
        (activeSectionId &&
          rSectionId &&
          String(rSectionId) === String(activeSectionId)) ||
        sec.toLowerCase() === selectedSection.trim().toLowerCase() ||
        normalizeSec(sec) === normalizeSec(selectedSection) ||
        normalizeSec(sec) === "all" ||
        normalizeSec(sec) === "all sections";

      return matchProg && matchSec;
    });
  }, [records, selectedClass, selectedSection, dbGrades, dbSections]);

  const matrixConfig = useMemo(
    () => getMatrixConfig(educationType, includeSaturday),
    [educationType, includeSaturday],
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
        }),
      ).unwrap();
      toast.success(
        values.isBreak
          ? "Break interval updated!"
          : "Schedule routine updated successfully!",
      );
    } else {
      await dispatch(
        addSchedule({
          ...values,
          program: values.program || selectedClass,
          section: values.section || selectedSection,
          institutionType: educationType,
        }),
      ).unwrap();
      toast.success(
        values.isBreak
          ? "Break interval added to campus routine!"
          : isSchool
            ? "Class period scheduled successfully!"
            : "Class routine scheduled successfully!",
      );
    }
    dispatch(fetchSchedules(true));
  };

  // Interactive Drag & Drop Handler with Duration Preservation & Optimistic UI
  const handleMoveClass = async (
    recordId,
    targetDay,
    targetStartTime,
    sourceDay,
  ) => {
    const record = records.find((r) => (r.id || r._id) === recordId);
    if (!record) return;

    // 1. Snapshot previous state for rollback if network fails
    const previousDays =
      Array.isArray(record.days) && record.days.length ? [...record.days] : [1];
    const previousDayOfWeek = record.dayOfWeek;
    const previousStartTime = record.startTime;
    const previousEndTime = record.endTime;

    // 2. Compute exact duration of the dragged class to PRESERVE 1-hr, 50-min, 90-min, etc.
    const origStart = minutes(record.startTime);
    const origEnd = minutes(record.endTime);
    const originalDurationMinutes =
      origEnd > origStart ? origEnd - origStart : 50;

    // Preserve the original class duration exactly!
    const targetStartMin = minutes(targetStartTime);
    const targetEndMin = targetStartMin + originalDurationMinutes;
    const resolvedEndTime = `${String(Math.floor(targetEndMin / 60)).padStart(2, "0")}:${String(targetEndMin % 60).padStart(2, "0")}`;
    const resolvedDayName = WEEKDAY_NAMES[targetDay - 1] || "Monday";

    // 3. If dragging a single day of a multi-day recurring class to a DIFFERENT time slot:
    // Split: remove the dragged day from the original schedule and create a separate slot for that day
    if (previousDays.length > 1 && targetStartTime !== previousStartTime) {
      const dayToRemove = sourceDay || targetDay;
      try {
        await dispatch(
          moveScheduleDay({
            id: record._id || record.id,
            sourceDay: dayToRemove,
            targetDay,
            startTime: targetStartTime,
            endTime: resolvedEndTime,
          }),
        ).unwrap();

        toast.success(
          `Moved ${record.subject} on ${resolvedDayName} to ${targetStartTime} – ${resolvedEndTime}`,
        );
      } catch (err) {
        dispatch(fetchSchedules(true));
        toast.error(
          typeof err === "string"
            ? err
            : err?.message ||
                "Failed to move period. Reverted to original slot.",
        );
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
      }),
    );

    // 5. Fire API call asynchronously in background
    // NOTE: Only send primitive fields — NOT the full populated record (gradeId, sectionId, teacherId
    // objects nested in the record will bloat the payload and get rejected by the 50kb body limit on Vercel).
    try {
      await dispatch(
        updateSchedule({
          id: record._id || record.id,
          days: newDays,
          dayOfWeek: primaryDayName,
          startTime: targetStartTime,
          endTime: resolvedEndTime,
          program: record.program || record.gradeId?.name || selectedClass,
          section: record.section || record.sectionId?.name || selectedSection,
          subject: record.subject || record.subjectId?.name,
          instructor:
            record.instructor || record.teacherName || record.teacherId?.name,
          isBreak: Boolean(record.isBreak),
          institutionType: educationType,
          status: record.status || "Active",
          gradeId: record.gradeId?._id || record.gradeId,
          sectionId: record.sectionId?._id || record.sectionId,
          subjectId: record.subjectId?._id || record.subjectId,
          teacherId: record.teacherId?._id || record.teacherId,
          campusId: record.campusId?._id || record.campusId,
        }),
      ).unwrap();

      toast.success(
        `Rescheduled ${record.subject} to ${resolvedDayName} (${targetStartTime} – ${resolvedEndTime})`,
      );
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
        }),
      );
      toast.error(
        typeof err === "string"
          ? err
          : err?.message || "Failed to move period. Reverted to original slot.",
      );
    }
  };

  // Overall dynamic stats calculated from real filtered routine records
  const totalPeriodsForClass = classRoutineRecords.filter(
    (r) => !r.isBreak,
  ).length;
  const activeInstructorsForClass = new Set(
    classRoutineRecords
      .map((r) => r.instructor || r.teacherName)
      .filter(Boolean),
  ).size;
  const activeSubjectsForClass = new Set(
    classRoutineRecords
      .filter((r) => !r.isBreak)
      .map((r) => (r.subject || "").trim().toLowerCase())
      .filter(Boolean),
  ).size;
  const totalWeeklySlots = useMemo(() => {
    return classRoutineRecords.reduce((acc, r) => {
      const dayCount =
        Array.isArray(r.days) && r.days.length ? r.days.length : 1;
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
      {/* 1. KPI Cards Grid */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 w-full"
        style={{ gap: "16px", marginBottom: "20px" }}
      >
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between min-w-0"
          style={{ padding: "18px 20px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0 flex-1" style={{ gap: "4px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap truncate">
              {isSchool ? "ACTIVE CLASS PERIODS" : "CLASS SCHEDULE COUNT"}
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight whitespace-nowrap">
              {totalPeriodsForClass}
            </span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0"
            style={{ width: "38px", height: "38px" }}
          >
            <BookOpen className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between min-w-0"
          style={{ padding: "18px 20px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0 flex-1" style={{ gap: "4px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap truncate">
              {isSchool ? "CLASS TEACHERS" : "INSTRUCTORS"}
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight whitespace-nowrap">
              {activeInstructorsForClass}
            </span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0"
            style={{ width: "38px", height: "38px" }}
          >
            <Users className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between min-w-0"
          style={{ padding: "18px 20px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0 flex-1" style={{ gap: "4px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap truncate">
              {isSchool ? "CONFIGURED SUBJECTS" : "UNIQUE COURSES"}
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight whitespace-nowrap">
              {activeSubjectsForClass}
            </span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0"
            style={{ width: "38px", height: "38px" }}
          >
            <BookOpen className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between min-w-0"
          style={{ padding: "18px 20px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0 flex-1" style={{ gap: "4px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap truncate">
              {isSchool ? "WEEKLY PERIODS" : "CAMPUS TOTAL"}
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight whitespace-nowrap">
              {totalWeeklySlots} slots
            </span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0"
            style={{ width: "38px", height: "38px" }}
          >
            <Clock className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* 2. Top Active Class & Section Selection Header Banner */}
      <div
        className="class-routine-header-banner bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between"
        style={{ padding: "20px 24px", gap: "16px", marginBottom: "16px", boxSizing: "border-box" }}
      >
        <div className="class-banner-info flex flex-col" style={{ gap: "3px" }}>
          <span className="class-banner-badge inline-flex items-center text-xs font-bold uppercase tracking-wider text-neutral-500" style={{ gap: "5px" }}>
            {isSchool ? <School className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
            {isSchool
              ? "Class Routine & Timetable"
              : "Academic Schedule Matrix"}
          </span>
          <h2 className="class-banner-title text-lg font-bold text-neutral-900 tracking-tight" style={{ margin: 0 }}>
            {selectedClass} •{" "}
            {selectedSection.toLowerCase().startsWith("section ")
              ? selectedSection
              : `Section ${selectedSection}`}
          </h2>
          <p className="class-banner-sub text-xs text-neutral-500 font-medium" style={{ margin: 0 }}>
            {totalPeriodsForClass}{" "}
            {totalPeriodsForClass === 1 ? "period" : "periods"} configured •{" "}
            {includeSaturday ? "Mon - Sat (6 Days)" : "Mon - Fri (5 Days)"} •{" "}
            Drag cards to reschedule
          </p>
        </div>

        <div
          className="class-banner-controls flex flex-wrap items-end justify-between xl:justify-end"
          style={{ gap: "10px" }}
        >
          {/* Class / Grade Selector & Editable Custom Input */}
          <div className="class-selector-group flex flex-col" style={{ gap: "3px" }}>
            <span className="class-selector-label text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Grade / Class
            </span>
            {isAddingCustomClass ? (
              <form
                onSubmit={handleSaveCustomClass}
                className="flex items-center"
                style={{ gap: "4px" }}
              >
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Grade 11"
                  value={customClassInput}
                  onChange={(e) => setCustomClassInput(e.target.value)}
                  className="rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  style={{ height: "38px", padding: "0 12px", minWidth: "120px", boxSizing: "border-box" }}
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-neutral-900 text-white cursor-pointer"
                  style={{ height: "38px", width: "38px" }}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomClass(false)}
                  className="inline-flex items-center justify-center rounded-lg bg-neutral-200 text-neutral-700 cursor-pointer"
                  style={{ height: "38px", width: "38px" }}
                >
                  ✕
                </button>
              </form>
            ) : (
              <select
                className="class-header-select rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                style={{ height: "38px", padding: "0 12px", minWidth: "130px", boxSizing: "border-box" }}
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
            )}
          </div>

          {/* Section Selector & Editable Custom Input */}
          <div className="class-selector-group flex flex-col" style={{ gap: "3px" }}>
            <span className="class-selector-label text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Section
            </span>
            {isAddingCustomSection ? (
              <form
                onSubmit={handleSaveCustomSection}
                className="flex items-center"
                style={{ gap: "4px" }}
              >
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Rose"
                  value={customSectionInput}
                  onChange={(e) => setCustomSectionInput(e.target.value)}
                  className="rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  style={{ height: "38px", padding: "0 12px", minWidth: "120px", boxSizing: "border-box" }}
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-neutral-900 text-white cursor-pointer"
                  style={{ height: "38px", width: "38px" }}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomSection(false)}
                  className="inline-flex items-center justify-center rounded-lg bg-neutral-200 text-neutral-700 cursor-pointer"
                  style={{ height: "38px", width: "38px" }}
                >
                  ✕
                </button>
              </form>
            ) : (
              <select
                className="class-header-select rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                style={{ height: "38px", padding: "0 12px", minWidth: "130px", boxSizing: "border-box" }}
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
            )}
          </div>

          {/* + Schedule Period (Primary Dark Button) */}
          <button
            type="button"
            onClick={() => handleOpenQuickAdd()}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              height: "38px",
              padding: "0 16px",
              gap: "6px",
              width: "auto",
              minWidth: "fit-content",
              boxSizing: "border-box",
            }}
          >
            <Plus className="w-3.5 h-3.5 text-white shrink-0" />
            <span>{isSchool ? "Schedule Period" : "Schedule Class"}</span>
          </button>

          {/* + Add Lunch / Break (Neutral Theme Outline Button — Remove Yellow/Amber!) */}
          <button
            type="button"
            onClick={() => handleOpenQuickAdd(undefined, true)}
            title="Add Lunch, Recess, or Prayer Break"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              height: "38px",
              padding: "0 14px",
              gap: "6px",
              width: "auto",
              minWidth: "fit-content",
              boxSizing: "border-box",
            }}
          >
            <Coffee className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            <span>+ Add Lunch / Break</span>
          </button>

          {/* Academic Setup (Neutral Outline Button) */}
          <Link
            to="/academics"
            title="Configure Pre-defined Classes, Sections & Subjects"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 no-underline"
            style={{
              height: "38px",
              padding: "0 14px",
              gap: "6px",
              width: "auto",
              minWidth: "fit-content",
              boxSizing: "border-box",
            }}
          >
            <Settings className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            <span>Academic Setup</span>
          </Link>

          {/* Assign Teachers (Neutral Outline Button) */}
          <Link
            to="/teacher-assignments"
            title="Assign Faculty to Subjects & Sections"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 no-underline"
            style={{
              height: "38px",
              padding: "0 14px",
              gap: "6px",
              width: "auto",
              minWidth: "fit-content",
              boxSizing: "border-box",
            }}
          >
            <UserCheck className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            <span>Assign Teachers</span>
          </Link>
        </div>
      </div>

      {/* 3. Timetable Views Tabs (Week Matrix & List) */}
      <Tabs
        value={view}
        onValueChange={setView}
        className="class-timetable-tabs"
      >
        <div
          className="w-full flex flex-wrap items-center justify-between"
          style={{ marginBottom: "16px", gap: "10px" }}
        >
          <div className="flex flex-wrap items-center" style={{ gap: "10px" }}>
            {/* Segmented Group 1: Weekly Matrix | All Scheduled List */}
            <TabsList
              className="bg-neutral-100 border border-neutral-200 rounded-lg inline-flex items-center"
              style={{ padding: "4px", gap: "4px", height: "auto" }}
            >
              <TabsTrigger
                value="week"
                className="rounded-md text-xs font-semibold whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-xs text-neutral-600 hover:text-neutral-900 cursor-pointer transition-all"
                style={{ padding: "6px 12px" }}
              >
                Weekly Matrix
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="rounded-md text-xs font-semibold whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-xs text-neutral-600 hover:text-neutral-900 cursor-pointer transition-all"
                style={{ padding: "6px 12px" }}
              >
                All Scheduled List
              </TabsTrigger>
            </TabsList>

            {/* Segmented Group 2: 5 Days (Mon-Fri) | 6 Days (+Saturday) */}
            <div
              className="bg-neutral-100 border border-neutral-200 rounded-lg inline-flex items-center"
              style={{ padding: "4px", gap: "4px" }}
            >
              <button
                type="button"
                onClick={() => setIncludeSaturday(false)}
                className={`rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  !includeSaturday
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                style={{ padding: "6px 12px" }}
              >
                5 Days (Mon-Fri)
              </button>
              <button
                type="button"
                onClick={() => setIncludeSaturday(true)}
                className={`rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  includeSaturday
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                style={{ padding: "6px 12px" }}
              >
                6 Days (+Saturday)
              </button>
            </div>

            {/* Date Navigator */}
            <div
              className="inline-flex items-center border border-neutral-200 rounded-lg bg-white shadow-xs"
              style={{ height: "36px", padding: "0 6px", boxSizing: "border-box" }}
            >
              <button
                type="button"
                aria-label="Previous week"
                onClick={() => setWeek(shiftDays(week, -7))}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span
                className="text-xs font-medium text-neutral-800 whitespace-nowrap inline-flex items-center"
                style={{ padding: "0 8px", gap: "6px" }}
              >
                <CalendarDays className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                {week.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                –{" "}
                {shiftDays(week, includeSaturday ? 5 : 4).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </span>
              <button
                type="button"
                aria-label="Next week"
                onClick={() => setWeek(shiftDays(week, 7))}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* This Week Button */}
            <button
              type="button"
              onClick={() => setWeek(mondayOf(new Date()))}
              className="inline-flex items-center justify-center border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              style={{ height: "36px", padding: "0 14px", boxSizing: "border-box" }}
            >
              This Week
            </button>
          </div>

          {/* Right Action: Detailed Form Button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setFullFormOpen(true)}
              title="Open full detailed schedule form"
              className="inline-flex items-center justify-center border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              style={{ height: "36px", padding: "0 14px", boxSizing: "border-box" }}
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
                    Big, flexible cells with interactive drag-and-drop. Drag any
                    period to move it to a different day or slot.
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
                }),
              ).unwrap();
              toast.success("Schedule routine created successfully!");
              setFullFormOpen(false);
              dispatch(fetchSchedules());
            } catch (err) {
              toast.error(
                typeof err === "string"
                  ? err
                  : err?.message || "Failed to schedule routine",
              );
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
                deleteSchedule(deleteTarget._id || deleteTarget.id),
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
