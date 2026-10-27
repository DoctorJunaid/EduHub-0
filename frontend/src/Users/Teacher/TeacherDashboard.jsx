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
  GraduationCap,
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
import { Spinner, SpinnerCustom, PageLoader } from "@/components/ui/spinner";
import useMyClass from "@/hooks/useMyClass";
import MyClassWidget from "@/components/classTeacher/MyClassWidget";
import TeacherLeaveRequestsCard from "./TeacherLeaveRequestsCard";
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
  const _teacher = useSelector(selectTeacherIdentity);
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

  // Synchronized Queries with unified 5min stale cache
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
      queryClient.invalidateQueries({ queryKey: ["teacher"] });
      queryClient.invalidateQueries({ queryKey: ["campus", "class-sessions"] });
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
  const enrolledStudentCount = (() => {
    const maxSection = classes.reduce((max, c) => Math.max(max, c.enrolledStudentsCount || c.studentCount || 0), 0);
    const totalAcrossClasses = classes.reduce((sum, c) => sum + (c.enrolledStudentsCount || c.studentCount || 0), 0);
    return maxSection || totalAcrossClasses || classInfo?.studentCount || enrolledStudents.length || 0;
  })();

  const todayScheduledCount = todaySessions.length;
  const todayConductedCount = todaySessions.filter((s) => s.status === "Completed").length;
  const todayWorkloadLabel =
    todayScheduledCount > 0 ? `${todayConductedCount}/${todayScheduledCount} Done` : "0 Scheduled";

  const metric = [
    { icon: CalendarCheck, label: "Today's Lectures", value: todayWorkloadLabel },
    {
      icon: Award,
      label: "Monthly Credits",
      value:
        creditSummary?.totalCredits !== undefined && creditSummary?.totalCredits !== null
          ? creditSummary.totalCredits
          : "0",
    },
    {
      icon: Coins,
      label: "Bonus Earned",
      isCurrency: true,
      currency: "PKR",
      amount: (creditSummary?.totalBonusEarned || 0).toLocaleString(),
    },
    { icon: BookOpen, label: "Assigned Courses", value: assignedCourseCount },
    { icon: FileText, label: "Pending Submissions", value: pendingSubmissionsCount },
    { icon: Users, label: "Enrolled Students", value: enrolledStudentCount },
  ];

  if (
    todaySessionsQuery.isLoading &&
    summaryQuery.isLoading &&
    classesQuery.isLoading &&
    !classes.length
  ) {
    return <PageLoader text="Loading teacher overview..." />;
  }

  return (
    <main
      className="teacher-dashboard"
      aria-labelledby="teacher-dashboard-title"
    >
      <h1 id="teacher-dashboard-title" className="sr-only">Teacher Overview</h1>

      {/* Class Teacher Hero Card (if assigned) */}
      {isClassTeacher && classInfo && (
        <div className="w-full">
          <MyClassWidget
            classInfo={classInfo}
            attendance={attendance}
            loading={myClassLoading}
          />
        </div>
      )}

      {/* Pending Student Leave Requests Card */}
      <TeacherLeaveRequestsCard />

      {/* Teacher Workload Summary Banner */}
      <section
        className="teacher-workload-banner w-full bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between"
        style={{ padding: "16px 20px", gap: "16px", boxSizing: "border-box" }}
      >
        <div className="workload-banner-left flex items-center min-w-0 flex-1" style={{ gap: "14px" }}>
          <div
            className="workload-banner-icon rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
            style={{ width: "38px", height: "38px" }}
          >
            <BookOpen className="w-4 h-4 text-neutral-700 stroke-[1.75]" />
          </div>
          <div className="workload-banner-content flex flex-col min-w-0" style={{ gap: "2px" }}>
            <div className="workload-heading-row flex items-center flex-wrap" style={{ gap: "8px" }}>
              <h2 className="workload-heading text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
                Faculty Workload Allocation
              </h2>
              <span
                className="workload-assigned-badge inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-medium"
                style={{ padding: "2px 8px" }}
              >
                {classes.length}/5 Classes Assigned
              </span>
              {classes.length < 5 ? (
                <span
                  className="workload-status-badge is-under inline-flex items-center rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200 text-[11px] font-medium"
                  style={{ padding: "2px 8px", gap: "4px" }}
                >
                  Under-assigned ({5 - classes.length} more needed)
                </span>
              ) : (
                <span
                  className="workload-status-badge is-optimal inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-medium"
                  style={{ padding: "2px 8px", gap: "4px" }}
                >
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 stroke-[2]" />
                  Optimal Daily Requirement Met
                </span>
              )}
            </div>
            <p className="workload-banner-subtext text-xs text-neutral-500">
              Campus standard requirement is 5 classes/day. Full class routine and assigned periods are synchronized below.
            </p>
          </div>
        </div>
        <div
          className="workload-banner-target inline-flex items-center rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 shrink-0 self-start md:self-auto"
          style={{ padding: "6px 12px", gap: "6px" }}
        >
          <Clock3 className="w-3.5 h-3.5 text-neutral-500 stroke-[1.75]" />
          <span>Target: <strong className="font-semibold text-neutral-900">5 Periods/Day</strong></span>
        </div>
      </section>

      {/* 1. KPI Cards Strip */}
      <section
        className="teacher-metrics campus-kpi-track w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
        aria-label="Teaching summary"
        style={{ boxSizing: "border-box" }}
      >
        {metric.map((m) => {
          const Icon = m.icon;
          return (
            <article
              className="teacher-metric campus-kpi-card min-w-0 bg-white hover:bg-neutral-50/50 transition-colors p-3.5 sm:p-4"
              key={m.label}
              style={{ minHeight: "80px", boxSizing: "border-box" }}
            >
              <div className="kpi-wrap min-w-0 flex flex-col justify-between h-full w-full" style={{ gap: "6px" }}>
                <div className="flex items-center justify-between w-full" style={{ gap: "6px" }}>
                  <span
                    className="kpi-label text-[10.5px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wide truncate"
                    title={m.label}
                  >
                    {m.label}
                  </span>
                  <div
                    className="kpi-icon shrink-0 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700"
                    style={{ width: "30px", height: "30px" }}
                  >
                    <Icon className="w-3.5 h-3.5 text-neutral-700 stroke-[1.75]" aria-hidden="true" />
                  </div>
                </div>
                <div
                  className="kpi-value text-base sm:text-lg font-bold text-neutral-900 tracking-tight truncate flex items-baseline"
                  style={{ gap: "3px" }}
                >
                  {m.isCurrency ? (
                    <>
                      <span className="text-xs font-semibold text-neutral-500">{m.currency}</span>
                      <span>{m.amount}</span>
                    </>
                  ) : (
                    <span>{m.value}</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* 2. Quick Actions Strip */}
      <div className="teacher-quick-actions-container w-full">
        <nav
          className="teacher-quick-actions grid grid-cols-2 sm:flex sm:flex-wrap items-center w-full"
          style={{ gap: "8px", width: "100%" }}
          aria-label="Teacher quick actions"
        >
          <Link
            to="/teacher/credits"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs font-medium transition-colors whitespace-nowrap shadow-xs w-full sm:w-auto"
            style={{ height: "38px", padding: "0 12px", gap: "6px", boxSizing: "border-box" }}
          >
            <Award className="w-3.5 h-3.5 text-neutral-600 shrink-0 stroke-[1.75]" />
            <span className="truncate">My Teaching Credits &amp; Sessions</span>
          </Link>
          <Link
            to="/teacher/assignments"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs font-medium transition-colors whitespace-nowrap shadow-xs w-full sm:w-auto"
            style={{ height: "38px", padding: "0 12px", gap: "6px", boxSizing: "border-box" }}
          >
            <ClipboardList className="w-3.5 h-3.5 text-neutral-600 shrink-0 stroke-[1.75]" />
            <span className="truncate">Assignments &amp; Grading</span>
          </Link>
          <Link
            to="/teacher/attendance"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs font-medium transition-colors whitespace-nowrap shadow-xs w-full sm:w-auto"
            style={{ height: "38px", padding: "0 12px", gap: "6px", boxSizing: "border-box" }}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-neutral-600 shrink-0 stroke-[1.75]" />
            <span className="truncate">Take Student Attendance</span>
          </Link>
          <Link
            to="/teacher/diary"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs font-medium transition-colors whitespace-nowrap shadow-xs w-full sm:w-auto"
            style={{ height: "38px", padding: "0 12px", gap: "6px", boxSizing: "border-box" }}
          >
            <FileText className="w-3.5 h-3.5 text-neutral-600 shrink-0 stroke-[1.75]" />
            <span className="truncate">Daily Lecture Diary</span>
          </Link>
          <Link
            to="/teacher/gradebook"
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs font-medium transition-colors whitespace-nowrap shadow-xs w-full sm:w-auto"
            style={{ height: "38px", padding: "0 12px", gap: "6px", boxSizing: "border-box" }}
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-600 shrink-0 stroke-[1.75]" />
            <span className="truncate">Exam Marks &amp; Gradebook</span>
          </Link>
        </nav>
      </div>

      {/* 3. Today's Teaching Credits Table */}
      <div className="teacher-section-container w-full">
        <section className="teacher-table-card w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
          <div
            className="teacher-card-header flex flex-col sm:flex-row sm:items-center justify-between w-full border-b border-neutral-200"
            style={{ padding: "16px 20px", gap: "12px", boxSizing: "border-box" }}
          >
            <div className="teacher-card-title-group min-w-0" style={{ gap: "2px" }}>
              <h2 className="teacher-card-title text-base font-bold text-neutral-900 tracking-tight">Today's Teaching Credits &amp; Periods</h2>
              <span className="teacher-card-subtitle text-xs text-neutral-500">Fulfill assigned lecture periods to accrue monthly teaching credits &amp; bonuses</span>
            </div>
            <div className="teacher-card-controls flex flex-wrap items-center w-full sm:w-auto" style={{ gap: "10px" }}>
              <Button
                variant="outline"
                className="rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium shadow-xs whitespace-nowrap shrink-0 w-full sm:w-auto inline-flex items-center justify-center"
                style={{ height: "38px", padding: "0 14px", boxSizing: "border-box" }}
                asChild
              >
                <Link to="/teacher/credits">All Credit Records →</Link>
              </Button>
            </div>
          </div>
          <div className="teacher-table-scroll w-full overflow-x-auto">
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
                      <td className="font-semibold text-neutral-900">
                        Period {sess.period} ({sess.startTime} – {sess.endTime})
                      </td>
                      <td className="font-medium text-neutral-800">
                        {sess.className} {sess.section ? `(${sess.section})` : ""}
                      </td>
                      <td className="font-bold text-neutral-900">{sess.subject}</td>
                      <td>
                        {sess.isSubstituteDuty ? (
                          <span
                            className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-medium"
                            style={{ padding: "2px 8px" }}
                          >
                            Substitution Duty
                          </span>
                        ) : sess.isSubstitutedOut ? (
                          <span
                            className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200 text-[11px] font-medium"
                            style={{ padding: "2px 8px" }}
                          >
                            Substituted Out
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200 text-[11px] font-medium"
                            style={{ padding: "2px 8px" }}
                          >
                            Assigned Teacher
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-medium"
                          style={{ padding: "2px 8px" }}
                        >
                          {sess.status}
                        </span>
                      </td>
                      <td>
                        {sess.status === "Completed" ? (
                          <strong className="text-neutral-900 font-bold">+{sess.creditValue || 1} Cr</strong>
                        ) : sess.deductionValue > 0 ? (
                          <strong className="text-neutral-700 font-bold">-PKR {sess.deductionValue}</strong>
                        ) : (
                          <span className="text-neutral-400 font-medium">1 Cr pending</span>
                        )}
                      </td>
                      <td className="text-right">
                        {sess.status === "Scheduled" && !sess.isSubstitutedOut && (
                          <Button
                            size="sm"
                            className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium shadow-xs"
                            style={{ height: "30px", padding: "0 12px" }}
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
                          <span className="text-neutral-800 font-medium flex items-center justify-end text-xs" style={{ gap: "4px" }}>
                            <CheckCircle2 size={13} className="text-neutral-700" /> Completed
                          </span>
                        )}
                        {(sess.status === "Missed" || sess.status === "Absent") && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium shadow-xs"
                            style={{ height: "30px", padding: "0 12px" }}
                          >
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
              <th>Your Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleClasses.map((item, idx) => {
              const isCT = Boolean(item.isClassTeacher || item.role === "Class Teacher");
              return (
                <tr key={item.id ? `${item.id}-${classStartIndex + idx}` : (item._id ? `${item._id}-${classStartIndex + idx}` : `class-${classStartIndex + idx}`)}>
                  <td className="font-bold text-neutral-900">
                    <div>{item.title || item.subject || "Untitled class"}</div>
                    {item.subjectCode && (
                      <span className="text-[11px] font-mono text-neutral-500 font-normal">
                        Code: {item.subjectCode}
                      </span>
                    )}
                  </td>
                  <td className="font-medium text-neutral-800">
                    {item.section || item.className || item.program || "—"}
                  </td>
                  <td>
                    <span className="flex items-center gap-1.5 text-neutral-700">
                      <Clock3 size={14} className="text-neutral-400" />
                      {(item.days || [item.dayOfWeek]).filter(Boolean).join(", ")}{" "}
                      {item.startTime ? `${item.startTime} – ${item.endTime || ""}` : ""}
                    </span>
                  </td>
                  <td className="text-neutral-600">{item.room || item.roomNumber || "—"}</td>
                  <td>
                    {isCT ? (
                      <span
                        className="inline-flex items-center rounded-md bg-neutral-900 text-white text-[11px] font-medium"
                        style={{ padding: "2px 8px", gap: "4px" }}
                      >
                        <GraduationCap className="w-3 h-3 text-white stroke-[1.75]" />
                        <span>Class Teacher</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200 text-[11px] font-medium"
                        style={{ padding: "2px 8px", gap: "4px" }}
                      >
                        <BookOpen className="w-3 h-3 text-neutral-500 stroke-[1.75]" />
                        <span>Subject Teacher</span>
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="teacher-table-actions">
                      <Link
                        to={`/teacher/attendance?classId=${encodeURIComponent(item.id || item._id)}`}
                        className="teacher-action-link text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
                      >
                        Attendance
                      </Link>
                      <span className="text-neutral-300">•</span>
                      <Link
                        to={`/teacher/diary?classId=${encodeURIComponent(item.id || item._id)}`}
                        className="teacher-action-link text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
                      >
                        Diary
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
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
                    <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {initials(item.studentName)}
                    </span>
                    <strong className="font-semibold text-neutral-900">
                      {item.studentName || item.studentId}
                    </strong>
                  </span>
                </td>
                <td className="font-medium text-neutral-800">{assignmentTitle(item)}</td>
                <td className="text-neutral-600">{item.submittedAt || item.submissionDate || "—"}</td>
                <td>
                  <span
                    className="inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-medium"
                    style={{ padding: "2px 8px" }}
                  >
                    Needs Grading
                  </span>
                </td>
                <td className="text-neutral-400">—</td>
                <td className="text-right">
                  <Button
                    size="sm"
                    asChild
                    className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-xs"
                    style={{ height: "30px", padding: "0 12px" }}
                  >
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
    <div className="teacher-section-container w-full">
      <section className="teacher-table-card w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        <div
          className="teacher-card-header flex flex-col sm:flex-row sm:items-center justify-between w-full border-b border-neutral-200"
          style={{ padding: "16px 20px", gap: "12px", boxSizing: "border-box" }}
        >
          <div className="teacher-card-title-group min-w-0" style={{ gap: "2px" }}>
            <h2 className="teacher-card-title text-base font-bold text-neutral-900 tracking-tight">{title}</h2>
            <span className="teacher-card-subtitle text-xs text-neutral-500">{subtitle}</span>
          </div>
          <div className="teacher-card-controls flex flex-col sm:flex-row sm:items-center w-full sm:w-auto" style={{ gap: "10px" }}>
            <label className="teacher-search-box relative flex items-center w-full sm:w-[240px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
              <span className="sr-only">{placeholder}</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-neutral-200 bg-white text-neutral-900 text-xs focus:outline-none focus:border-neutral-900"
                style={{ height: "38px", paddingLeft: "32px", paddingRight: "12px", boxSizing: "border-box" }}
              />
            </label>
            <Button
              variant="outline"
              className="rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium shadow-xs whitespace-nowrap shrink-0 w-full sm:w-auto inline-flex items-center justify-center"
              style={{ height: "38px", padding: "0 14px", boxSizing: "border-box" }}
              asChild
            >
              <Link to={actionTo}>{actionLabel} →</Link>
            </Button>
          </div>
        </div>
        <div className="teacher-table-scroll w-full overflow-x-auto">{children}</div>
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
      <Icon className="text-neutral-300 mb-1" size={28} />
      <p className="font-semibold text-neutral-700 text-sm mb-0.5">{text}</p>
      <span className="text-xs text-neutral-400">{detail}</span>
    </div>
  );
}
