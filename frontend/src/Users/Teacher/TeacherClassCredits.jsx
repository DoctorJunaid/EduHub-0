import React, { useCallback, useEffect, useState, useId } from "react";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  Coins,
  TrendingDown,
  UserCheck,
} from "lucide-react";
import { Spinner, SpinnerCustom } from "@/components/ui/spinner";
import {
  getMySessions,
  getMySummary,
  markSessionStatus,
  requestDispute,
} from "@/api/classSession.api";
import { dateKey } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import "./TeacherClassCredits.css";

const formatPKR = (amt) => `PKR ${Number(amt || 0).toLocaleString("en-PK")}`;

export default function TeacherClassCredits() {
  const [activeTab, setActiveTab] = useState("today");
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Filters
  const currentMonthStr = dateKey(new Date()).slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Dispute Dialog State
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [activeDisputeSession, setActiveDisputeSession] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const disputeTextareaId = useId();

  const loadData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      setLoadError("");

      const [sessRes, sumRes] = await Promise.all([
        getMySessions(
          activeTab === "today"
            ? { date: dateKey(new Date()) }
            : { month: selectedMonth },
        ),
        getMySummary({ month: selectedMonth }),
      ]);

      if (sessRes.data?.success) setSessions(sessRes.data.data || []);
      if (sumRes.data?.success) setSummary(sumRes.data.data || null);

      if (showToast) toast.success("Teaching sessions synchronized.");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load teaching records.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedMonth]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleMarkStatus = async (sessionId, status) => {
    try {
      const res = await markSessionStatus(sessionId, { status });
      if (res.data?.success) {
        toast.success(res.data.message || `Class marked as ${status}`);
        loadData();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update class status.",
      );
    }
  };

  const handleOpenDispute = (session) => {
    setActiveDisputeSession(session);
    setDisputeReason("");
    setDisputeOpen(true);
  };

  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      toast.error("Please enter a justification for review.");
      return;
    }

    try {
      setSubmittingDispute(true);
      const res = await requestDispute(activeDisputeSession._id, {
        reason: disputeReason,
      });
      if (res.data?.success) {
        toast.success("Review request submitted to Campus Manager.");
        setDisputeOpen(false);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit dispute.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const getStatusBadge = (session) => {
    const status = session.status;
    if (session.isSubstituted && session.isSubstituteDuty) {
      return (
        <span className="campus-status-pill is-pending">
          Substitution Duty
        </span>
      );
    }
    if (session.isSubstituted && session.isSubstitutedOut) {
      return (
        <span className="campus-status-pill is-pending">
          Substituted Out
        </span>
      );
    }

    switch (status) {
      case "Completed":
        return (
          <span className="campus-status-pill is-active">
            Completed (+{session.creditValue || 1} Cr)
          </span>
        );
      case "Missed":
        return (
          <span className="campus-status-pill is-danger">
            Missed (-{formatPKR(session.deductionValue)})
          </span>
        );
      case "Absent":
        return (
          <span className="campus-status-pill is-danger">
            Absent
          </span>
        );
      case "Approved Adjustment":
        return (
          <span className="campus-status-pill is-pending">
            Approved Adjustment
          </span>
        );
      case "Cancelled":
        return (
          <span className="campus-status-pill">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="campus-status-pill is-active">
            Scheduled
          </span>
        );
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      `${s.subject || ""} ${s.className || ""} ${s.section || ""} ${s.room || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ? true : s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const hasApprovedDeductions = Number(summary?.approvedDeductionsTotal || 0) > 0;

  return (
    <div className="campus-tab-page teacher-credits-page">
      {/* 1. Toolbar Controls (Date/Month & Sync) */}
      <div className="teacher-credits-toolbar">
        <div className="teacher-credits-controls">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="teacher-credits-month"
            aria-label="Select month"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="teacher-credits-sync toolbar-btn-outline flex items-center gap-1.5"
          >
            {refreshing ? (
              <Spinner className="size-3.5" />
            ) : (
              <RefreshCw size={14} />
            )}
            Sync
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards Strip */}
      <div className="campus-kpi-track teacher-credits-kpis">
        {/* Total Credits */}
        <div className="campus-kpi-card teacher-credits-kpi">
          <div className="kpi-wrap">
            <div className="kpi-icon blue">
              <Award size={18} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">TOTAL CREDITS</span>
              <div className="kpi-value">{summary?.totalCredits ?? "—"}</div>
              <span className="kpi-subtext">
                {summary?.regularCredits || 0} Regular +{" "}
                {summary?.substituteCredits || 0} Substitute
              </span>
            </div>
          </div>
        </div>

        {/* Classes Completed */}
        <div className="campus-kpi-card teacher-credits-kpi">
          <div className="kpi-wrap">
            <div className="kpi-icon emerald">
              <CheckCircle2 size={18} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">CLASSES COMPLETED</span>
              <div className="kpi-value">{summary?.completedCount ?? "—"}</div>
              <span className="kpi-subtext">
                of {summary?.scheduledCount || 0} scheduled classes
              </span>
            </div>
          </div>
        </div>

        {/* Substitution Bonus */}
        <div className="campus-kpi-card teacher-credits-kpi">
          <div className="kpi-wrap">
            <div className="kpi-icon amber">
              <Coins size={18} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">SUBSTITUTION BONUS</span>
              <div className="kpi-value text-amber-600">
                +{formatPKR(summary?.totalBonusEarned)}
              </div>
              <span className="kpi-subtext">
                {summary?.substituteDutiesTaken || 0} classes covered
              </span>
            </div>
          </div>
        </div>

        {/* Approved Deductions */}
        <div className="campus-kpi-card teacher-credits-kpi">
          <div className="kpi-wrap">
            <div className={`kpi-icon ${hasApprovedDeductions ? "rose" : "neutral"}`}>
              <TrendingDown size={18} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">APPROVED DEDUCTIONS</span>
              <div
                className={`kpi-value ${
                  hasApprovedDeductions ? "text-rose-600" : ""
                }`}
              >
                -{formatPKR(summary?.approvedDeductionsTotal)}
              </div>
              <span className="kpi-subtext">
                {summary?.missedCount || 0} missed,{" "}
                {summary?.pendingReviewsCount || 0} pending review
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabs Navigation */}
      <div className="teacher-credits-tabs-container">
        <div className="teacher-credits-tabs">
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`teacher-credits-tab ${
              activeTab === "today" ? "is-active" : ""
            }`}
          >
            Today's Scheduled Classes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`teacher-credits-tab ${
              activeTab === "history" ? "is-active" : ""
            }`}
          >
            Monthly Class History &amp; Credits
          </button>
        </div>
      </div>

      {/* 4. Filter and Search Bar for History Tab */}
      {activeTab === "history" && (
        <div className="teacher-credits-filters-container">
          <div className="teacher-credits-filters">
            <div className="relative flex-1 w-full max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Filter by subject, class, or section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="teacher-credits-search w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="teacher-credits-status-filter text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Missed">Missed</option>
                <option value="Absent">Absent</option>
                <option value="Substituted">Substituted</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 5. Main Table Card */}
      <div className="teacher-credits-section-container">
        <div className="campus-table-container teacher-credits-card">
          <div className="teacher-credits-card-header">
            <div className="teacher-credits-card-heading">
              <Clock3 size={16} className="text-blue-600" />
              <h2 className="teacher-credits-card-title">
                {activeTab === "today"
                  ? "Today's Teaching Schedule & Verification"
                  : `Teaching Sessions for ${selectedMonth}`}
              </h2>
            </div>
            <span className="teacher-credits-session-count">
              {filteredSessions.length} sessions listed
            </span>
          </div>

          {loading ? (
            <div className="teacher-credits-state text-center text-slate-500 text-sm">
              <SpinnerCustom
                text="Loading teaching sessions..."
                size="lg"
                className="flex-col gap-2"
              />
            </div>
          ) : loadError ? (
            <div className="teacher-credits-state text-center text-slate-500 text-sm">
              <AlertCircle className="inline-block mb-2 text-rose-500" size={32} />
              <p className="font-semibold text-slate-700">{loadError}</p>
              <span className="text-xs text-slate-400 mt-1 block">
                Use Sync to try again.
              </span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="teacher-credits-state text-center text-slate-400 text-sm">
              <Calendar className="inline-block mb-2 text-slate-300" size={32} />
              <p className="font-semibold text-slate-600">
                No class sessions found
              </p>
              <span className="text-xs text-slate-400 mt-1 block">
                {activeTab === "today"
                  ? "No classes scheduled for today or none assigned."
                  : "Try selecting a different month or search term."}
              </span>
            </div>
          ) : (
            <div className="teacher-table-scroll">
              <table className="teacher-credits-table">
                <thead>
                  <tr>
                    <th>Period &amp; Time</th>
                    <th>Class &amp; Section</th>
                    <th>Subject</th>
                    <th>Role / Assignment</th>
                    <th>Room</th>
                    <th>Status &amp; Credit</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((sess) => (
                    <tr key={sess._id}>
                      <td className="font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                            P{sess.period}
                          </span>
                          <span>
                            {sess.startTime} – {sess.endTime}
                          </span>
                        </div>
                      </td>
                      <td className="font-medium text-slate-800">
                        {sess.className} {sess.section ? `• ${sess.section}` : ""}
                      </td>
                      <td className="font-bold text-slate-900">
                        {sess.subject}
                      </td>
                      <td>
                        {sess.isSubstituteDuty ? (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <UserCheck size={13} /> Substitute for{" "}
                            {sess.originalTeacherId?.name || "Teacher"}
                          </span>
                        ) : sess.isSubstitutedOut ? (
                          <span className="text-amber-700 font-semibold">
                            Substituted by{" "}
                            {sess.actualTeacherId?.name || "Colleague"}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium">
                            Regular Class
                          </span>
                        )}
                      </td>
                      <td className="text-slate-500">
                        {sess.room || "Room not set"}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(sess)}
                          {sess.dispute?.isDisputed && (
                            <span className="text-[10px] text-amber-700 font-semibold">
                              Dispute: {sess.dispute.disputeStatus}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {sess.status === "Scheduled" &&
                            !sess.isSubstitutedOut && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-7 px-2.5 text-xs font-semibold"
                                  onClick={() =>
                                    handleMarkStatus(sess._id, "Completed")
                                  }
                                >
                                  <CheckCircle2 size={13} className="mr-1" />{" "}
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg h-7 px-2 text-xs"
                                  onClick={() =>
                                    handleMarkStatus(sess._id, "Missed")
                                  }
                                >
                                  Missed
                                </Button>
                              </>
                            )}

                          {sess.status === "Completed" && (
                            <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 size={14} /> Completed
                            </span>
                          )}

                          {(sess.status === "Missed" ||
                            sess.status === "Absent") && (
                            <>
                              {!sess.dispute?.isDisputed ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50 rounded-lg h-7 px-2.5 text-xs font-semibold"
                                  onClick={() => handleOpenDispute(sess)}
                                >
                                  Request Review
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-500 italic">
                                  Review Submitted
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review / Dispute Modal */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="teacher-dialog teacher-dialog-compact">
          <DialogHeader>
            <DialogTitle className="teacher-dialog-title-with-icon">
              <AlertCircle size={20} className="text-blue-600" />
              Request Class Record Review
            </DialogTitle>
            <DialogDescription>
              Submit a formal dispute to the Campus Manager if this class was
              conducted or marked in error.
            </DialogDescription>
          </DialogHeader>

          {activeDisputeSession && (
            <div className="teacher-dialog-summary">
              <div>
                <strong className="text-slate-800">Class: </strong>
                {activeDisputeSession.subject} ({activeDisputeSession.className}
                )
              </div>
              <div>
                <strong className="text-slate-800">Scheduled Time: </strong>
                Period {activeDisputeSession.period} (
                {activeDisputeSession.startTime} –{" "}
                {activeDisputeSession.endTime})
              </div>
              <div>
                <strong className="text-slate-800">Current Status: </strong>
                <span className="text-rose-600 font-semibold">
                  {activeDisputeSession.status}
                </span>
              </div>
              <div>
                <strong className="text-slate-800">Proposed Deduction: </strong>
                <span className="text-rose-600 font-semibold">
                  {formatPKR(activeDisputeSession.deductionValue)}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitDispute}>
            <div className="teacher-dialog-body">
              <label
                htmlFor={disputeTextareaId}
              >
                Detailed Justification / Remark
              </label>
              <textarea
                id={disputeTextareaId}
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why this class should not be counted as missed (e.g. attendance recorded late, conducted in lab 2, emergency approved by HOD)..."
                required
              />
            </div>

            <DialogFooter className="teacher-dialog-footer">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDisputeOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingDispute}
                className="toolbar-btn toolbar-btn-primary"
              >
                {submittingDispute ? "Submitting..." : "Submit Review Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
