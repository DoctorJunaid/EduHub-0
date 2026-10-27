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

const getCategoryClass = (category = "") => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("medical") || cat.includes("sick")) return "leave-category-medical";
  if (cat.includes("casual")) return "leave-category-casual";
  if (cat.includes("event") || cat.includes("wedding") || cat.includes("family")) return "leave-category-event";
  return "leave-category-default";
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
    <section className={`teacher-leave-card ${className}`}>
      {/* Header */}
      <div className="leave-card-header">
        <div className="leave-card-title-group">
          <div className="leave-card-icon">
            <Clock3 size={18} />
          </div>
          <div className="leave-card-heading-wrap">
            <div className="leave-card-heading-row">
              <h2 className="leave-card-heading">
                Student Leave Requests
              </h2>
              {pendingLeaves.length > 0 ? (
                <span className="leave-pending-badge">
                  {pendingLeaves.length} Pending
                </span>
              ) : (
                <span className="leave-all-reviewed-badge">
                  All Reviewed
                </span>
              )}
            </div>
            <p className="leave-card-subtitle">
              Review absence applications submitted by students. Approvals sync directly to central attendance.
            </p>
          </div>
        </div>

        {/* Tab & Refresh Controls */}
        <div className="leave-card-controls">
          <div className="leave-tabs-pill">
            <button
              type="button"
              onClick={() => setActiveTab("Pending")}
              className={`leave-tab-btn ${activeTab === "Pending" ? "is-active" : ""}`}
            >
              Pending ({pendingLeaves.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Approved")}
              className={`leave-tab-btn ${activeTab === "Approved" ? "is-active" : ""}`}
            >
              Approved ({approvedLeaves.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("All")}
              className={`leave-tab-btn ${activeTab === "All" ? "is-active" : ""}`}
            >
              All ({leavesList.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="leave-refresh-btn"
            title="Refresh leave requests"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="leave-requests-list">
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 size={22} className="animate-spin text-slate-800" />
            <span>Loading leave requests...</span>
          </div>
        ) : displayedLeaves.length === 0 ? (
          <div className="leave-empty-state">
            <div className="leave-empty-icon">
              <ShieldCheck size={20} />
            </div>
            <h3 className="leave-empty-title">
              {activeTab === "Pending"
                ? "No pending leave requests"
                : `No ${activeTab.toLowerCase()} requests found`}
            </h3>
            <p className="leave-empty-desc">
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
              <div key={leave._id} className="leave-request-row">
                {/* Left: Avatar + Student & Reason Info */}
                <div className="leave-row-main">
                  <div className="leave-student-avatar">
                    {initial}
                  </div>

                  <div className="leave-student-info">
                    {/* Top line: Name, roll, class, category */}
                    <div className="leave-info-top">
                      <span className="leave-student-name">
                        {studentName}
                      </span>
                      <span className="leave-meta-badge">
                        {leave.className} {leave.section ? `(${leave.section})` : ""}
                      </span>
                      <span className="leave-roll-badge">
                        Roll #{leave.rollNumber || leave.studentId?.rollNumber || "—"}
                      </span>
                      <span className={`leave-category-pill ${getCategoryClass(leave.category)}`}>
                        {leave.category || "Leave"}
                      </span>
                    </div>

                    {/* Second line: Date & Reason */}
                    <div className="leave-info-bottom">
                      <div className="leave-date-badge">
                        <CalendarDays size={13} />
                        <span>Absence: {formatDate(leave.dateStr)}</span>
                      </div>
                      <div className="leave-reason-pill">
                        <span className="leave-reason-label">Reason:</span>
                        <span className="leave-reason-text">"{leave.reason}"</span>
                      </div>
                      {leave.note && (
                        <div className="leave-note-pill">
                          <Paperclip size={11} />
                          <span>{leave.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions or Status */}
                <div className="leave-row-actions">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleReview(leave._id, "Reject")}
                        className="leave-btn-reject"
                      >
                        {isProcessing ? (
                          <Loader2 size={13} className="animate-spin text-rose-600" />
                        ) : (
                          <X size={14} />
                        )}
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleReview(leave._id, "Approved")}
                        className="leave-btn-approve"
                      >
                        {isProcessing ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        <span>Approve &amp; Sync</span>
                      </button>
                    </>
                  ) : isApproved ? (
                    <span className="leave-status-approved">
                      <CheckCircle2 size={13} />
                      <span>Approved &amp; Synced</span>
                    </span>
                  ) : (
                    <span className="leave-status-rejected">
                      <XCircle size={13} />
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
