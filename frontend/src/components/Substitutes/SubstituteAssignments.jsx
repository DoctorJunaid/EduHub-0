import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Calendar as CalendarIcon, User, RefreshCw, X, Check, Clock3, CheckCircle2 } from "lucide-react";
import api from "../../api/axiosInstance";
import { toast } from "react-hot-toast";
import AssignSubstituteDialog from "./AssignSubstituteDialog";
import DataPagination from "../shared/DataPagination";
import usePaginationParams from "../../hooks/usePaginationParams";
import "./SubstituteAssignments.css";

const getTeacherName = (teacher) => {
  if (!teacher) return "Teacher";
  if (typeof teacher === "string") return teacher;
  if (teacher.name) return teacher.name;
  if (teacher.user?.name) return teacher.user.name;
  if (teacher.employeeId) return `Teacher (${teacher.employeeId})`;
  return "Teacher";
};

const SubstituteAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { page, pageSize, setPage, setPageSize } = usePaginationParams({
    defaultPage: 1,
    defaultPageSize: 20,
  });

  useEffect(() => {
    fetchAssignments();
  }, [selectedDate]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/campus/substitutes?date=${selectedDate}`);
      if (res.data.success) {
        setAssignments(res.data.data);
      }
    } catch {
      toast.error("Failed to load substitutes");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this assignment?")) return;
    try {
      const res = await api.delete(`/campus/substitutes/${id}`);
      if (res.data.success) {
        toast.success("Assignment cancelled");
        fetchAssignments();
      }
    } catch {
      toast.error("Failed to cancel assignment");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/campus/substitutes/${id}`, { status });
      if (res.data.success) {
        toast.success(`Status updated to ${status}`);
        fetchAssignments();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const origTeacherName = getTeacherName(assignment.originalTeacherId);
      const subTeacherName = getTeacherName(assignment.substituteTeacherId);
      const matchesSearch = !query || [
        assignment.className,
        assignment.section,
        assignment.subject,
        assignment.reason,
        origTeacherName,
        subTeacherName,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      return matchesSearch && (!statusFilter || assignment.status === statusFilter);
    });
  }, [assignments, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, currentPage, pageSize]);

  const visibleAssignments = paginatedAssignments;

  const counts = assignments.reduce((summary, assignment) => {
    summary.total += 1;
    if (assignment.status === "Pending Approval") summary.pending += 1;
    if (["Assigned", "Completed"].includes(assignment.status)) summary.active += 1;
    if (assignment.status === "Completed") summary.completed += 1;
    return summary;
  }, { total: 0, pending: 0, active: 0, completed: 0 });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending Approval":
        return "status-pending";
      case "Assigned":
        return "status-assigned";
      case "Completed":
        return "status-completed";
      case "Cancelled":
      case "Declined":
        return "status-cancelled";
      default:
        return "status-default";
    }
  };

  if (isDialogOpen) {
    return <AssignSubstituteDialog
      isOpen={isDialogOpen}
      onClose={() => setIsDialogOpen(false)}
      onSuccess={() => {
        setIsDialogOpen(false);
        fetchAssignments();
      }}
      selectedDate={selectedDate}
    />;
  }

  return (
    <div className="substitutes-container campus-tab-page">
      <div className="campus-kpi-track substitutes-kpis">
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><CalendarIcon size={16} /></div><div className="kpi-info"><span className="kpi-label">Today's Assignments</span><span className="kpi-value">{counts.total}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><Clock3 size={16} /></div><div className="kpi-info"><span className="kpi-label">Pending Approval</span><span className="kpi-value">{counts.pending}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><User size={16} /></div><div className="kpi-info"><span className="kpi-label">Active Coverage</span><span className="kpi-value">{counts.active}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><CheckCircle2 size={16} /></div><div className="kpi-info"><span className="kpi-label">Completed</span><span className="kpi-value">{counts.completed}</span></div></div></div>
      </div>

      <div className="substitutes-action-row">
        <button type="button" className="toolbar-btn toolbar-btn-primary" onClick={() => setIsDialogOpen(true)}>
          <Plus size={14} /> Assign Substitute
        </button>
      </div>

      <div className="campus-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-search">
            <Search size={13} />
            <input type="search" placeholder="Search assignments..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <select className="toolbar-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option value="">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Assigned">Assigned</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <label className="substitutes-date-filter"><CalendarIcon size={13} /><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} aria-label="Assignment date" /></label>
          {(search || statusFilter) && <button type="button" className="toolbar-btn toolbar-btn-outline" onClick={() => { setSearch(""); setStatusFilter(""); }}>Reset</button>}
        </div>
        <div className="toolbar-actions"><span className="substitutes-result-count">{visibleAssignments.length} shown</span></div>
      </div>

      <div className="campus-table-container substitutes-table-wrap">
        <div className="overflow-x-auto flex-1">
          <table className="substitutes-table">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-700/50">
                <th>Period &amp; time</th>
                <th>Class coverage</th>
                <th>Original teacher</th>
                <th>Substitute teacher</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading assignments...
                  </td>
                </tr>
              ) : visibleAssignments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="substitutes-empty">
                    <CalendarIcon size={24} /><strong>No assignments found</strong><span>Try another date or clear the filters.</span>
                  </td>
                </tr>
              ) : (
                visibleAssignments.map((assignment) => {
                  const origName = getTeacherName(assignment.originalTeacherId);
                  const subName = getTeacherName(assignment.substituteTeacherId);
                  const origAvatar = (origName || "U").slice(0, 1).toUpperCase();
                  const subAvatar = (subName || "U").slice(0, 1).toUpperCase();

                  return (
                    <tr key={assignment._id}>
                      <td>
                        <strong>Period {assignment.period}</strong>
                        <small>{assignment.startTime} - {assignment.endTime}</small>
                      </td>
                      <td>
                        <strong>{assignment.className} {assignment.section && <span className="muted">/ {assignment.section}</span>}</strong>
                        <small className="subject-label">{assignment.subject}</small>
                      </td>
                      <td>
                        <div className="substitute-person">
                          <span className="person-avatar">{origAvatar}</span>
                          <span>
                            <strong>{origName}</strong>
                            <small>{assignment.reason}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="substitute-person">
                          <span className="person-avatar person-avatar-accent">{subAvatar}</span>
                          <span>
                            <strong>{subName}</strong>
                            {assignment.bonusEligible && <small className="bonus-label">Bonus: PKR {assignment.bonusAmount}</small>}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`substitute-status ${getStatusBadgeClass(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td>
                        <div className="substitute-actions">
                          {assignment.status === 'Pending Approval' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(assignment._id, 'Assigned')}
                              className="action-icon-btn action-approve"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {assignment.status === 'Assigned' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(assignment._id, 'Completed')}
                              className="action-icon-btn action-complete"
                              title="Mark Completed"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {['Assigned', 'Pending Approval'].includes(assignment.status) && (
                            <button
                              type="button"
                              onClick={() => handleCancel(assignment._id)}
                              className="action-icon-btn action-cancel"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <DataPagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredAssignments.length}
          pageCount={pageCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="substitute assignments"
        />
      </div>
    </div>
  );
};

export default SubstituteAssignments;
