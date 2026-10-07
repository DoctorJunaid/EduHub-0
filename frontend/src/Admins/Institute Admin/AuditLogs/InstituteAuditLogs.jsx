import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Building2,
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
  FileText,
  Download,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
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
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "approved":
    case "confirmed":
    case "paid":
      return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
    case "rejected":
    case "cancelled":
    case "deleted":
    case "deactivated":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    case "updated":
    case "applied":
    case "waived":
    case "omitted":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "broadcasted":
    case "generated":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
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

  const selectedCampusName = campuses.find((c) => c.id === selectedCampusId || c._id === selectedCampusId)?.name || "All Campuses";

  return (
    <div className="institute-audit-logs-page space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center text-2xl shadow-lg shadow-indigo-600/20">
            <ShieldCheck size={30} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Institute Audit &amp; Activity Logs
              </h1>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-2.5 py-0.5">
                Multi-Campus
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Centralized security audit trail tracking system events, branch mutations, staff operations, and financial records across every campus branch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCsv}
            className="border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-xl text-xs flex items-center gap-1.5"
          >
            <Download size={14} /> Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Audit Records</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                {stats.totalLogs || totalLogs || 0}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Today's Activities</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {stats.todayLogs || 0}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Campuses Tracked</span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5 block">
                {campuses.length || stats.totalCampuses || 0}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Critical Operations</span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                {stats.criticalEvents || 0}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campus Quick Switcher Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Filter by Campus Branch:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setSelectedCampusId("all");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCampusId === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            🏢 All Campuses ({totalLogs})
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{campus.name}</span>
                {campus.code && <span className="opacity-70 text-[10px]">({campus.code})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <Input
              placeholder="Search user, action, reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-xs rounded-xl h-9"
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
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
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
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
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
              className="w-1/2 h-9 px-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-700 dark:text-slate-200"
              title="From Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 h-9 px-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-700 dark:text-slate-200"
              title="To Date"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white shrink-0"
              title="Reset all filters"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Campus Branch</th>
                <th className="px-4 py-3.5">Performed By</th>
                <th className="px-4 py-3.5">Action &amp; Target</th>
                <th className="px-4 py-3.5">Reason / Description</th>
                <th className="px-4 py-3.5 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Spinner size="md" className="mx-auto mb-2" />
                    Fetching institute audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldCheck size={36} className="mx-auto mb-2 text-slate-400 opacity-60" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                      No audit log entries found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try selecting another campus or clearing search filters.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const campusName = log.campusId?.name || "Institute Root";
                  const campusCode = log.campusId?.code || "";
                  const actorName = log.performedBy?.name || "System";
                  const actorRole = log.performedBy?.role || "system";
                  const actorEmail = log.performedBy?.email || "";

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatRelativeTime(log.timestamp)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Campus */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant="outline"
                          className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 font-semibold text-xs"
                        >
                          <Building2 size={12} className="mr-1" />
                          {campusName}
                        </Badge>
                      </td>

                      {/* Performed By */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {actorName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span className="capitalize">{actorRole.replace(/_/g, " ")}</span>
                          {actorEmail && <span>• {actorEmail}</span>}
                        </div>
                      </td>

                      {/* Action & Entity */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-[11px] font-bold px-2 py-0.5 border ${getActionBadgeClass(log.action)}`}>
                            {log.action}
                          </Badge>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {log.entityType}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5 max-w-xs text-slate-600 dark:text-slate-300 truncate">
                        {log.reason || `Mutated ${log.entityType} record`}
                      </td>

                      {/* Payload Inspect Button */}
                      <td className="px-4 py-3.5 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg flex items-center gap-1 mx-auto"
                        >
                          <Eye size={13} /> View
                        </Button>
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing Page <strong className="text-slate-900 dark:text-white">{page}</strong> of <strong className="text-slate-900 dark:text-white">{totalPages}</strong> ({totalLogs} total events)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-8 px-3 rounded-xl text-xs"
              >
                <ChevronLeft size={14} className="mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="h-8 px-3 rounded-xl text-xs"
              >
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Audit Event Details
                  </h3>
                  <p className="text-xs text-slate-400">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 font-medium block">Campus Branch:</span>
                <span className="font-bold text-indigo-300 mt-0.5 block">
                  {selectedLog.campusId?.name || "Institute Level"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 font-medium block">Action &amp; Target:</span>
                <span className="font-bold text-white mt-0.5 block capitalize">
                  {selectedLog.action} {selectedLog.entityType}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 font-medium block">Executed By:</span>
                <span className="font-bold text-white mt-0.5 block">
                  {selectedLog.performedBy?.name} ({selectedLog.performedBy?.role})
                </span>
                <span className="text-slate-400 text-[10px]">
                  {selectedLog.performedBy?.email || "No email"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 font-medium block">IP &amp; Client:</span>
                <span className="font-mono text-slate-300 mt-0.5 block truncate">
                  {selectedLog.ipAddress || "Internal Server"}
                </span>
                <span className="text-slate-500 text-[10px] truncate block">
                  {selectedLog.userAgent || "Browser Client"}
                </span>
              </div>
            </div>

            {selectedLog.reason && (
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
                <span className="text-slate-400 font-medium block mb-1">Reason / Note:</span>
                <p className="text-slate-200">{selectedLog.reason}</p>
              </div>
            )}

            {/* Changes JSON payload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-300">Payload &amp; State Changes:</span>
                <button
                  onClick={() => handleCopyJson(selectedLog.changes || selectedLog.metadata)}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-48 border border-slate-800">
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

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                onClick={() => setSelectedLog(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold px-5"
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
