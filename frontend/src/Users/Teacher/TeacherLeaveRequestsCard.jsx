import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  Paperclip,
  Check,
  X,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { getTeacherLeavesApi, reviewTeacherLeaveApi } from "@/api/studentLeave.api";
import toast from "react-hot-toast";
import "./TeacherLeaveRequestsCard.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export default function TeacherLeaveRequestsCard({ className = "" }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Pending");
  const [reviewingId, setReviewingId] = useState(null);

  // 1. Fetch Teacher Leave Requests
  const {
    data: leaves = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["teacher", "leave-requests"],
    queryFn: async () => {
      const res = await getTeacherLeavesApi();
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      return [];
    },
    staleTime: 30 * 1000,
  });

  // 2. Review Mutation (Approve / Reject)
  const reviewMutation = useMutation({
    mutationFn: ({ id, status, remarks }) => reviewTeacherLeaveApi(id, { status, remarks }),
    onSuccess: (res, vars) => {
      const isApproved = vars.status === "Approved";
      toast.success(
        isApproved
          ? "Leave approved! Central Campus Manager database synced to 'Excused'."
          : "Leave request rejected."
      );
      setReviewingId(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["teacher", "attendance"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "myClass"] });
      queryClient.invalidateQueries({ queryKey: ["campus-admin"] });
      queryClient.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to process review.");
      setReviewingId(null);
    },
  });

  const handleReview = (id, status) => {
    setReviewingId(id);
    reviewMutation.mutate({ id, status });
  };

  const leavesList = Array.isArray(leaves)
    ? leaves
    : Array.isArray(leaves?.data)
    ? leaves.data
    : [];

  const pendingLeaves = leavesList.filter((l) => l && l.status === "Pending");
  const approvedLeaves = leavesList.filter((l) => l && l.status === "Approved");

  const displayedLeaves =
    activeTab === "Pending"
      ? pendingLeaves
      : activeTab === "Approved"
      ? approvedLeaves
      : leavesList;

  return (
    <section
      className={`teacher-leave-card w-full bg-white border border-neutral-200 rounded-xl shadow-xs ${className}`}
      style={{ padding: "20px 24px", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div
        className="leave-card-header flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100"
        style={{ gap: "14px" }}
      >
        <div className="leave-card-title-group flex items-center min-w-0" style={{ gap: "12px" }}>
          <div
            className="leave-card-icon rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
            style={{ width: "38px", height: "38px" }}
          >
            <Clock3 className="w-4 h-4 text-neutral-700 stroke-[1.75]" />
          </div>
          <div className="leave-card-heading-wrap flex flex-col min-w-0" style={{ gap: "2px" }}>
            <div className="leave-card-heading-row flex items-center flex-wrap" style={{ gap: "8px" }}>
              <h2 className="leave-card-heading text-base font-bold text-neutral-900 tracking-tight">
                Student Leave Requests
              </h2>
              {pendingLeaves.length > 0 ? (
                <span
                  className="leave-pending-badge inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-medium"
                  style={{ padding: "2px 8px" }}
                >
                  {pendingLeaves.length} Pending
                </span>
              ) : (
                <span
                  className="leave-all-reviewed-badge inline-flex items-center rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200 text-[11px] font-medium"
                  style={{ padding: "2px 8px" }}
                >
                  All Reviewed
                </span>
              )}
            </div>
            <p className="leave-card-subtitle text-xs text-neutral-500">
              Review absence applications submitted by students. Approvals sync directly to central attendance.
            </p>
          </div>
        </div>

        {/* Tab & Refresh Controls */}
        <div className="leave-card-controls flex items-center justify-between w-full sm:w-auto shrink-0" style={{ gap: "8px", marginBottom: "12px" }}>
          <div
            className="leave-tabs-pill inline-flex items-center rounded-lg bg-neutral-100 border border-neutral-200 min-w-0"
            style={{ padding: "3px", gap: "2px" }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("Pending")}
              className={`leave-tab-btn rounded-md text-xs transition-colors whitespace-nowrap ${
                activeTab === "Pending"
                  ? "bg-white text-neutral-900 font-semibold shadow-xs border border-neutral-200/60"
                  : "text-neutral-600 hover:text-neutral-900 font-medium"
              }`}
              style={{ height: "28px", padding: "0 8px" }}
            >
              Pending ({pendingLeaves.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Approved")}
              className={`leave-tab-btn rounded-md text-xs transition-colors whitespace-nowrap ${
                activeTab === "Approved"
                  ? "bg-white text-neutral-900 font-semibold shadow-xs border border-neutral-200/60"
                  : "text-neutral-600 hover:text-neutral-900 font-medium"
              }`}
              style={{ height: "28px", padding: "0 8px" }}
            >
              Approved ({approvedLeaves.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("All")}
              className={`leave-tab-btn rounded-md text-xs transition-colors whitespace-nowrap ${
                activeTab === "All"
                  ? "bg-white text-neutral-900 font-semibold shadow-xs border border-neutral-200/60"
                  : "text-neutral-600 hover:text-neutral-900 font-medium"
              }`}
              style={{ height: "28px", padding: "0 8px" }}
            >
              All ({leavesList.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="leave-refresh-btn inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 transition-colors shadow-xs shrink-0"
            style={{ width: "32px", height: "32px" }}
            title="Refresh leave requests"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="leave-requests-list flex flex-col" style={{ gap: "10px", marginTop: "16px" }}>
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center text-neutral-400 text-xs gap-2">
            <Loader2 size={22} className="animate-spin text-neutral-800" />
            <span>Loading leave requests...</span>
          </div>
        ) : displayedLeaves.length === 0 ? (
          <div
            className="leave-empty-state rounded-xl border border-dashed border-neutral-200 flex flex-col items-center justify-center text-center bg-neutral-50/50"
            style={{ padding: "32px 20px" }}
          >
            <div
              className="leave-empty-icon rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600"
              style={{ width: "40px", height: "40px", marginBottom: "8px" }}
            >
              <ShieldCheck size={18} />
            </div>
            <h3 className="leave-empty-title text-sm font-semibold text-neutral-800 m-0">
              {activeTab === "Pending"
                ? "No pending leave requests"
                : `No ${activeTab.toLowerCase()} requests found`}
            </h3>
            <p className="leave-empty-desc text-xs text-neutral-500 mt-1 max-w-md">
              {activeTab === "Pending"
                ? "All student absence applications have been reviewed. When students apply for leave, they will appear here immediately."
                : "Student leave records will populate here once applications are submitted."}
            </p>
          </div>
        ) : (
          displayedLeaves.map((leave) => {
            if (!leave) return null;
            const isProcessing = reviewingId === leave._id;
            const isPending = leave.status === "Pending";
            const isApproved = leave.status === "Approved";
            const studentName = leave.studentName || leave.studentId?.name || "Student";
            const initial = String(studentName).charAt(0).toUpperCase() || "S";

            return (
              <div
                key={leave._id}
                className="leave-request-row w-full bg-white border border-neutral-200 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between transition-colors hover:bg-neutral-50/40"
                style={{ padding: "14px 18px", gap: "14px", boxSizing: "border-box" }}
              >
                {/* Left: Avatar + Student & Reason Info */}
                <div className="leave-row-main flex items-start sm:items-center min-w-0 flex-1" style={{ gap: "14px" }}>
                  <div
                    className="leave-student-avatar rounded-full bg-neutral-900 text-white font-semibold flex items-center justify-center shrink-0 text-xs"
                    style={{ width: "40px", height: "40px" }}
                  >
                    {initial}
                  </div>

                  <div className="leave-student-info flex flex-col min-w-0 flex-1" style={{ gap: "6px" }}>
                    {/* Top line: Name, roll, class, category */}
                    <div className="leave-info-top flex items-center flex-wrap" style={{ gap: "6px" }}>
                      <span className="leave-student-name text-sm font-bold text-neutral-900">
                        {studentName}
                      </span>
                      <span
                        className="leave-meta-badge inline-flex items-center rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200 text-[11px] font-medium"
                        style={{ padding: "1px 7px" }}
                      >
                        {leave.className} {leave.section ? `(${leave.section})` : ""}
                      </span>
                      <span
                        className="leave-roll-badge inline-flex items-center rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200 text-[11px] font-medium"
                        style={{ padding: "1px 7px" }}
                      >
                        Roll #{leave.rollNumber || leave.studentId?.rollNumber || "—"}
                      </span>
                      <span
                        className="leave-category-pill inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-medium"
                        style={{ padding: "1px 8px" }}
                      >
                        {leave.category || "Leave"}
                      </span>
                    </div>

                    {/* Second line: Date & Reason */}
                    <div className="leave-info-bottom flex items-center flex-wrap" style={{ gap: "8px" }}>
                      <div
                        className="leave-date-badge inline-flex items-center rounded-md bg-white text-neutral-700 border border-neutral-200 text-xs font-medium"
                        style={{ padding: "3px 8px", gap: "5px" }}
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-neutral-500 stroke-[1.75]" />
                        <span>Absence: {formatDate(leave.dateStr)}</span>
                      </div>
                      <div
                        className="leave-reason-pill inline-flex items-center rounded-md bg-neutral-50 text-neutral-700 border border-neutral-200 text-xs"
                        style={{ padding: "3px 10px", gap: "6px" }}
                      >
                        <span className="leave-reason-label font-semibold text-neutral-800">Reason:</span>
                        <span className="leave-reason-text italic text-neutral-600">"{leave.reason}"</span>
                      </div>
                      {leave.note && (
                        <div
                          className="leave-note-pill inline-flex items-center text-xs text-neutral-500 italic"
                          style={{ gap: "4px" }}
                        >
                          <Paperclip className="w-3 h-3 text-neutral-400" />
                          <span>{leave.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions or Status */}
                <div
                  className={`leave-row-actions ${
                    isPending
                      ? "grid grid-cols-2 sm:flex sm:items-center sm:justify-end w-full sm:w-auto"
                      : "flex items-center justify-start sm:justify-end w-full sm:w-auto"
                  }`}
                  style={{ gap: "10px", marginTop: "12px" }}
                >
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleReview(leave._id, "Reject")}
                        className="leave-btn-reject inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs w-full sm:w-auto"
                        style={{ height: "38px", padding: "0 14px", gap: "6px", boxSizing: "border-box" }}
                      >
                        {isProcessing ? (
                          <Loader2 size={13} className="animate-spin text-neutral-700" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-neutral-600 stroke-[1.75]" />
                        )}
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleReview(leave._id, "Approved")}
                        className="leave-btn-approve inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs w-full sm:w-auto"
                        style={{ height: "38px", padding: "0 14px", gap: "6px", boxSizing: "border-box" }}
                      >
                        {isProcessing ? (
                          <Loader2 size={13} className="animate-spin text-white" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-white stroke-[2]" />
                        )}
                        <span>Approve &amp; Sync</span>
                      </button>
                    </>
                  ) : isApproved ? (
                    <span
                      className="leave-status-approved inline-flex items-center rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-medium"
                      style={{ height: "36px", padding: "0 12px", gap: "6px" }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700 stroke-[1.75]" />
                      <span>Approved &amp; Synced</span>
                    </span>
                  ) : (
                    <span
                      className="leave-status-rejected inline-flex items-center rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200 text-xs font-medium"
                      style={{ height: "36px", padding: "0 12px", gap: "6px" }}
                    >
                      <XCircle className="w-3.5 h-3.5 text-neutral-500 stroke-[1.75]" />
                      <span>Rejected</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
