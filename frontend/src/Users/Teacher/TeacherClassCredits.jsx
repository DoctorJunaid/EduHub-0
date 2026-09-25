import React, { useEffect, useState, useId } from "react";
import { useSelector } from "react-redux";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  MessageSquare,
  HelpCircle,
  Coins,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import {
  getMySessions,
  getMySummary,
  markSessionStatus,
  requestDispute,
} from "@/api/classSession.api";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

const formatPKR = (amt) =>
  `PKR ${Number(amt || 0).toLocaleString("en-PK")}`;

export default function TeacherClassCredits() {
  const currentUser = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState("today");
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Dispute Dialog State
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [activeDisputeSession, setActiveDisputeSession] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const disputeTextareaId = useId();

  const loadData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const [sessRes, sumRes] = await Promise.all([
        getMySessions(
          activeTab === "today"
            ? { date: new Date().toISOString().split("T")[0] }
            : { month: selectedMonth }
        ),
        getMySummary({ month: selectedMonth }),
      ]);

      if (sessRes.data?.success) setSessions(sessRes.data.data || []);
      if (sumRes.data?.success) setSummary(sumRes.data.data || null);

      if (showToast) toast.success("Teaching sessions synchronized.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load teaching records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, activeTab]);

  const handleMarkStatus = async (sessionId, status) => {
    try {
      const res = await markSessionStatus(sessionId, { status });
      if (res.data?.success) {
        toast.success(res.data.message || `Class marked as ${status}`);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update class status.");
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          Substitution Duty
        </span>
      );
    }
    if (session.isSubstituted && session.isSubstitutedOut) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          Substituted Out
        </span>
      );
    }

    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Completed (+{session.creditValue || 1} Cr)
          </span>
        );
      case "Missed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Missed (-{formatPKR(session.deductionValue)})
          </span>
        );
      case "Absent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Absent
          </span>
        );
      case "Approved Adjustment":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Approved Adjustment
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
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

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
            Faculty Teaching Credit Portal
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Teaching Credits &amp; Sessions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily completed periods, substitution duties, teaching credits, and salary adjustments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Sync
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Credits
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">
              {summary?.totalCredits ?? "—"}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {summary?.regularCredits || 0} Regular + {summary?.substituteCredits || 0} Substitute
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Classes Completed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-600">
              {summary?.completedCount ?? "—"}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              of {summary?.scheduledCount || 0} scheduled classes
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Substitution Bonus
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Coins size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-700">
              +{formatPKR(summary?.totalBonusEarned)}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {summary?.substituteDutiesTaken || 0} classes covered
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Approved Deductions
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600">
              -{formatPKR(summary?.approvedDeductionsTotal)}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {summary?.missedCount || 0} missed, {summary?.pendingReviewsCount || 0} pending review
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("today")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "today"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Today's Scheduled Classes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Monthly Class History &amp; Credits
        </button>
      </div>

      {/* Filter and Search Bar for History Tab */}
      {activeTab === "history" && (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
          <div className="relative flex-1 w-full">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Filter by subject, class, or section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-700"
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
      )}

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock3 size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">
              {activeTab === "today"
                ? "Today's Teaching Schedule & Verification"
                : `Teaching Sessions for ${selectedMonth}`}
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filteredSessions.length} sessions listed
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="animate-spin inline-block mr-2" size={16} />
            Loading teaching sessions...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Calendar className="inline-block mb-2 text-slate-300" size={32} />
            <p className="font-semibold text-slate-600">No class sessions found</p>
            <span className="text-xs text-slate-400 mt-1 block">
              {activeTab === "today"
                ? "No classes scheduled for today or none assigned."
                : "Try selecting a different month or search term."}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Period &amp; Time</th>
                  <th className="py-3.5 px-4">Class &amp; Section</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Role / Assignment</th>
                  <th className="py-3.5 px-4">Room</th>
                  <th className="py-3.5 px-4">Status &amp; Credit</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSessions.map((sess) => (
                  <tr
                    key={sess._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center">
                          P{sess.period}
                        </span>
                        <span>
                          {sess.startTime} – {sess.endTime}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                      {sess.className} {sess.section ? `• ${sess.section}` : ""}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {sess.subject}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {sess.isSubstituteDuty ? (
                        <span className="text-purple-700 font-semibold flex items-center gap-1">
                          <UserCheck size={13} /> Substitute for{" "}
                          {sess.originalTeacherId?.name || "Teacher"}
                        </span>
                      ) : sess.isSubstitutedOut ? (
                        <span className="text-amber-700 font-semibold">
                          Substituted by {sess.actualTeacherId?.name || "Colleague"}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium">Regular Class</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {sess.room || "Room 101"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(sess)}
                        {sess.dispute?.isDisputed && (
                          <span className="text-[10px] text-amber-700 font-semibold">
                            Dispute: {sess.dispute.disputeStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {sess.status === "Scheduled" && !sess.isSubstitutedOut && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-7 px-2.5 text-xs font-semibold"
                              onClick={() => handleMarkStatus(sess._id, "Completed")}
                            >
                              <CheckCircle2 size={13} className="mr-1" /> Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg h-7 px-2 text-xs"
                              onClick={() => handleMarkStatus(sess._id, "Missed")}
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

                        {(sess.status === "Missed" || sess.status === "Absent") && (
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

      {/* Review / Dispute Modal */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle size={20} className="text-blue-600" />
              Request Class Record Review
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Submit a formal dispute to the Campus Manager if this class was conducted or marked in error.
            </DialogDescription>
          </DialogHeader>

          {activeDisputeSession && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 mb-3">
              <div>
                <strong className="text-slate-800">Class: </strong>
                {activeDisputeSession.subject} ({activeDisputeSession.className})
              </div>
              <div>
                <strong className="text-slate-800">Scheduled Time: </strong>
                Period {activeDisputeSession.period} ({activeDisputeSession.startTime} – {activeDisputeSession.endTime})
              </div>
              <div>
                <strong className="text-slate-800">Current Status: </strong>
                <span className="text-rose-600 font-semibold">{activeDisputeSession.status}</span>
              </div>
              <div>
                <strong className="text-slate-800">Proposed Deduction: </strong>
                <span className="text-rose-600 font-semibold">{formatPKR(activeDisputeSession.deductionValue)}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitDispute} className="space-y-4">
            <div>
              <label
                htmlFor={disputeTextareaId}
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Detailed Justification / Remark
              </label>
              <textarea
                id={disputeTextareaId}
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why this class should not be counted as missed (e.g. attendance recorded late, conducted in lab 2, emergency approved by HOD)..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDisputeOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingDispute}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
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
