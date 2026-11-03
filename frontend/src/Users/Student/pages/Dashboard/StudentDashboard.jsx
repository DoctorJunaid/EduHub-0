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
  Info,
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
import { selectCurrentUser } from "@/store/Slices/authSlice";
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
  const portal = useStudentPortal();
  const {
    isLoading,
    classTeacher,
    subjects = [],
    transport: portalTransport,
    student: portalStudent,
  } = portal;

  const { student: reduxStudent, courses = [], timetable = [], attendance } = useSelector(
    selectStudentDashboard,
  );
  const user = useSelector(selectCurrentUser);
  const diary = useSelector(selectStudentDiary) || [];
  const assignments = useSelector(selectStudentAssignments) || [];
  const [today, setToday] = useState(() => dateKey(new Date()));

  const student = portalStudent || reduxStudent || user || null;
  const targetStudentId = student?.id || student?._id;

  const studentName = student?.name || user?.name || "Student";
  const studentInitials = studentName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase() || "ST";

  const studentEmail = student?.email || user?.email || "";
  const studentRoll = student?.roll || student?.rollNumber || student?.rollNo || "";
  const rawClass =
    student?.gradeOrClass ||
    student?.className ||
    student?.program ||
    (isSchool ? "Class 9" : "Semester 1");
  const studentClass = String(rawClass).startsWith("Class") ? rawClass : `Class ${rawClass}`;
  const cleanSection = student?.section
    ? String(student.section).replace(/^(section\s*)+/i, "").trim() || "A"
    : "A";
  const studentAvatar = student?.avatar || user?.avatar || "";
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

  const totalEnrolledCount =
    subjects && subjects.length > 0
      ? subjects.length
      : courses && courses.length > 0
        ? courses.length
        : 0;

  const stats = [
    {
      label: isSchool ? "Enrolled Subjects" : "Enrolled Courses",
      icon: BookOpen,
      value: totalEnrolledCount > 0 ? totalEnrolledCount : (student ? "—" : "—"),
      description: isSchool
        ? "Subjects assigned to your grade"
        : "Subjects on your student record",
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
      value: assignments.filter(
        (assignment) => assignment.status === "Pending Submission",
      ).length,
      description: isSchool
        ? "Homework awaiting teacher check"
        : "Assignments awaiting submission",
    },
  ];

  const todayDiary = diaryEntriesForDate(diary, today);
  const upcomingAssignments = assignments.filter(
    (assignment) => assignment.dueDate >= today,
  );

  return (
    <section className="student-dashboard" aria-label="Student dashboard">
      {/* ── Student Profile & Welcome Banner (Always visible for ANY logged in student) ── */}
      <div className="sd-profile-banner" tabIndex={-1} aria-label="Student profile banner">
        <div className="sd-profile-banner-left">
          <div className="sd-profile-avatar" aria-hidden="true">
            {studentAvatar ? (
              <img
                src={studentAvatar}
                alt={studentName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{studentInitials}</span>
            )}
          </div>
          <div className="sd-profile-info">
            <div className="sd-profile-meta">
              <span className="sd-profile-tag sd-profile-tag-active">
                <span className="sd-active-dot" />
                Active Student
              </span>
              <Badge variant="outline" className="sd-profile-badge-class">
                {studentClass} · Section {cleanSection}
              </Badge>
              {studentRoll && (
                <Badge variant="outline" className="sd-profile-badge-roll">
                  Roll #{studentRoll}
                </Badge>
              )}
            </div>

            <h1 className="sd-profile-name">
              {studentName}
            </h1>

            <div className="sd-profile-details">
              {studentEmail && (
                <span className="sd-profile-detail-item">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
                  <span>{studentEmail}</span>
                </span>
              )}
              {studentEmail && <span className="sd-profile-dot">•</span>}
              <span className="sd-profile-detail-item">
                <GraduationCap className="w-3.5 h-3.5 shrink-0 text-zinc-600 dark:text-zinc-400" aria-hidden="true" />
                <span>
                  {classTeacher?.name ? (
                    <>
                      Class Teacher: <strong>{classTeacher.name}</strong>
                    </>
                  ) : (
                    <>
                      Class Incharge: <strong>Section Faculty Incharge</strong>
                    </>
                  )}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="sd-profile-actions">
          <Link
            to="/student/id-card"
            className="sd-profile-btn-card"
            title="View or Print Student Digital ID Card"
          >
            <QrCode className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Student ID Card</span>
          </Link>

          <Link
            to="/student/support?category=Academic"
            className="sd-profile-btn-ask"
            title="Contact Academic Support or Teacher"
          >
            <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Ask Teacher</span>
          </Link>
        </div>
      </div>

      <div className="sd-stats">
        {stats.map((stat) => (
          <SummaryCard key={stat.label} {...stat} className="sd-stat" />
        ))}
      </div>

      {/* ── Student Transport Details Card (School Bus & Commute) ── */}
      <div className="sd-transport-card">
        <div className="sd-transport-header">
          <div className="sd-transport-info">
            <div className="sd-transport-icon" aria-hidden="true">
              <Bus className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div className="sd-transport-titles">
              <div className="sd-transport-title-row">
                <h3 className="sd-transport-title">
                  {isEnrolledInTransport
                    ? transport?.route?.routeName || "Assigned Campus Bus Route"
                    : "School Bus & Commute"}
                </h3>
                <span className={`sd-transport-badge ${isEnrolledInTransport ? "is-enrolled" : "is-self"}`}>
                  {isEnrolledInTransport ? "Enrolled Commuter" : "Self Commuter"}
                </span>
              </div>
              <p className="sd-transport-desc">
                {isEnrolledInTransport
                  ? `Designated stop: ${transport?.stop?.stopName || "Designated stop"} · Bus ${transport?.vehicle?.busNumber || "Assigned"}`
                  : "Campus bus service not assigned to this student profile."}
              </p>
            </div>
          </div>

          <div className="sd-transport-actions">
            {isEnrolledInTransport && transport?.driver?.phone && transport.driver.phone !== "—" && (
              <a
                href={`tel:${transport.driver.phone}`}
                className="sd-transport-btn sd-transport-btn-secondary"
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Call Driver</span>
              </a>
            )}
            <Link
              to="/student/transport"
              className="sd-transport-btn sd-transport-btn-primary"
            >
              <span>View Transport Details</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {isEnrolledInTransport ? (
          <div className="sd-transport-grid">
            <div className="sd-transport-box">
              <span className="sd-transport-box-label">
                <Bus className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" aria-hidden="true" /> Assigned Bus
              </span>
              <strong className="sd-transport-box-title">
                {transport?.vehicle?.busNumber || "Bus #12"}
              </strong>
              <span className="sd-transport-box-sub">
                {transport?.vehicle?.model || "Toyota Coaster"} · {transport?.vehicle?.plateNumber || "ABC-123"}
              </span>
            </div>

            <div className="sd-transport-box">
              <span className="sd-transport-box-label">
                <MapPin className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" aria-hidden="true" /> Pickup Stop &amp; Routine
              </span>
              <strong className="sd-transport-box-title">
                {transport?.stop?.stopName || "Assigned Stop"}
              </strong>
              <div className="sd-transport-timing-row">
                <span className="sd-timing-pill">Pickup: {transport?.stop?.pickupTime || "07:15 AM"}</span>
                <span className="sd-timing-pill">Return: {transport?.stop?.dropTime || "02:30 PM"}</span>
              </div>
            </div>

            <div className="sd-transport-box">
              <span className="sd-transport-box-label">
                <User className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" aria-hidden="true" /> Designated Driver
              </span>
              <strong className="sd-transport-box-title">
                {transport?.driver?.name || "Ali Ahmed"}
              </strong>
              <div className="sd-transport-driver-sub">
                <span>Phone:</span>
                {transport?.driver?.phone && transport.driver.phone !== "—" ? (
                  <a href={`tel:${transport.driver.phone}`} className="sd-driver-phone-link">
                    {transport.driver.phone}
                  </a>
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="sd-transport-unassigned">
            <div className="sd-transport-unassigned-text">
              <Info className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />
              <span>Need school bus transport? Request route assignment from the administration.</span>
            </div>
            <Link
              to="/student/support?category=Transport"
              className="sd-transport-request-link"
            >
              <span>Request Transport Service</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      <Card className="sd-timetable">
        <div className="sd-section-heading">
          <div className="sd-section-title">
            <span className="sd-icon" aria-hidden="true">
              <CalendarDays aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2>
                {isShowingAllClasses
                  ? isSchool
                    ? "Weekly Period Routine"
                    : "Weekly Class Timetable"
                  : isSchool
                    ? "Today's Period Timetable"
                    : "Today's Class Timetable"}
              </h2>
              <div className="sd-timetable-meta">
                <span className="sd-timetable-section-note">
                  {student?.section
                    ? `${isSchool ? "Daily period routine" : "Weekly lecture schedule"} for Section ${cleanSection}`
                    : isSchool
                      ? "Your daily periods"
                      : "Your class schedule"}
                </span>
                <span className="sd-timetable-dot" aria-hidden="true">·</span>
                <time dateTime={today} className="sd-timetable-date">
                  {parseDate(today).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </time>
                <div className="sd-timetable-badges">
                  {isShowingAllClasses && (
                    <Badge
                      variant="outline"
                      className="text-[11px] font-normal bg-muted/40"
                    >
                      Showing Regular Routine
                    </Badge>
                  )}
                  {totalClasses > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[11px] font-semibold bg-zinc-50 border-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                    >
                      {totalClasses} {isSchool ? (totalClasses === 1 ? "Period" : "Periods") : (totalClasses === 1 ? "Class" : "Classes")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" asChild className="sd-timetable-header-btn">
            <Link to="/student/courses">
              <span>{isSchool ? "View All Subjects" : "View All Courses"}</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {!displayedClasses.length ? (
          <div className="sd-timetable-empty">
            <span className="sd-timetable-empty-icon" aria-hidden="true">
              <CalendarDays className="w-5 h-5 text-zinc-500" />
            </span>
            <p className="sd-timetable-empty-title">
              {isSchool ? "No periods scheduled for today" : "No classes scheduled for today"}
            </p>
            <p className="sd-timetable-empty-desc">
              {student
                ? `${isSchool ? "Daily period routine" : "Class schedule"} for Section ${cleanSection} will appear once periods are active.`
                : "Your timetable will appear when your student record is linked."}
            </p>
            <Button variant="outline" size="sm" asChild className="sd-timetable-empty-btn">
              <Link to="/student/courses">
                <span>{isSchool ? "View All Subjects" : "View All Courses"}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="md:hidden flex items-center justify-between text-[11px] text-muted-foreground px-1 py-1">
              <span>Swipe routine horizontally</span>
              <span>← Scroll →</span>
            </div>

            {/* Desktop / Tablet Table View */}
            <div className="sd-timetable-desktop-view">
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
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card-based Routine View (< 640px) */}
            <div className="sd-timetable-mobile-cards">
              {paginatedClasses.map((session, idx) => (
                <div key={session.id || session._id || `m-session-${idx}`} className="sd-period-card">
                  <div className="sd-period-card-top">
                    <div className="min-w-0">
                      <strong className="sd-period-subject">{session.subject}</strong>
                      <span className="sd-period-section">Section {session.section}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`sd-status sd-status-${(session.status || "active").toLowerCase()}`}
                    >
                      {session.status === "Active" ? "Scheduled" : (session.status || "Scheduled")}
                    </Badge>
                  </div>
                  <div className="sd-period-card-details">
                    <div className="sd-period-detail-item">
                      <Clock3 className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
                      <span>{timeLabel(session.startTime)} – {timeLabel(session.endTime)}</span>
                    </div>
                    <div className="sd-period-detail-item">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
                      <span>{session.room || "Classroom"}</span>
                    </div>
                    <div className="sd-period-detail-item">
                      <GraduationCap className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
                      <span className="truncate">{session.instructor || "Assigned Teacher"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
          </>
        )}
      </Card>

      {/* Class Faculty & Incharges Section */}
      <Card className="sd-faculty">
        <div className="sd-section-heading sd-faculty-header">
          <div className="sd-section-title">
            <span className="sd-icon" aria-hidden="true">
              <Users aria-hidden="true" />
            </span>
            <div className="min-w-0">
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
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span>{classTeacher.email}</span>
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
                          <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
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
                <span className="sd-faculty-empty-icon" aria-hidden="true">
                  <BookOpen className="w-4 h-4" />
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
