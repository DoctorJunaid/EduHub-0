import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
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
import "./TeacherAttendance.css";
import TeacherPagination from "./TeacherPagination";

const getTodayKey = () => new Date().toISOString().split("T")[0];

const initials = (name = "") =>
  name
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
      const found = classes.find(
        (c) => String(c.id || c._id || c.classId) === requestedClassId
      );
      setSelectedClassId(
        found
          ? String(found.id || found._id || found.classId)
          : String(classes[0].id || classes[0]._id || classes[0].classId)
      );
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
    if (roster.length > 0) {
      const initialDraft = {};
      roster.forEach((s) => {
        if (s.status) {
          initialDraft[s._id || s.id] = s.status;
        }
      });
      setDraft(initialDraft);
    } else {
      setDraft({});
    }
  }, [roster]);

  // Helper to get effective status for a student
  const getStatus = (student) => {
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
      updated[s._id || s.id] = status;
    });
    setDraft(updated);
    toast.success(`Marked all ${roster.length} students as ${status}.`);
  };

  // 3. Save Attendance Mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => saveTeacherStudentAttendance(payload),
    onSuccess: (res, vars) => {
      toast.success(res.data?.message || `Saved attendance for ${vars.records.length} students!`);
      queryClient.invalidateQueries({
        queryKey: ["teacher", "attendance", "roster"],
      });
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
      .map((student) => {
        const sId = student._id || student.id;
        const effectiveStatus = draft[sId] || student.status || "Present";
        return {
          studentId: sId,
          status: effectiveStatus,
          remarks: student.remarks || "",
          className: selectedClass.className || student.gradeOrClass || "Class 10",
          section: selectedClass.section || student.section || "A",
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

  // Filtered Students Search with Debounce
  const filteredStudents = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const roll = (s.rollNumber || s.roll || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
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

  return (
    <main
      className="campus-tab-page teacher-attendance"
      aria-labelledby="teacher-attendance-title"
    >
      {/* Header Toolbar */}
      <header className="campus-toolbar teacher-attendance-toolbar flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              classesQuery.refetch();
              rosterQuery.refetch();
              toast.success("Attendance synced.");
            }}
            disabled={classesQuery.isFetching || isFetchingRoster}
            className="toolbar-btn-outline flex items-center gap-1.5"
          >
            {classesQuery.isFetching || isFetchingRoster ? (
              <Spinner className="size-3.5" />
            ) : (
              <RefreshCw size={14} />
            )}
            Sync
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="toolbar-btn toolbar-btn-primary flex items-center gap-1.5"
            onClick={handleSaveAttendance}
            disabled={saving || !selectedClass || roster.length === 0 || date > getTodayKey()}
          >
            {saving ? (
              <Spinner className="size-4 mr-1 text-white" />
            ) : (
              <Save size={14} className="mr-1" />
            )}
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </header>

      {/* KPI Metrics Strip */}
      <section className="teacher-attendance-metrics" aria-label="Attendance statistics">
        <Metric
          icon={Users}
          label="TOTAL STUDENTS"
          value={roster.length}
          variant="total"
        />
        <Metric
          icon={CircleCheck}
          label="PRESENT"
          value={counts.Present}
          variant="present"
        />
        <Metric
          icon={CircleX}
          label="ABSENT"
          value={counts.Absent}
          variant="absent"
        />
        <Metric
          icon={Clock3}
          label="LATE / LEAVE"
          value={counts.Late + counts["On Leave"]}
          variant="late"
        />
      </section>

      {/* Main Attendance Card */}
      <section className="teacher-attendance-card">
        {/* Controls Strip: Search, Class Dropdown, Date Picker, Bulk Buttons */}
        <div className="teacher-attendance-controls">
          <label className="teacher-attendance-search">
            <Search size={16} />
            <span className="sr-only">Search students</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search students, roll number..."
            />
          </label>

          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setPage(1);
            }}
            disabled={loadingClasses || classes.length === 0}
            aria-label="Select assigned class"
            className="min-w-[220px]"
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
            onChange={(e) => setDate(e.target.value)}
            aria-label="Attendance date"
            className="px-3"
          >
          </input>

          <div className="teacher-attendance-bulk">
            <Button
              variant="outline"
              onClick={() => markAll("Present")}
              disabled={loadingRoster || roster.length === 0}
            >
              <CheckCheck size={16} /> Mark All Present
            </Button>
            <Button
              variant="outline"
              onClick={() => markAll("Absent")}
              disabled={loadingRoster || roster.length === 0}
            >
              <CircleX size={16} /> Mark All Absent
            </Button>
          </div>
        </div>

        {/* Attendance Roster Table */}
        <div className="teacher-attendance-table-wrap">
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
              className="campus-data-table teacher-attendance-table"
              style={{ width: "100%", tableLayout: "fixed" }}
            >
              <thead>
                <tr>
                  <th style={{ width: "28%" }}>Student Name &amp; Roll No</th>
                  <th style={{ width: "20%" }}>Program &amp; Section</th>
                  <th style={{ width: "18%" }}>Current Status</th>
                  <th style={{ width: "24%" }}>Mark Status</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((student) => {
                  const id = student._id || student.id;
                  const currentStatus = getStatus(student);

                  return (
                    <tr key={id}>
                      <td>
                        <span className="teacher-attendance-student">
                          <span className="teacher-avatar">
                            {initials(student.name)}
                          </span>
                          <div>
                            <strong>{student.name}</strong>
                            <small>{student.rollNumber || "Roll N/A"}</small>
                          </div>
                        </span>
                      </td>
                      <td>
                        <span className="font-medium text-slate-800 text-xs">
                          {student.program || student.gradeOrClass || "Class 10"}
                        </span>
                        <small className="block text-slate-500 text-[11px]">
                          Sec: {student.section || selectedClass?.section || "A"}
                        </small>
                      </td>
                      <td>
                        <Status status={currentStatus} />
                      </td>
                      <td>
                        <div className="teacher-status-actions">
                          {["Present", "Absent", "Late", "On Leave"].map(
                            (option) => {
                              const isSelected = currentStatus === option;
                              return (
                                <Button
                                  key={option}
                                  size="sm"
                                  variant={
                                    isSelected
                                      ? option === "Absent"
                                        ? "destructive"
                                        : option === "Present"
                                        ? "default"
                                        : "secondary"
                                      : "outline"
                                  }
                                  className={
                                    isSelected
                                      ? option === "Present"
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2.5 text-xs font-semibold"
                                        : option === "Absent"
                                        ? "bg-rose-600 hover:bg-rose-700 text-white h-7 px-2.5 text-xs font-semibold"
                                        : "bg-amber-500 hover:bg-amber-600 text-white h-7 px-2 text-xs font-semibold"
                                      : "h-7 px-2 text-xs text-slate-700 hover:bg-slate-100"
                                  }
                                  onClick={() => markStudent(id, option)}
                                >
                                  {option === "On Leave" ? "Leave" : option}
                                </Button>
                              );
                            }
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="teacher-action-trigger"
                              aria-label={`Actions for ${student.name}`}
                            >
                              <CircleAlert size={16} aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            sideOffset={6}
                            collisionPadding={12}
                            className="teacher-action-menu"
                          >
                            <DropdownMenuItem
                              className="teacher-action-item"
                              onSelect={() => markStudent(id, "Present")}
                            >
                              <CircleCheck size={16} className="text-emerald-600" />
                              Mark Present
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="teacher-action-item text-rose-600"
                              onSelect={() => markStudent(id, "Absent")}
                            >
                              <CircleX size={16} className="text-rose-600" />
                              Mark Absent
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="teacher-action-item text-amber-600"
                              onSelect={() => markStudent(id, "Late")}
                            >
                              <Clock3 size={16} className="text-amber-600" />
                              Mark Late
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="teacher-action-item text-amber-600"
                              onSelect={() => markStudent(id, "On Leave")}
                            >
                              <Clock3 size={16} className="text-amber-600" />
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
        <footer className="teacher-attendance-footer">
          <span>
            Showing{" "}
            {filteredStudents.length
              ? (currentPage - 1) * pageSize + 1
              : 0}
            –
            {Math.min(currentPage * pageSize, filteredStudents.length)} of{" "}
            {filteredStudents.length} matching records
          </span>
          <TeacherPagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            label="Attendance pages"
          />
        </footer>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value, variant = "total" }) {
  return (
    <article>
      <span className={`teacher-attendance-metric-icon ${variant}`}>
        <Icon size={20} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function Status({ status }) {
  if (!status) {
    return <span className="teacher-attendance-unmarked">Not marked</span>;
  }
  const normalizedClass = status.toLowerCase().replace(/\s+/g, "-");
  return (
    <span className={`teacher-attendance-status ${normalizedClass}`}>
      <i />
      {status}
    </span>
  );
}
