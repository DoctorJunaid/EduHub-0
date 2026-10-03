import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Filter,
  Eye,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Globe,
  AlertCircle,
  Building2,
  Activity,
  FileText,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import "./AuditLogs.css";

const ENTITY_OPTIONS = [
  { value: "all", label: "All Entity Types" },
  { value: "Institute", label: "Institutes" },
  { value: "Campus", label: "Campuses" },
  { value: "User", label: "Users & Accounts" },
  { value: "GlobalBroadcast", label: "Broadcasts" },
  { value: "PlatformSetting", label: "Platform Settings" },
  { value: "FeeRecord", label: "Fee Records" },
  { value: "PaymentTransaction", label: "Payments" },
  { value: "MonthlyPayroll", label: "Payroll Batches" },
  { value: "AttendanceApproval", label: "Attendance Approvals" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "applied", label: "Applied" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "generated", label: "Generated" },
  { value: "confirmed", label: "Confirmed" },
];

function getActionBadgeClass(action) {
  switch (action?.toLowerCase()) {
    case "created":
      return "action-created";
    case "approved":
    case "confirmed":
    case "paid":
      return "action-success";
    case "rejected":
    case "cancelled":
      return "action-danger";
    case "updated":
    case "applied":
      return "action-info";
    default:
      return "action-neutral";
  }
}

function formatRelativeTime(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);

  // Filters
  const [selectedEntity, setSelectedEntity] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [activeLog, setActiveLog] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchLogs = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = {
        page: pageNum,
        limit,
      };
      if (selectedEntity !== "all") params.entityType = selectedEntity;
      if (selectedAction !== "all") params.action = selectedAction;

      const res = await axiosInstance.get("/super-admin/audit-logs", { params });
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || pageNum);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load platform audit logs");
    } finally {
      setLoading(false);
    }
  }, [limit, selectedEntity, selectedAction]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // Client-side search filtering on active page
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const actorName = log.performedBy?.name?.toLowerCase() || "";
    const actorEmail = log.performedBy?.email?.toLowerCase() || "";
    const entityType = log.entityType?.toLowerCase() || "";
    const action = log.action?.toLowerCase() || "";
    const reason = log.reason?.toLowerCase() || "";
    const ip = log.ipAddress?.toLowerCase() || "";
    const instName = log.instituteId?.name?.toLowerCase() || "";
    const campusName = log.campusId?.name?.toLowerCase() || "";

    return (
      actorName.includes(query) ||
      actorEmail.includes(query) ||
      entityType.includes(query) ||
      action.includes(query) ||
      reason.includes(query) ||
      ip.includes(query) ||
      instName.includes(query) ||
      campusName.includes(query)
    );
  });

  const handleInspect = (log) => {
    setActiveLog(log);
    setInspectModalOpen(true);
    setCopied(false);
  };

  const handleCopyPayload = () => {
    if (!activeLog) return;
    const payload = JSON.stringify(
      {
        id: activeLog._id,
        timestamp: activeLog.timestamp,
        entityType: activeLog.entityType,
        entityId: activeLog.entityId,
        action: activeLog.action,
        performedBy: activeLog.performedBy,
        ipAddress: activeLog.ipAddress,
        userAgent: activeLog.userAgent,
        reason: activeLog.reason,
        institute: activeLog.instituteId,
        campus: activeLog.campusId,
        changes: activeLog.changes,
        metadata: activeLog.metadata,
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success("Audit payload copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="audit-logs-page">
      {/* Top Banner & Stats */}
      <div className="audit-header">
        <div className="audit-header-title">
          <div className="audit-icon-wrap">
            <ShieldCheck size={24} className="audit-title-icon" />
          </div>
          <div>
            <h1>Platform Audit Logs</h1>
            <p>Immutable forensic record of all administrative actions, quota adjustments, and mutations across the platform.</p>
          </div>
        </div>

        <button
          type="button"
          className="audit-refresh-btn"
          onClick={() => fetchLogs(page)}
          disabled={loading}
          title="Refresh audit trail"
        >
          <RefreshCw size={15} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="audit-kpi-grid">
        <div className="audit-kpi-card">
          <div className="kpi-icon-wrap">
            <Activity size={18} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Logged Events</span>
            <span className="kpi-value">{Number(total || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="audit-kpi-card">
          <div className="kpi-icon-wrap">
            <Filter size={18} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Active Filter Scope</span>
            <span className="kpi-value">
              {selectedEntity === "all" ? "All Entities" : selectedEntity}
            </span>
          </div>
        </div>

        <div className="audit-kpi-card">
          <div className="kpi-icon-wrap">
            <Globe size={18} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Current Page</span>
            <span className="kpi-value">
              Page {page} of {totalPages || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="audit-controls-bar">
        <div className="audit-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by actor, email, entity, IP or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="audit-filters-row">
          <div className="audit-select-wrap">
            <label htmlFor="entityTypeFilter">Entity</label>
            <select
              id="entityTypeFilter"
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              disabled={loading}
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="audit-select-wrap">
            <label htmlFor="actionFilter">Action</label>
            <select
              id="actionFilter"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              disabled={loading}
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="audit-table-card">
        {loading && logs.length === 0 ? (
          <div className="audit-loading-wrap">
            <Spinner size={32} />
            <p>Loading platform audit trail...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="audit-empty-wrap">
            <AlertCircle size={44} className="empty-icon" />
            <h3>No Audit Logs Found</h3>
            <p>No logged events match the selected criteria or filter parameters.</p>
            {(selectedEntity !== "all" || selectedAction !== "all" || searchQuery) && (
              <button
                type="button"
                className="audit-reset-btn"
                onClick={() => {
                  setSelectedEntity("all");
                  setSelectedAction("all");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="audit-table-responsive">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Target Scope</th>
                  <th>IP Address</th>
                  <th className="th-action">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const actor = log.performedBy || {};
                  return (
                    <tr key={log._id}>
                      <td className="td-timestamp">
                        <div className="timestamp-cell">
                          <Clock size={13} className="time-icon" />
                          <span className="rel-time">{formatRelativeTime(log.timestamp)}</span>
                          <span className="full-time">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="td-actor">
                        <div className="actor-cell">
                          <div className="actor-avatar">
                            <User size={13} />
                          </div>
                          <div className="actor-info">
                            <span className="actor-name">{actor.name || "System"}</span>
                            <span className="actor-meta">
                              {actor.email || actor.role || "automated"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="td-action">
                        <span className={`audit-action-pill ${getActionBadgeClass(log.action)}`}>
                          {log.action || "action"}
                        </span>
                      </td>

                      <td className="td-entity">
                        <div className="entity-cell">
                          <span className="entity-type-badge">{log.entityType}</span>
                          {log.reason && (
                            <span className="entity-reason" title={log.reason}>
                              {log.reason}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="td-scope">
                        <div className="scope-cell">
                          {log.instituteId?.name ? (
                            <div className="scope-inst">
                              <Building2 size={13} />
                              <span>{log.instituteId.name}</span>
                            </div>
                          ) : (
                            <span className="scope-global">Platform Global</span>
                          )}
                          {log.campusId?.name && (
                            <span className="scope-campus">Campus: {log.campusId.name}</span>
                          )}
                        </div>
                      </td>

                      <td className="td-ip">
                        <span className="ip-badge">{log.ipAddress || "Internal"}</span>
                      </td>

                      <td className="td-inspect">
                        <button
                          type="button"
                          className="inspect-btn"
                          onClick={() => handleInspect(log)}
                          title="Inspect raw event payload & changes"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="audit-pagination-footer">
            <span className="page-summary">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total logs)
            </span>

            <div className="page-buttons">
              <button
                type="button"
                className="page-nav-btn"
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className="page-nav-btn"
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages || loading}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── INSPECT LOG MODAL ── */}
      {inspectModalOpen && activeLog && (
        <div className="audit-modal-backdrop" onClick={() => setInspectModalOpen(false)}>
          <div className="audit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <div className="modal-title-row">
                <FileText size={18} className="modal-header-icon" />
                <h3>Event Payload Details</h3>
                <span className={`audit-action-pill ${getActionBadgeClass(activeLog.action)}`}>
                  {activeLog.action}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setInspectModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="audit-modal-body">
              {/* Event Metadata Cards */}
              <div className="modal-meta-grid">
                <div className="meta-card">
                  <span className="meta-lbl">Log ID</span>
                  <span className="meta-val code">{activeLog._id}</span>
                </div>
                <div className="meta-card">
                  <span className="meta-lbl">Timestamp</span>
                  <span className="meta-val">{new Date(activeLog.timestamp).toLocaleString()}</span>
                </div>
                <div className="meta-card">
                  <span className="meta-lbl">Actor</span>
                  <span className="meta-val">
                    {activeLog.performedBy?.name} ({activeLog.performedBy?.email || activeLog.performedBy?.role || "system"})
                  </span>
                </div>
                <div className="meta-card">
                  <span className="meta-lbl">Entity Reference</span>
                  <span className="meta-val code">
                    {activeLog.entityType}: {activeLog.entityId}
                  </span>
                </div>
                {activeLog.ipAddress && (
                  <div className="meta-card">
                    <span className="meta-lbl">IP Address</span>
                    <span className="meta-val">{activeLog.ipAddress}</span>
                  </div>
                )}
                {activeLog.reason && (
                  <div className="meta-card full-width">
                    <span className="meta-lbl">Declared Reason</span>
                    <span className="meta-val">{activeLog.reason}</span>
                  </div>
                )}
              </div>

              {/* Diffs: Changes Before / After */}
              {(activeLog.changes?.before || activeLog.changes?.after) && (
                <div className="changes-section">
                  <h4>State Mutation Diffs</h4>
                  <div className="changes-grid">
                    {activeLog.changes.before && (
                      <div className="diff-box">
                        <span className="diff-tag before">Before Mutation</span>
                        <pre className="json-block">
                          {JSON.stringify(activeLog.changes.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {activeLog.changes.after && (
                      <div className="diff-box">
                        <span className="diff-tag after">After Mutation</span>
                        <pre className="json-block">
                          {JSON.stringify(activeLog.changes.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Complete JSON Payload */}
              <div className="raw-json-section">
                <div className="raw-json-header">
                  <h4>Raw Event JSON</h4>
                  <button
                    type="button"
                    className="copy-json-btn"
                    onClick={handleCopyPayload}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? "Copied" : "Copy Payload"}</span>
                  </button>
                </div>
                <pre className="json-block full">
                  {JSON.stringify(activeLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="audit-modal-footer">
              <button
                type="button"
                className="audit-modal-done-btn"
                onClick={() => setInspectModalOpen(false)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
