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
  Trophy,
  FileText,
  CalendarDays,
  ClipboardList,
  Clock3,
  ArrowRight,
  WalletCards,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import SummaryCard from "@/components/common/SummaryCard";
import {
  selectStudentDashboard,
  selectStudentProfile,
} from "@/store/selectors/studentDashboard";
import { dateKey, parseDate } from "@/lib/dates";
import { timeLabel, dayLabel } from "@/lib/schedule";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { student, courses, timetable, attendance, cgpa, results } =
    useSelector(selectStudentDashboard);
  const profile = useSelector(selectStudentProfile);
  const diary = useSelector(selectStudentDiary);
  const assignments = useSelector(selectStudentAssignments);
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
  const todaysClasses = timetable.filter((session) =>
    session.days.includes(parseDate(today).getDay()),
  );
  const stats = [
    {
      label: "Enrolled Courses",
      icon: BookOpen,
      value: student ? courses.length : "—",
      description: student
        ? "Subjects on your student record"
        : "Student record not linked",
    },
    {
      label: "Attendance Rate",
      icon: ChartNoAxesColumnIncreasing,
      value:
        attendance?.rate == null
          ? "—"
          : `${Number(attendance.rate.toFixed(1))}%`,
      description: !attendance?.marked
        ? "No attendance recorded"
        : attendance.policyPending
          ? "Attendance policy not set"
          : `${attendance.present} / ${attendance.marked} recorded lectures present`,
    },
    {
      label: "Current CGPA",
      icon: Trophy,
      value: cgpa == null ? "—" : cgpa.toFixed(2),
      description:
        cgpa != null
          ? "Recorded cumulative GPA"
          : results.length
            ? `${results.length} results recorded; CGPA unavailable`
            : "CGPA not recorded",
    },
    {
      label: "Pending Tasks",
      icon: FileText,
      value: student
        ? assignments.filter(
            (assignment) => assignment.status === "Pending Submission",
          ).length
        : "—",
      description: "Assignments awaiting submission",
    },
  ];

  return (
    <section className="student-dashboard" aria-label="Student dashboard">
      <Card
        id="student-profile-summary"
        className="sd-profile"
        tabIndex={-1}
        aria-labelledby="student-name"
      >
        <div className="sd-profile-person">
          <Avatar>
            <AvatarFallback>{profile.initials}</AvatarFallback>
          </Avatar>
          <div className="sd-profile-copy">
            <div className="sd-profile-heading">
              <h1 id="student-name">{profile.name}</h1>
              <Badge
                variant="secondary"
                className={`sd-status sd-status-${student?.status?.toLowerCase() || "unknown"}`}
              >
                {profile.roleLabel}
              </Badge>
            </div>
            {student ? (
              <p className="sd-profile-details">
                {student.roll && <strong>{student.roll}</strong>}
                {student.program && (
                  <span>
                    {student.program}
                    {student.section ? ` (${student.section})` : ""}
                  </span>
                )}
                {student.semester && <span>{student.semester}</span>}
              </p>
            ) : (
              <p className="sd-profile-details">{profile.email}</p>
            )}
          </div>
        </div>
        <div className="sd-quick-actions">
          <Button className="btn-primary" asChild>
            <Link to="/student/assignments">
              <ClipboardList aria-hidden="true" />
              My Assignments
            </Link>
          </Button>
          <Button variant="outline" className="btn-secondary" asChild>
            <Link to="/student/fees">
              <WalletCards aria-hidden="true" />
              Fee Vouchers
            </Link>
          </Button>
        </div>
      </Card>
      {!student && (
        <Alert className="sd-record-notice">
          <AlertDescription>
            No student record is linked to this account. Ask your institute to
            verify the email address on your student record.
          </AlertDescription>
        </Alert>
      )}
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
              <h2>Today's Class Timetable</h2>
              <p>
                {student?.section
                  ? `Weekly lecture schedule for Section ${student.section}`
                  : "Your class schedule"}{" "}
                <span aria-hidden="true">·</span>{" "}
                <time dateTime={today}>
                  {parseDate(today).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/student/courses">
              View All Courses
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
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
            {todaysClasses.map((session) => (
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
            {!todaysClasses.length && (
              <TableRow>
                <TableCell colSpan={5} className="sd-table-empty">
                  {student
                    ? "No classes scheduled for your section today."
                    : "Your timetable will appear when your student record is linked."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <div className="sd-bottom-grid">
        <Card className="sd-bottom-card">
          <div className="sd-section-heading">
            <div className="sd-section-title">
              <span className="sd-icon">
                <CalendarDays aria-hidden="true" />
              </span>
              <h2>Upcoming Assignments</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/student/assignments">
                View All
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {assignments.some((assignment) => assignment.dueDate >= today) ? (
            <div className="sd-assignment-list">
              {assignments
                .filter((assignment) => assignment.dueDate >= today)
                .slice(0, 3)
                .map((assignment) => (
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
        <Card className="sd-bottom-card">
          <div className="sd-section-heading">
            <div className="sd-section-title">
              <span className="sd-icon">
                <ClipboardList aria-hidden="true" />
              </span>
              <h2>Today's Class Diary</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/student/diary">
                All Notes
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {diaryEntriesForDate(diary, today).length ? (
            <div className="sd-diary-list">
              {diaryEntriesForDate(diary, today)
                .slice(0, 2)
                .map((entry) => (
                  <StudentDiaryEntry key={entry.id} entry={entry} compact />
                ))}
            </div>
          ) : (
            <div className="sd-empty">
              <span className="sd-empty-icon">
                <BookOpen aria-hidden="true" />
              </span>
              <h3>No class notes for today</h3>
              <p>Use All Notes to view your lecture history.</p>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
