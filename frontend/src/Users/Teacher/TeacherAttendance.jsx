import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCheck,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock3,
  Save,
  Search,
  Users,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  QrCode,
  XCircle,
} from "lucide-react";
import QRAttendanceScanner from "@/components/attendance/QRAttendanceScanner";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import {
  getTeacherAttendanceClasses,
  getTeacherAttendanceRoster,
  saveTeacherStudentAttendance,
} from "@/api/teacherAttendance.api";
import { qk } from "@/lib/queryKeys";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import { Spinner, SpinnerCustom } from "@/components/ui/spinner";
import TeacherLeaveRequestsCard from "./TeacherLeaveRequestsCard";
import "./TeacherAttendance.css";

const getTodayKey = () => new Date().toISOString().split("T")[0];

const initials = (name = "") =>
  String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ST";

export default function TeacherAttendance() {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState("");
  const [date, setDate] = useState(getTodayKey());
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [draft, setDraft] = useState({}); // { [studentId]: "Present" | "Absent" | "Late" | "On Leave" }
  const [scannerOpen, setScannerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 1. Classes Query
  const classesQuery = useQuery({
    queryKey: qk.teacherAttendanceClasses(),
    queryFn: async () => {
      const res = await getTeacherAttendanceClasses();
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const classes = classesQuery.data || [];
  const loadingClasses = classesQuery.isLoading;

  // Sync selectedClassId on load or query param
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      const requestedClassId = params.get("classId");
      const found = requestedClassId
        ? classes.find((c) => String(c.id || c._id || c.classId) === requestedClassId)
        : null;

      if (found) {
        setSelectedClassId(String(found.id || found._id || found.classId));
      } else {
        const preferred =
          classes.find((c) => c.isClassTeacher && (c.enrolledStudentsCount || c.studentCount) > 0) ||
          classes.find((c) => (c.enrolledStudentsCount || c.studentCount) > 0) ||
          classes.find((c) => c.isClassTeacher) ||
          classes[0];
        setSelectedClassId(String(preferred.id || preferred._id || preferred.classId));
      }
    }
  }, [classes, selectedClassId, params]);

  const selectedClass = useMemo(() => {
    return (
      classes.find(
        (c) => String(c.id || c._id || c.classId) === String(selectedClassId)
      ) || classes[0]
    );
  }, [classes, selectedClassId]);

  // 2. Roster Query
  const cId = selectedClass?.id || selectedClass?._id || selectedClass?.classId || selectedClassId;
  const cName = selectedClass?.className || selectedClass?.gradeOrClass || "";
  const cSec = selectedClass?.section || "";

  const rosterQuery = useQuery({
    queryKey: qk.teacherAttendanceRoster({
      classId: cId,
      className: cName,
      section: cSec,
      date,
    }),
    queryFn: async () => {
      if (!cId) return [];
      const res = await getTeacherAttendanceRoster({
        classId: cId,
        className: cName,
        section: cSec,
        date,
      });
      return res.data?.data?.students || [];
    },
    enabled: Boolean(cId),
    staleTime: 5 * 60 * 1000,
  });

  const roster = rosterQuery.data || [];
  const loadingRoster = rosterQuery.isLoading;
  const isFetchingRoster = rosterQuery.isFetching && !rosterQuery.isLoading;
  const loadError =
    classesQuery.error?.response?.data?.message ||
    rosterQuery.error?.response?.data?.message ||
    "";

  // Reset draft on class/date switch if roster changes
  useEffect(() => {
    if (rosterQuery.data && rosterQuery.data.length > 0) {
      const initialDraft = {};
      rosterQuery.data.forEach((s) => {
        if (s.status) {
          initialDraft[s._id || s.id] = s.status;
        }
      });
      setDraft(initialDraft);
    } else {
      setDraft({});
    }
  }, [rosterQuery.data]);

  // Helper to get effective status for a student
  const getStatus = (student) => {
    if (!student) return "";
    const sId = student._id || student.id;
    return draft[sId] !== undefined ? draft[sId] : student.status || "";
  };

  // Mark Individual Student
  const markStudent = (studentId, status) => {
    setDraft((prev) => ({ ...prev, [studentId]: status }));
  };

  // Bulk Actions
  const markAll = (status) => {
    const updated = {};
    roster.forEach((s) => {
      if (s) {
        updated[s._id || s.id] = status;
      }
    });
    setDraft(updated);
    toast.success(`Marked all ${roster.length} students as ${status}.`);
  };

  // 3. Save Attendance Mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => saveTeacherStudentAttendance(payload),
    onSuccess: (res, vars) => {
      toast.success(res.data?.message || `Saved attendance for ${vars.records.length} students!`);
      queryClient.invalidateQueries({ queryKey: ["teacher", "attendance"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "todayClasses"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "credits"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "myClass"] });
      queryClient.invalidateQueries({ queryKey: ["campus", "class-sessions"] });
      rosterQuery.refetch();
      classesQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to save attendance records.");
    },
  });

  const handleSaveAttendance = () => {
    if (date > getTodayKey()) {
      toast.error("Future attendance cannot be recorded.");
      return;
    }
    if (!selectedClass) {
      toast.error("Please select an assigned class.");
      return;
    }

    const recordsToSave = roster
      .filter(Boolean)
      .map((student) => {
        const sId = student._id || student.id;
        const effectiveStatus = draft[sId] || student.status || "Present";
        return {
          studentId: sId,
          status: effectiveStatus,
          remarks: student.remarks || "",
          className: selectedClass?.className || student.gradeOrClass || "Class 10",
          section: selectedClass?.section || student.section || "A",
        };
      })
      .filter((r) => r.status);

    if (!recordsToSave.length) {
      toast.error("Mark attendance for at least one student before saving.");
      return;
    }

    saveMutation.mutate({
      classId: selectedClass.id || selectedClass._id || selectedClass.classId,
      className: selectedClass.className,
      section: selectedClass.section,
      subject: selectedClass.subject,
      date,
      records: recordsToSave,
    });
  };

  const saving = saveMutation.isPending;

  // Filtered Students Search with Debounce and String Casts
  const filteredStudents = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((s) => {
      if (!s) return false;
      const name = String(s.name || "").toLowerCase();
      const roll = String(s.rollNumber ?? s.roll ?? "").toLowerCase();
      const email = String(s.email || "").toLowerCase();
      return name.includes(q) || roll.includes(q) || email.includes(q);
    });
  }, [roster, debouncedSearch]);

  // Pagination
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Live KPI Metrics Computation
  const counts = useMemo(() => {
    const tally = { Present: 0, Absent: 0, Late: 0, "On Leave": 0, Unmarked: 0 };
    roster.forEach((s) => {
      if (!s) return;
      const st = getStatus(s);
      if (st === "Present") tally.Present += 1;
      else if (st === "Absent") tally.Absent += 1;
      else if (st === "Late") tally.Late += 1;
      else if (st === "On Leave" || st === "Leave" || st === "Excused") tally["On Leave"] += 1;
      else tally.Unmarked += 1;
    });
    return tally;
  }, [roster, draft]);

  const hasMarkedAny = Object.keys(draft).length > 0 || roster.some((s) => s.status);

  const handleAttendanceMarked = useCallback((_result) => {
    queryClient.invalidateQueries({ queryKey: ["teacher-attendance"] });
    queryClient.invalidateQueries({ queryKey: ["teacher", "attendance"] });
    rosterQuery.refetch();
    classesQuery.refetch();
  }, [queryClient, rosterQuery, classesQuery]);

  const handleSync = () => {
    classesQuery.refetch();
    rosterQuery.refetch();
    toast.success("Attendance synced.");
  };

  const handleScanQr = () => {
    setScannerOpen(true);
  };

  const handleMarkAllPresent = () => {
    markAll("Present");
  };

  const handleMarkAllAbsent = () => {
    markAll("Absent");
  };

  return (
    <main
      className="campus-tab-page teacher-attendance w-full"
      aria-labelledby="teacher-attendance-title"
    >
      {/* Top Header Banner & "Sync" Action Bar */}
      <div
        className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between"
        style={{ padding: "18px 20px", gap: "16px", marginBottom: "20px", boxSizing: "border-box" }}
      >
        <div className="flex flex-col min-w-0" style={{ gap: "4px" }}>
          <h1
            id="teacher-attendance-title"
            className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight"
          >
            Student Attendance &amp; Leave Requests
          </h1>
          <p className="text-xs text-neutral-500">
            Manage daily attendance records and review student leave applications.
          </p>
        </div>
        <div className="flex items-center flex-wrap sm:flex-nowrap" style={{ gap: "8px" }}>
          <button
            type="button"
            onClick={handleSync}
            disabled={classesQuery.isFetching || isFetchingRoster}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs shrink-0 self-start sm:self-auto"
            style={{ height: "38px", padding: "0 16px", gap: "6px", boxSizing: "border-box" }}
          >
            {classesQuery.isFetching || isFetchingRoster ? (
              <Spinner className="size-3.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            )}
            <span>Sync</span>
          </button>
          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={saving || !selectedClass || roster.length === 0 || date > getTodayKey()}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs shrink-0 self-start sm:self-auto"
            style={{ height: "38px", padding: "0 16px", gap: "6px", boxSizing: "border-box" }}
          >
            {saving ? (
              <Spinner className="size-3.5 mr-1 text-white" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1" />
            )}
            <span>{saving ? "Saving..." : "Save Attendance"}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <section
        className="grid grid-cols-2 lg:grid-cols-4 w-full"
        style={{ gap: "16px", marginBottom: "20px" }}
        aria-label="Attendance statistics"
      >
        <Metric
          icon={Users}
          label="TOTAL STUDENTS"
          value={roster.length}
        />
        <Metric
          icon={CircleCheck}
          label="PRESENT"
          value={counts.Present}
        />
        <Metric
          icon={CircleX}
          label="ABSENT"
          value={counts.Absent}
        />
        <Metric
          icon={Clock3}
          label="LATE / LEAVE"
          value={counts.Late + counts["On Leave"]}
        />
      </section>

      {/* Pending Student Leave Applications */}
      <TeacherLeaveRequestsCard className="mb-6" />

      {/* Main Attendance Card */}
      <section className="teacher-attendance-card w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Daily Attendance Marking Toolbar */}
        <div
          className="teacher-attendance-controls flex flex-col w-full bg-neutral-50/60 border-b border-neutral-200"
          style={{ padding: "18px 20px", gap: "14px", boxSizing: "border-box" }}
        >
          {/* Top Row: Search Input + Class Selector + Date Picker */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center w-full" style={{ gap: "12px" }}>
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search students, roll number..."
                className="w-full bg-white border border-neutral-200 rounded-lg text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
                style={{ height: "38px", paddingLeft: "36px", paddingRight: "12px", boxSizing: "border-box" }}
              />
            </div>

            {/* Class Selector & Date Picker */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center" style={{ gap: "12px" }}>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setPage(1);
                }}
                disabled={loadingClasses || classes.length === 0}
                aria-label="Select assigned class"
                className="w-full sm:w-auto min-w-[220px] bg-white border border-neutral-200 rounded-lg text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-400 transition-colors cursor-pointer"
                style={{ height: "38px", padding: "0 12px", boxSizing: "border-box" }}
              >
                {classes.length === 0 ? (
                  <option value="">No assigned classes</option>
                ) : (
                  classes.map((row) => (
                    <option
                      key={row.id || row._id || row.classId}
                      value={row.id || row._id || row.classId}
                    >
                      {row.className} • Section {row.section} ({row.subject})
                    </option>
                  ))
                )}
              </select>

              <input
                type="date"
                max={getTodayKey()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
                aria-label="Attendance date"
                className="w-full sm:w-auto bg-white border border-neutral-200 rounded-lg text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-400 transition-colors cursor-pointer"
                style={{ height: "38px", padding: "0 12px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Action Buttons: Scan QR, Mark All Present, Mark All Absent */}
          <div className="grid grid-cols-1 sm:grid-cols-3 w-full" style={{ gap: "10px" }}>
            <button
              type="button"
              onClick={handleScanQr}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs"
              style={{ height: "38px", padding: "0 14px", gap: "6px", boxSizing: "border-box" }}
            >
              <QrCode className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              <span>Scan QR Code</span>
            </button>
            <button
              type="button"
              onClick={handleMarkAllPresent}
              disabled={loadingRoster || roster.length === 0}
              className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs"
              style={{ height: "38px", padding: "0 16px", gap: "6px", boxSizing: "border-box" }}
            >
              <CheckCheck className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Mark All Present</span>
            </button>
            <button
              type="button"
              onClick={handleMarkAllAbsent}
              disabled={loadingRoster || roster.length === 0}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs"
              style={{ height: "38px", padding: "0 14px", gap: "6px", boxSizing: "border-box" }}
            >
              <XCircle className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              <span>Mark All Absent</span>
            </button>
          </div>
        </div>

        {/* Attendance Roster Table */}
        <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          {loadingClasses || loadingRoster ? (
            <div className="py-16 text-center text-slate-500">
              <SpinnerCustom
                text="Loading enrolled students &amp; attendance status..."
                size="lg"
                className="flex-col gap-2"
              />
            </div>
          ) : loadError ? (
            <div className="py-16 text-center text-slate-500">
              <AlertCircle className="inline-block mb-2 text-rose-500" size={32} />
              <p className="font-semibold text-slate-700">{loadError}</p>
              <span className="text-xs text-slate-400 mt-1 block">
                Click Sync to reload assigned classes.
              </span>
            </div>
          ) : classes.length === 0 ? (
            <div className="teacher-attendance-empty">
              <span className="teacher-attendance-empty-icon">
                <FileCheck2 size={24} />
              </span>
              <strong>No assigned classes found</strong>
              <p>
                Timetable sessions or academic classes assigned to your teacher account will appear here.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => classesQuery.refetch()}
              >
                <RefreshCw size={14} className="mr-1.5" /> Check for Classes
              </Button>
            </div>
          ) : roster.length === 0 ? (
            <div className="teacher-attendance-empty">
              <span className="teacher-attendance-empty-icon">
                <Users size={24} />
              </span>
              <strong>No students found in this class section</strong>
              <p>No active student enrollments found for the selected cohort.</p>
            </div>
          ) : (
            <table
              className="w-full min-w-[700px] border-collapse"
              style={{ width: "100%", minWidth: "700px" }}
            >
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50">
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px", width: "28%" }}>Student Name &amp; Roll No</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px", width: "20%" }}>Program &amp; Section</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px", width: "18%" }}>Current Status</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px", width: "24%" }}>Mark Status</th>
                  <th className="text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px", width: "10%" }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {visibleRows.map((student) => {
                  const id = student._id || student.id;
                  const currentStatus = getStatus(student);

                  return (
                    <tr key={id} className="hover:bg-neutral-50/40 transition-colors">
                      <td style={{ padding: "12px 16px" }}>
                        <span className="teacher-attendance-student flex items-center" style={{ gap: "10px" }}>
                          <span className="teacher-avatar">
                            {initials(student.name)}
                          </span>
                          <div>
                            <strong className="block text-xs font-semibold text-neutral-900">{student.name}</strong>
                            <small className="block text-[11px] text-neutral-500">{student.rollNumber || "Roll N/A"}</small>
                          </div>
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="font-medium text-neutral-800 text-xs">
                          {student.program || student.gradeOrClass || "Class 10"}
                        </span>
                        <small className="block text-neutral-500 text-[11px]">
                          Sec: {student.section || selectedClass?.section || "A"}
                        </small>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Status status={currentStatus} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div className="teacher-status-actions flex items-center flex-nowrap" style={{ gap: "4px" }}>
                          {["Present", "Absent", "Late", "On Leave"].map(
                            (option) => {
                              const isSelected = currentStatus === option;
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  className={`inline-flex items-center justify-center text-[11px] font-medium rounded-md whitespace-nowrap transition-colors ${
                                    isSelected
                                      ? option === "Present"
                                        ? "border border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold"
                                        : option === "Absent"
                                        ? "border border-rose-300 bg-rose-50 text-rose-700 font-semibold"
                                        : option === "Late"
                                        ? "border border-amber-300 bg-amber-50 text-amber-700 font-semibold"
                                        : "border border-neutral-300 bg-neutral-100 text-neutral-700 font-semibold"
                                      : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                                  }`}
                                  style={{ height: "28px", padding: "0 8px", boxSizing: "border-box" }}
                                  onClick={() => markStudent(id, option)}
                                >
                                  {option === "On Leave" ? "Leave" : option}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors"
                              aria-label={`Actions for ${student.name}`}
                            >
                              <CircleAlert size={16} aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            sideOffset={6}
                            collisionPadding={12}
                            className="bg-white border border-neutral-200 rounded-xl shadow-lg p-1 min-w-[150px]"
                          >
                            <DropdownMenuItem
                              className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                              onSelect={() => markStudent(id, "Present")}
                            >
                              <CircleCheck size={14} className="text-emerald-600" />
                              Mark Present
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-rose-700 hover:bg-rose-50 cursor-pointer"
                              onSelect={() => markStudent(id, "Absent")}
                            >
                              <CircleX size={14} className="text-rose-600" />
                              Mark Absent
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-amber-700 hover:bg-amber-50 cursor-pointer"
                              onSelect={() => markStudent(id, "Late")}
                            >
                              <Clock3 size={14} className="text-amber-600" />
                              Mark Late
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-amber-700 hover:bg-amber-50 cursor-pointer"
                              onSelect={() => markStudent(id, "On Leave")}
                            >
                              <Clock3 size={14} className="text-amber-600" />
                              Mark On Leave
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loadingClasses &&
            !loadingRoster &&
            roster.length > 0 &&
            filteredStudents.length === 0 && (
              <div className="teacher-attendance-empty py-8 text-center text-slate-400 text-sm">
                No students match your search filter "{search}".
              </div>
            )}
        </div>

        {/* Footer with Pagination */}
        <footer
          className="flex flex-col sm:flex-row items-center justify-between w-full border-t border-neutral-200 bg-neutral-50/50"
          style={{ padding: "12px 20px", gap: "12px", boxSizing: "border-box" }}
        >
          <span className="text-xs text-neutral-500">
            Showing {filteredStudents.length ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} total records
          </span>
          <nav className="flex items-center" style={{ gap: "10px" }} aria-label="Attendance pages">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-700 text-xs font-medium transition-colors shadow-xs"
              style={{ height: "32px", padding: "0 12px" }}
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => setPage(Math.max(1, currentPage - 1))}
            >
              Previous
            </button>
            <span className="text-xs font-medium text-neutral-700" aria-live="polite">{currentPage} / {pageCount}</span>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-700 text-xs font-medium transition-colors shadow-xs"
              style={{ height: "32px", padding: "0 12px" }}
              aria-label="Next page"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
            >
              Next
            </button>
          </nav>
        </footer>
      </section>

      <ErrorBoundary
        title="QR Scanner Notice"
        fallback={(error, reset) => (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 text-center space-y-4">
              <h3 className="font-semibold text-slate-900">QR Scanner Encountered an Issue</h3>
              <p className="text-xs text-slate-600">{error?.message || "Camera was interrupted."}</p>
              <div className="flex justify-center gap-3">
                <Button size="sm" variant="outline" onClick={() => setScannerOpen(false)}>
                  Close
                </Button>
                <Button size="sm" onClick={() => { reset(); }}>
                  Retry Scanner
                </Button>
              </div>
            </div>
          </div>
        )}
      >
        <QRAttendanceScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          endpoint="/teacher/attendance/qr-scan"
          classScope={
            selectedClass
              ? {
                  className: selectedClass.className || selectedClass.gradeOrClass || "",
                  section: selectedClass.section || "",
                }
              : undefined
          }
          onAttendanceMarked={handleAttendanceMarked}
        />
      </ErrorBoundary>

      {/* Mobile Floating Action Button for Quick QR Attendance */}
      <div className="teacher-attendance-fab-wrap">
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="teacher-attendance-fab"
          aria-label="Scan student QR code"
          title="Scan QR Code Attendance"
        >
          <QrCode size={18} />
          <span>Scan QR</span>
        </button>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div
      className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center min-w-0"
      style={{ padding: "16px 18px", gap: "12px", boxSizing: "border-box" }}
    >
      <div
        className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
        style={{ width: "36px", height: "36px" }}
      >
        <Icon className="w-4 h-4 text-neutral-700 stroke-[2]" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 truncate">
          {label}
        </span>
        <span className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight truncate">
          {value}
        </span>
      </div>
    </div>
  );
}

function Status({ status }) {
  if (!status) {
    return (
      <span
        className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-500 border border-neutral-200 text-xs font-medium"
        style={{ padding: "3px 8px" }}
      >
        Not marked
      </span>
    );
  }
  const isPresent = status === "Present";
  const isAbsent = status === "Absent";
  const isLate = status === "Late";

  return (
    <span
      className={`inline-flex items-center rounded-md text-xs font-medium border ${
        isPresent
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : isAbsent
          ? "bg-rose-50 text-rose-800 border-rose-200"
          : isLate
          ? "bg-amber-50 text-amber-800 border-amber-200"
          : "bg-neutral-100 text-neutral-800 border-neutral-200"
      }`}
      style={{ padding: "3px 8px", gap: "6px" }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isPresent ? "bg-emerald-500" : isAbsent ? "bg-rose-500" : isLate ? "bg-amber-500" : "bg-neutral-500"
        }`}
      />
      {String(status)}
    </span>
  );
}

