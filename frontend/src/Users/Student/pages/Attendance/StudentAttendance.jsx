import { useSelector } from "react-redux";
import {
  Users,
  BookOpen,
  CalendarDays,
  Clock3,
  ChartNoAxesColumnIncreasing,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import SummaryCard from "@/components/common/SummaryCard";
import Progress from "@/components/common/Progress";
import AttendanceStatusBadge from "@/components/common/AttendanceStatusBadge";
import { selectStudentAttendancePage } from "@/store/selectors/studentAttendance";
import "./StudentAttendance.css";

const percentage = (rate) => `${Number(rate.toFixed(1))}%`;

export default function StudentAttendance() {
  const { student, attendance, courses, rows, absent, late, leave } =
    useSelector(selectStudentAttendancePage);
  const stats = [
    {
      label: "Overall Attendance",
      icon: Users,
      value: attendance?.rate == null ? "—" : percentage(attendance.rate),
      description: "Reference threshold: 75% (demo)",
    },
    {
      label: "Lectures Attended",
      icon: BookOpen,
      value: student ? attendance.present : "—",
      description: "Recorded Present",
    },
    {
      label: "Absences",
      icon: CalendarDays,
      value: student ? absent : "—",
      description: "Recorded Absent",
    },
    {
      label: "Late / Leave",
      icon: Clock3,
      value: student ? late + leave : "—",
      description: student
        ? `${late} Late · ${leave} On Leave`
        : "Student record not linked",
    },
  ];
  return (
    <section className="student-attendance-page">
      <header className="sta-page-heading">
        <h1>Attendance Record &amp; History</h1>
        <p>
          Daily attendance logs, course-wise eligibility threshold, and overall
          attendance percentage.
        </p>
      </header>
      <div className="sta-stats">
        {stats.map((stat) => (
          <SummaryCard key={stat.label} {...stat} className="sta-stat" />
        ))}
      </div>
      {(!student || attendance?.policyPending) && (
        <p className="sta-notice">
          {!student
            ? "No student record is linked to this account. Your attendance will appear when your record is linked."
            : "Attendance percentage is unavailable until the attendance policy for Late and On Leave is set. Recorded counts remain visible."}
        </p>
      )}
      <Card className="sta-card">
        <div className="sta-card-heading">
          <h2>
            <span>
              <ChartNoAxesColumnIncreasing aria-hidden="true" />
            </span>
            Course-Wise Attendance Percentage
          </h2>
        </div>
        <div className="sta-courses">
          {courses.map((course) => (
            <div className="sta-course" key={course.title}>
              <div className="sta-course-heading">
                <h3>{course.title}</h3>
                <span>
                  {course.attendance.marked
                    ? `${course.attendance.present}/${course.attendance.marked} lectures${course.attendance.rate == null ? " · Percentage unavailable" : ` (${percentage(course.attendance.rate)})`}`
                    : "No attendance recorded"}
                </span>
              </div>
              {course.attendance.rate == null ? (
                <p className="sta-course-empty">
                  {course.attendance.policyPending
                    ? "Attendance policy not set."
                    : "No attendance data available for this enrolled course."}
                </p>
              ) : (
                <Progress
                  value={course.attendance.rate}
                  label={`${course.title} attendance: ${percentage(course.attendance.rate)}`}
                />
              )}
            </div>
          ))}
        </div>
        {!courses.length && (
          <p className="sta-empty">
            No attendance data available for enrolled courses.
          </p>
        )}
      </Card>
      <Card className="sta-card">
        <div className="sta-card-heading">
          <h2>
            <span>
              <CalendarDays aria-hidden="true" />
            </span>
            Daily Attendance Log
          </h2>
          <p>Recent lecture check-in history</p>
        </div>
        <Table aria-label="Daily attendance history">
          <TableHeader>
            <TableRow>
              {["Date", "Course / Subject", "Status", "Remarks"].map(
                (heading) => (
                  <TableHead key={heading} scope="col">
                    {heading}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ record, session, date }) => (
              <TableRow key={record.id}>
                <TableCell>
                  <time dateTime={date}>{date}</time>
                </TableCell>
                <TableCell>{session.subject}</TableCell>
                <TableCell>
                  <AttendanceStatusBadge status={record.status} />
                </TableCell>
                <TableCell>
                  {typeof record.remarks === "string" && record.remarks.trim()
                    ? record.remarks
                    : "No remarks"}
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={4} className="sta-empty">
                  No attendance records available yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
