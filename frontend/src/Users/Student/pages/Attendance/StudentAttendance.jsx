import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Users,
  BookOpen,
  CalendarDays,
  Clock3,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import Progress from "@/components/common/Progress";
import AttendanceStatusBadge from "@/components/common/AttendanceStatusBadge";
import { selectStudentAttendancePage } from "@/store/selectors/studentAttendance";
import { PageLoader } from "@/components/ui/spinner";
import useStudentPortal from "@/hooks/useStudentPortal";
import "./StudentAttendance.css";

const percentage = (rate) => `${Number(rate.toFixed(1))}%`;
const ITEMS_PER_PAGE = 8;
const LOGS_PER_PAGE = 10;

function AttendancePagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  itemLabel = "records",
  onPageChange,
  ariaLabel,
}) {
  if (totalItems <= 0) return null;
  const itemWord = totalItems === 1 ? itemLabel.replace(/s$/, "") : itemLabel;

  return (
    <footer className="sta-pagination" aria-label={ariaLabel}>
      <span className="sta-pagination-info">
        Showing <strong>{startIndex + 1} - {endIndex}</strong> of{" "}
        <strong>{totalItems}</strong> total {itemWord}
      </span>
      <div className="sta-pagination-controls">
        <button
          type="button"
          className="sta-pagination-btn"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          <span>Previous</span>
        </button>
        <span className="sta-pagination-pages">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          className="sta-pagination-btn"
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
  const { isLoading } = useStudentPortal();
  const { student, attendance, courses = [], rows = [], absent = 0, late = 0, leave = 0 } =
    useSelector(selectStudentAttendancePage) || {};

  // All state hooks declared unconditionally at top level
  const [coursePage, setCoursePage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "Present", "Absent", "Late", "On Leave"

  // Filtered attendance rows based on search and status filter
  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((item) => {
      const status = item.record?.status || "";
      const matchesStatus =
        statusFilter === "all" ||
        status.toLowerCase() === statusFilter.toLowerCase();

      if (!matchesStatus) return false;

      const subject = item.session?.subject || "";
      const date = item.date || "";
      const remarks = item.record?.remarks || "";

      return (
        !q ||
        subject.toLowerCase().includes(q) ||
        date.toLowerCase().includes(q) ||
        remarks.toLowerCase().includes(q)
      );
    });
  }, [rows, searchQuery, statusFilter]);

  // Pagination for courses
  const totalCourseItems = courses.length;
  const totalCoursePages = Math.max(1, Math.ceil(totalCourseItems / ITEMS_PER_PAGE));
  const safeCoursePage = Math.min(Math.max(1, coursePage), totalCoursePages);
  const courseStartIndex = (safeCoursePage - 1) * ITEMS_PER_PAGE;
  const courseEndIndex = Math.min(courseStartIndex + ITEMS_PER_PAGE, totalCourseItems);
  const visibleCourses = courses.slice(courseStartIndex, courseEndIndex);

  // Pagination for logs
  const totalLogItems = filteredRows.length;
  const totalLogPages = Math.max(1, Math.ceil(totalLogItems / LOGS_PER_PAGE));
  const safeLogPage = Math.min(Math.max(1, logPage), totalLogPages);
  const logStartIndex = (safeLogPage - 1) * LOGS_PER_PAGE;
  const logEndIndex = Math.min(logStartIndex + LOGS_PER_PAGE, totalLogItems);
  const visibleRows = filteredRows.slice(logStartIndex, logEndIndex);

  // Status counts for filter pills
  const statusCounts = useMemo(() => {
    return {
      all: rows.length,
      present: rows.filter((r) => r.record?.status === "Present").length,
      absent: rows.filter((r) => r.record?.status === "Absent").length,
      late: rows.filter((r) => r.record?.status === "Late").length,
      leave: rows.filter((r) => r.record?.status === "On Leave").length,
    };
  }, [rows]);

  if (isLoading && !student) {
    return <PageLoader text="Loading your attendance record..." />;
  }

  const overallRate = attendance?.rate == null ? 100 : Number(attendance.rate);
  const isAtRisk = overallRate < 75;

  return (
    <section className="student-attendance-page">
      {/* 1. Neutral Standardized KPI Metric Cards */}
      <div className="sta-stats">
        <Card className="sta-stat">
          <div className="sta-stat-icon-wrap">
            <Users className="w-4 h-4" />
          </div>
          <div className="sta-stat-info">
            <span className="sta-stat-label">Attendance Rate</span>
            <span className={`sta-stat-num ${isAtRisk ? "text-amber-600 dark:text-amber-400" : ""}`}>
              {percentage(overallRate)}
            </span>
            <span className="sta-stat-sub">
              {isAtRisk ? "Warning: Below 75%" : "Minimum 75% standard"}
            </span>
          </div>
        </Card>

        <Card className="sta-stat">
          <div className="sta-stat-icon-wrap text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="sta-stat-info">
            <span className="sta-stat-label">Days Present</span>
            <span className="sta-stat-num">
              {student ? attendance?.present ?? 0 : "—"}
            </span>
            <span className="sta-stat-sub">Recorded Present</span>
          </div>
        </Card>

        <Card className="sta-stat">
          <div className="sta-stat-icon-wrap text-rose-600 dark:text-rose-400">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div className="sta-stat-info">
            <span className="sta-stat-label">Absences</span>
            <span className="sta-stat-num">
              {student ? absent : "—"}
            </span>
            <span className="sta-stat-sub">Recorded Absent</span>
          </div>
        </Card>

        <Card className="sta-stat">
          <div className="sta-stat-icon-wrap text-amber-600 dark:text-amber-400">
            <Clock3 className="w-4 h-4" />
          </div>
          <div className="sta-stat-info">
            <span className="sta-stat-label">Leaves &amp; Late</span>
            <span className="sta-stat-num">
              {student ? `${leave} L / ${late} D` : "—"}
            </span>
            <span className="sta-stat-sub">
              {student ? `${leave} on leave · ${late} late` : "No records"}
            </span>
          </div>
        </Card>
      </div>

      {/* Notice Banner if Policy Pending or Risk */}
      {isAtRisk && (
        <div className="sta-alert-warning">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p>
            <strong>Attendance Advisory:</strong> Your current attendance is {percentage(overallRate)}, which is below the required 75% board examination threshold. Please consult your academic advisor.
          </p>
        </div>
      )}

      {/* 2. Subject-wise Progress Card */}
      <Card className="sta-card">
        <div className="sta-card-heading">
          <h2>
            <span>
              <ChartNoAxesColumnIncreasing aria-hidden="true" />
            </span>
            Subject Attendance Progress
          </h2>
          <span className="sta-count-tag">{courses.length} subjects monitored</span>
        </div>

        <div className="sta-courses">
          {visibleCourses.map((course) => {
            const marked = course.attendance?.marked || 0;
            const present = course.attendance?.present || 0;
            const rate = course.attendance?.rate == null ? 0 : course.attendance.rate;
            const hasRate = course.attendance?.rate != null;

            return (
              <div className="sta-course" key={course.id || course.title}>
                <div className="sta-course-heading">
                  <div className="sta-course-title-wrap">
                    <h3>{course.title || course.name}</h3>
                    {hasRate && (
                      <span className={`sta-rate-badge ${rate >= 75 ? "rate-good" : rate >= 65 ? "rate-warn" : "rate-danger"}`}>
                        {percentage(rate)}
                      </span>
                    )}
                  </div>
                  <span className="sta-course-days">
                    {marked > 0 ? (
                      <>
                        <strong>{present}</strong> / {marked} days attended
                      </>
                    ) : (
                      "No sessions recorded yet"
                    )}
                  </span>
                </div>

                {hasRate ? (
                  <div className="sta-progress-wrapper">
                    <Progress
                      value={rate}
                      className={rate >= 75 ? "progress-good" : rate >= 65 ? "progress-warn" : "progress-danger"}
                      label={`${course.title} attendance: ${percentage(rate)}`}
                    />
                  </div>
                ) : (
                  <p className="sta-course-empty">
                    Attendance data will appear as soon as daily lectures commence.
                  </p>
                )}
              </div>
            );
          })}

          {!courses.length && (
            <div className="sta-empty">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h3>No courses enrolled yet.</h3>
              <p>Your subject attendance will populate here once enrolled in your semester or class.</p>
            </div>
          )}
        </div>

        {totalCourseItems > ITEMS_PER_PAGE && (
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

      {/* 3. Daily Attendance History Log Card */}
      <Card className="sta-card">
        <div className="sta-card-heading">
          <h2>
            <span>
              <CalendarDays aria-hidden="true" />
            </span>
            Daily Attendance Log
          </h2>
          <span className="sta-count-tag">{filteredRows.length} logs found</span>
        </div>

        {/* Filter Controls Row */}
        <div className="sta-filter-row">
          {/* Status Pills */}
          <div className="sta-tab-pills" role="tablist" aria-label="Filter logs by status">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "all"}
              className={`sta-tab-btn ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => {
                setStatusFilter("all");
                setLogPage(1);
              }}
            >
              All ({statusCounts.all})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "Present"}
              className={`sta-tab-btn ${statusFilter === "Present" ? "active" : ""}`}
              onClick={() => {
                setStatusFilter("Present");
                setLogPage(1);
              }}
            >
              Present ({statusCounts.present})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "Absent"}
              className={`sta-tab-btn ${statusFilter === "Absent" ? "active" : ""}`}
              onClick={() => {
                setStatusFilter("Absent");
                setLogPage(1);
              }}
            >
              Absent ({statusCounts.absent})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "Late"}
              className={`sta-tab-btn ${statusFilter === "Late" ? "active" : ""}`}
              onClick={() => {
                setStatusFilter("Late");
                setLogPage(1);
              }}
            >
              Late ({statusCounts.late})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "On Leave"}
              className={`sta-tab-btn ${statusFilter === "On Leave" ? "active" : ""}`}
              onClick={() => {
                setStatusFilter("On Leave");
                setLogPage(1);
              }}
            >
              Leave ({statusCounts.leave})
            </button>
          </div>

          {/* Search Box */}
          <div className="sta-search-wrap">
            <Search className="sta-search-icon" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search by subject, date, or remarks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setLogPage(1);
              }}
              className="sta-search-input"
              aria-label="Search attendance log"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setLogPage(1);
                }}
                className="sta-search-clear"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop & Tablet Table (>= 768px) */}
        <div className="sta-table-container">
          <Table aria-label="Daily attendance history">
            <TableHeader>
              <TableRow>
                {["Date", "Course / Subject", "Status", "Remarks"].map((heading) => (
                  <TableHead key={heading} scope="col">
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map(({ record, session, date }) => (
                <TableRow key={record.id || `${date}-${session?.subject}`} className="sta-table-row">
                  <TableCell>
                    <span className="sta-date-cell">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                      <time dateTime={date}>{date}</time>
                    </span>
                  </TableCell>
                  <TableCell>
                    <strong className="sta-subject-text">{session?.subject || "General"}</strong>
                  </TableCell>
                  <TableCell>
                    <AttendanceStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell>
                    <span className="sta-remarks-text">
                      {typeof record.remarks === "string" && record.remarks.trim()
                        ? record.remarks
                        : "No remarks"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {!filteredRows.length && (
                <TableRow>
                  <TableCell colSpan={4} className="sta-empty">
                    <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <h3>No attendance records match your filter.</h3>
                    <p>Try clearing your search query or selecting "All" statuses.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards View (< 768px) */}
        <div className="sta-mobile-cards">
          {visibleRows.map(({ record, session, date }) => (
            <div key={record.id || `${date}-${session?.subject}`} className="sta-mobile-card">
              <div className="sta-mobile-card-top">
                <span className="sta-mobile-date">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                  <time dateTime={date}>{date}</time>
                </span>
                <AttendanceStatusBadge status={record.status} />
              </div>

              <div className="sta-mobile-subject">
                <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                <strong>{session?.subject || "General"}</strong>
              </div>

              {typeof record.remarks === "string" && record.remarks.trim() && (
                <div className="sta-mobile-remarks">
                  <span>Note: {record.remarks}</span>
                </div>
              )}
            </div>
          ))}

          {!filteredRows.length && (
            <div className="sta-empty sta-mobile-empty">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h3>No attendance records match.</h3>
              <p>Try clearing your search or status filter.</p>
            </div>
          )}
        </div>

        {totalLogItems > LOGS_PER_PAGE && (
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
