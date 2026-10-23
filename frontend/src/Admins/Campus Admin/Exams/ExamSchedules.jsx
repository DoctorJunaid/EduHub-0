import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileClock,
  FileText,
  GraduationCap,
  List,
  Plus,
  Search,
  Users,
  Award,
  Check,
  Building,
  School,
  BookOpen,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  selectExams,
  selectExamStats,
  fetchExams,
  addExam,
  updateExam,
  deleteExam,
} from "@/store/Slices/examsSlice.js";
import { selectFaculty, fetchFaculty } from "@/store/Slices/facultySlice.js";
import { selectStudents, fetchStudents } from "@/store/Slices/studentsSlice.js";
import { selectTimetable, fetchSchedules } from "@/store/Slices/timetableSlice.js";
import { mondayOf, shiftDays, minutes } from "../../../lib/schedule.js";
import { dateKey, parseDate, examTypes, filterExams } from "./examData.js";
import { useInstitution } from "@/context/InstitutionContext";
import toast from "react-hot-toast";
import ExamGrid from "./ExamGrid";
import ScheduledExams from "./ScheduledExams";
import QuickExamModal from "./QuickExamModal";
import ExamDetailsDialog from "./ExamDetailsDialog";
import { checkCohortDailyExamLimit } from "./examData.js";
import usePaginationParams from "@/hooks/usePaginationParams";
import "../Timetable/ClassTimetable.css";
import "./ExamSchedules.css";

const emptyFilters = {
  search: "",
  examType: "",
  department: "",
  room: "",
  invigilator: "",
  dailyLoad: "all",
};

export default function ExamSchedules() {
  const { isSchool } = useInstitution();
  const dispatch = useDispatch();

  const rawRecords = useSelector(selectExams);
  const records = useMemo(
    () => (Array.isArray(rawRecords) ? rawRecords : []),
    [rawRecords]
  );
  const stats = useSelector((state) =>
    selectExamStats(state, dateKey(new Date()))
  );
  const rawFaculty = useSelector(selectFaculty);
  const faculty = useMemo(
    () => (Array.isArray(rawFaculty) ? rawFaculty : []),
    [rawFaculty]
  );
  const rawStudents = useSelector(selectStudents);
  const students = useMemo(
    () => (Array.isArray(rawStudents) ? rawStudents : []),
    [rawStudents]
  );
  const rawTimetable = useSelector(selectTimetable);
  const timetable = useMemo(
    () => (Array.isArray(rawTimetable) ? rawTimetable : []),
    [rawTimetable]
  );

  // Load real exam data once on mount
  useEffect(() => {
    dispatch(fetchExams());
  }, [dispatch]);

  // Lazily load supporting collections only if they are not already populated
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

  useEffect(() => {
    if (!rawTimetable || rawTimetable.length === 0) {
      dispatch(fetchSchedules());
    }
  }, [dispatch, rawTimetable?.length]);

  const [view, setView] = useState("week");
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [filters, setFilters] = useState(emptyFilters);
  const { page, pageSize, setPage, setPageSize } = usePaginationParams({
    defaultPage: 1,
    defaultPageSize: 20,
  });
  const [educationType, setEducationType] = useState(() =>
    isSchool ? "School" : "College"
  );

  useEffect(() => {
    setEducationType(isSchool ? "School" : "College");
  }, [isSchool]);

  // Dynamic Classes / Grades Selection Track
  const [customClasses, setCustomClasses] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [isAddingCustomClass, setIsAddingCustomClass] = useState(false);
  const [customClassInput, setCustomClassInput] = useState("");
  const [isAddingCustomSection, setIsAddingCustomSection] = useState(false);
  const [customSectionInput, setCustomSectionInput] = useState("");

  const availableClasses = useMemo(() => {
    const fromStudents = students
      .map((s) => s.gradeOrClass || s.program)
      .filter(Boolean);
    const fromExams = records
      .map((r) => r.program || r.className || r.gradeOrClass || r.department)
      .filter(Boolean);
    const fromTimetable = timetable
      .map((t) => t.program || t.className)
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
        ...fromExams,
        ...fromTimetable,
        ...defaults,
      ]),
    ];
  }, [students, records, timetable, customClasses, isSchool]);

  const availableSections = useMemo(() => {
    const fromStudents = students.map((s) => s.section).filter(Boolean);
    const fromExams = records.map((r) => r.section).filter(Boolean);
    const defaults = ["A", "B", "C", "D"];
    return [...new Set([...customSections, ...fromStudents, ...fromExams, ...defaults])];
  }, [students, records, customSections]);

  // Selected Class and Section (supports "ALL" to view campus-wide)
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedSection, setSelectedSection] = useState("ALL");

  // Dynamic dropdown options for forms
  const options = useMemo(() => {
    const teacherNames = [
      ...new Set(
        faculty
          .map((f) => f.name)
          .concat(records.map((r) => r.invigilator || r.teacherName))
          .filter(Boolean)
      ),
    ];
    const roomNames = [
      ...new Set(
        records
          .map((r) => r.room || r.roomNumber)
          .concat(timetable.map((t) => t.room || t.roomNumber))
          .concat(
            isSchool
              ? ["Exam Hall A", "Exam Hall B", "Room 101", "Room 102", "Science Lab"]
              : ["Main Auditorium", "Exam Hall 1", "Exam Hall 2", "Lab 3"]
          )
          .filter(Boolean)
      ),
    ];
    const subjects = [
      ...new Set(
        records
          .map((r) => r.subject)
          .concat(timetable.map((t) => t.subject))
          .concat([
            "Mathematics",
            "Physics",
            "Chemistry",
            "English",
            "Computer Science",
            "Biology",
          ])
          .filter(Boolean)
      ),
    ];

    return {
      examType: examTypes,
      program: availableClasses,
      section: availableSections,
      invigilator: teacherNames.length
        ? teacherNames
        : [isSchool ? "Ms. Ayesha Khan" : "Dr. Usman Khan"],
      room: roomNames,
      subject: subjects,
    };
  }, [faculty, records, timetable, availableClasses, availableSections, isSchool]);

  // Filter records based on selected class, section, search, and dropdown filters
  const filteredRecords = useMemo(() => {
    let result = filterExams(records, filters);

    if (selectedClass && selectedClass !== "ALL") {
      const targetClassLower = selectedClass.trim().toLowerCase();
      result = result.filter((r) => {
        const c = (
          r.program ||
          r.className ||
          r.gradeOrClass ||
          r.department ||
          ""
        )
          .trim()
          .toLowerCase();
        return c === targetClassLower;
      });
    }

    if (selectedSection && selectedSection !== "ALL") {
      const targetSecLower = selectedSection.trim().toLowerCase();
      result = result.filter((r) => {
        const s = (r.section || "").trim().toLowerCase();
        return (
          !s ||
          s === targetSecLower ||
          s === `section ${targetSecLower}` ||
          s === "all sections"
        );
      });
    }

    return result.sort(
      (a, b) =>
        (a.date || "").localeCompare(b.date || "") ||
        (a.startTime || "").localeCompare(b.startTime || "")
    );
  }, [records, filters, selectedClass, selectedSection]);

  // Modal Dialog States
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickModalDefaults, setQuickModalDefaults] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Open Quick Schedule Modal
  const handleOpenQuickAdd = (defaults = {}) => {
    setEditingRecord(null);
    setQuickModalDefaults({
      date: defaults.date || dateKey(new Date()),
      startTime: defaults.startTime || "09:00",
      endTime: defaults.endTime || "12:00",
      className: selectedClass !== "ALL" ? selectedClass : availableClasses[0],
      section: selectedSection !== "ALL" ? selectedSection : "A",
    });
    setQuickModalOpen(true);
  };

  // Action Dispatcher for cards & table rows
  const onAction = (mode, id, recordData) => {
    const record =
      recordData || records.find((r) => (r.id || r._id) === id);

    if (mode === "add") {
      handleOpenQuickAdd();
    } else if (mode === "edit" && record) {
      setEditingRecord(record);
      setQuickModalOpen(true);
    } else if (mode === "delete" && record) {
      setDeleteTarget(record);
    } else if (mode === "view" && record) {
      setViewingRecord(record);
    }
  };

  // Save Exam (Create or Update)
  const handleSaveExam = async (values) => {
    try {
      if (editingRecord) {
        await dispatch(
          updateExam({
            ...values,
            id: editingRecord._id || editingRecord.id,
          })
        ).unwrap();
        toast.success("Exam schedule updated successfully!");
      } else {
        await dispatch(
          addExam({
            ...values,
            program: values.program || (selectedClass !== "ALL" ? selectedClass : availableClasses[0]),
            section: values.section || (selectedSection !== "ALL" ? selectedSection : "A"),
            institutionType: educationType,
          })
        ).unwrap();
        toast.success("Examination scheduled successfully!");
      }
      dispatch(fetchExams());
      setQuickModalOpen(false);
      setEditingRecord(null);
    } catch (err) {
      const msg =
        typeof err === "string" ? err : err?.message || "Failed to save exam schedule";
      toast.error(msg);
      throw err;
    }
  };

  // Drag and Drop Exam Rescheduling with Conflict Protection
  const handleMoveExam = async (examId, targetDate, targetStartTime, targetEndTime) => {
    const record = records.find((r) => (r.id || r._id) === examId);
    if (!record) return;

    // Preserve original duration
    const origStartMin = minutes(record.startTime);
    const origEndMin = minutes(record.endTime);
    const origDuration = origEndMin > origStartMin ? origEndMin - origStartMin : 180; // default 3 hrs

    const resolvedStartMin = minutes(targetStartTime);
    const resolvedEndMin = resolvedStartMin + origDuration;
    const resolvedEndTime = `${String(Math.floor(resolvedEndMin / 60)).padStart(2, "0")}:${String(
      resolvedEndMin % 60
    ).padStart(2, "0")}`;

    // Validate cohort daily limits on the target date
    const check = checkCohortDailyExamLimit(records, {
      program: record.program || record.className,
      section: record.section,
      date: targetDate,
      startTime: targetStartTime,
      endTime: resolvedEndTime,
      _id: examId,
    });
    if (check.isBlocked) {
      toast.error(check.reason);
      return;
    }

    try {
      await dispatch(
        updateExam({
          ...record,
          id: record._id || record.id,
          date: targetDate,
          examDate: new Date(`${targetDate}T12:00:00.000Z`),
          startTime: targetStartTime,
          endTime: resolvedEndTime,
          isDualExamDay: check.isRareCase,
        })
      ).unwrap();
      toast.success(
        check.isRareCase
          ? `Exam moved as 2nd paper (Rare Case) on ${targetDate} (${targetStartTime} – ${resolvedEndTime})`
          : `Exam rescheduled to ${targetDate} (${targetStartTime} – ${resolvedEndTime})`
      );
      dispatch(fetchExams());
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to move exam";
      toast.error(msg);
      dispatch(fetchExams());
    }
  };

  // Custom Class / Section Handlers
  const handleSaveCustomClass = (e) => {
    e.preventDefault();
    if (customClassInput.trim()) {
      const name = customClassInput.trim();
      setCustomClasses((prev) => [...new Set([...prev, name])]);
      setSelectedClass(name);
      setCustomClassInput("");
      setIsAddingCustomClass(false);
      toast.success(`Class "${name}" selected!`);
    }
  };

  const handleSaveCustomSection = (e) => {
    e.preventDefault();
    if (customSectionInput.trim()) {
      const sec = customSectionInput.trim();
      setCustomSections((prev) => [...new Set([...prev, sec])]);
      setSelectedSection(sec);
      setCustomSectionInput("");
      setIsAddingCustomSection(false);
      toast.success(`Section "${sec}" selected!`);
    }
  };

  const changeFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  const dateOptions = { month: "short", day: "numeric" };

  // Real Database Metrics
  const totalExams = records.length;
  const midterms = records.filter((item) => item.examType === "Midterm").length;
  const finals = records.filter((item) => item.examType === "Final").length;

  // Compute dual exam days across cohorts
  const cohortDayMap = {};
  records.forEach((r) => {
    const d = (r.examDate || r.date || "").split("T")[0];
    const cohort = `${r.program || r.class || ""}-${r.section || ""}`;
    const key = `${d}_${cohort}`;
    cohortDayMap[key] = (cohortDayMap[key] || 0) + 1;
  });
  const dualExamDaysCount = Object.values(cohortDayMap).filter((cnt) => cnt >= 2).length;

  return (
    <section
      className="campus-tab-page class-timetable"
      aria-label="Campus Exam Schedules Management"
    >
      {/* 1. Top 4 Standardized KPI Metric Cards */}
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
              TOTAL EXAMINATIONS
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight whitespace-nowrap">
              {totalExams}
            </span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0"
            style={{ width: "38px", height: "38px" }}
          >
            <FileText className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between min-w-0"
          style={{ padding: "18px 20px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0 flex-1" style={{ gap: "4px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap truncate">
              MIDTERM PAPERS
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight whitespace-nowrap">
              {midterms}
            </span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0"
            style={{ width: "38px", height: "38px" }}
          >
            <CalendarDays className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between min-w-0"
          style={{ padding: "18px 20px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0 flex-1" style={{ gap: "4px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap truncate">
              FINAL EXAMINATIONS
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight whitespace-nowrap">
              {finals}
            </span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0"
            style={{ width: "38px", height: "38px" }}
          >
            <GraduationCap className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between min-w-0"
          style={{ padding: "18px 20px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0 flex-1" style={{ gap: "4px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap truncate">
              DUAL-EXAM DAYS (RARE)
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight whitespace-nowrap">
              {dualExamDaysCount}
            </span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0"
            style={{ width: "38px", height: "38px" }}
          >
            <AlertTriangle className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* 2. Top Active Class & Section Selection Header Banner */}
      <div
        className="class-routine-header-banner bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between"
        style={{ padding: "20px 24px", gap: "16px", marginBottom: "20px", boxSizing: "border-box" }}
      >
        <div className="class-banner-info flex flex-col" style={{ gap: "4px" }}>
          <span className="class-banner-badge inline-flex items-center text-xs font-bold uppercase tracking-wider text-neutral-500" style={{ gap: "5px" }}>
            <FileClock className="w-3.5 h-3.5" />
            {isSchool ? "Examination Timetable Matrix" : "Academic Exam Schedule"}
          </span>
          <h2 className="class-banner-title text-lg font-bold text-neutral-900 tracking-tight" style={{ margin: 0 }}>
            {selectedClass === "ALL" ? "All Grades & Classes" : selectedClass} •{" "}
            {selectedSection === "ALL" ? "All Sections" : `Section ${selectedSection}`}
          </h2>
          <p className="class-banner-sub text-xs text-neutral-500 font-medium" style={{ margin: 0 }}>
            {filteredRecords.length} exam papers scheduled • Full 7-Day Week • Drag cards to reschedule
          </p>
        </div>

        <div className="class-banner-controls flex flex-wrap items-end justify-between xl:justify-end" style={{ gap: "10px" }}>
          {/* Class Selector */}
          <div className="class-selector-group flex flex-col" style={{ gap: "3px" }}>
            <span className="class-selector-label text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {isSchool ? "Grade / Class" : "Degree Program"}
            </span>
            {isAddingCustomClass ? (
              <form onSubmit={handleSaveCustomClass} className="flex items-center" style={{ gap: "4px" }}>
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
                className="class-header-select border border-neutral-200 rounded-lg bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
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
                <option value="ALL">All Classes ({records.length})</option>
                {availableClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__add_new__">+ Add New Grade/Class...</option>
              </select>
            )}
          </div>

          {/* Section Selector */}
          <div className="class-selector-group flex flex-col" style={{ gap: "3px" }}>
            <span className="class-selector-label text-[10px] font-bold uppercase tracking-wider text-neutral-500">Section</span>
            {isAddingCustomSection ? (
              <form onSubmit={handleSaveCustomSection} className="flex items-center" style={{ gap: "4px" }}>
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
                className="class-header-select border border-neutral-200 rounded-lg bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
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
                <option value="ALL">All Sections</option>
                {availableSections.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
                <option value="__add_new_sec__">+ Add New Section...</option>
              </select>
            )}
          </div>

          {/* Schedule Exam Button */}
          <button
            type="button"
            className="banner-add-btn bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium inline-flex items-center justify-center whitespace-nowrap shadow-xs cursor-pointer"
            style={{ height: "38px", padding: "0 16px", gap: "6px" }}
            onClick={() => handleOpenQuickAdd()}
          >
            <Plus size={14} />
            Schedule Exam
          </button>
        </div>
      </div>

      {/* 3. Main Views Tabs & Unified Toolbar */}
      <Tabs
        value={view}
        onValueChange={setView}
        className="class-timetable-tabs"
      >
        <div className="campus-toolbar flex flex-wrap items-center justify-between" style={{ gap: "12px", marginBottom: "16px" }}>
          <div className="toolbar-left flex flex-wrap items-center" style={{ gap: "10px" }}>
            <TabsList className="tt-view-tabs">
              <TabsTrigger value="week">Weekly Matrix</TabsTrigger>
              <TabsTrigger value="list">All Scheduled List</TabsTrigger>
            </TabsList>

            {/* Week Navigation */}
            <div className="tt-week-nav flex items-center" style={{ gap: "4px" }}>
              <button
                type="button"
                className="tt-week-nav-btn inline-flex items-center justify-center border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 cursor-pointer"
                style={{ height: "36px", width: "36px" }}
                aria-label="Previous week"
                onClick={() => setWeek(shiftDays(week, -7))}
              >
                <ChevronLeft size={14} />
              </button>
              <span
                className="tt-week-range inline-flex items-center border border-neutral-200 rounded-lg bg-white text-xs font-medium text-neutral-700"
                style={{ height: "36px", padding: "0 12px", gap: "6px" }}
              >
                <CalendarDays size={13} className="text-neutral-500" />
                {week.toLocaleDateString("en-US", dateOptions)} –{" "}
                {shiftDays(week, 6).toLocaleDateString("en-US", dateOptions)}
              </span>
              <button
                type="button"
                className="tt-week-nav-btn inline-flex items-center justify-center border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 cursor-pointer"
                style={{ height: "36px", width: "36px" }}
                aria-label="Next week"
                onClick={() => setWeek(shiftDays(week, 7))}
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Search Input */}
            <div
              className="toolbar-search relative flex items-center"
              style={{ height: "36px" }}
            >
              <Search size={14} className="absolute left-3 text-neutral-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search exams..."
                value={filters.search}
                onChange={(e) => changeFilter("search", e.target.value)}
                aria-label="Search exams"
                className="border border-neutral-200 rounded-lg bg-white text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                style={{ height: "36px", paddingLeft: "32px", paddingRight: "12px", width: "170px", boxSizing: "border-box" }}
              />
            </div>

            {/* Exam Type Filter */}
            <select
              className="toolbar-select border border-neutral-200 rounded-lg bg-white text-xs text-neutral-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-400"
              aria-label="Filter by Exam Type"
              style={{ height: "36px", padding: "0 12px", boxSizing: "border-box" }}
              value={filters.examType}
              onChange={(e) => changeFilter("examType", e.target.value)}
            >
              <option value="">All Types</option>
              {options.examType.map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>

            {/* Room / Hall Filter */}
            <select
              className="toolbar-select border border-neutral-200 rounded-lg bg-white text-xs text-neutral-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-400"
              aria-label="Filter by Room"
              style={{ height: "36px", padding: "0 12px", boxSizing: "border-box" }}
              value={filters.room}
              onChange={(e) => changeFilter("room", e.target.value)}
            >
              <option value="">All Halls</option>
              {options.room.map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>

            {/* Daily Paper Load Filter */}
            <select
              className="toolbar-select border border-neutral-200 rounded-lg bg-white text-xs text-neutral-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-400"
              aria-label="Filter by Daily Load"
              style={{ height: "36px", padding: "0 12px", boxSizing: "border-box" }}
              value={filters.dailyLoad || ""}
              onChange={(e) => changeFilter("dailyLoad", e.target.value)}
            >
              <option value="">All Days</option>
              <option value="single">Single Paper</option>
              <option value="dual">Dual Papers (Rare)</option>
            </select>
          </div>

          <div className="toolbar-actions flex items-center">
            {/* Category Color Legend */}
            <div className="exam-category-legend flex items-center" style={{ gap: "8px" }}>
              <span
                className="inline-flex items-center rounded-md bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-700"
                style={{ padding: "2px 8px", gap: "6px" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> Midterm
              </span>
              <span
                className="inline-flex items-center rounded-md bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-700"
                style={{ padding: "2px 8px", gap: "6px" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> Final
              </span>
              <span
                className="inline-flex items-center rounded-md bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-700"
                style={{ padding: "2px 8px", gap: "6px" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> Quiz
              </span>
              <span
                className="inline-flex items-center rounded-md bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-700"
                style={{ padding: "2px 8px", gap: "6px" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> Practical
              </span>
            </div>
          </div>
        </div>

        {/* 4. Tab Panel Content */}
        <div className="tt-panel-content">
          <TabsContent value="week">
            <ExamGrid
              records={filteredRecords}
              allRecords={records}
              currentClass={selectedClass}
              week={week}
              onView={(id) => onAction("view", id)}
              onAction={onAction}
              onQuickAdd={handleOpenQuickAdd}
              onMoveExam={handleMoveExam}
            />
          </TabsContent>

          <TabsContent value="list">
            <ScheduledExams
              records={filteredRecords}
              page={page}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={setPageSize}
              onAction={onAction}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* 5. Modals & Dialogs */}
      <QuickExamModal
        isOpen={quickModalOpen}
        onClose={() => {
          setQuickModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveExam}
        currentClass={{
          program: selectedClass !== "ALL" ? selectedClass : availableClasses[0],
          section: selectedSection !== "ALL" ? selectedSection : "A",
        }}
        initialDate={quickModalDefaults?.date}
        initialStartTime={quickModalDefaults?.startTime}
        initialEndTime={quickModalDefaults?.endTime}
        options={options}
        isSchool={isSchool}
        editRecord={editingRecord}
      />

      {viewingRecord && (
        <ExamDetailsDialog
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Examination Schedule?"
        description={`Are you sure you want to delete ${deleteTarget?.subject ?? "this exam"}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            try {
              await dispatch(
                deleteExam(deleteTarget._id || deleteTarget.id)
              ).unwrap();
              toast.success("Exam schedule deleted successfully.");
              dispatch(fetchExams());
            } catch (err) {
              const msg =
                typeof err === "string" ? err : "Failed to delete exam schedule";
              toast.error(msg);
            }
          }
          setDeleteTarget(null);
        }}
      />
    </section>
  );
}
