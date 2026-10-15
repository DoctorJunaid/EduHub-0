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
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { isSchool } = useInstitution();
  const { isLoading, classTeacher, subjects } = useStudentPortal();
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

  return (
    <section className="student-dashboard" aria-label="Student dashboard">
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
                  ? `${isSchool ? "Daily period routine" : "Weekly lecture schedule"} for Section ${student.section}`
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
      <Card className="sd-faculty-card p-5 mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="sd-section-heading mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="sd-section-title flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Users size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Class Faculty &amp; Teacher Incharges</h2>
              <p className="text-xs text-slate-500">Know your appointed Class Teacher and Subject Teachers so you know who to contact for what.</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {student?.gradeOrClass || "My Class"} - Section {student?.section || "A"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Appointed Class Teacher Incharge Card */}
          <div className="md:col-span-1 p-4 rounded-xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-sm">
                  👑 Class Teacher
                </span>
                <span className="text-[11px] font-semibold text-indigo-700">Overall Incharge</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {classTeacher?.name || "Assigned Class Incharge"}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                {classTeacher?.designation || "Senior Faculty"}
              </p>
              {classTeacher?.email && (
                <p className="text-xs text-slate-500 mt-2 font-mono break-all">
                  ✉️ {classTeacher.email}
                </p>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-indigo-100/80 text-[11px] text-slate-600 leading-relaxed bg-white/60 p-2.5 rounded-lg">
              <strong>Contact For:</strong> Overall Class Attendance, Result Making &amp; Report Cards, Leave Approvals &amp; General Inquiries.
            </div>
          </div>

          {/* 2. Subject Teachers Grid */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Subject Teachers
              </span>
              <span className="text-[11px] text-slate-500">
                Contact for subject coursework, marks &amp; homework
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {(subjects || []).length > 0 ? (
                subjects.map((sub, idx) => {
                  const teacherName = sub.instructor?.name || "Assigned Subject Faculty";
                  const teacherEmail = sub.instructor?.email || "";
                  return (
                    <div
                      key={sub.id || idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <strong className="text-xs font-bold text-slate-900 block truncate">
                            {sub.name}
                          </strong>
                          <span className="text-[11px] text-slate-600 block mt-0.5">
                            👨‍🏫 {teacherName}
                          </span>
                        </div>
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                          Subject Teacher
                        </span>
                      </div>
                      {teacherEmail && (
                        <span className="text-[10px] text-slate-400 font-mono mt-1.5 truncate">
                          {teacherEmail}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
                  Subject teachers will appear here once allocated by your Campus Manager.
                </div>
              )}
            </div>
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
