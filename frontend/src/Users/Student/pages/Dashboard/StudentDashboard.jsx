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
  GraduationCap,
  MessageSquare,
  Mail,
  Bus,
  MapPin,
  Clock,
  Phone,
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
import { getMyTransportApi } from "@/api/transport.api";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { isSchool } = useInstitution();
  const { isLoading, classTeacher, subjects, transport: portalTransport } = useStudentPortal();
  const [directTransport, setDirectTransport] = useState(null);

  useEffect(() => {
    getMyTransportApi()
      .then((res) => {
        if (res?.success && res.assigned) {
          setDirectTransport(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const transport = directTransport || portalTransport;

  const { student, courses = [], timetable = [], attendance } = useSelector(
    selectStudentDashboard,
  );
  const diary = useSelector(selectStudentDiary) || [];
  const assignments = useSelector(selectStudentAssignments) || [];
  const [today, setToday] = useState(() => dateKey(new Date()));
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

  if (isLoading && !student) {
    return <PageLoader text="Loading student dashboard..." />;
  }

  const todaysClasses = (timetable || []).filter((session) =>
    session?.days?.includes(parseDate(today).getDay()),
  );
  const displayedClasses = todaysClasses.length > 0 ? todaysClasses : (timetable || []);
  const isShowingAllClasses =
    todaysClasses.length === 0 && (timetable || []).length > 0;

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
        <Card className="sd-teacher-banner p-3 flex flex-row items-center justify-between gap-3 border-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/50 dark:border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              {classTeacher.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Class Teacher
                </span>
                {classTeacher.sectionName && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-zinc-300 font-medium">
                    Section {classTeacher.sectionName}
                  </Badge>
                )}
              </div>
              <h3 className="text-sm font-bold text-foreground leading-snug truncate">{classTeacher.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {classTeacher.department || classTeacher.designation || "Class Mentor"}
                {classTeacher.email && ` · ${classTeacher.email}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" asChild className="h-8 text-xs gap-1.5 border-zinc-200 hover:bg-zinc-100">
              <Link to="/student/support?category=Academic">
                <MessageSquare className="w-3.5 h-3.5" />
                Ask Teacher
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* ── Transport Card (Scenario: Bus #12, Driver Ali, Stop, Pickup Time) ── */}
      {transport?.assigned ? (
        <Card className="sd-transport-card p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-zinc-200 bg-white dark:bg-zinc-900/60 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {transport.route?.routeName || "Campus Transit Route"}
                </span>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium">
                  Active Commuter
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-foreground leading-snug truncate">
                {transport.vehicle?.busNumber || "Bus #12"}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({transport.vehicle?.model || "Toyota Coaster"} · {transport.vehicle?.plateNumber || "ABC-123"})
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full md:w-auto shrink-0">
            {/* Designated Stop & Timing */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs">
              <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-tight">
                  Designated Stop
                </span>
                <strong className="text-foreground leading-tight">{transport.stop?.stopName || "Stop 2: Market"}</strong>
                <span className="text-muted-foreground block text-[11px] leading-tight">
                  Pickup: {transport.stop?.pickupTime || "07:15 AM"}
                </span>
              </div>
            </div>

            {/* Driver Ali Contact */}
            <div className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-tight">
                  Driver Contact
                </span>
                <strong className="text-foreground leading-tight">
                  {transport.driver?.name || "Ali Ahmed"}
                </strong>
                <span className="text-muted-foreground block text-[11px] leading-tight">
                  {transport.driver?.phone || "+92 300 1234567"}
                </span>
              </div>
              {transport.driver?.phone && transport.driver?.phone !== "—" && (
                <Button size="sm" variant="outline" asChild className="h-7 text-xs gap-1 border-zinc-200 hover:bg-zinc-100">
                  <a href={`tel:${transport.driver.phone}`}>
                    <Phone className="w-3 h-3 text-emerald-600" />
                    Call
                  </a>
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="sd-stats">
        {stats.map((stat) => (
          <SummaryCard key={stat.label} {...stat} className="sd-stat" />
        ))}
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
            {displayedClasses.map((session) => (
              <TableRow key={session.id}>
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
                <TableCell>{session.room}</TableCell>
                <TableCell>{session.instructor}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`sd-status sd-status-${session.status.toLowerCase()}`}
                  >
                    {session.status === "Active" ? "Scheduled" : session.status}
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
