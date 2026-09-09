import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
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
      value: "—",
      description: "Assignments not available yet",
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
          <Button
            disabled
            title="The Student Assignments page is not available yet"
          >
            <ClipboardList aria-hidden="true" />
            My Assignments
          </Button>
          <Button
            variant="outline"
            disabled
            title="The Student Fee Vouchers page is not available yet"
          >
            <WalletCards aria-hidden="true" />
            Fee Vouchers
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
          <Button
            variant="outline"
            disabled
            title="The Student My Courses page is not available yet"
          >
            View All Courses
            <ArrowRight aria-hidden="true" />
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
            <Button
              variant="ghost"
              disabled
              title="The Student Assignments page is not available yet"
            >
              View All
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
          <div className="sd-empty">
            <span className="sd-empty-icon">
              <FileText aria-hidden="true" />
            </span>
            <h3>No assignments available</h3>
            <p>Published assignments and their due dates will appear here.</p>
          </div>
        </Card>
        <Card className="sd-bottom-card">
          <div className="sd-section-heading">
            <div className="sd-section-title">
              <span className="sd-icon">
                <ClipboardList aria-hidden="true" />
              </span>
              <h2>Today's Class Diary</h2>
            </div>
            <Button
              variant="ghost"
              disabled
              title="The Student Daily Diary page is not available yet"
            >
              All Notes
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
          <div className="sd-empty">
            <span className="sd-empty-icon">
              <BookOpen aria-hidden="true" />
            </span>
            <h3>No class notes available</h3>
            <p>
              Class topics, notes, and homework will appear here when available.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
