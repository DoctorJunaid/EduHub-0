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
  Filter,
  Plus,
  ShieldAlert,
  UserCheck,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
  classTeachers = [],
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

  return (
    <div className="tat-container">
      {/* 1. Header & KPI Metric Cards */}
      <div className="tat-kpi-grid">
        <div className="tat-kpi-card">
          <div className="tat-kpi-icon-wrap bg-indigo-50 text-indigo-600">
            <Users size={22} />
          </div>
          <div className="tat-kpi-info">
            <span className="tat-kpi-label">Total Faculty</span>
            <span className="tat-kpi-value">{metrics.totalTeachers}</span>
            <span className="tat-kpi-subtext">Registered in campus</span>
          </div>
        </div>

        <div className="tat-kpi-card">
          <div className="tat-kpi-icon-wrap bg-amber-50 text-amber-600">
            <AlertTriangle size={22} />
          </div>
          <div className="tat-kpi-info">
            <span className="tat-kpi-label">Under-Assigned</span>
            <span className="tat-kpi-value text-amber-600 font-bold">
              {metrics.underAssignedCount}
            </span>
            <span className="tat-kpi-subtext">&lt; {REQUIRED_CLASSES_PER_DAY} classes/day</span>
          </div>
        </div>

        <div className="tat-kpi-card">
          <div className="tat-kpi-icon-wrap bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
          <div className="tat-kpi-info">
            <span className="tat-kpi-label">Optimal Workload</span>
            <span className="tat-kpi-value text-emerald-600">{metrics.optimalCount}</span>
            <span className="tat-kpi-subtext">&ge; {REQUIRED_CLASSES_PER_DAY} classes assigned</span>
          </div>
        </div>

        <div className="tat-kpi-card">
          <div className="tat-kpi-icon-wrap bg-blue-50 text-blue-600">
            <BookOpen size={22} />
          </div>
          <div className="tat-kpi-info">
            <span className="tat-kpi-label">Total Allocations</span>
            <span className="tat-kpi-value">{metrics.totalAssignments}</span>
            <span className="tat-kpi-subtext">Active class subjects</span>
          </div>
        </div>

        <div className="tat-kpi-card">
          <div className="tat-kpi-icon-wrap bg-rose-50 text-rose-600">
            <ShieldAlert size={22} />
          </div>
          <div className="tat-kpi-info">
            <span className="tat-kpi-label">Force Overrides</span>
            <span className="tat-kpi-value text-rose-600">{metrics.forceConfirmedCount}</span>
            <span className="tat-kpi-subtext">Manual overrides active</span>
          </div>
        </div>
      </div>

      {/* 2. Assignment Form Card */}
      <div className="tat-form-card">
        <div className="tat-form-header">
          <div>
            <h3 className="tat-form-title">Assign Teacher to Class &amp; Subject</h3>
            <p className="tat-form-subtitle">
              Allocate subject teachers, schedule routine periods, prevent conflicts, and balance workloads.
            </p>
          </div>
          <span className="tat-badge tat-badge-workload-target hidden sm:inline-flex">
            Daily Standard: {REQUIRED_CLASSES_PER_DAY} Classes / Teacher
          </span>
        </div>

        <form onSubmit={(e) => handleSubmitAssignment(e, false)}>
          <div className="tat-form-grid">
            {/* Teacher Selector with Workload Badge */}
            <div className="tat-form-field">
              <label htmlFor="tatTeacher">
                <span>Teacher *</span>
                {formData.teacherId && (
                  <span className="text-[11px] font-normal text-slate-500">
                    Current: {teacherWorkloadMap[String(formData.teacherId)] || 0} classes
                  </span>
                )}
              </label>
              <select
                id="tatTeacher"
                className="tat-select font-medium"
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                required
              >
                <option value="" disabled>Select Teacher</option>
                {teachers.map((t) => {
                  const count = teacherWorkloadMap[String(t._id)] || 0;
                  const isUnder = count < REQUIRED_CLASSES_PER_DAY;
                  return (
                    <option key={t._id} value={t._id}>
                      {t.name} — ({count} {count === 1 ? "Class" : "Classes"} Assigned
                      {isUnder ? " • Under-assigned" : " • Target Reached"})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Class / Grade Selector */}
            <div className="tat-form-field">
              <label htmlFor="tatGrade">Class / Grade *</label>
              <select
                id="tatGrade"
                className="tat-select"
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

            {/* Section Selector */}
            <div className="tat-form-field">
              <label htmlFor="tatSection">Section *</label>
              <select
                id="tatSection"
                className="tat-select"
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

            {/* Subject Selector */}
            <div className="tat-form-field">
              <label htmlFor="tatSubject">Subject *</label>
              <select
                id="tatSubject"
                className="tat-select"
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

            {/* Time Routine / Slot */}
            <div className="tat-form-field">
              <label htmlFor="tatTimeSlot">
                <span>Time Routine / Period</span>
                <button
                  type="button"
                  onClick={() => setUseCustomTime(!useCustomTime)}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  {useCustomTime ? "Use Standard Periods" : "Custom Time"}
                </button>
              </label>
              {useCustomTime ? (
                <Input
                  placeholder="e.g. 08:30 AM – 09:15 AM"
                  value={formData.customTimeSlot}
                  onChange={(e) => setFormData({ ...formData, customTimeSlot: e.target.value })}
                  className="tat-input"
                  required
                />
              ) : (
                <select
                  id="tatTimeSlot"
                  className="tat-select"
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

            {/* Room Number */}
            <div className="tat-form-field">
              <label htmlFor="tatRoom">Room / Hall / Lab</label>
              <Input
                id="tatRoom"
                placeholder="e.g. Room 102, Physics Lab"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="tat-input"
              />
            </div>
          </div>

          {/* Conflict Alert Box with "Confirm Forcefully" button */}
          {currentConflict && (
            <div
              className={`tat-conflict-alert ${
                currentConflict.timeConflict ? "danger-mode" : ""
              }`}
            >
              <div className="tat-conflict-head">
                <AlertTriangle size={22} className="tat-conflict-icon" />
                <div>
                  <h4 className="tat-conflict-title">
                    {currentConflict.timeConflict && currentConflict.subjectConflict
                      ? "⚠️ Double Conflict: Simultaneous Class Schedule & Duplicate Subject Assignment"
                      : currentConflict.timeConflict
                      ? "⚠️ Scheduling Conflict Detected"
                      : "⚠️ Subject Already Assigned to Another Teacher"}
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

              <div className="tat-conflict-actions">
                <span className="text-xs font-medium text-slate-600 mr-auto">
                  Administrative override is permitted with logged audit trail.
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      timeSlot: STANDARD_PERIODS[1],
                    }))
                  }
                  className="h-8 text-xs bg-white text-slate-700"
                >
                  Adjust Period
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmitAssignment(e, true)}
                  className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Spinner className="size-3.5 mr-1" />
                  ) : (
                    <ShieldAlert size={14} />
                  )}
                  Confirm Forcefully
                </Button>
              </div>
            </div>
          )}

          {/* Standard Form Actions */}
          <div className="mt-5 flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.teacherId ||
                !formData.gradeId ||
                !formData.sectionId ||
                !formData.subjectId
              }
              className="h-10 px-6 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
            >
              {isSubmitting ? (
                <Spinner className="mr-2 size-4" />
              ) : (
                <Plus className="mr-1.5 size-4" />
              )}
              Assign Teacher
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="tat-filters-bar">
        <div className="tat-search-wrap">
          <Search size={16} className="tat-search-icon" />
          <input
            type="text"
            placeholder="Search by teacher, class, subject, room, or period..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tat-search-input"
          />
        </div>

        <div className="tat-filter-controls">
          {/* Under-assigned Toggle Filter */}
          <button
            type="button"
            onClick={() => setShowUnderAssignedOnly(!showUnderAssignedOnly)}
            className={`tat-toggle-btn ${showUnderAssignedOnly ? "active" : ""}`}
            title="Filter teachers who have fewer than 5 classes assigned per day"
          >
            <AlertTriangle size={14} />
            <span>Under-assigned Teachers ({metrics.underAssignedCount})</span>
          </button>

          {/* Override Filter */}
          <button
            type="button"
            onClick={() => setFilterOverrideOnly(!filterOverrideOnly)}
            className={`tat-toggle-btn ${filterOverrideOnly ? "active" : ""}`}
          >
            <ShieldAlert size={14} />
            <span>Manual Overrides ({metrics.forceConfirmedCount})</span>
          </button>

          {/* Teacher Dropdown Filter */}
          <select
            className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 font-medium"
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
          >
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Grade Dropdown Filter */}
          <select
            className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 font-medium"
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
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
      <div className="tat-table-wrap">
        <table className="tat-table">
          <thead>
            <tr>
              <th>Teacher &amp; Workload</th>
              <th>Class &amp; Section</th>
              <th>Assigned Subject</th>
              <th>Routine &amp; Time Slot</th>
              <th>Room / Lab</th>
              <th>Role &amp; Status</th>
              <th className="text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && teacherAssignments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <TableSkeleton rows={5} columns={7} />
                </td>
              </tr>
            ) : filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                  {searchQuery || filterTeacher || filterGrade || showUnderAssignedOnly || filterOverrideOnly
                    ? "No teacher assignments match your active filters. Try resetting the search or filters."
                    : "No classes have been assigned yet. Use the form above to assign teachers to classes and subjects."}
                </td>
              </tr>
            ) : (
              filteredAssignments.map((a) => {
                const tId = String(a.teacherId?._id || a.teacherId);
                const workload = teacherWorkloadMap[tId] || a.totalClassesAssigned || 1;
                const isUnder = workload < REQUIRED_CLASSES_PER_DAY;
                const isTarget = workload === REQUIRED_CLASSES_PER_DAY;
                const teacherName = a.teacherId?.name || "Teacher";
                const subjectName = a.subjectId?.name || "Subject";
                const className = `${a.gradeId?.name || "Class"} - ${a.sectionId?.name || "A"}`;

                // Check if this teacher is also the Class Teacher of this section
                const isClassTeacher =
                  a.isClassTeacher ||
                  (a.sectionId?.classTeacherId &&
                    String(a.sectionId.classTeacherId) === tId);

                return (
                  <tr key={a._id}>
                    {/* Teacher & Workload */}
                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{teacherName}</span>
                          {/* Workload Badge */}
                          <span
                            className={`tat-badge ${
                              isUnder
                                ? "tat-badge-workload-under"
                                : isTarget
                                ? "tat-badge-workload-target"
                                : "tat-badge-workload-over"
                            }`}
                            title={`Workload: ${workload} classes assigned (Target: ${REQUIRED_CLASSES_PER_DAY})`}
                          >
                            {workload} Classes Assigned
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {a.teacherId?.email || a.teacherId?.department || "Faculty"}
                        </span>
                      </div>
                    </td>

                    {/* Class & Section */}
                    <td>
                      <div className="font-medium text-slate-800">{className}</div>
                      <div className="text-xs text-slate-500">Section {a.sectionId?.name || "A"}</div>
                    </td>

                    {/* Assigned Subject */}
                    <td>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <BookOpen size={14} className="text-indigo-600" />
                        <span>{subjectName}</span>
                      </div>
                      {a.subjectId?.code && (
                        <span className="text-xs text-slate-500 font-mono">
                          Code: {a.subjectId.code}
                        </span>
                      )}
                    </td>

                    {/* Routine & Time Slot */}
                    <td>
                      <div className="flex items-center gap-1.5 text-slate-800 text-xs font-semibold">
                        <Clock size={13} className="text-slate-400" />
                        <span>{a.timeSlot || "Standard Period Routine"}</span>
                      </div>
                    </td>

                    {/* Room / Lab */}
                    <td>
                      <div className="flex items-center gap-1 text-xs text-slate-700">
                        <MapPin size={13} className="text-slate-400" />
                        <span className="font-medium">{a.roomNumber || "Room 101"}</span>
                      </div>
                    </td>

                    {/* Role & Status */}
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        {/* Role Indicator */}
                        <span
                          className={`tat-badge ${
                            isClassTeacher ? "tat-badge-role-ct" : "tat-badge-role-st"
                          }`}
                        >
                          {isClassTeacher ? "👑 Class Teacher" : "📘 Subject Teacher"}
                        </span>

                        {/* Status (Standard vs Manual Override) */}
                        {a.isForceConfirmed ? (
                          <span
                            className="tat-badge tat-badge-override"
                            title={`Overridden by ${a.forceConfirmedBy?.name || "Campus Manager"}: ${
                              a.overrideReason || "Manual override confirmed"
                            }`}
                          >
                            ⚠️ Force Confirmed Override
                          </span>
                        ) : (
                          <span className="tat-badge tat-badge-standard">
                            ✓ Standard Active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isDeletingId === a._id}
                        onClick={() => handleDeleteAssignment(a._id, teacherName, subjectName)}
                        className="size-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Remove Assignment"
                      >
                        {isDeletingId === a._id ? (
                          <Spinner className="size-4 text-red-600" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
