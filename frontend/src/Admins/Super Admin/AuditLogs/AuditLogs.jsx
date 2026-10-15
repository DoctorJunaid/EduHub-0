import { useState, useEffect, useCallback } from "react";
import {
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
  { value: "Plan", label: "SaaS Plans" },
  { value: "Subscription", label: "Subscriptions" },
  { value: "Inquiry", label: "Inquiries & Leads" },
  { value: "GlobalBroadcast", label: "Broadcasts" },
  { value: "PlatformSetting", label: "Platform Settings" },
  { value: "FeeRecord", label: "Fee Records" },
  { value: "PaymentTransaction", label: "Payments" },
  { value: "MonthlyPayroll", label: "Payroll Batches" },
  { value: "AttendanceApproval", label: "Attendance Approvals" },
  { value: "TeacherClassSession", label: "Teacher Sessions" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "assigned", label: "Assigned" },
  { value: "converted", label: "Converted" },
  { value: "activated", label: "Activated" },
  { value: "deactivated", label: "Deactivated" },
  { value: "broadcasted", label: "Broadcasted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "applied", label: "Applied" },
  { value: "paid", label: "Paid" },
  { value: "waived", label: "Waived" },
  { value: "omitted", label: "Omitted" },
  { value: "cancelled", label: "Cancelled" },
  { value: "generated", label: "Generated" },
  { value: "confirmed", label: "Confirmed" },
];

const ITEMS_PER_PAGE = 10;

function getActionBadgeStyle(action) {
  switch (action?.toLowerCase()) {
    case "created":
    case "activated":
    case "converted":
    case "approved":
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
    case "cancelled":
    case "deleted":
    case "deactivated":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "updated":
    case "applied":
    case "waived":
    case "omitted":
    case "broadcasted":
    case "assigned":
    case "paid":
    case "generated":
    default:
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
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
  const limit = ITEMS_PER_PAGE;

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
    <div
      className="w-full flex flex-col"
      style={{ padding: "24px", gap: "20px", boxSizing: "border-box" }}
    >
      {/* 3 Summary KPI Metric Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 w-full"
        style={{ gap: "16px" }}
      >
        {/* Card 1: Total Logged Events */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between"
          style={{ padding: "20px 24px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0 flex-1" style={{ gap: "4px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap">
              TOTAL LOGGED EVENTS
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight whitespace-nowrap">
              {Number(total || 0).toLocaleString()}
            </span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0"
            style={{ width: "40px", height: "40px" }}
          >
            <Activity className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 2: Active Filter Scope */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between"
          style={{ padding: "20px 24px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0 flex-1" style={{ gap: "4px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap">
              ACTIVE FILTER SCOPE
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight truncate">
              {selectedEntity === "all" ? "All Entities" : selectedEntity}
            </span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0"
            style={{ width: "40px", height: "40px" }}
          >
            <Filter className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 3: Current Page */}
        <div
          className="bg-white border border-neutral-200 rounded-xl shadow-xs flex items-center justify-between"
          style={{ padding: "20px 24px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col min-w-0 flex-1" style={{ gap: "4px" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap">
              CURRENT PAGE
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight whitespace-nowrap">
              Page {page} of {totalPages || 1}
            </span>
          </div>
          <div
            className="rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0"
            style={{ width: "40px", height: "40px" }}
          >
            <Globe className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div
        className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between"
        style={{ padding: "14px 18px", gap: "12px", boxSizing: "border-box" }}
      >
        {/* Search Input on the Left */}
        <div className="relative flex-1 min-w-[280px]">
          <Search
            size={16}
            className="text-neutral-400 pointer-events-none absolute"
            style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search by actor, email, entity, IP or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-colors"
            style={{
              height: "36px",
              paddingLeft: "36px",
              paddingRight: searchQuery ? "32px" : "12px",
              boxSizing: "border-box",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              style={{ right: "10px", top: "50%", transform: "translateY(-50%)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters & Refresh Button on the Right */}
        <div className="flex items-center flex-wrap" style={{ gap: "10px" }}>
          {/* Entity Filter */}
          <div className="flex items-center shrink-0" style={{ gap: "6px" }}>
            <label htmlFor="entityTypeFilter" className="text-xs font-medium text-neutral-500 whitespace-nowrap">
              Entity
            </label>
            <select
              id="entityTypeFilter"
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              disabled={loading}
              className="border border-neutral-200 rounded-lg bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
              style={{
                height: "36px",
                padding: "0 12px",
                boxSizing: "border-box",
              }}
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center shrink-0" style={{ gap: "6px" }}>
            <label htmlFor="actionFilter" className="text-xs font-medium text-neutral-500 whitespace-nowrap">
              Action
            </label>
            <select
              id="actionFilter"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              disabled={loading}
              className="border border-neutral-200 rounded-lg bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
              style={{
                height: "36px",
                padding: "0 12px",
                boxSizing: "border-box",
              }}
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Relocated Refresh Button */}
          <button
            type="button"
            onClick={() => fetchLogs(page)}
            disabled={loading}
            className="border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            style={{
              height: "36px",
              padding: "0 14px",
              gap: "6px",
              boxSizing: "border-box",
            }}
            title="Refresh audit trail"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-neutral-600" : "text-neutral-600"} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        {loading && logs.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center text-center" style={{ padding: "64px 24px" }}>
            <Spinner size={32} />
            <p className="text-xs text-neutral-500 mt-2">Loading platform audit trail...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center text-center" style={{ padding: "64px 24px" }}>
            <AlertCircle size={44} className="text-neutral-400 mb-2" />
            <h3 className="text-sm font-semibold text-neutral-800">No Audit Logs Found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">No logged events match the selected criteria or filter parameters.</p>
            {(selectedEntity !== "all" || selectedAction !== "all" || searchQuery) && (
              <button
                type="button"
                className="mt-4 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
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
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50">
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px" }}>Timestamp</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px" }}>Actor</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px" }}>Action</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px" }}>Entity Type</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px" }}>Target Scope</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px" }}>IP Address</th>
                  <th className="text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" style={{ padding: "12px 16px" }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const actor = log.performedBy || {};
                  return (
                    <tr key={log._id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                      <td className="align-middle" style={{ padding: "12px 16px" }}>
                        <div className="flex items-center" style={{ gap: "6px" }}>
                          <Clock size={13} className="text-neutral-400 shrink-0" />
                          <span className="text-xs font-semibold text-neutral-800 whitespace-nowrap">
                            {formatRelativeTime(log.timestamp)}
                          </span>
                          <span className="text-[11px] text-neutral-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="align-middle" style={{ padding: "12px 16px" }}>
                        <div className="flex items-center" style={{ gap: "10px" }}>
                          <div
                            className="rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0"
                            style={{ width: "28px", height: "28px" }}
                          >
                            <User size={13} />
                          </div>
                          <div className="flex flex-col min-w-0" style={{ gap: "1px" }}>
                            <span className="text-xs font-medium text-neutral-900 truncate">
                              {actor.name || "System"}
                            </span>
                            <span className="text-[11px] text-neutral-400 truncate">
                              {actor.email || actor.role || "automated"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="align-middle" style={{ padding: "12px 16px" }}>
                        <span
                          className={`inline-flex items-center justify-center rounded-md border text-xs font-medium whitespace-nowrap ${getActionBadgeStyle(log.action)}`}
                          style={{ padding: "3px 10px" }}
                        >
                          {log.action || "action"}
                        </span>
                      </td>

                      <td className="align-middle" style={{ padding: "12px 16px" }}>
                        <div className="flex flex-col min-w-0" style={{ gap: "2px" }}>
                          <span className="text-xs font-semibold text-neutral-900">
                            {log.entityType}
                          </span>
                          {log.reason && (
                            <span
                              className="text-[11px] text-neutral-400 truncate max-w-[220px]"
                              title={log.reason}
                            >
                              {log.reason}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="align-middle" style={{ padding: "12px 16px" }}>
                        <div className="flex flex-col min-w-0" style={{ gap: "2px" }}>
                          {log.instituteId?.name ? (
                            <div className="flex items-center text-xs font-medium text-neutral-800" style={{ gap: "6px" }}>
                              <Building2 size={13} className="text-neutral-500 shrink-0" />
                              <span className="truncate">{log.instituteId.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400 italic">Platform Global</span>
                          )}
                          {log.campusId?.name && (
                            <span className="text-[11px] text-neutral-500 truncate">
                              Campus: {log.campusId.name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="align-middle" style={{ padding: "12px 16px" }}>
                        <span className="text-xs font-mono text-neutral-600 bg-neutral-100/70 border border-neutral-200 rounded px-1.5 py-0.5 whitespace-nowrap">
                          {log.ipAddress || "Internal"}
                        </span>
                      </td>

                      <td className="align-middle text-right" style={{ padding: "12px 16px" }}>
                        <button
                          type="button"
                          onClick={() => handleInspect(log)}
                          className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition-colors shadow-none cursor-pointer"
                          style={{ padding: "4px 10px", gap: "6px" }}
                          title="Inspect raw event payload & changes"
                        >
                          <Eye size={13} className="text-neutral-500" />
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
          <div
            className="flex items-center justify-between border-t border-neutral-200 bg-white"
            style={{ padding: "12px 18px" }}
          >
            <span className="text-xs text-neutral-500">
              Showing page <strong className="text-neutral-800 font-semibold">{page}</strong> of{" "}
              <strong className="text-neutral-800 font-semibold">{totalPages}</strong> ({total} total logs)
            </span>

            <div className="flex items-center" style={{ gap: "8px" }}>
              <button
                type="button"
                className="border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ height: "32px", padding: "0 12px", gap: "4px" }}
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className="border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ height: "32px", padding: "0 12px", gap: "4px" }}
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages || loading}
              >
                <span>Next</span>
                <ChevronRight size={14} />
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
                <span
                  className={`inline-flex items-center justify-center rounded-md border text-xs font-medium whitespace-nowrap ${getActionBadgeStyle(activeLog.action)}`}
                  style={{ padding: "3px 10px" }}
                >
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
