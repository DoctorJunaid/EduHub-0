import React, { useState, useId } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coins,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  SlidersHorizontal,
  Clock3,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { Spinner, SpinnerCustom } from "@/components/ui/spinner";
import {
  getSalaryReviewCenter,
  reviewAdjustment,
  resolveDispute,
} from "@/api/classSession.api";
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
import { qk } from "@/lib/queryKeys";
import { useDebounce } from "@/hooks/useDebounce";

const formatPKR = (amt) =>
  `PKR ${Number(amt || 0).toLocaleString("en-PK")}`;

export default function SalaryReviewCenter() {
  const queryClient = useQueryClient();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Adjust Amount Dialog State
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [activeItemForAdjust, setActiveItemForAdjust] = useState(null);
  const [adjustedAmount, setAdjustedAmount] = useState("");
  const [adjustRemark, setAdjustRemark] = useState("");

  // Dispute Resolution Dialog State
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [activeItemForDispute, setActiveItemForDispute] = useState(null);
  const [disputeDecision, setDisputeDecision] = useState("Approve");
  const [disputeRemark, setDisputeRemark] = useState("");

  const adjustAmountInputId = useId();
  const adjustRemarkInputId = useId();
  const disputeDecisionSelectId = useId();
  const disputeRemarkInputId = useId();

  // Query review center items
  const {
    data: items = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: qk.payrollReview({ month: selectedMonth, status: statusFilter }),
    queryFn: async () => {
      const res = await getSalaryReviewCenter({
        month: selectedMonth,
        status: statusFilter,
      });
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const loadItems = async (showToast = false) => {
    await refetch();
    if (showToast) toast.success("Review center items synchronized.");
  };

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await reviewAdjustment(id, payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      toast.success(
        variables.payload.action === "Adjust"
          ? "Adjustment amount updated successfully."
          : `Adjustment ${variables.payload.action.toLowerCase()}d successfully.`
      );
      queryClient.invalidateQueries({ queryKey: ["payroll-review"] });
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update adjustment.");
    },
  });

  // Dispute mutation
  const disputeMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await resolveDispute(id, payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Dispute resolved as ${variables.payload.decision}.`);
      queryClient.invalidateQueries({ queryKey: ["payroll-review"] });
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to resolve dispute.");
    },
  });

  const savingAdjust = reviewMutation.isPending;
  const savingDispute = disputeMutation.isPending;

  const handleSimpleReview = (item, action) => {
    reviewMutation.mutate({
      id: item._id,
      payload: {
        action,
        remark: `${action} by Campus Manager`,
      },
    });
  };

  const handleOpenAdjust = (item) => {
    setActiveItemForAdjust(item);
    setAdjustedAmount(String(item.amount || 0));
    setAdjustRemark("");
    setAdjustOpen(true);
  };

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    if (!adjustedAmount || isNaN(adjustedAmount)) {
      toast.error("Please enter a valid amount.");
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: activeItemForAdjust._id,
        payload: {
          action: "Adjust",
          adjustedAmount: Number(adjustedAmount),
          remark: adjustRemark || "Amount adjusted by Campus Manager",
        },
      });
      setAdjustOpen(false);
    } catch {
      // Handled in onError
    }
  };

  const handleOpenDispute = (item) => {
    setActiveItemForDispute(item);
    setDisputeDecision("Approve");
    setDisputeRemark("");
    setDisputeOpen(true);
  };

  const handleSaveDispute = async (e) => {
    e.preventDefault();
    try {
      await disputeMutation.mutateAsync({
        id: activeItemForDispute._id,
        payload: {
          decision: disputeDecision,
          resolutionRemark: disputeRemark || `Dispute ${disputeDecision.toLowerCase()}d`,
          adjustedStatus: disputeDecision === "Approve" ? "Approved Adjustment" : "Missed",
          adjustedDeduction: disputeDecision === "Approve" ? 0 : activeItemForDispute.amount,
        },
      });
      setDisputeOpen(false);
    } catch {
      // Handled in onError
    }
  };

  const pendingDeductionsTotal = items
    .filter((i) => i.type === "Deduction" && i.reviewStatus === "Pending Review")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const pendingBonusesTotal = items
    .filter((i) => i.type === "Bonus" && i.reviewStatus === "Pending Review")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const pendingDisputesCount = items.filter(
    (i) => i.disputeStatus === "Pending"
  ).length;

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      `${item.teacher?.name || ""} ${item.subject || ""} ${item.className || ""} ${item.disputeReason || ""}`
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase());
    const matchesType =
      typeFilter === "All" ? true : item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Financial Governance &amp; Payroll Integrity
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Salary Adjustment &amp; Dispute Review Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review proposed missed lecture deductions, substitution bonuses, and teacher dispute appeals before payroll finalization.
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
            onClick={() => loadItems(true)}
            disabled={loading}
            className="rounded-xl text-xs flex items-center gap-1.5"
          >
            {loading ? <Spinner className="size-3.5" /> : <RefreshCw size={14} />}
            Sync
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Pending Deductions
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600">
              {formatPKR(pendingDeductionsTotal)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              from missed or unconducted periods
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
              Pending Substitute Bonuses
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Coins size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-700">
              +{formatPKR(pendingBonusesTotal)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              from completed substitution duties
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Pending Teacher Disputes
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-700">
              {pendingDisputesCount} Appeals
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              requiring manager resolution
            </span>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {["Pending", "Approved", "Rejected", "All"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                statusFilter === tab
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab === "Pending" ? "Pending Actions" : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Filter teacher, class, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700"
          >
            <option value="All">All Types</option>
            <option value="Deduction">Missed Deductions</option>
            <option value="Bonus">Substitution Bonuses</option>
            <option value="Teacher Dispute">Teacher Disputes</option>
          </select>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            {filteredItems.length} adjustment records found
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <SpinnerCustom text="Loading salary adjustment items..." size="lg" className="flex-col gap-2" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="inline-block mb-2 text-emerald-400" size={32} />
            <p className="font-semibold text-slate-600">No review items pending</p>
            <span className="text-slate-400 mt-1 block">
              All class sessions and adjustments are clear for this filter.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Class &amp; Time</th>
                  <th className="py-3 px-4">Adjustment Type</th>
                  <th className="py-3 px-4">Details / Teacher Excuse</th>
                  <th className="py-3 px-4 text-right">Proposed Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Manager Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div>
                        <strong className="block text-slate-900 font-bold">
                          {item.teacher?.name || "Teacher"}
                        </strong>
                        <span className="text-[11px] text-slate-500">
                          {item.teacher?.department || "Faculty"} • {item.teacher?.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div>
                        <strong className="block text-slate-800">
                          {item.subject} ({item.className})
                        </strong>
                        <span className="text-[11px] text-slate-500">
                          {new Date(item.date).toLocaleDateString()} • Period {item.period} ({item.startTime})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.type === "Bonus"
                            ? "bg-purple-100 text-purple-800"
                            : item.type === "Teacher Dispute"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {item.disputeReason ? (
                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900">
                          <strong className="block text-[10px] uppercase font-bold text-amber-700">
                            Teacher Appeal:
                          </strong>
                          <span className="italic">"{item.disputeReason}"</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">
                          {item.remarks || item.reviewRemark || "Standard system adjustment calculation"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-black">
                      {item.type === "Bonus" ? (
                        <span className="text-purple-700 text-sm">
                          +{formatPKR(item.amount)}
                        </span>
                      ) : item.amount > 0 ? (
                        <span className="text-rose-600 text-sm">
                          -{formatPKR(item.amount)}
                        </span>
                      ) : (
                        <span className="text-slate-400">PKR 0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.reviewStatus === "Approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.reviewStatus === "Rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.reviewStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.type === "Teacher Dispute" ? (
                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg h-7 px-2.5 text-xs font-semibold"
                            onClick={() => handleOpenDispute(item)}
                          >
                            Resolve Appeal
                          </Button>
                        ) : (
                          <>
                            {item.reviewStatus === "Pending Review" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-7 px-2 text-xs font-semibold"
                                  onClick={() => handleSimpleReview(item, "Approve")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg h-7 px-2 text-xs font-semibold"
                                  onClick={() => handleOpenAdjust(item)}
                                >
                                  Adjust
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg h-7 px-2 text-xs"
                                  onClick={() => handleSimpleReview(item, "Reject")}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {item.reviewStatus === "Approved" && (
                              <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1">
                                <CheckCircle2 size={13} /> Approved
                              </span>
                            )}
                            {item.reviewStatus === "Rejected" && (
                              <span className="text-rose-600 text-xs font-semibold">
                                Rejected
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

      {/* Adjust Amount Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal size={20} className="text-blue-600" />
              Adjust Adjustment Amount
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Override the proposed penalty or bonus amount for this lecture period.
            </DialogDescription>
          </DialogHeader>

          {activeItemForAdjust && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 mb-2">
              <div>
                <strong className="text-slate-800">Teacher: </strong>
                {activeItemForAdjust.teacher?.name}
              </div>
              <div>
                <strong className="text-slate-800">Class: </strong>
                {activeItemForAdjust.subject} ({activeItemForAdjust.className})
              </div>
              <div>
                <strong className="text-slate-800">Type: </strong>
                {activeItemForAdjust.type}
              </div>
            </div>
          )}

          <form onSubmit={handleSaveAdjust} className="space-y-4">
            <div>
              <label
                htmlFor={adjustAmountInputId}
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Revised Amount (PKR)
              </label>
              <input
                id={adjustAmountInputId}
                type="number"
                min="0"
                value={adjustedAmount}
                onChange={(e) => setAdjustedAmount(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor={adjustRemarkInputId}
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Adjustment Justification / Remark
              </label>
              <input
                id={adjustRemarkInputId}
                type="text"
                placeholder="Reason for changing amount (e.g. partial period attended, special grant)..."
                value={adjustRemark}
                onChange={(e) => setAdjustRemark(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingAdjust}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                {savingAdjust ? "Saving..." : "Save Adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resolve Dispute Dialog */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-600" />
              Resolve Teacher Dispute
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Evaluate the teacher's appeal. Approving it removes the deduction and awards teaching credit.
            </DialogDescription>
          </DialogHeader>

          {activeItemForDispute && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 mb-2">
              <div>
                <strong className="text-slate-800">Teacher: </strong>
                {activeItemForDispute.teacher?.name}
              </div>
              <div>
                <strong className="text-slate-800">Class: </strong>
                {activeItemForDispute.subject} ({activeItemForDispute.className})
              </div>
              <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 mt-2">
                <strong className="block text-[10px] uppercase font-bold text-amber-700">
                  Teacher's Stated Reason:
                </strong>
                <span className="italic">"{activeItemForDispute.disputeReason}"</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveDispute} className="space-y-4">
            <div>
              <label
                htmlFor={disputeDecisionSelectId}
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Decision
              </label>
              <select
                id={disputeDecisionSelectId}
                value={disputeDecision}
                onChange={(e) => setDisputeDecision(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Approve">Approve Appeal (Clear Deduction &amp; Award Credit)</option>
                <option value="Reject">Reject Appeal (Confirm Salary Deduction)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor={disputeRemarkInputId}
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Manager Remarks / Resolution Note
              </label>
              <textarea
                id={disputeRemarkInputId}
                rows={3}
                placeholder="Explanation of manager resolution..."
                value={disputeRemark}
                onChange={(e) => setDisputeRemark(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
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
                disabled={savingDispute}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
              >
                {savingDispute ? "Processing..." : "Confirm Resolution"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
