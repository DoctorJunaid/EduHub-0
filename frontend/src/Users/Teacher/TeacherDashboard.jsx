import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  Coins,
  FileText,
  Search,
  Users,
} from "lucide-react";
import {
  selectAssignedTeacherClasses,
  selectStudentsForAssignedClasses,
  selectTeacherIdentity,
} from "./teacherScope";
import { getTodayClasses, getMySummary, markSessionStatus } from "@/api/classSession.api";
import { getTeacherAssignments, getTeacherClasses } from "@/api/assignment.api";
import { dateKey } from "@/lib/dates";
import { qk } from "@/lib/queryKeys";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Spinner, SpinnerCustom } from "@/components/ui/spinner";
import useMyClass from "@/hooks/useMyClass";
import MyClassWidget from "@/components/classTeacher/MyClassWidget";
import toast from "react-hot-toast";
import "./TeacherDashboard.css";

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ST";

export default function TeacherDashboard() {
  const queryClient = useQueryClient();
  const { isClassTeacher, classInfo, attendance, loading: myClassLoading } = useMyClass();
  const reduxClasses = useSelector(selectAssignedTeacherClasses);
  const teacher = useSelector(selectTeacherIdentity);
  const enrolledStudents = useSelector(selectStudentsForAssignedClasses);
  const reduxAssignments = useSelector((state) => state.assignments?.records || []);
  const reduxSubmissions = useSelector((state) => state.submissions?.records || []);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const debouncedScheduleSearch = useDebounce(scheduleSearch, 300);
  const debouncedSubmissionSearch = useDebounce(submissionSearch, 300);

  const handleScheduleSearchChange = (val) => {
    setScheduleSearch(val);
    setCurrentPage(1);
  };


  const currentMonthKey = dateKey(new Date()).slice(0, 7);

  // 1. Parallel React Query Fetches with 5 min staleTime
  const todaySessionsQuery = useQuery({
    queryKey: qk.teacherTodayClasses(),
    queryFn: async () => {
      const res = await getTodayClasses();
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const summaryQuery = useQuery({
    queryKey: qk.teacherSummary({ month: currentMonthKey }),
    queryFn: async () => {
      const res = await getMySummary({ month: currentMonthKey });
      return res.data?.data || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const assignmentsQuery = useQuery({
    queryKey: qk.teacherAssignments(),
    queryFn: async () => {
      const res = await getTeacherAssignments();
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const classesQuery = useQuery({
    queryKey: qk.teacherClasses(),
    queryFn: async () => {
      const res = await getTeacherClasses();
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // 2. Complete Session Mutation
  const completeMutation = useMutation({
    mutationFn: (sessionId) => markSessionStatus(sessionId, { status: "Completed" }),
    onSuccess: () => {
      toast.success("Teaching credit recorded!");
      queryClient.invalidateQueries({ queryKey: qk.teacherTodayClasses() });
      queryClient.invalidateQueries({ queryKey: qk.teacherSummary({ month: currentMonthKey }) });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to mark class completed.");
    },
  });

  const todaySessions = todaySessionsQuery.data || [];
  const creditSummary = summaryQuery.data;
  const liveAssignments = assignmentsQuery.data || [];
  const liveClasses = classesQuery.data || [];

  const loadingSessions = todaySessionsQuery.isLoading;
  const creditsError = todaySessionsQuery.error?.response?.data?.message || (todaySessionsQuery.error ? "Unable to load today's teaching records." : "");

  const classes = liveClasses.length > 0 ? liveClasses : reduxClasses;
  const assignments = liveAssignments.length > 0 ? liveAssignments : reduxAssignments;
  const submissions = reduxSubmissions;

  const filteredClasses = classes.filter((item) =>
    `${item.title || ""} ${item.subject || ""} ${item.className || ""} ${item.section || ""} ${item.room || ""} ${item.teacherName || item.instructor || ""} ${(item.days || []).join(" ")} ${item.dayOfWeek || ""} ${item.startTime || ""} ${item.endTime || ""}`
      .toLowerCase()
      .includes(debouncedScheduleSearch.toLowerCase()),
  );

  const totalClassItems = filteredClasses.length;
  const totalClassPages = Math.max(1, Math.ceil(totalClassItems / ITEMS_PER_PAGE));


  const safePage = Math.min(Math.max(1, currentPage), totalClassPages);
  const classStartIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const classEndIndex = Math.min(classStartIndex + ITEMS_PER_PAGE, totalClassItems);
  const visibleClasses = filteredClasses.slice(classStartIndex, classStartIndex + ITEMS_PER_PAGE);
  const assignedCourseCount = classes.length > 0 ? classes.length : new Set(
    classes
      .map((item) => item.courseId || item.subjectId || item.title || item.subject)
      .filter(Boolean),
  ).size;

  const liveSubmissions = liveAssignments.flatMap((a) =>
    (a.submissions || []).map((s) => ({
      ...s,
      id: s._id || s.id || `sub_${s.studentId}`,
      assignmentId: a._id || a.id,
      assignmentTitle: a.title,
      studentName: s.studentName || (typeof s.studentId === "object" ? s.studentId?.name : null) || "Student",
      submittedAt: s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("en-CA") : "—",
    }))
  );

  const allSubmissions = liveSubmissions.length > 0 ? liveSubmissions : submissions;
  const pending = allSubmissions.filter((item) =>
    item.status === "Submitted" || item.status === "Late" || item.status === "Pending"
  );

  const assignmentTitle = (submission) =>
    submission.assignmentTitle ||
    assignments.find((a) => (a.id || a._id) === submission.assignmentId)?.title ||
    submission.assignmentId ||
    "Assignment";

  const filteredSubmissions = pending.filter((item) =>
    `${item.studentName || item.studentId || ""} ${assignmentTitle(item)}`
      .toLowerCase()
      .includes(debouncedSubmissionSearch.toLowerCase()),
  );

  const pendingSubmissionsCount = pending.length;
  const enrolledStudentCount = classes.reduce((sum, c) => sum + (c.enrolledStudentsCount || 0), 0) || enrolledStudents.length;

  const metric = [
    [Award, "Monthly Credits", creditSummary?.totalCredits ?? "—"],
    [Coins, "Bonus Earned", `PKR ${(creditSummary?.totalBonusEarned || 0).toLocaleString()}`],
    [BookOpen, "Assigned Courses", assignedCourseCount],
    [FileText, "Pending Submissions", pendingSubmissionsCount],
    [Users, "Enrolled Students", enrolledStudentCount],
  ];

  return (
    <main
      className="teacher-dashboard"
      aria-labelledby="teacher-dashboard-title"
    >
      <h1 id="teacher-dashboard-title" className="sr-only">Teacher Overview</h1>

      {/* Class Teacher Hero Card (if assigned) */}
      {isClassTeacher && classInfo && (
        <div className="mb-6">
          <MyClassWidget
            classInfo={classInfo}
            attendance={attendance}
            loading={myClassLoading}
          />
        </div>
      )}

      {/* 1. KPI Cards Strip */}
      <section className="teacher-metrics campus-kpi-track" aria-label="Teaching summary">
        {metric.map(([Icon, label, value]) => (
          <article className="teacher-metric campus-kpi-card" key={label}>
            <div className="kpi-wrap">
              <div className="kpi-icon">
                <Icon size={18} aria-hidden="true" />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">{label}</span>
                <strong className="kpi-value">{value}</strong>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* 2. Quick Actions Strip */}
      <div className="teacher-quick-actions-container">
        <nav className="teacher-quick-actions" aria-label="Teacher quick actions">
          <Link to="/teacher/credits">
            <Award size={15} /> My Teaching Credits &amp; Sessions
          </Link>
          <Link to="/teacher/assignments">
            <ClipboardList size={15} /> Assignments &amp; Grading
          </Link>
          <Link to="/teacher/attendance">
            <CalendarCheck size={15} /> Take Student Attendance
          </Link>
          <Link to="/teacher/diary">
            <FileText size={15} /> Daily Lecture Diary
          </Link>
          <Link to="/teacher/gradebook">
            <BookOpen size={15} /> Exam Marks &amp; Gradebook
          </Link>
        </nav>
      </div>

      {/* 3. Today's Teaching Credits Table */}
      <div className="teacher-section-container">
        <section className="teacher-table-card">
          <div className="teacher-card-header">
            <div className="teacher-card-title-group">
              <h2 className="teacher-card-title">Today's Teaching Credits &amp; Periods</h2>
              <span className="teacher-card-subtitle">Fulfill assigned lecture periods to accrue monthly teaching credits &amp; bonuses</span>
            </div>
            <div className="teacher-card-controls">
              <Button variant="outline" className="teacher-action-btn toolbar-btn-outline" asChild>
                <Link to="/teacher/credits">All Credit Records →</Link>
              </Button>
            </div>
          </div>
          <div className="teacher-table-scroll">
            {loadingSessions ? (
              <div className="p-8 flex items-center justify-center">
                <SpinnerCustom text="Loading today's periods..." size="default" />
              </div>
            ) : creditsError ? (
              <EmptyRow
                icon={CircleAlert}
                text={creditsError}
                detail="Refresh the page or try again later."
              />
            ) : todaySessions.length === 0 ? (
              <EmptyRow text="No teaching classes scheduled for today." />
            ) : (
              <table className="teacher-overview-table">
                <thead>
                  <tr>
                    <th>Period &amp; Time</th>
                    <th>Class &amp; Section</th>
                    <th>Subject</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Credits</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySessions.map((sess) => (
                    <tr key={sess._id}>
                      <td className="font-semibold text-slate-900">
                        Period {sess.period} ({sess.startTime} – {sess.endTime})
                      </td>
                      <td className="font-medium text-slate-800">
                        {sess.className} {sess.section ? `(${sess.section})` : ""}
                      </td>
                      <td className="font-bold text-slate-900">{sess.subject}</td>
                      <td>
                        {sess.isSubstituteDuty ? (
                          <span className="text-amber-700 font-semibold">Substitution Duty</span>
                        ) : sess.isSubstitutedOut ? (
                          <span className="text-amber-700 font-semibold">Substituted Out</span>
                        ) : (
                          <span className="text-slate-600 font-medium">Assigned Teacher</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`campus-status-pill ${
                            sess.status === "Completed"
                              ? "is-active"
                              : sess.status === "Missed" || sess.status === "Absent"
                              ? "is-danger"
                              : sess.status === "Substituted"
                              ? "is-pending"
                              : "is-active"
                          }`}
                        >
                          {sess.status}
                        </span>
                      </td>
                      <td>
                        {sess.status === "Completed" ? (
                          <strong className="text-emerald-700 font-bold">+{sess.creditValue || 1} Cr</strong>
                        ) : sess.deductionValue > 0 ? (
                          <strong className="text-rose-600 font-bold">-PKR {sess.deductionValue}</strong>
                        ) : (
                          <span className="text-slate-400 font-medium">1 Cr pending</span>
                        )}
                      </td>
                      <td className="text-right">
                        {sess.status === "Scheduled" && !sess.isSubstitutedOut && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-7 px-3 text-xs font-semibold"
                            disabled={completeMutation.isPending && completeMutation.variables === sess._id}
                            onClick={() => completeMutation.mutate(sess._id)}
                          >
                            {completeMutation.isPending && completeMutation.variables === sess._id ? (
                              <Spinner className="mr-1 size-3 text-white" />
                            ) : (
                              <CheckCircle2 size={13} className="mr-1" />
                            )}
                            Mark Done
                          </Button>
                        )}
                        {sess.status === "Completed" && (
                          <span className="text-emerald-600 font-bold flex items-center justify-end gap-1 text-xs">
                            <CheckCircle2 size={13} /> Completed
                          </span>
                        )}
                        {(sess.status === "Missed" || sess.status === "Absent") && (
                          <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                            <Link to="/teacher/credits">Review Dispute</Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* 4. Teaching Schedule & Classes Table */}
      <TeacherTable
        title="My Teaching Schedule & Classes"
        subtitle="Assigned weekly lectures and room allocations"
        search={scheduleSearch}
        setSearch={handleScheduleSearchChange}
        placeholder="Search classes or subjects..."
        actionLabel="Mark Attendance Now"
        actionTo="/teacher/attendance"
        footer={
          totalClassItems > 0 ? (
            <footer className="teacher-table-pagination" aria-label="Classes pagination">
              <span className="teacher-pagination-info">
                Showing <strong>{classStartIndex + 1} - {classEndIndex}</strong> of{" "}
                <strong>{totalClassItems}</strong> {totalClassItems === 1 ? "class" : "classes"}
              </span>
              <div className="teacher-pagination-controls">
                <button
                  type="button"
                  className="teacher-pagination-btn"
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <span className="teacher-pagination-pages">
                  {safePage} / {totalClassPages}
                </span>
                <button
                  type="button"
                  className="teacher-pagination-btn"
                  onClick={() => setCurrentPage(Math.min(totalClassPages, safePage + 1))}
                  disabled={safePage >= totalClassPages}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </footer>
          ) : null
        }
      >
        <table className="teacher-overview-table">
          <thead>
            <tr>
              <th>Course / Subject</th>
              <th>Section / Batch</th>
              <th>Day &amp; Time Routine</th>
              <th>Room / Lab</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleClasses.map((item, idx) => (
              <tr key={item.id ? `${item.id}-${classStartIndex + idx}` : (item._id ? `${item._id}-${classStartIndex + idx}` : `class-${classStartIndex + idx}`)}>
                <td className="font-bold text-slate-900">
                  {item.title || item.subject || "Untitled class"}
                </td>
                <td className="font-medium text-slate-800">
                  {item.section || item.className || item.program || "—"}
                </td>
                <td>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Clock3 size={14} className="text-slate-400" />
                    {(item.days || [item.dayOfWeek]).filter(Boolean).join(", ")}{" "}
                    {item.startTime ? `${item.startTime} – ${item.endTime || ""}` : ""}
                  </span>
                </td>
                <td className="text-slate-600">{item.room || item.roomNumber || "—"}</td>
                <td>
                  <div className="teacher-table-actions">
                    <Link
                      to={`/teacher/attendance?classId=${encodeURIComponent(item.id || item._id)}`}
                      className="teacher-action-link"
                    >
                      Attendance
                    </Link>
                    <span className="text-slate-300">•</span>
                    <Link
                      to={`/teacher/diary?classId=${encodeURIComponent(item.id || item._id)}`}
                      className="teacher-action-link"
                    >
                      Diary
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!totalClassItems && (
          <EmptyRow
            text={scheduleSearch ? "No classes match your search query." : "No teaching classes scheduled for today."}
            detail={scheduleSearch ? "Try checking your spelling or clearing the search." : "All current items for this section have been processed."}
          />
        )}
      </TeacherTable>

      {/* 5. Pending Assignment Submissions Table */}
      <TeacherTable
        title="Pending Assignment Submissions"
        subtitle="Review and grade student deliverables"
        search={submissionSearch}
        setSearch={setSubmissionSearch}
        placeholder="Search students or assignments..."
        actionLabel="All Submissions"
        actionTo="/teacher/assignments"
      >
        <table className="teacher-overview-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Assignment Title</th>
              <th>Submission Date</th>
              <th>Status</th>
              <th>Grade</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {initials(item.studentName)}
                    </span>
                    <strong className="font-semibold text-slate-900">
                      {item.studentName || item.studentId}
                    </strong>
                  </span>
                </td>
                <td className="font-medium text-slate-800">{assignmentTitle(item)}</td>
                <td className="text-slate-600">{item.submittedAt || item.submissionDate || "—"}</td>
                <td>
                  <span className="campus-status-pill is-pending">
                    Needs Grading
                  </span>
                </td>
                <td className="text-slate-400">—</td>
                <td className="text-right">
                  <Button size="sm" asChild className="h-7 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white">
                    <Link to={`/teacher/assignments?submissionId=${encodeURIComponent(item.id)}`}>
                      Evaluate
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredSubmissions.length && (
          <EmptyRow text="No pending submissions are available." />
        )}
      </TeacherTable>
    </main>
  );
}

function TeacherTable({
  title,
  subtitle,
  search,
  setSearch,
  placeholder,
  actionLabel,
  actionTo,
  children,
  footer = null,
}) {
  return (
    <div className="teacher-section-container">
      <section className="teacher-table-card">
        <div className="teacher-card-header">
          <div className="teacher-card-title-group">
            <h2 className="teacher-card-title">{title}</h2>
            <span className="teacher-card-subtitle">{subtitle}</span>
          </div>
          <div className="teacher-card-controls">
            <label className="teacher-search-box">
              <Search size={14} />
              <span className="sr-only">{placeholder}</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={placeholder}
              />
            </label>
            <Button variant="outline" className="teacher-action-btn toolbar-btn-outline" asChild>
              <Link to={actionTo}>{actionLabel} →</Link>
            </Button>
          </div>
        </div>
        <div className="teacher-table-scroll">{children}</div>
        {footer}
      </section>
    </div>
  );
}

function EmptyRow({
  text,
  icon: Icon = FileText,
  detail = "All current items for this section have been processed.",
}) {
  return (
    <div className="teacher-empty-state">
      <Icon className="text-slate-300 mb-1" size={28} />
      <p className="font-semibold text-slate-600 text-sm mb-0.5">{text}</p>
      <span className="text-xs text-slate-400">{detail}</span>
    </div>
  );
}
