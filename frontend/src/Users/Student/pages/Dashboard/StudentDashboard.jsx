import {
  selectStudentDiary,
  diaryEntriesForDate,
} from "@/store/selectors/studentDiary";
import StudentDiaryEntry from "../../components/StudentDiaryEntry";
import { selectStudentAssignments } from "@/store/selectors/studentAssignments";
import AssignmentStatusBadge from "../../components/AssignmentStatusBadge";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  FileText,
  CalendarDays,
  ClipboardList,
  Clock3,
  ArrowRight,
  Users,
  User,
  GraduationCap,
  MessageSquare,
  Mail,
  QrCode,
  Bus,
  MapPin,
  Clock,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import SummaryCard from "@/components/common/SummaryCard";
import { selectStudentDashboard } from "@/store/selectors/studentDashboard";
import { dateKey, parseDate } from "@/lib/dates";
import { timeLabel, dayLabel } from "@/lib/schedule";
import { useInstitution } from "@/context/InstitutionContext";
import { PageLoader } from "@/components/ui/spinner";
import useStudentPortal from "@/hooks/useStudentPortal";
import { useQuery } from "@tanstack/react-query";
import { getMyTransportApi } from "@/api/transport.api";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { isSchool } = useInstitution();
  const { isLoading, classTeacher, subjects, transport: portalTransport } = useStudentPortal();

  const { student, courses = [], timetable = [], attendance } = useSelector(
    selectStudentDashboard,
  );
  const diary = useSelector(selectStudentDiary) || [];
  const assignments = useSelector(selectStudentAssignments) || [];
  const [today, setToday] = useState(() => dateKey(new Date()));

  const targetStudentId = student?.id || student?._id;
  const { data: transportResponse } = useQuery({
    queryKey: ["transport", "my-transport", targetStudentId],
    queryFn: () => getMyTransportApi(targetStudentId),
    enabled: Boolean(targetStudentId),
    staleTime: 2 * 60 * 1000,
  });

  const transport = transportResponse?.data || portalTransport || null;
  const isEnrolledInTransport = Boolean(
    transport?.assigned ||
    transport?.usesTransport ||
    student?.usesTransport ||
    student?.transportEnrolled ||
    transport?.route?.routeName
  );
  useEffect(() => {
    let timer;
    const refreshDay = () => {
      clearTimeout(timer);
      const now = new Date();
      setToday(dateKey(now));
      const nextDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      timer = setTimeout(refreshDay, nextDay - now);
    };
    refreshDay();
    document.addEventListener("visibilitychange", refreshDay);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", refreshDay);
    };
  }, []);

  const [timetablePage, setTimetablePage] = useState(1);
  const [timetablePageSize, setTimetablePageSize] = useState(4);

  const todaysClasses = (timetable || []).filter((session) =>
    session?.days?.includes(parseDate(today).getDay()),
  );
  const displayedClasses = todaysClasses.length > 0 ? todaysClasses : (timetable || []);
  const isShowingAllClasses =
    todaysClasses.length === 0 && (timetable || []).length > 0;

  useEffect(() => {
    setTimetablePage(1);
  }, [displayedClasses.length, today]);

  if (isLoading && !student) {
    return <PageLoader text="Loading student dashboard..." />;
  }

  const totalClasses = displayedClasses.length;
  const totalTimetablePages = Math.max(1, Math.ceil(totalClasses / timetablePageSize));
  const safeTimetablePage = Math.min(Math.max(1, timetablePage), totalTimetablePages);

  const timetableStartIndex = (safeTimetablePage - 1) * timetablePageSize;
  const timetableEndIndex = Math.min(timetableStartIndex + timetablePageSize, totalClasses);
  const paginatedClasses = displayedClasses.slice(timetableStartIndex, timetableEndIndex);

  const getTimetablePageNumbers = () => {
    if (totalTimetablePages <= 5) {
      return Array.from({ length: totalTimetablePages }, (_, i) => i + 1);
    }
    if (safeTimetablePage <= 3) {
      return [1, 2, 3, 4, "...", totalTimetablePages];
    }
    if (safeTimetablePage >= totalTimetablePages - 2) {
      return [
        1,
        "...",
        totalTimetablePages - 3,
        totalTimetablePages - 2,
        totalTimetablePages - 1,
        totalTimetablePages,
      ];
    }
    return [
      1,
      "...",
      safeTimetablePage - 1,
      safeTimetablePage,
      safeTimetablePage + 1,
      "...",
      totalTimetablePages,
    ];
  };

  const stats = [
    {
      label: isSchool ? "Enrolled Subjects" : "Enrolled Courses",
      icon: BookOpen,
      value: student ? courses.length : "—",
      description: student
        ? isSchool
          ? "Subjects assigned to your grade"
          : "Subjects on your student record"
        : "Student record not linked",
    },
    {
      label: "Attendance Rate",
      icon: ChartNoAxesColumnIncreasing,
      value:
        attendance?.rate == null
          ? "—"
          : `${Number(attendance.rate.toFixed(1))}%`,
      description: isSchool
        ? "Daily attendance record"
        : !attendance?.marked
          ? "No attendance recorded"
          : attendance.policyPending
            ? "Attendance policy not set"
            : `${attendance.present} / ${attendance.marked} recorded days present`,
    },
    {
      label: isSchool ? "Homework Tasks" : "Pending Tasks",
      icon: FileText,
      value: student
        ? assignments.filter(
            (assignment) => assignment.status === "Pending Submission",
          ).length
        : "—",
      description: isSchool
        ? "Homework awaiting teacher check"
        : "Assignments awaiting submission",
    },
  ];

  const todayDiary = diaryEntriesForDate(diary, today);
  const upcomingAssignments = assignments.filter(
    (assignment) => assignment.dueDate >= today,
  );
  const cleanSection = student?.section
    ? student.section.replace(/^(section\s*)+/i, "").trim() || "A"
    : "A";

  return (
    <section className="student-dashboard" aria-label="Student dashboard">
      {classTeacher?.name && (
        <div className="sd-teacher-banner">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-zinc-800 dark:bg-zinc-700 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 overflow-hidden">
              {classTeacher.avatar ? (
                <img
                  src={classTeacher.avatar}
                  alt={classTeacher.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                classTeacher.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0 gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                  <GraduationCap className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                  Class Teacher
                </span>
                {classTeacher.sectionName && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-zinc-200 bg-zinc-50 text-zinc-700 font-medium">
                    Section {classTeacher.sectionName}
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug truncate">
                {classTeacher.name}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1.5">
                <span>{classTeacher.department || classTeacher.designation || "Class Mentor"}</span>
                {classTeacher.email && (
                  <>
                    <span className="text-neutral-300 dark:text-neutral-600">•</span>
                    <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">{classTeacher.email}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              to="/student/id-card"
              className="sd-teacher-btn-card"
            >
              <QrCode className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
              <span>Student ID Card</span>
            </Link>

            <Link
              to="/student/support?category=Academic"
              className="sd-teacher-btn-ask"
            >
              <MessageSquare className="w-4 h-4 text-white shrink-0" />
              <span style={{ color: "#ffffff" }}>Ask Teacher</span>
            </Link>
          </div>
        </div>
      )}

      <div className="sd-stats">
        {stats.map((stat) => (
          <SummaryCard key={stat.label} {...stat} className="sd-stat" />
        ))}
      </div>

      {/* ── Student Transport Details Card ── */}
      <div className="sd-transport-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2.5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Bus className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-snug truncate">
                  {isEnrolledInTransport
                    ? transport?.route?.routeName || "Assigned Campus Bus Route"
                    : "School Bus & Commute"}
                </h3>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
                >
                  {isEnrolledInTransport ? "Enrolled Commuter" : "Self Commuter"}
                </span>
              </div>
              <p className="text-xs text-neutral-500 truncate mt-0.5">
                {isEnrolledInTransport
                  ? `Designated stop: ${transport?.stop?.stopName || "Designated stop"} · Bus ${transport?.vehicle?.busNumber || "Assigned"}`
                  : "Campus bus service not assigned to this student profile."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEnrolledInTransport && transport?.driver?.phone && transport.driver.phone !== "—" && (
              <a
                href={`tel:${transport.driver.phone}`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <Phone className="w-3 h-3 text-neutral-600" />
                <span>Call Driver</span>
              </a>
            )}
            <Link
              to="/student/transport"
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>View Transport Details</span>
              <ArrowRight className="w-3 h-3 text-neutral-500" />
            </Link>
          </div>
        </div>

        {isEnrolledInTransport ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5">
            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <Bus className="w-3 h-3 text-neutral-600" /> Assigned Bus
              </span>
              <strong className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block truncate">
                {transport?.vehicle?.busNumber || "Bus #12"}
              </strong>
              <span className="text-[11px] text-neutral-500 block truncate">
                {transport?.vehicle?.model || "Toyota Coaster"} · {transport?.vehicle?.plateNumber || "ABC-123"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-neutral-600" /> Pickup Stop &amp; Timing
              </span>
              <strong className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block truncate">
                {transport?.stop?.stopName || "Assigned Stop"}
              </strong>
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-semibold block truncate">
                Pickup: {transport?.stop?.pickupTime || "07:15 AM"} · Return: {transport?.stop?.dropTime || "02:30 PM"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <User className="w-3 h-3 text-neutral-600" /> Designated Driver
              </span>
              <strong className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block truncate">
                {transport?.driver?.name || "Ali Ahmed"}
              </strong>
              <span className="text-[11px] text-neutral-500 block truncate">
                Phone: {transport?.driver?.phone || "—"}
              </span>
            </div>
          </div>
        ) : (
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-neutral-500 gap-2">
            <span className="text-[11px]">Need school bus transport? Request route assignment from the administration.</span>
            <Link
              to="/student/support?category=Transport"
              className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Request Transport Service →
            </Link>
          </div>
        )}
      </div>
      <Card className="sd-timetable">
        <div className="sd-section-heading">
          <div className="sd-section-title">
            <span className="sd-icon">
              <CalendarDays aria-hidden="true" />
            </span>
            <div>
              <h2>
                {isShowingAllClasses
                  ? isSchool
                    ? "Weekly Period Routine"
                    : "Weekly Class Timetable"
                  : isSchool
                    ? "Today's Period Timetable"
                    : "Today's Class Timetable"}
              </h2>
              <p>
                {student?.section
                  ? `${isSchool ? "Daily period routine" : "Weekly lecture schedule"} for Section ${cleanSection}`
                  : isSchool
                    ? "Your daily periods"
                    : "Your class schedule"}{" "}
                <span aria-hidden="true">·</span>{" "}
                <time dateTime={today}>
                  {parseDate(today).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </time>
                {isShowingAllClasses && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs font-normal bg-muted/40"
                  >
                    Showing Regular Routine
                  </Badge>
                )}
                {totalClasses > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs font-semibold bg-zinc-50 border-zinc-200 text-zinc-700"
                  >
                    {totalClasses} {isSchool ? (totalClasses === 1 ? "Period" : "Periods") : (totalClasses === 1 ? "Class" : "Classes")}
                  </Badge>
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/student/courses">
              {isSchool ? "View All Subjects" : "View All Courses"}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="md:hidden flex items-center justify-between text-[11px] text-muted-foreground px-1 py-1">
          <span>Swipe routine horizontally</span>
          <span>← Scroll →</span>
        </div>
        <Table aria-label="Today's class timetable">
          <TableHeader>
            <TableRow>
              {[
                "Course / Subject",
                "Timing & Routine",
                "Room / Lab",
                "Instructor",
                "Status",
              ].map((heading) => (
                <TableHead key={heading} scope="col">
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClasses.map((session, idx) => (
              <TableRow key={session.id || session._id || `timetable-session-${idx}`}>
                <TableCell>
                  <strong>{session.subject}</strong>
                  <small>Sec: {session.section}</small>
                </TableCell>
                <TableCell>
                  <span className="sd-class-time">
                    <Clock3 aria-hidden="true" />
                    {timeLabel(session.startTime)} –{" "}
                    {timeLabel(session.endTime)}
                  </span>
                  <small>{dayLabel(session.days)}</small>
                </TableCell>
                <TableCell>{session.room || "Classroom"}</TableCell>
                <TableCell>{session.instructor || "Assigned Teacher"}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`sd-status sd-status-${(session.status || "active").toLowerCase()}`}
                  >
                    {session.status === "Active" ? "Scheduled" : (session.status || "Scheduled")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!displayedClasses.length && (
              <TableRow>
                <TableCell colSpan={5} className="sd-table-empty">
                  {student
                    ? "No classes scheduled for your section."
                    : "Your timetable will appear when your student record is linked."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalClasses > 0 && (
          <footer className="sd-table-pagination" aria-label="Timetable pagination">
            <div className="sd-pagination-left">
              <span className="sd-pagination-info">
                Showing <strong>{timetableStartIndex + 1}–{timetableEndIndex}</strong> of{" "}
                <strong>{totalClasses}</strong> {isSchool ? (totalClasses === 1 ? "period" : "periods") : (totalClasses === 1 ? "class" : "classes")}
              </span>

              {totalClasses > 4 && (
                <div className="sd-pagination-size-wrap">
                  <span>Rows:</span>
                  <select
                    value={timetablePageSize}
                    onChange={(e) => {
                      setTimetablePageSize(Number(e.target.value));
                      setTimetablePage(1);
                    }}
                    className="sd-pagination-select"
                    aria-label="Periods per page"
                  >
                    <option value={4}>4 per page</option>
                    <option value={6}>6 per page</option>
                    <option value={8}>8 per page</option>
                    <option value={12}>12 per page</option>
                  </select>
                </div>
              )}
            </div>

            {totalTimetablePages > 1 && (
              <div className="sd-pagination-controls">
                <button
                  type="button"
                  className="sd-pagination-btn"
                  onClick={() => setTimetablePage((p) => Math.max(1, p - 1))}
                  disabled={safeTimetablePage <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                  <span>Prev</span>
                </button>

                <div className="sd-pagination-pages">
                  {getTimetablePageNumbers().map((p, idx) =>
                    p === "..." ? (
                      <span key={`ellipsis-${idx}`} className="sd-pagination-ellipsis" aria-hidden="true">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        className={`sd-pagination-page-btn ${p === safeTimetablePage ? "active" : ""}`}
                        onClick={() => setTimetablePage(p)}
                        aria-label={`Go to page ${p}`}
                        aria-current={p === safeTimetablePage ? "page" : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="sd-pagination-btn"
                  onClick={() => setTimetablePage((p) => Math.min(totalTimetablePages, p + 1))}
                  disabled={safeTimetablePage >= totalTimetablePages}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            )}
          </footer>
        )}
      </Card>

      {/* Class Faculty & Incharges Section */}
      <Card className="sd-faculty">
        <div className="sd-section-heading">
          <div className="sd-section-title">
            <span className="sd-icon">
              <Users aria-hidden="true" />
            </span>
            <div>
              <h2>Class Faculty &amp; Teacher Incharges</h2>
              <p>Appointed Class Teacher and Subject Teachers for your section</p>
            </div>
          </div>
          <span className="sd-faculty-grade-pill">
            {student?.gradeOrClass || "My Class"} · Section {cleanSection}
          </span>
        </div>

        <div className="sd-faculty-grid">
          {/* 1. Appointed Class Teacher Incharge Card */}
          <div className="sd-incharge-card">
            <div>
              <div className="sd-incharge-header">
                <span className="sd-incharge-badge">
                  <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                  Class Teacher
                </span>
                <span className="sd-incharge-role">Overall Incharge</span>
              </div>

              <div className="sd-incharge-body">
                <h3 className="sd-incharge-name">
                  {classTeacher?.name || "Assigned Class Incharge"}
                </h3>
                <p className="sd-incharge-designation">
                  {classTeacher?.designation || classTeacher?.department || "Senior Faculty"}
                </p>
                {classTeacher?.email && (
                  <div className="sd-incharge-email">
                    <Mail className="w-3 h-3 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="truncate">{classTeacher.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="sd-incharge-footer">
              <strong>Contact For:</strong> Overall attendance, report cards, leave requests &amp; general inquiries.
            </div>
          </div>

          {/* 2. Subject Teachers Section */}
          <div className="sd-subject-teachers-section">
            <div className="sd-faculty-subheading">
              <span className="sd-faculty-subtitle">
                Assigned Subject Teachers
              </span>
              <span className="sd-faculty-subnote">
                Coursework, marks &amp; homework
              </span>
            </div>

            {(subjects || []).length > 0 ? (
              <div className="sd-subject-teachers-grid">
                {subjects.map((sub, idx) => {
                  const teacherName = sub.instructor?.name || "Assigned Subject Faculty";
                  const teacherEmail = sub.instructor?.email || "";
                  return (
                    <div key={sub.id || idx} className="sd-subject-teacher-item">
                      <div className="sd-subject-teacher-info">
                        <strong className="sd-subject-name truncate">
                          {sub.name}
                        </strong>
                        <span className="sd-subject-teacher-name">
                          <GraduationCap className="w-3 h-3 text-muted-foreground shrink-0" aria-hidden="true" />
                          <span className="truncate">{teacherName}</span>
                        </span>
                        {teacherEmail && (
                          <span className="sd-subject-teacher-email truncate">
                            {teacherEmail}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className="sd-subject-badge">
                        Subject Teacher
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="sd-faculty-empty">
                <span className="sd-faculty-empty-icon">
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <p className="sd-faculty-empty-title">No subject teachers allocated yet</p>
                <p className="sd-faculty-empty-desc">
                  Subject teachers will appear here once allocated by your Campus Manager.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="sd-bottom-grid">
        <Card className="sd-bottom-card sd-diary-card">
          <div className="sd-section-heading">
            <div className="sd-section-title">
              <span className="sd-icon">
                <CalendarDays aria-hidden="true" />
              </span>
              <h2>Upcoming Homework & Tasks</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/student/assignments">
                View All
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {upcomingAssignments.length > 0 ? (
            <div className="sd-assignment-list">
              {upcomingAssignments.slice(0, 3).map((assignment) => (
                <Link to="/student/assignments" key={assignment.id}>
                  <FileText aria-hidden="true" />
                  <div>
                    <strong>{assignment.title}</strong>
                    <small>
                      {assignment.subject} &middot; Due: {assignment.dueDate}
                    </small>
                  </div>
                  <AssignmentStatusBadge status={assignment.status} />
                </Link>
              ))}
            </div>
          ) : assignments.length > 0 ? (
            <div className="sd-assignment-list">
              <p className="text-xs text-muted-foreground px-2 py-1 font-medium">
                Recent Assigned Homework:
              </p>
              {assignments.slice(0, 3).map((assignment) => (
                <Link to="/student/assignments" key={assignment.id}>
                  <FileText aria-hidden="true" />
                  <div>
                    <strong>{assignment.title}</strong>
                    <small>
                      {assignment.subject} &middot; Due: {assignment.dueDate}
                    </small>
                  </div>
                  <AssignmentStatusBadge status={assignment.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="sd-empty">
              <span className="sd-empty-icon">
                <FileText aria-hidden="true" />
              </span>
              <h3>No upcoming assignments</h3>
              <p>Assignments with upcoming due dates will appear here.</p>
            </div>
          )}
        </Card>
        <Card className="sd-bottom-card sd-diary-card">
          <div className="sd-section-heading">
            <div className="sd-section-title">
              <span className="sd-icon">
                <ClipboardList aria-hidden="true" />
              </span>
              <h2>
                {todayDiary.length > 0
                  ? "Today's Class Diary"
                  : "Latest Class Diary Notes"}
              </h2>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/student/diary">
                All Notes
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {todayDiary.length > 0 ? (
            <div className="sd-diary-list">
              {todayDiary.slice(0, 2).map((entry) => (
                <StudentDiaryEntry key={entry.id} entry={entry} compact />
              ))}
            </div>
          ) : diary.length > 0 ? (
            <div className="sd-diary-list">
              <p className="text-xs text-muted-foreground px-2 py-1 font-medium">
                Recent Published Lecture Notes:
              </p>
              {diary.slice(0, 2).map((entry) => (
                <StudentDiaryEntry key={entry.id} entry={entry} compact />
              ))}
            </div>
          ) : (
            <div className="sd-empty">
              <span className="sd-empty-icon">
                <BookOpen aria-hidden="true" />
              </span>
              <h3>No class notes available yet</h3>
              <p>Use All Notes to view your lecture history.</p>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
