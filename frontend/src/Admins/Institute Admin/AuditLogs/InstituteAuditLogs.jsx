import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Building2,
  Search,
  RefreshCw,
  Eye,
  X,
  Copy,
  Check,
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function InstituteAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [stats, setStats] = useState({ totalLogs: 0, todayLogs: 0, criticalEvents: 0, totalCampuses: 0 });
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
  const [copied, setCopied] = useState(false);

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

      const res = await axiosInstance.get("/institute-admin/audit-logs", { params });
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

  const handleCopyJson = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    toast.success("JSON copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToCsv = () => {
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = ["Timestamp", "Campus", "Actor Name", "Actor Role", "Action", "Entity Type", "Reason", "IP Address"];
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

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `institute_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit logs exported to CSV");
  };

  return (
    <div className="institute-audit-logs-page flex flex-col gap-5 pb-12">
      {/* ── 1. Top Action Toolbar (Aligned Right under Header / Breadcrumbs) ── */}
      <div className="flex items-center justify-end gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCsv}
          className="h-9 px-3 gap-2 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-md cursor-pointer shadow-none"
        >
          <Download size={15} /> Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs()}
          disabled={loading}
          className="h-9 px-3 gap-2 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-md cursor-pointer shadow-none"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {/* ── 2. Summary KPI Metrics Card Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <div className="audit-kpi-card bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium block">
              Total Audit Records
            </span>
            <span className="text-2xl font-bold text-neutral-900 block tracking-tight">
              {stats.totalLogs || totalLogs || 0}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
            <Activity size={16} />
          </div>
        </div>

        <div className="audit-kpi-card bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium block">
              Today's Activities
            </span>
            <span className="text-2xl font-bold text-neutral-900 block tracking-tight">
              {stats.todayLogs || 0}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
            <Clock size={16} />
          </div>
        </div>

        <div className="audit-kpi-card bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium block">
              Campuses Tracked
            </span>
            <span className="text-2xl font-bold text-neutral-900 block tracking-tight">
              {campuses.length || stats.totalCampuses || 0}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
            <Building2 size={16} />
          </div>
        </div>

        <div className="audit-kpi-card bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium block">
              Critical Operations
            </span>
            <span
              className={`text-2xl font-bold block tracking-tight ${
                stats.criticalEvents > 0 ? "text-rose-600" : "text-neutral-900"
              }`}
            >
              {stats.criticalEvents || 0}
            </span>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              stats.criticalEvents > 0 ? "bg-rose-50 text-rose-600" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            <AlertTriangle size={16} />
          </div>
        </div>
      </div>

      {/* ── 3. Filter Bar & Campus Selector ── */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-xs space-y-4">
        {/* Campus Quick Switcher Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div className="flex items-center shrink-0">
            <Building2 className="w-4 h-4 text-muted-foreground mr-1.5 shrink-0" />
            <span className="text-xs font-semibold text-neutral-700">
              Filter by Campus Branch:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedCampusId("all");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedCampusId === "all"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900 border border-neutral-200/70"
              }`}
            >
              <span>All Campuses ({totalLogs})</span>
            </button>

            {campuses.map((campus) => {
              const isSelected = (campus.id || campus._id) === selectedCampusId;
              return (
                <button
                  key={campus.id || campus._id}
                  type="button"
                  onClick={() => {
                    setSelectedCampusId(campus.id || campus._id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900 border border-neutral-200/70"
                  }`}
                >
                  <span>{campus.name}</span>
                  {campus.code && <span className="opacity-70 text-[10px]">({campus.code})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Toolbar Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input with Pl-9 Icon Clearance */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search user, action, reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 bg-white border border-neutral-200 rounded-md text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
            />
          </div>

          {/* Entity Type Dropdown */}
          <div>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 bg-white border border-neutral-200 rounded-md text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 cursor-pointer transition-colors"
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Dropdown */}
          <div>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 bg-white border border-neutral-200 rounded-md text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 cursor-pointer transition-colors"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range & Clear */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 h-9 px-2.5 bg-white border border-neutral-200 rounded-md text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors cursor-pointer"
              title="From Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 h-9 px-2.5 bg-white border border-neutral-200 rounded-md text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors cursor-pointer"
              title="To Date"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2.5 text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md border border-neutral-200 shrink-0 cursor-pointer transition-colors"
              title="Reset all filters"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-w-[950px]">
          <table className="w-full text-left text-xs text-neutral-600 institute-audit-table border-collapse">
            <thead className="bg-neutral-50/80 text-neutral-500 font-bold uppercase tracking-wider text-[11px] border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Campus Branch</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Performed By</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Action &amp; Target</th>
                <th className="px-4 py-3.5 min-w-[240px]">Reason / Description</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <Spinner size="md" className="mx-auto mb-2" />
                    Fetching institute audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <ShieldCheck size={36} className="mx-auto mb-2 text-neutral-300" />
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
                  const campusName = log.campusId?.name || "Institute Root";
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
                          <Building2 size={13} className="text-muted-foreground shrink-0" />
                          <span>{campusName}</span>
                        </span>
                      </td>

                      {/* Performed By */}
                      <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                        <div className="font-semibold text-neutral-900">
                          {actorName}
                        </div>
                        <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">{actorRole.replace(/_/g, " ")}</span>
                          {actorEmail && <span className="text-neutral-400">• {actorEmail}</span>}
                        </div>
                      </td>

                      {/* Action & Entity */}
                      <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`action-badge inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md border shrink-0 whitespace-nowrap ${getActionBadgeClass(
                              log.action
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
              Showing Page <strong className="text-neutral-900">{page}</strong> of{" "}
              <strong className="text-neutral-900">{totalPages}</strong> ({totalLogs} total events)
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
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 text-neutral-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">
                    Audit Event Details
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                <span className="text-muted-foreground font-medium block">Campus Branch:</span>
                <span className="font-semibold text-neutral-900 mt-0.5 block">
                  {selectedLog.campusId?.name || "Institute Root"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                <span className="text-muted-foreground font-medium block">Action &amp; Target:</span>
                <span className="font-semibold text-neutral-900 mt-0.5 block capitalize">
                  {selectedLog.action} {selectedLog.entityType}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                <span className="text-muted-foreground font-medium block">Executed By:</span>
                <span className="font-semibold text-neutral-900 mt-0.5 block">
                  {selectedLog.performedBy?.name} ({selectedLog.performedBy?.role})
                </span>
                <span className="text-muted-foreground text-[10px]">
                  {selectedLog.performedBy?.email || "No email"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                <span className="text-muted-foreground font-medium block">IP &amp; Client:</span>
                <span className="font-mono text-neutral-800 mt-0.5 block truncate">
                  {selectedLog.ipAddress || "Internal Server"}
                </span>
                <span className="text-muted-foreground text-[10px] truncate block">
                  {selectedLog.userAgent || "Browser Client"}
                </span>
              </div>
            </div>

            {selectedLog.reason && (
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs">
                <span className="text-muted-foreground font-medium block mb-1">Reason / Note:</span>
                <p className="text-neutral-800">{selectedLog.reason}</p>
              </div>
            )}

            {/* Changes JSON payload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-neutral-800">Payload &amp; State Changes:</span>
                <button
                  onClick={() => handleCopyJson(selectedLog.changes || selectedLog.metadata)}
                  className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy JSON"}</span>
                </button>
              </div>
              <pre className="bg-neutral-950 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-48 border border-neutral-800 custom-scrollbar">
                {JSON.stringify(
                  {
                    changes: selectedLog.changes,
                    metadata: selectedLog.metadata,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex justify-end">
              <Button
                onClick={() => setSelectedLog(null)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold px-5 h-9 cursor-pointer"
              >
                Close View
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
