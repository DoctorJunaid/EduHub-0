import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Users,
  BookOpen,
  CalendarDays,
  Clock3,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
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
const ITEMS_PER_PAGE = 10;

function AttendancePagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  itemLabel = "subjects",
  onPageChange,
  ariaLabel,
}) {
  const itemWord = totalItems === 1 ? itemLabel.replace(/s$/, "") : itemLabel;

  return (
    <footer
      className="sta-pagination flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-800 pt-3 px-4 pb-2 mt-3 -mx-4 -mb-4 sm:-mx-3 sm:-mb-2.5"
      aria-label={ariaLabel}
    >
      <span className="sta-pagination-info text-xs text-neutral-500 dark:text-neutral-400">
        Showing <strong>{startIndex + 1} - {endIndex}</strong> of{" "}
        <strong>{totalItems}</strong> total {itemWord}
      </span>
      <div className="sta-pagination-controls flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
        <button
          type="button"
          className="sta-pagination-btn h-8 px-3 text-xs font-medium border border-neutral-200 dark:border-neutral-800 rounded-md inline-flex items-center gap-1.5 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          <span>Previous</span>
        </button>
        <span className="sta-pagination-pages text-xs font-medium text-neutral-700 dark:text-neutral-200 px-2 select-none">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          className="sta-pagination-btn h-8 px-3 text-xs font-medium border border-neutral-200 dark:border-neutral-800 rounded-md inline-flex items-center gap-1.5 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}

export default function StudentAttendance() {
  const { student, attendance, courses, rows, absent, late, leave } =
    useSelector(selectStudentAttendancePage);

  const [coursePage, setCoursePage] = useState(1);
  const [logPage, setLogPage] = useState(1);

  const totalCourseItems = (courses || []).length;
  const totalCoursePages = Math.max(1, Math.ceil(totalCourseItems / ITEMS_PER_PAGE));
  const safeCoursePage = Math.min(Math.max(1, coursePage), totalCoursePages);
  const courseStartIndex = (safeCoursePage - 1) * ITEMS_PER_PAGE;
  const courseEndIndex = Math.min(courseStartIndex + ITEMS_PER_PAGE, totalCourseItems);
  const visibleCourses = (courses || []).slice(courseStartIndex, courseEndIndex);

  const [prevTotalCourses, setPrevTotalCourses] = useState(totalCourseItems);
  if (totalCourseItems !== prevTotalCourses) {
    setPrevTotalCourses(totalCourseItems);
    setCoursePage(1);
  }

  const totalLogItems = (rows || []).length;
  const totalLogPages = Math.max(1, Math.ceil(totalLogItems / ITEMS_PER_PAGE));
  const safeLogPage = Math.min(Math.max(1, logPage), totalLogPages);
  const logStartIndex = (safeLogPage - 1) * ITEMS_PER_PAGE;
  const logEndIndex = Math.min(logStartIndex + ITEMS_PER_PAGE, totalLogItems);
  const visibleRows = (rows || []).slice(logStartIndex, logEndIndex);

  const [prevTotalLogs, setPrevTotalLogs] = useState(totalLogItems);
  if (totalLogItems !== prevTotalLogs) {
    setPrevTotalLogs(totalLogItems);
    setLogPage(1);
  }

  const stats = [
    {
      label: "Attendance Rate",
      icon: Users,
      value: attendance?.rate == null ? "—" : percentage(attendance.rate),
      description: attendance?.risk
        ? "Attendance risk: below 75%"
        : "School attendance record",
    },
    {
      label: "Days Present",
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
      label: "Leaves",
      icon: Clock3,
      value: student ? leave : "—",
      description: student
        ? `${leave} approved leave days${late ? ` · ${late} late arrivals` : ""}`
        : "Student record not linked",
    },
  ];

  return (
    <section className="student-attendance-page">
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
            Daily Attendance Progress
          </h2>
        </div>
        <div className="sta-courses">
          {visibleCourses.map((course) => (
            <div className="sta-course" key={course.title}>
              <div className="sta-course-heading">
                <h3>{course.title}</h3>
                <span>
                  {course.attendance.marked
                    ? `${course.attendance.present}/${course.attendance.marked} recorded days${course.attendance.rate == null ? " · Percentage unavailable" : ` (${percentage(course.attendance.rate)})`}`
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
        {totalCourseItems > 0 && (
          <AttendancePagination
            currentPage={safeCoursePage}
            totalPages={totalCoursePages}
            startIndex={courseStartIndex}
            endIndex={courseEndIndex}
            totalItems={totalCourseItems}
            itemLabel="subjects"
            onPageChange={setCoursePage}
            ariaLabel="Daily attendance progress pagination"
          />
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
          <p>Recent daily attendance history</p>
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
            {visibleRows.map(({ record, session, date }) => (
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
        {totalLogItems > 0 && (
          <AttendancePagination
            currentPage={safeLogPage}
            totalPages={totalLogPages}
            startIndex={logStartIndex}
            endIndex={logEndIndex}
            totalItems={totalLogItems}
            itemLabel="records"
            onPageChange={setLogPage}
            ariaLabel="Daily attendance log pagination"
          />
        )}
      </Card>
    </section>
  );
}
