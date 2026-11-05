import React, { useState, useMemo } from "react";
import {
  Users,
  Clock,
  MapPin,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Search,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import TableSkeleton from "@/components/shared/TableSkeleton";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import "./TeacherAssignmentTab.css";

const STANDARD_PERIODS = [
  "Period 1: 08:00 AM – 08:45 AM",
  "Period 2: 08:45 AM – 09:30 AM",
  "Period 3: 09:30 AM – 10:15 AM",
  "Period 4: 10:30 AM – 11:15 AM",
  "Period 5: 11:15 AM – 12:00 PM",
  "Period 6: 12:00 PM – 12:45 PM",
  "Period 7: 12:45 PM – 01:30 PM",
  "Period 8: 01:30 PM – 02:15 PM",
];

const REQUIRED_CLASSES_PER_DAY = 5;

export default function TeacherAssignmentTab({
  grades = [],
  sections = [],
  subjects = [],
  gradeSubjects = [],
  teachers = [],
  teacherAssignments = [],
  classTeachers: _classTeachers = [],
  onRefresh,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    teacherId: "",
    gradeId: "",
    sectionId: "",
    subjectId: "",
    timeSlot: STANDARD_PERIODS[0],
    customTimeSlot: "",
    roomNumber: "Room 101",
  });

  const [useCustomTime, setUseCustomTime] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [showUnderAssignedOnly, setShowUnderAssignedOnly] = useState(false);
  const [filterOverrideOnly, setFilterOverrideOnly] = useState(false);

  // Compute teacher workload mapping (number of classes assigned)
  const teacherWorkloadMap = useMemo(() => {
    const map = {};
    for (const t of teachers) {
      map[String(t._id)] = 0;
    }
    for (const a of teacherAssignments) {
      const tId = String(a.teacherId?._id || a.teacherId);
      if (tId) {
        map[tId] = (map[tId] || 0) + 1;
      }
    }
    return map;
  }, [teachers, teacherAssignments]);

  // Total summary statistics
  const metrics = useMemo(() => {
    const totalTeachers = teachers.length;
    let underAssignedCount = 0;
    let optimalCount = 0;

    for (const t of teachers) {
      const count = teacherWorkloadMap[String(t._id)] || 0;
      if (count < REQUIRED_CLASSES_PER_DAY) {
        underAssignedCount++;
      } else {
        optimalCount++;
      }
    }

    const forceConfirmedCount = teacherAssignments.filter(
      (a) => a.isForceConfirmed
    ).length;

    return {
      totalTeachers,
      underAssignedCount,
      optimalCount,
      totalAssignments: teacherAssignments.length,
      forceConfirmedCount,
    };
  }, [teachers, teacherWorkloadMap, teacherAssignments]);

  // Real-time conflict detection on the currently selected form inputs
  const currentConflict = useMemo(() => {
    if (!formData.teacherId || !formData.gradeId || !formData.sectionId || !formData.subjectId) {
      return null;
    }

    const effectiveTimeSlot = useCustomTime
      ? formData.customTimeSlot.trim()
      : formData.timeSlot.trim();

    // 1. Time Slot Conflict: is this teacher already assigned during this time slot?
    let timeConflict = null;
    if (effectiveTimeSlot) {
      timeConflict = teacherAssignments.find((a) => {
        const tId = String(a.teacherId?._id || a.teacherId);
        if (tId !== String(formData.teacherId)) return false;

        // Same exact class & subject doesn't count as a time conflict (it's a duplicate)
        const isSame =
          String(a.gradeId?._id || a.gradeId) === String(formData.gradeId) &&
          String(a.sectionId?._id || a.sectionId) === String(formData.sectionId) &&
          String(a.subjectId?._id || a.subjectId) === String(formData.subjectId);
        if (isSame) return false;

        const aSlot = (a.timeSlot || "").trim().toLowerCase();
        const curSlot = effectiveTimeSlot.toLowerCase();
        return aSlot && aSlot === curSlot;
      });
    }

    // 2. Subject Conflict: is this specific class + subject already assigned to another teacher?
    const subjectConflict = teacherAssignments.find((a) => {
      const sameGrade = String(a.gradeId?._id || a.gradeId) === String(formData.gradeId);
      const sameSection = String(a.sectionId?._id || a.sectionId) === String(formData.sectionId);
      const sameSubject = String(a.subjectId?._id || a.subjectId) === String(formData.subjectId);
      const differentTeacher = String(a.teacherId?._id || a.teacherId) !== String(formData.teacherId);
      return sameGrade && sameSection && sameSubject && differentTeacher;
    });

    if (timeConflict || subjectConflict) {
      return {
        hasConflict: true,
        timeConflict,
        subjectConflict,
      };
    }
    return null;
  }, [formData, useCustomTime, teacherAssignments]);

  // Execute assignment submit (standard or force confirmed)
  const handleSubmitAssignment = async (e, forceConfirm = false) => {
    if (e && e.preventDefault) e.preventDefault();

    const effectiveTimeSlot = useCustomTime
      ? formData.customTimeSlot.trim()
      : formData.timeSlot.trim();

    if (!formData.teacherId || !formData.gradeId || !formData.sectionId || !formData.subjectId) {
      toast.error("Please fill in all required fields (Teacher, Class, Section, Subject).");
      return;
    }

    let overrideReason = "";
    if (forceConfirm) {
      const reason = window.prompt(
        "Confirm Forcefully: Please provide an administrative override reason (or press OK for default):",
        "Override approved by Campus Manager"
      );
      if (reason === null) return; // User cancelled prompt
      overrideReason = reason.trim() || "Manual override confirmed by Campus Manager";
    }

    try {
      setIsSubmitting(true);
      const payload = {
        teacherId: formData.teacherId,
        gradeId: formData.gradeId,
        sectionId: formData.sectionId,
        subjectId: formData.subjectId,
        timeSlot: effectiveTimeSlot,
        roomNumber: formData.roomNumber.trim(),
        forceConfirm,
        overrideReason,
      };

      await axiosInstance.post("/academic/teacher-assignments", payload);
      toast.success(
        forceConfirm
          ? "Teacher assigned forcefully (Manual Override Recorded)!"
          : "Teacher assigned successfully!"
      );

      // Reset form
      setFormData((prev) => ({
        ...prev,
        subjectId: "",
        roomNumber: "Room 101",
      }));
      setUseCustomTime(false);

      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error(err.response.data?.message || "Conflict detected! You can use 'Confirm Forcefully' if needed.");
      } else {
        toast.error(err.response?.data?.message || "Failed to create assignment");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete / Unassign handler
  const handleDeleteAssignment = async (id, teacherName, subjectName) => {
    if (!window.confirm(`Are you sure you want to unassign ${teacherName} from ${subjectName}?`)) {
      return;
    }
    try {
      setIsDeletingId(id);
      await axiosInstance.delete(`/academic/teacher-assignments/${id}`);
      toast.success("Assignment removed successfully");
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove assignment");
    } finally {
      setIsDeletingId(null);
    }
  };

  // Filtered assignments list
  const filteredAssignments = useMemo(() => {
    return teacherAssignments.filter((a) => {
      const tId = String(a.teacherId?._id || a.teacherId);
      const tName = a.teacherId?.name || "";
      const tEmail = a.teacherId?.email || "";
      const gName = a.gradeId?.name || "";
      const sName = a.sectionId?.name || "";
      const subName = a.subjectId?.name || "";
      const room = a.roomNumber || "";
      const time = a.timeSlot || "";

      // Text search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        `${tName} ${tEmail} ${gName} ${sName} ${subName} ${room} ${time}`
          .toLowerCase()
          .includes(q);

      // Teacher filter
      const matchesTeacher = !filterTeacher || tId === String(filterTeacher);

      // Grade filter
      const matchesGrade =
        !filterGrade || String(a.gradeId?._id || a.gradeId) === String(filterGrade);

      // Under-assigned filter (< 5 classes assigned)
      const teacherWorkload = teacherWorkloadMap[tId] || 0;
      const matchesUnderAssigned =
        !showUnderAssignedOnly || teacherWorkload < REQUIRED_CLASSES_PER_DAY;

      // Force confirmed filter
      const matchesOverride = !filterOverrideOnly || a.isForceConfirmed;

      return matchesSearch && matchesTeacher && matchesGrade && matchesUnderAssigned && matchesOverride;
    });
  }, [
    teacherAssignments,
    searchQuery,
    filterTeacher,
    filterGrade,
    showUnderAssignedOnly,
    filterOverrideOnly,
    teacherWorkloadMap,
  ]);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedAssignments = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssignments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssignments, safeCurrentPage]);

  return (
    <div className="tat-container w-full flex flex-col" style={{ gap: "20px" }}>
      {/* 1. Header & KPI Metric Cards */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full"
        style={{ gap: "14px", marginBottom: "4px" }}
      >
        {/* TOTAL FACULTY */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between"
          style={{ padding: "16px 18px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0" style={{ gap: "2px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 truncate">
              Total Faculty
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {metrics.totalTeachers}
            </span>
            <span className="text-xs text-neutral-400 truncate">Registered in campus</span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
            style={{ width: "36px", height: "36px" }}
          >
            <Users className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        {/* UNDER-ASSIGNED */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between"
          style={{ padding: "16px 18px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0" style={{ gap: "2px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 truncate">
              Under-Assigned
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {metrics.underAssignedCount}
            </span>
            <span className="text-xs text-neutral-400 truncate">&lt; {REQUIRED_CLASSES_PER_DAY} classes/day</span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
            style={{ width: "36px", height: "36px" }}
          >
            <AlertTriangle className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        {/* OPTIMAL WORKLOAD */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between"
          style={{ padding: "16px 18px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0" style={{ gap: "2px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 truncate">
              Optimal Workload
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {metrics.optimalCount}
            </span>
            <span className="text-xs text-neutral-400 truncate">&ge; {REQUIRED_CLASSES_PER_DAY} classes assigned</span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
            style={{ width: "36px", height: "36px" }}
          >
            <CheckCircle2 className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        {/* TOTAL ALLOCATIONS */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between"
          style={{ padding: "16px 18px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0" style={{ gap: "2px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 truncate">
              Total Allocations
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {metrics.totalAssignments}
            </span>
            <span className="text-xs text-neutral-400 truncate">Active class subjects</span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
            style={{ width: "36px", height: "36px" }}
          >
            <BookOpen className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        {/* FORCE OVERRIDES */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between col-span-2 sm:col-span-1"
          style={{ padding: "16px 18px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0" style={{ gap: "2px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 truncate">
              Force Overrides
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {metrics.forceConfirmedCount}
            </span>
            <span className="text-xs text-neutral-400 truncate">Manual overrides active</span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
            style={{ width: "36px", height: "36px" }}
          >
            <ShieldAlert className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* 2. Assignment Form Card */}
      <div
        className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden"
        style={{ boxSizing: "border-box" }}
      >
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 bg-neutral-50/50"
          style={{ padding: "16px 20px", gap: "12px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col" style={{ gap: "4px" }}>
            <h3
              className="text-base font-bold text-neutral-900 tracking-tight flex items-center"
              style={{ gap: "8px" }}
            >
              <BookOpen className="w-4 h-4 text-neutral-800" />
              <span>Assign Teacher to Class &amp; Subject</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Allocate subject teachers, schedule routine periods, prevent conflicts, and balance workloads.
            </p>
          </div>
          <span
            className="inline-flex items-center rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-medium self-start sm:self-auto shrink-0"
            style={{ padding: "5px 12px", boxSizing: "border-box" }}
          >
            Daily Standard:{" "}
            <strong className="ml-1 text-neutral-900">
              {REQUIRED_CLASSES_PER_DAY} Classes / Teacher
            </strong>
          </span>
        </div>

        {/* Form Body with generous padding & comfortable spacing */}
        <form
          onSubmit={(e) => handleSubmitAssignment(e, false)}
          style={{ padding: "20px 24px", boxSizing: "border-box" }}
        >
          {/* Main 3-column structured grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ gap: "16px" }}
          >
            {/* 1. Teacher Selector */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <label htmlFor="tatTeacher" className="text-xs font-semibold text-neutral-800 flex items-center justify-between">
                <span>Teacher <span className="text-rose-500">*</span></span>
                {formData.teacherId && (
                  <span className="text-[11px] font-normal text-neutral-500">
                    {teacherWorkloadMap[String(formData.teacherId)] || 0} classes assigned
                  </span>
                )}
              </label>
              <select
                id="tatTeacher"
                className="w-full text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 cursor-pointer transition-all"
                style={{ height: "38px", padding: "0 12px", boxSizing: "border-box" }}
                value={formData.teacherId}
                onChange={(e) => {
                  setFormData({ ...formData, teacherId: e.target.value });
                }}
                required
              >
                <option value="" disabled>Select Teacher</option>
                {teachers.map((t) => {
                  const count = teacherWorkloadMap[String(t._id)] || 0;
                  const isUnder = count < REQUIRED_CLASSES_PER_DAY;
                  return (
                    <option key={t._id} value={t._id}>
                      {t.name} — ({count} {count === 1 ? "Class" : "Classes"}
                      {isUnder ? " • Under-assigned" : " • Target reached"})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2. Class / Grade Selector */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <label htmlFor="tatGrade" className="text-xs font-semibold text-neutral-800">
                Class / Grade <span className="text-rose-500">*</span>
              </label>
              <select
                id="tatGrade"
                className="w-full text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 cursor-pointer transition-all"
                style={{ height: "38px", padding: "0 12px", boxSizing: "border-box" }}
                value={formData.gradeId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gradeId: e.target.value,
                    sectionId: "",
                    subjectId: "",
                  })
                }
                required
              >
                <option value="" disabled>Select Class</option>
                {grades.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Section Selector */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <label htmlFor="tatSection" className="text-xs font-semibold text-neutral-800">
                Section <span className="text-rose-500">*</span>
              </label>
              <select
                id="tatSection"
                className="w-full text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 cursor-pointer transition-all disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
                style={{ height: "38px", padding: "0 12px", boxSizing: "border-box" }}
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                required
                disabled={!formData.gradeId}
              >
                <option value="" disabled>Select Section</option>
                {sections
                  .filter((s) => String(s.gradeId?._id || s.gradeId) === String(formData.gradeId))
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* 4. Subject Selector */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <label htmlFor="tatSubject" className="text-xs font-semibold text-neutral-800">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                id="tatSubject"
                className="w-full text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 cursor-pointer transition-all disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
                style={{ height: "38px", padding: "0 12px", boxSizing: "border-box" }}
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                required
                disabled={!formData.gradeId}
              >
                <option value="" disabled>Select Subject</option>
                {(() => {
                  const gradeSubs = gradeSubjects
                    .filter((gs) => String(gs.gradeId?._id || gs.gradeId) === String(formData.gradeId))
                    .map((gs) => gs.subjectId)
                    .filter(Boolean);
                  const list = gradeSubs.length > 0 ? gradeSubs : subjects;
                  return list.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} {sub.code ? `(${sub.code})` : ""}
                    </option>
                  ));
                })()}
              </select>
            </div>

            {/* 5. Time Routine / Period */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-800">
                <span>Period / Time Routine</span>
                <button
                  type="button"
                  onClick={() => setUseCustomTime(!useCustomTime)}
                  className="text-neutral-600 hover:text-neutral-900 underline underline-offset-2 text-xs font-medium cursor-pointer"
                >
                  {useCustomTime ? "Use Standard" : "Custom Time"}
                </button>
              </div>
              {useCustomTime ? (
                <input
                  type="text"
                  placeholder="e.g. 08:30 AM – 09:15 AM"
                  value={formData.customTimeSlot}
                  onChange={(e) => setFormData({ ...formData, customTimeSlot: e.target.value })}
                  className="w-full text-xs rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 shadow-2xs focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
                  style={{ height: "38px", padding: "0 12px", boxSizing: "border-box" }}
                  required
                />
              ) : (
                <select
                  id="tatTimeSlot"
                  className="w-full text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 cursor-pointer transition-all"
                  style={{ height: "38px", padding: "0 12px", boxSizing: "border-box" }}
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                >
                  {STANDARD_PERIODS.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 6. Room / Hall / Lab */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <label htmlFor="tatRoom" className="text-xs font-semibold text-neutral-800">
                Room / Hall / Lab <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                id="tatRoom"
                type="text"
                placeholder="e.g. Room 101, Physics Lab"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full text-xs rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 shadow-2xs focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
                style={{ height: "38px", padding: "0 12px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Conflict Alert Box with proper spacing */}
          {currentConflict && (
            <div
              className={`tat-conflict-alert my-3 ${
                currentConflict.timeConflict ? "danger-mode" : ""
              }`}
              style={{ padding: "14px 16px", borderRadius: "10px", marginTop: "14px", boxSizing: "border-box" }}
            >
              <div className="tat-conflict-head">
                <AlertTriangle size={22} className="tat-conflict-icon" />
                <div>
                  <h4 className="tat-conflict-title">
                    {currentConflict.timeConflict && currentConflict.subjectConflict
                      ? "Double Conflict: Simultaneous Class Schedule & Duplicate Subject Assignment"
                      : currentConflict.timeConflict
                      ? "Scheduling Conflict Detected"
                      : "Subject Already Assigned to Another Teacher"}
                  </h4>
                  <div className="tat-conflict-desc">
                    {currentConflict.timeConflict && (
                      <p>
                        <strong>Time Slot Clash:</strong> The selected teacher is already assigned to teach{" "}
                        <span className="underline font-semibold">
                          {currentConflict.timeConflict.gradeId?.name} - {currentConflict.timeConflict.sectionId?.name} (
                          {currentConflict.timeConflict.subjectId?.name})
                        </span>{" "}
                        during the exact same time slot ({currentConflict.timeConflict.timeSlot || "selected period"}).
                      </p>
                    )}
                    {currentConflict.subjectConflict && (
                      <p className="mt-1">
                        <strong>Duplicate Subject:</strong>{" "}
                        <span className="underline font-semibold">
                          {currentConflict.subjectConflict.subjectId?.name}
                        </span>{" "}
                        for this class is already assigned to{" "}
                        <strong>{currentConflict.subjectConflict.teacherId?.name || "another faculty member"}</strong>.
                        Assigning will override or replace their allocation.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="tat-conflict-actions pt-2">
                <span className="text-xs font-medium text-neutral-600 mr-auto">
                  Administrative override is permitted with logged audit trail.
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      timeSlot: STANDARD_PERIODS[1],
                    }))
                  }
                  className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 px-3.5 py-2 transition-colors cursor-pointer"
                  style={{ height: "34px", padding: "0 12px", boxSizing: "border-box" }}
                >
                  Adjust Period
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmitAssignment(e, true)}
                  className="inline-flex items-center justify-center rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 gap-2"
                  style={{ height: "34px", padding: "0 14px", boxSizing: "border-box" }}
                >
                  {isSubmitting ? (
                    <Spinner className="w-3.5 h-3.5 text-white shrink-0" />
                  ) : (
                    <ShieldAlert size={15} className="shrink-0" />
                  )}
                  <span>Confirm Forcefully</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Action Row: Submit button with proper margin and sizing */}
          <div
            className="flex items-center justify-end"
            style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1px solid #f5f5f5",
            }}
          >
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.teacherId ||
                !formData.gradeId ||
                !formData.sectionId ||
                !formData.subjectId
              }
              className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0 w-full sm:w-auto"
              style={{
                height: "38px",
                padding: "0 20px",
                gap: "8px",
                boxSizing: "border-box",
              }}
            >
              {isSubmitting ? (
                <Spinner className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-white shrink-0" />
              )}
              <span>Assign Teacher</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Integrated Table Card with Toolbar, Table & Pagination */}
      <div
        className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden"
        style={{ boxSizing: "border-box" }}
      >
        {/* Search & Filter Toolbar - Single row on desktop, resilient to global CSS stripping */}
        <div
          className="w-full flex flex-col xl:flex-row xl:items-center justify-between border-b border-neutral-200 bg-neutral-50/40"
          style={{ padding: "14px 20px", gap: "12px", boxSizing: "border-box" }}
        >
          {/* Search Input with inline paddingLeft to guarantee icon spacing */}
          <div className="relative w-full xl:w-80 shrink-0">
            <Search
              className="w-4 h-4 text-neutral-400 absolute pointer-events-none"
              style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by teacher, class, subject, room, or period..."
              className="w-full text-xs rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 shadow-2xs focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
              style={{
                height: "36px",
                paddingLeft: "36px",
                paddingRight: "12px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Filter Controls Row */}
          <div
            className="flex flex-wrap items-center w-full xl:w-auto"
            style={{ gap: "8px" }}
          >
            {/* Under-assigned Filter Toggle */}
            <button
              type="button"
              onClick={() => {
                setShowUnderAssignedOnly(!showUnderAssignedOnly);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer shadow-2xs ${
                showUnderAssignedOnly
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              }`}
              style={{
                height: "36px",
                padding: "0 12px",
                gap: "6px",
                boxSizing: "border-box",
              }}
              title="Filter teachers who have fewer than 5 classes assigned per day"
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 shrink-0 ${
                  showUnderAssignedOnly ? "text-white" : "text-neutral-600"
                }`}
              />
              <span>Under-assigned ({metrics.underAssignedCount})</span>
            </button>

            {/* Manual Overrides Filter Toggle */}
            <button
              type="button"
              onClick={() => {
                setFilterOverrideOnly(!filterOverrideOnly);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer shadow-2xs ${
                filterOverrideOnly
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              }`}
              style={{
                height: "36px",
                padding: "0 12px",
                gap: "6px",
                boxSizing: "border-box",
              }}
            >
              <ShieldAlert
                className={`w-3.5 h-3.5 shrink-0 ${
                  filterOverrideOnly ? "text-white" : "text-neutral-600"
                }`}
              />
              <span>Overrides ({metrics.forceConfirmedCount})</span>
            </button>

            {/* Teacher Dropdown */}
            <select
              value={filterTeacher}
              onChange={(e) => {
                setFilterTeacher(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 cursor-pointer transition-all flex-1 sm:flex-initial"
              style={{
                height: "36px",
                padding: "0 12px",
                minWidth: "140px",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Teachers</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Class Dropdown */}
            <select
              value={filterGrade}
              onChange={(e) => {
                setFilterGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 cursor-pointer transition-all flex-1 sm:flex-initial"
              style={{
                height: "36px",
                padding: "0 12px",
                minWidth: "130px",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Classes</option>
              {grades.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Assignments Table */}
        <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80">
                <th
                  style={{ padding: "12px 16px", boxSizing: "border-box" }}
                  className="text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap"
                >
                  Teacher &amp; Workload
                </th>
                <th
                  style={{ padding: "12px 16px", boxSizing: "border-box" }}
                  className="text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap"
                >
                  Class &amp; Section
                </th>
                <th
                  style={{ padding: "12px 16px", boxSizing: "border-box" }}
                  className="text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap"
                >
                  Assigned Subject
                </th>
                <th
                  style={{ padding: "12px 16px", boxSizing: "border-box" }}
                  className="text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap"
                >
                  Routine &amp; Time Slot
                </th>
                <th
                  style={{ padding: "12px 16px", boxSizing: "border-box" }}
                  className="text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap"
                >
                  Room / Lab
                </th>
                <th
                  style={{ padding: "12px 16px", boxSizing: "border-box" }}
                  className="text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap"
                >
                  Role &amp; Status
                </th>
                <th
                  style={{ padding: "12px 16px", boxSizing: "border-box" }}
                  className="text-center text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap w-20"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && teacherAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <TableSkeleton rows={5} columns={7} />
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500 text-sm">
                    {searchQuery || filterTeacher || filterGrade || showUnderAssignedOnly || filterOverrideOnly
                      ? "No teacher assignments match your active filters. Try resetting the search or filters."
                      : "No classes have been assigned yet. Use the form above to assign teachers to classes and subjects."}
                  </td>
                </tr>
              ) : (
                paginatedAssignments.map((a) => {
                  const tId = String(a.teacherId?._id || a.teacherId);
                  const workload = teacherWorkloadMap[tId] || a.totalClassesAssigned || 1;
                  const teacherName = a.teacherId?.name || "Teacher";
                  const subjectName = a.subjectId?.name || "Subject";
                  const className = `${a.gradeId?.name || "Class"} - ${a.sectionId?.name || "A"}`;

                  // Check if this teacher is also the Class Teacher of this section
                  const isClassTeacher =
                    a.isClassTeacher ||
                    (a.sectionId?.classTeacherId &&
                      String(a.sectionId.classTeacherId) === tId);

                  return (
                    <tr key={a._id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Teacher & Workload */}
                      <td style={{ padding: "14px 16px", boxSizing: "border-box" }} className="align-middle">
                        <div className="flex flex-col" style={{ gap: "3px" }}>
                          <div className="flex items-center" style={{ gap: "8px" }}>
                            <span className="font-semibold text-neutral-900">{teacherName}</span>
                            {/* Workload Badge */}
                            <span
                              className="inline-flex items-center rounded-md bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-700 whitespace-nowrap"
                              style={{ padding: "2px 8px" }}
                              title={`Workload: ${workload} classes assigned (Target: ${REQUIRED_CLASSES_PER_DAY})`}
                            >
                              {workload === 1 ? "1 Class Assigned" : `${workload} Classes Assigned`}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-500">
                            {a.teacherId?.email || a.teacherId?.department || "Faculty"}
                          </span>
                        </div>
                      </td>

                      {/* Class & Section (Fixed Section Section Bug) */}
                      <td style={{ padding: "14px 16px", boxSizing: "border-box" }} className="align-middle">
                        <div className="font-medium text-neutral-800">{className}</div>
                        <div className="text-xs text-neutral-500">
                          {a.sectionId?.name?.toLowerCase().startsWith("section")
                            ? a.sectionId?.name
                            : `Section ${a.sectionId?.name || "A"}`}
                        </div>
                      </td>

                      {/* Assigned Subject */}
                      <td style={{ padding: "14px 16px", boxSizing: "border-box" }} className="align-middle">
                        <div className="font-semibold text-neutral-900 flex items-center" style={{ gap: "6px" }}>
                          <BookOpen className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                          <span>{subjectName}</span>
                        </div>
                        {a.subjectId?.code && (
                          <span className="text-xs text-neutral-400 font-mono">
                            Code: {a.subjectId.code}
                          </span>
                        )}
                      </td>

                      {/* Routine & Time Slot */}
                      <td style={{ padding: "14px 16px", boxSizing: "border-box" }} className="align-middle">
                        <div className="flex items-center text-neutral-800 text-xs font-medium" style={{ gap: "6px" }}>
                          <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{a.timeSlot || "Standard Period Routine"}</span>
                        </div>
                      </td>

                      {/* Room / Lab */}
                      <td style={{ padding: "14px 16px", boxSizing: "border-box" }} className="align-middle">
                        <div className="flex items-center text-xs text-neutral-700" style={{ gap: "4px" }}>
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="font-medium">{a.roomNumber || "Room 101"}</span>
                        </div>
                      </td>

                      {/* Role & Status */}
                      <td style={{ padding: "14px 16px", boxSizing: "border-box" }} className="align-middle">
                        <div className="flex flex-col items-start" style={{ gap: "4px" }}>
                          {/* Role Indicator */}
                          <span
                            className={`inline-flex items-center rounded-md text-[11px] font-medium ${
                              isClassTeacher
                                ? "bg-neutral-900 text-white border border-neutral-900 shadow-xs"
                                : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                            }`}
                            style={{ padding: "3px 8px" }}
                          >
                            {isClassTeacher ? "Class Teacher" : "Subject Teacher"}
                          </span>

                          {/* Status (Standard vs Manual Override) */}
                          {a.isForceConfirmed ? (
                            <span
                              className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-medium"
                              style={{ padding: "2px 8px" }}
                              title={`Overridden by ${a.forceConfirmedBy?.name || "Campus Manager"}: ${
                                a.overrideReason || "Manual override confirmed"
                              }`}
                            >
                              Force Confirmed Override
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200 text-[11px] font-medium"
                              style={{ padding: "2px 8px" }}
                            >
                              Standard Active
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 16px", boxSizing: "border-box" }} className="align-middle text-center">
                        <button
                          type="button"
                          disabled={isDeletingId === a._id}
                          onClick={() => handleDeleteAssignment(a._id, teacherName, subjectName)}
                          className="inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                          style={{ width: "32px", height: "32px", boxSizing: "border-box" }}
                          title="Remove Assignment"
                        >
                          {isDeletingId === a._id ? (
                            <Spinner className="w-3.5 h-3.5 text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer (10 Rows Per Page) */}
        <div
          className="border-t border-neutral-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between"
          style={{ padding: "12px 20px", gap: "12px", boxSizing: "border-box" }}
        >
          <div className="text-xs text-neutral-500 font-medium">
            {filteredAssignments.length > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold text-neutral-900">
                  {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                –
                <span className="font-semibold text-neutral-900">
                  {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredAssignments.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-neutral-900">
                  {filteredAssignments.length}
                </span>{" "}
                allocations
              </>
            ) : (
              "No allocations to display"
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center" style={{ gap: "8px" }}>
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                style={{ height: "32px" }}
              >
                Previous
              </button>
              <span className="text-xs font-medium text-neutral-600 px-1">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                style={{ height: "32px" }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
