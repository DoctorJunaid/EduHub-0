import React, { useState, useEffect } from "react";
import { Plus, Search, Calendar as CalendarIcon, User, RefreshCw, X, Check, Clock3, CheckCircle2 } from "lucide-react";
import api from "../../api/axiosInstance";
import { toast } from "react-hot-toast";
import AssignSubstituteDialog from "./AssignSubstituteDialog";
import "./SubstituteAssignments.css";

const SubstituteAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const visibleAssignments = assignments.filter((assignment) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [
      assignment.className,
      assignment.section,
      assignment.subject,
      assignment.reason,
      assignment.originalTeacherId?.user?.name,
      assignment.substituteTeacherId?.user?.name,
    ].some((value) => String(value || "").toLowerCase().includes(query));
    return matchesSearch && (!statusFilter || assignment.status === statusFilter);
  });

  const counts = assignments.reduce((summary, assignment) => {
    summary.total += 1;
    if (assignment.status === "Pending Approval") summary.pending += 1;
    if (["Assigned", "Completed"].includes(assignment.status)) summary.active += 1;
    if (assignment.status === "Completed") summary.completed += 1;
    return summary;
  }, { total: 0, pending: 0, active: 0, completed: 0 });

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Pending Approval': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Assigned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Cancelled': case 'Declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
      <div className="substitutes-heading">
        <div>
          <div className="substitutes-eyebrow">Staff operations / coverage</div>
          <h1>Substitute Assignments</h1>
          <p>Coordinate cover classes, approvals, and substitute workload for the selected day.</p>
        </div>
        <button type="button" className="toolbar-btn toolbar-btn-primary" onClick={() => setIsDialogOpen(true)}>
          <Plus size={14} /> Assign Substitute
        </button>
      </div>

      <div className="campus-kpi-track substitutes-kpis">
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><CalendarIcon size={16} /></div><div className="kpi-info"><span className="kpi-label">Today's Assignments</span><span className="kpi-value">{counts.total}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><Clock3 size={16} /></div><div className="kpi-info"><span className="kpi-label">Pending Approval</span><span className="kpi-value">{counts.pending}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><User size={16} /></div><div className="kpi-info"><span className="kpi-label">Active Coverage</span><span className="kpi-value">{counts.active}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><CheckCircle2 size={16} /></div><div className="kpi-info"><span className="kpi-label">Completed</span><span className="kpi-value">{counts.completed}</span></div></div></div>
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
        <div className="overflow-x-auto">
          <table className="substitutes-table">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-700/50">
                <th>Period &amp; time</th><th>Class coverage</th><th>Original teacher</th><th>Substitute teacher</th><th>Status</th><th className="text-right">Actions</th>
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
                visibleAssignments.map((assignment) => (
                  <tr key={assignment._id}>
                    <td><strong>Period {assignment.period}</strong><small>{assignment.startTime} - {assignment.endTime}</small>
                    </td>
                    <td><strong>{assignment.className} {assignment.section && <span className="muted">/ {assignment.section}</span>}</strong><small className="subject-label">{assignment.subject}</small>
                    </td>
                    <td><div className="substitute-person"><span className="person-avatar">{(assignment.originalTeacherId?.user?.name || "U").slice(0, 1)}</span><span><strong>{assignment.originalTeacherId?.user?.name || "Unknown"}</strong><small>{assignment.reason}</small></span></div>
                    </td>
                    <td><div className="substitute-person"><span className="person-avatar person-avatar-accent">{(assignment.substituteTeacherId?.user?.name || "U").slice(0, 1)}</span><span><strong>{assignment.substituteTeacherId?.user?.name || "Unknown"}</strong>{assignment.bonusEligible && <small className="bonus-label">Bonus: PKR {assignment.bonusAmount}</small>}</span></div>
                    </td>
                    <td><span className={`substitute-status ${getStatusBadgeClass(assignment.status)}`}>{assignment.status}</span>
                    </td>
                    <td className="text-right"><div className="substitute-actions">
                        {assignment.status === 'Pending Approval' && (
                          <button onClick={() => handleUpdateStatus(assignment._id, 'Assigned')} className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {assignment.status === 'Assigned' && (
                          <button onClick={() => handleUpdateStatus(assignment._id, 'Completed')} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition" title="Mark Completed">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {['Assigned', 'Pending Approval'].includes(assignment.status) && (
                          <button onClick={() => handleCancel(assignment._id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubstituteAssignments;
