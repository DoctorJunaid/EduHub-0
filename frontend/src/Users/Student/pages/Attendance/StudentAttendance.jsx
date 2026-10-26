import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  BookOpen,
  CalendarDays,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  FileText,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Check,
  Loader2,
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
import AttendanceStatusBadge from "@/components/common/AttendanceStatusBadge";
import { selectStudentAttendancePage } from "@/store/selectors/studentAttendance";
import { PageLoader } from "@/components/ui/spinner";
import useStudentPortal from "@/hooks/useStudentPortal";
import { applyStudentLeaveApi } from "@/api/studentLeave.api";
import toast from "react-hot-toast";
import "./StudentAttendance.css";

const percentage = (rate) => `${Number(rate.toFixed(1))}%`;
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
  const queryClient = useQueryClient();
  const { isLoading, leaveRequests = [], refetch } = useStudentPortal();
  const { student, attendance, rows = [], absent = 0, late = 0, leave = 0 } =
    useSelector(selectStudentAttendancePage) || {};

  // All state hooks declared unconditionally at top level
  const [logPage, setLogPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "Present", "Absent", "Late", "On Leave"

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedAbsentDate, setSelectedAbsentDate] = useState("");
  const [leaveCategory, setLeaveCategory] = useState("Medical");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveNote, setLeaveNote] = useState("");

  // Close modal on Escape key
  useEffect(() => {
    if (!isLeaveModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsLeaveModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLeaveModalOpen]);

  // Map of student's submitted leave requests by dateStr
  const leaveMap = useMemo(() => {
    const map = new Map();
    (leaveRequests || []).forEach((lr) => {
      const d = lr.dateStr || (lr.date ? String(lr.date).slice(0, 10) : "");
      if (d) map.set(d, lr);
    });
    return map;
  }, [leaveRequests]);

  // Leave Application Mutation
  const applyLeaveMutation = useMutation({
    mutationFn: (payload) => applyStudentLeaveApi(payload),
    onSuccess: (res) => {
      toast.success(
        res.message || "Leave application submitted! Status updated to Pending."
      );
      setIsLeaveModalOpen(false);
      resetLeaveForm();
      if (typeof refetch === "function") refetch();
      queryClient.invalidateQueries({ queryKey: ["student"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["campus-admin"] });
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || err.message || "Failed to submit leave application."
      );
    },
  });

  const resetLeaveForm = () => {
    setSelectedAbsentDate("");
    setLeaveCategory("Medical");
    setLeaveReason("");
    setLeaveNote("");
  };

  const handleOpenLeaveModal = (date) => {
    setSelectedAbsentDate(date);
    setLeaveCategory("Medical");
    setLeaveReason("");
    setLeaveNote("");
    setIsLeaveModalOpen(true);
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      toast.error("Please provide a reason for absence.");
      return;
    }
    applyLeaveMutation.mutate({
      date: selectedAbsentDate,
      category: leaveCategory,
      reason: leaveReason.trim(),
      note: leaveNote.trim(),
    });
  };

  // Filtered attendance rows based on search and status filter
  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((item) => {
      const status = item.record?.status || "";
      const matchesStatus =
        statusFilter === "all" ||
        status.toLowerCase() === statusFilter.toLowerCase();

      if (!matchesStatus) return false;

      const date = item.date || "";
      const remarks = item.record?.remarks || "";

      return (
        !q ||
        date.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q) ||
        remarks.toLowerCase().includes(q)
      );
    });
  }, [rows, searchQuery, statusFilter]);

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
      leave: rows.filter((r) => r.record?.status === "On Leave" || r.record?.status === "Excused").length,
    };
  }, [rows]);

  if (isLoading && !student) {
    return <PageLoader text="Loading your attendance record..." />;
  }

  const overallRate = attendance?.rate == null ? 100 : Number(attendance.rate);
  const isAtRisk = overallRate < 75;

  // Render Action column content
  const renderAction = (record, date) => {
    const statusLower = String(record?.status || "").toLowerCase();
    const isAbsent = statusLower === "absent";
    const isExcused = statusLower === "excused" || statusLower === "on leave";
    const leaveReq = leaveMap.get(date);

    if (isAbsent) {
      if (leaveReq?.status === "Pending") {
        return (
          <span className="sta-leave-pending-badge" title="Waiting for teacher approval">
            <Clock3 className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Pending Review</span>
          </span>
        );
      }
      if (leaveReq?.status === "Rejected") {
        return (
          <div className="sta-leave-action-group">
            <span
              className="sta-leave-rejected-badge"
              title={leaveReq.rejectionReason || "Leave request was rejected"}
            >
              <X className="w-3 h-3 text-rose-500 shrink-0" />
              <span>Rejected</span>
            </span>
            <button
              type="button"
              className="sta-apply-leave-btn reapply"
              onClick={() => handleOpenLeaveModal(date)}
              title="Submit a revised leave application"
            >
              Re-apply
            </button>
          </div>
        );
      }
      // Absent with no leave application submitted yet
      return (
        <button
          type="button"
          className="sta-apply-leave-btn"
          onClick={() => handleOpenLeaveModal(date)}
          aria-label={`Apply leave for ${date}`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Apply Leave</span>
        </button>
      );
    }

    if (isExcused) {
      return (
        <span className="sta-leave-approved-badge" title="Leave approved by teacher">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Leave Approved</span>
        </span>
      );
    }

    return <span className="text-muted-foreground/40 text-xs">—</span>;
  };

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

      {/* Daily Attendance History Log Card */}
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
              placeholder="Search by date, status, or remarks..."
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
                <TableHead scope="col">DATE</TableHead>
                <TableHead scope="col">STATUS</TableHead>
                <TableHead scope="col">REMARKS</TableHead>
                <TableHead scope="col" className="sta-action-col">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map(({ record, date }) => (
                <TableRow key={record.id || `${date}-${record?.status}`} className="sta-table-row">
                  <TableCell>
                    <span className="sta-date-cell">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                      <time dateTime={date}>{date}</time>
                    </span>
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
                  <TableCell className="sta-action-col">
                    {renderAction(record, date)}
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
          {visibleRows.map(({ record, date }) => (
            <div key={record.id || `${date}-${record?.status}`} className="sta-mobile-card">
              <div className="sta-mobile-card-top">
                <span className="sta-mobile-date">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                  <time dateTime={date}>{date}</time>
                </span>
                <AttendanceStatusBadge status={record.status} />
              </div>

              {typeof record.remarks === "string" && record.remarks.trim() && (
                <div className="sta-mobile-remarks">
                  <span>Remarks: {record.remarks}</span>
                </div>
              )}

              <div className="sta-mobile-action-wrap">
                {renderAction(record, date)}
              </div>
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

      {/* Leave Application Modal Popup */}
      {isLeaveModalOpen && (
        <div
          className="sta-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLeaveModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-modal-title"
        >
          <div className="sta-modal-dialog">
            {/* Header */}
            <div className="sta-modal-header">
              <div className="sta-modal-header-left">
                <div className="sta-modal-icon-badge" aria-hidden="true">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div className="sta-modal-title-text">
                  <h3 id="leave-modal-title">Apply Leave for Absence</h3>
                  <p>
                    Submit reason for absence on{" "}
                    <span className="sta-modal-date-pill">{selectedAbsentDate}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="sta-modal-close-btn"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleLeaveSubmit} className="sta-modal-form">
              <div className="sta-modal-group">
                <label className="sta-modal-label">Absence Date</label>
                <input
                  type="text"
                  value={selectedAbsentDate}
                  disabled
                  className="sta-modal-input"
                />
              </div>

              <div className="sta-modal-group">
                <label className="sta-modal-label">
                  Leave Category <span className="sta-modal-req">*</span>
                </label>
                <select
                  value={leaveCategory}
                  onChange={(e) => setLeaveCategory(e.target.value)}
                  className="sta-modal-select"
                >
                  <option value="Medical">Medical / Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Family Emergency">Family Emergency</option>
                  <option value="Personal">Personal Work</option>
                  <option value="Event">Family Event</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sta-modal-group">
                <label className="sta-modal-label">
                  Reason for Absence <span className="sta-modal-req">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="State your reason clearly (e.g., severe fever and doctor consultation)..."
                  className="sta-modal-textarea"
                />
              </div>

              <div className="sta-modal-group">
                <label className="sta-modal-label">Optional Note / File</label>
                <input
                  type="text"
                  value={leaveNote}
                  onChange={(e) => setLeaveNote(e.target.value)}
                  placeholder="e.g. Doctor prescription attached / slip signed by parent"
                  className="sta-modal-input"
                />
              </div>

              {/* Footer Buttons */}
              <div className="sta-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  disabled={applyLeaveMutation.isPending}
                  className="sta-modal-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyLeaveMutation.isPending || !leaveReason.trim()}
                  className="sta-modal-submit-btn"
                >
                  {applyLeaveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Submit Leave Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
