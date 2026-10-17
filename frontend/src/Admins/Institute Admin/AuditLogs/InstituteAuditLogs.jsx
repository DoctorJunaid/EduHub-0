import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Building2,
  Search,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import "./InstituteAuditLogs.css";

const ENTITY_OPTIONS = [
  { value: "all", label: "All Entity Types" },
  { value: "Campus", label: "Campus Branches" },
  { value: "User", label: "Users & Staff" },
  { value: "Student", label: "Students" },
  { value: "FeeRecord", label: "Fee Records" },
  { value: "PaymentTransaction", label: "Payments" },
  { value: "MonthlyPayroll", label: "Payroll Batches" },
  { value: "AttendanceApproval", label: "Attendance Approvals" },
  { value: "TeacherAttendance", label: "Teacher Attendance" },
  { value: "SubstituteAssignment", label: "Substitutes" },
  { value: "GlobalBroadcast", label: "Broadcast Alerts" },
  { value: "SalaryPolicy", label: "Salary Policies" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "assigned", label: "Assigned" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
  { value: "waived", label: "Waived" },
  { value: "omitted", label: "Omitted" },
  { value: "generated", label: "Generated" },
  { value: "confirmed", label: "Confirmed" },
  { value: "broadcasted", label: "Broadcasted" },
];

function getActionBadgeClass(action) {
  switch (action?.toLowerCase()) {
    case "created":
    case "activated":
    case "assigned":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    case "approved":
    case "confirmed":
    case "paid":
      return "bg-slate-100 text-slate-700 border-slate-200/80";
    case "rejected":
    case "cancelled":
    case "deleted":
    case "deactivated":
      return "bg-rose-50 text-rose-700 border-rose-200/60";
    case "updated":
    case "applied":
    case "waived":
    case "omitted":
      return "bg-amber-50 text-amber-700 border-amber-200/60";
    case "broadcasted":
    case "generated":
      return "bg-slate-100 text-slate-700 border-slate-200/80";
    default:
      return "bg-neutral-100 text-neutral-700 border-neutral-200/70";
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

function compactAuditValue(value) {
  if (value === null || value === undefined || value === "") return undefined;
  if (Array.isArray(value)) {
    const items = value
      .map(compactAuditValue)
      .filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, compactAuditValue(item)])
      .filter(([, item]) => item !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value;
}

function formatAuditLabel(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\bid\b/gi, "ID")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function AuditPayloadValue({ value }) {
  if (Array.isArray(value)) {
    return (
      <ul className="audit-payload-list">
        {value.map((item, index) => (
          <li key={index}>
            <AuditPayloadValue value={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (value && typeof value === "object") {
    return (
      <dl className="audit-payload-nested">
        {Object.entries(value).map(([key, item]) => (
          <div key={key}>
            <dt>{formatAuditLabel(key)}</dt>
            <dd>
              <AuditPayloadValue value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  const displayValue =
    typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : typeof value === "number"
        ? value.toLocaleString()
        : String(value);

  return <span className="audit-payload-value">{displayValue}</span>;
}

export default function InstituteAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    criticalEvents: 0,
    totalCampuses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCampusId, setSelectedCampusId] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [action, setAction] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const auditPayload = selectedLog
    ? compactAuditValue({
        changes: selectedLog.changes,
        metadata: selectedLog.metadata,
      }) || {}
    : {};
  const auditPayloadGroups = Object.entries(auditPayload).flatMap(
    ([key, value]) => {
      if (
        key === "changes" &&
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        ("before" in value || "after" in value)
      ) {
        return Object.entries(value).map(([state, data]) => ({
          key: `${key}-${state}`,
          label: formatAuditLabel(state),
          value: data,
        }));
      }

      return [{ key, label: formatAuditLabel(key), value }];
    },
  );

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        campusId: selectedCampusId !== "all" ? selectedCampusId : undefined,
        entityType: entityType !== "all" ? entityType : undefined,
        action: action !== "all" ? action : undefined,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await axiosInstance.get("/institute-admin/audit-logs", {
        params,
      });
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setTotalLogs(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.campuses) setCampuses(res.data.campuses);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, selectedCampusId, entityType, action, search, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setSelectedCampusId("all");
    setEntityType("all");
    setAction("all");
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const exportToCsv = () => {
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = [
      "Timestamp",
      "Campus",
      "Actor Name",
      "Actor Role",
      "Action",
      "Entity Type",
      "Reason",
      "IP Address",
    ];
    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.campusId?.name || "Institute-level",
      log.performedBy?.name || "System",
      log.performedBy?.role || "System",
      log.action,
      log.entityType,
      `"${(log.reason || "").replace(/"/g, '""')}"`,
      log.ipAddress || "—",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `institute_audit_logs_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit logs exported to CSV");
  };

  return (
    <div className="institute-audit-logs-page flex flex-col gap-5 pb-12">
      {/* ── 1. SUMMARY KPI METRICS CARD ROW (DIRECTLY BENEATH HEADER / BREADCRUMBS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 w-full" style={{ gap: "16px" }}>
        <div className="audit-kpi-card bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex items-center justify-between min-w-0">
          <div className="space-y-1 min-w-0 flex-1 mr-2">
            <span className="text-xs text-muted-foreground font-medium block truncate">
              Total Audit Records
            </span>
            <span className="text-2xl font-bold text-neutral-900 block tracking-tight truncate">
              {stats.totalLogs || totalLogs || 0}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
            <Activity size={16} />
          </div>
        </div>

        <div className="audit-kpi-card bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex items-center justify-between min-w-0">
          <div className="space-y-1 min-w-0 flex-1 mr-2">
            <span className="text-xs text-muted-foreground font-medium block truncate">
              Today's Activities
            </span>
            <span className="text-2xl font-bold text-neutral-900 block tracking-tight truncate">
              {stats.todayLogs || 0}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
            <Clock size={16} />
          </div>
        </div>

        <div className="audit-kpi-card bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex items-center justify-between min-w-0">
          <div className="space-y-1 min-w-0 flex-1 mr-2">
            <span className="text-xs text-muted-foreground font-medium block truncate">
              Campuses Tracked
            </span>
            <span className="text-2xl font-bold text-neutral-900 block tracking-tight truncate">
              {campuses.length || stats.totalCampuses || 0}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
            <Building2 size={16} />
          </div>
        </div>

        <div className="audit-kpi-card bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex items-center justify-between min-w-0">
          <div className="space-y-1 min-w-0 flex-1 mr-2">
            <span className="text-xs text-muted-foreground font-medium block truncate">
              Critical Operations
            </span>
            <span
              className={`text-2xl font-bold block tracking-tight truncate ${
                stats.criticalEvents > 0 ? "text-rose-600" : "text-neutral-900"
              }`}
            >
              {stats.criticalEvents || 0}
            </span>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              stats.criticalEvents > 0
                ? "bg-rose-50 text-rose-600"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            <AlertTriangle size={16} />
          </div>
        </div>
      </div>

      {/* ── 2. UNIFIED CONTENT TOOLBAR & CRITERIA FILTER CARD ── */}
      <div className="audit-filter-card bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-none w-full flex flex-col gap-4">
        {/* Top Strip: Campus Branch Selector + Action Buttons */}
        <div className="audit-filter-top-row flex flex-col md:flex-row md:items-center justify-between gap-3 w-full pb-3.5 border-b border-neutral-100">
          {/* Campus Branch Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground shrink-0">
              <Building2 className="w-4 h-4 text-muted-foreground mr-1.5 shrink-0" />
              <span>Filter by Campus Branch:</span>
            </div>

            {/* Campus Pill Tabs Container */}
            <div className="audit-campus-pills-container inline-flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCampusId("all");
                  setPage(1);
                }}
                className={`audit-campus-pill px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center ${
                  selectedCampusId === "all"
                    ? "bg-neutral-900 text-white shadow-sm border border-neutral-900"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200/80"
                }`}
              >
                <span>All Campuses</span>
                <span
                  className={`text-[10px] ml-1 font-normal opacity-70 ${
                    selectedCampusId === "all"
                      ? "text-neutral-300"
                      : "text-muted-foreground"
                  }`}
                >
                  ({totalLogs})
                </span>
              </button>

              {campuses.map((campus) => {
                const isSelected =
                  (campus.id || campus._id) === selectedCampusId;
                return (
                  <button
                    key={campus.id || campus._id}
                    type="button"
                    onClick={() => {
                      setSelectedCampusId(campus.id || campus._id);
                      setPage(1);
                    }}
                    className={`audit-campus-pill px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center ${
                      isSelected
                        ? "bg-neutral-900 text-white shadow-sm border border-neutral-900"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200/80"
                    }`}
                  >
                    <span>{campus.name}</span>
                    {campus.code && (
                      <span
                        className={`text-[10px] ml-1 font-normal opacity-70 ${
                          isSelected
                            ? "text-neutral-300"
                            : "text-muted-foreground"
                        }`}
                      >
                        ({campus.code})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons: Export CSV & Refresh */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCsv}
              className="audit-action-btn h-9 px-3 text-xs font-medium border border-neutral-200 rounded-md hover:bg-neutral-50 flex items-center gap-1.5 bg-white text-neutral-700 shadow-none cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs()}
              disabled={loading}
              className="audit-action-btn h-9 px-3 text-xs font-medium border border-neutral-200 rounded-md hover:bg-neutral-50 flex items-center gap-1.5 bg-white text-neutral-700 shadow-none cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-neutral-600 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Bottom Strip: Search & Criteria Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full items-center">
          {/* Fix Search Input Collision */}
          <div className="audit-search-wrap relative w-full sm:col-span-2 lg:col-span-1">
            <Search className="audit-search-icon absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search user, action, reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="audit-search-input pl-9 pr-3 py-2 h-9 text-xs sm:text-sm border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 w-full"
            />
          </div>

          {/* All Entity Types Dropdown */}
          <div className="w-full">
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="audit-filter-select h-9 px-3 text-xs sm:text-sm border border-neutral-200 rounded-md bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer w-full"
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* All Actions Dropdown */}
          <div className="w-full">
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="audit-filter-select h-9 px-3 text-xs sm:text-sm border border-neutral-200 rounded-md bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer w-full"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker: Start Date */}
          <div className="w-full">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="audit-filter-date h-9 px-3 text-xs sm:text-sm border border-neutral-200 rounded-md bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer w-full"
              title="From Date"
            />
          </div>

          {/* Date Picker: End Date + Reset Button */}
          <div className="w-full flex items-center gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="audit-filter-date h-9 px-3 text-xs sm:text-sm border border-neutral-200 rounded-md bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer flex-1 min-w-0"
              title="To Date"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="audit-reset-btn h-9 w-9 p-0 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md border border-neutral-200 shrink-0 cursor-pointer transition-colors"
              title="Reset all filters"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full min-w-[950px] text-left text-xs text-neutral-600 institute-audit-table border-collapse">
            <thead className="bg-neutral-50/80 text-neutral-500 font-bold uppercase tracking-wider text-[11px] border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Campus Branch</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Performed By</th>
                <th className="px-4 py-3.5 whitespace-nowrap">
                  Action &amp; Target
                </th>
                <th className="px-4 py-3.5 min-w-[240px]">
                  Reason / Description
                </th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">
                  Payload
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-neutral-400"
                  >
                    <Spinner size="md" className="mx-auto mb-2" />
                    Fetching institute audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-neutral-400"
                  >
                    <ShieldCheck
                      size={36}
                      className="mx-auto mb-2 text-neutral-300"
                    />
                    <p className="font-semibold text-neutral-800 text-sm">
                      No audit log entries found
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Try selecting another campus or clearing search filters.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const campusName =
                    log.campusId?.name ||
                    log.changes?.before?.name ||
                    "Institute Root";
                  const actorName = log.performedBy?.name || "System";
                  const actorRole = log.performedBy?.role || "system";
                  const actorEmail = log.performedBy?.email || "";

                  return (
                    <tr
                      key={log._id}
                      className="h-14 hover:bg-neutral-50/60 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 font-mono text-neutral-500 whitespace-nowrap align-middle">
                        <div className="font-semibold text-neutral-900">
                          {formatRelativeTime(log.timestamp)}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Campus Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                        <span className="campus-badge inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200/70 shrink-0 whitespace-nowrap">
                          <Building2
                            size={13}
                            className="text-muted-foreground shrink-0"
                          />
                          <span>{campusName}</span>
                        </span>
                      </td>

                      {/* Performed By */}
                      <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                        <div className="font-semibold text-neutral-900">
                          {actorName}
                        </div>
                        <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">
                            {actorRole.replace(/_/g, " ")}
                          </span>
                          {actorEmail && (
                            <span className="text-neutral-400">
                              • {actorEmail}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action & Entity */}
                      <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`action-badge inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md border shrink-0 whitespace-nowrap ${getActionBadgeClass(
                              log.action,
                            )}`}
                          >
                            {log.action}
                          </span>
                          <span className="font-medium text-neutral-800 text-xs">
                            {log.entityType}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5 max-w-xs text-neutral-700 truncate align-middle">
                        {log.reason || `Mutated ${log.entityType} record`}
                      </td>

                      {/* Payload Inspect Button */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap align-middle">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-neutral-900 hover:bg-neutral-100 rounded-md inline-flex items-center gap-1.5 mx-auto transition-colors font-medium cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
            <span>
              Showing Page <strong className="text-neutral-900">{page}</strong>{" "}
              of <strong className="text-neutral-900">{totalPages}</strong> (
              {totalLogs} total events)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-8 px-3 rounded-lg text-xs border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 cursor-pointer"
              >
                <ChevronLeft size={14} className="mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="h-8 px-3 rounded-lg text-xs border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 cursor-pointer"
              >
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div
          className="audit-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedLog(null);
          }}
        >
          <section
            className="audit-event-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-modal-title"
          >
            <header className="audit-modal-header">
              <div className="audit-modal-heading">
                <span className="audit-modal-icon">
                  <ShieldCheck size={19} aria-hidden="true" />
                </span>
                <div>
                  <p className="audit-modal-eyebrow">Audit event</p>
                  <h2 id="audit-modal-title">Audit Event Details</h2>
                  <p className="audit-modal-timestamp">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="audit-modal-close"
                aria-label="Close audit event details"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="audit-modal-body">
              <div className="audit-modal-details">
                <div className="audit-modal-field">
                  <span>Campus branch</span>
                  <strong>
                    {selectedLog.campusId?.name ||
                      selectedLog.changes?.before?.name ||
                      "Institute Root"}
                  </strong>
                </div>
                <div className="audit-modal-field">
                  <span>Action &amp; target</span>
                  <strong className="capitalize">
                    {selectedLog.action} {selectedLog.entityType}
                  </strong>
                </div>
                <div className="audit-modal-field">
                  <span>Executed by</span>
                  <strong>{selectedLog.performedBy?.name || "System"}</strong>
                  <small>
                    {selectedLog.performedBy?.role?.replace(/_/g, " ") ||
                      "System"}
                    {selectedLog.performedBy?.email
                      ? ` · ${selectedLog.performedBy.email}`
                      : ""}
                  </small>
                </div>
              </div>

              {(selectedLog.ipAddress || selectedLog.userAgent) && (
                <details className="audit-modal-technical">
                  <summary>Technical details</summary>
                  <div className="audit-modal-technical-content">
                    {selectedLog.ipAddress && (
                      <div>
                        <span>IP address</span>
                        <strong>{selectedLog.ipAddress}</strong>
                      </div>
                    )}
                    {selectedLog.userAgent && (
                      <div>
                        <span>Client</span>
                        <strong>{selectedLog.userAgent}</strong>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {selectedLog.reason && (
                <section className="audit-modal-reason">
                  <h3>Reason / note</h3>
                  <p>{selectedLog.reason}</p>
                </section>
              )}

              {Object.keys(auditPayload).length > 0 && (
                <section className="audit-modal-payload">
                  <div className="audit-modal-payload-heading">
                    <div>
                      <h3>Payload &amp; state changes</h3>
                      <p>Relevant fields recorded for this event</p>
                    </div>
                  </div>
                  <div className="audit-payload-grid">
                    {auditPayloadGroups.map((group) => (
                      <section className="audit-payload-group" key={group.key}>
                        <h4>{group.label}</h4>
                        <AuditPayloadValue value={group.value} />
                      </section>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <footer className="audit-modal-footer">
              <Button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="audit-modal-done"
              >
                Close
              </Button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
