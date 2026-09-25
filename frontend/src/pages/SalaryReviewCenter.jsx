import React, { useEffect, useState, useId } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Coins,
  TrendingDown,
  RefreshCw,
  Search,
  SlidersHorizontal,
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
import "./SalaryReviewCenter.css";

const formatPKR = (amt) =>
  `PKR ${Number(amt || 0).toLocaleString("en-PK")}`;

export default function SalaryReviewCenter() {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Adjust Amount Dialog State
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [activeItemForAdjust, setActiveItemForAdjust] = useState(null);
  const [adjustedAmount, setAdjustedAmount] = useState("");
  const [adjustRemark, setAdjustRemark] = useState("");
  const [savingAdjust, setSavingAdjust] = useState(false);

  // Dispute Resolution Dialog State
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [activeItemForDispute, setActiveItemForDispute] = useState(null);
  const [disputeDecision, setDisputeDecision] = useState("Approve");
  const [disputeRemark, setDisputeRemark] = useState("");
  const [savingDispute, setSavingDispute] = useState(false);

  const adjustAmountInputId = useId();
  const adjustRemarkInputId = useId();
  const disputeDecisionSelectId = useId();
  const disputeRemarkInputId = useId();

  const loadItems = async (showToast = false) => {
    try {
      setLoading(true);
      const res = await getSalaryReviewCenter({
        month: selectedMonth,
        status: statusFilter,
      });
      if (res.data?.success) {
        setItems(res.data.data || []);
        if (showToast) toast.success("Review center items synchronized.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load review center items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [selectedMonth, statusFilter]);

  const handleSimpleReview = async (item, action) => {
    try {
      const res = await reviewAdjustment(item._id, {
        action,
        remark: `${action} by Campus Manager`,
      });
      if (res.data?.success) {
        toast.success(`Adjustment ${action.toLowerCase()}d successfully.`);
        loadItems();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update adjustment.");
    }
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
      setSavingAdjust(true);
      const res = await reviewAdjustment(activeItemForAdjust._id, {
        action: "Adjust",
        adjustedAmount: Number(adjustedAmount),
        remark: adjustRemark || "Amount adjusted by Campus Manager",
      });

      if (res.data?.success) {
        toast.success("Adjustment amount updated successfully.");
        setAdjustOpen(false);
        loadItems();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to adjust amount.");
    } finally {
      setSavingAdjust(false);
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
      setSavingDispute(true);
      const res = await resolveDispute(activeItemForDispute._id, {
        decision: disputeDecision,
        resolutionRemark: disputeRemark || `Dispute ${disputeDecision.toLowerCase()}d`,
        adjustedStatus: disputeDecision === "Approve" ? "Approved Adjustment" : "Missed",
        adjustedDeduction: disputeDecision === "Approve" ? 0 : activeItemForDispute.amount,
      });

      if (res.data?.success) {
        toast.success(`Dispute resolved as ${disputeDecision}.`);
        setDisputeOpen(false);
        loadItems();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve dispute.");
    } finally {
      setSavingDispute(false);
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
        .includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === "All" ? true : item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="salary-review-page campus-tab-page">
      <div className="salary-review-heading">
        <nav className="salary-review-breadcrumb" aria-label="Breadcrumb">
          <span>Home</span><span aria-hidden="true">/</span><span aria-current="page">Salary Review Center</span>
        </nav>
      </div>

      <div className="salary-review-kpis campus-kpi-track">
        <div className="salary-review-kpi campus-kpi-card">
          <div>
            <span className="salary-review-kpi-label">Pending Deductions</span>
            <strong>{formatPKR(pendingDeductionsTotal)}</strong>
            <small>From missed or unconducted periods</small>
          </div>
          <span className="salary-review-kpi-icon"><TrendingDown size={17} /></span>
        </div>
        <div className="salary-review-kpi campus-kpi-card">
          <div>
            <span className="salary-review-kpi-label">Pending Substitute Bonuses</span>
            <strong>+{formatPKR(pendingBonusesTotal)}</strong>
            <small>From completed substitution duties</small>
          </div>
          <span className="salary-review-kpi-icon"><Coins size={17} /></span>
        </div>
        <div className="salary-review-kpi campus-kpi-card">
          <div>
            <span className="salary-review-kpi-label">Pending Teacher Disputes</span>
            <strong>{pendingDisputesCount} Appeals</strong>
            <small>Requiring manager resolution</small>
          </div>
          <span className="salary-review-kpi-icon"><AlertCircle size={17} /></span>
        </div>
      </div>

      <div className="salary-review-month-row">
        <label htmlFor="salary-review-month">Review month</label>
        <div className="salary-review-month-controls">
          <input
            id="salary-review-month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="salary-review-month-input"
          />
          <Button
            variant="outline"
            onClick={() => loadItems(true)}
            disabled={loading}
            className="salary-review-sync-btn"
          >
            {loading ? <Spinner className="size-3.5" /> : <RefreshCw size={14} />}
            Sync
          </Button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="salary-review-controls">
        <div className="salary-review-tabs">
          {["Pending", "Approved", "Rejected", "All"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`salary-review-tab ${statusFilter === tab ? "is-active" : ""}`}
            >
              {tab === "Pending" ? "Pending Actions" : tab}
            </button>
          ))}
        </div>

        <div className="salary-review-filters">
          <div className="salary-review-search">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Filter teacher, class, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="salary-review-search-input"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="salary-review-type-filter"
          >
            <option value="All">All Types</option>
            <option value="Deduction">Missed Deductions</option>
            <option value="Bonus">Substitution Bonuses</option>
            <option value="Teacher Dispute">Teacher Disputes</option>
          </select>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="salary-review-table-wrap">
        <div className="salary-review-table-summary">
          <span>
            {filteredItems.length} adjustment records found
          </span>
        </div>

        {loading ? (
          <div className="salary-review-state">
            <RefreshCw className="animate-spin inline-block mr-2" size={16} />
            Loading salary adjustment items...
          <div className="p-12 text-center text-slate-500 text-xs">
            <SpinnerCustom text="Loading salary adjustment items..." size="lg" className="flex-col gap-2" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="salary-review-state">
            <CheckCircle2 className="salary-review-empty-icon" size={28} />
            <p>No review items pending</p>
            <span>
              All class sessions and adjustments are clear for this filter.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="salary-review-table">
              <thead>
                <tr>
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
                  <tr key={item._id}>
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
                        className={`salary-review-type-badge ${item.type === "Bonus" ? "is-bonus" : item.type === "Teacher Dispute" ? "is-dispute" : "is-deduction"}`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {item.disputeReason ? (
                        <div className="salary-review-appeal">
                          <strong>
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
                        <span className="salary-review-amount">
                          +{formatPKR(item.amount)}
                        </span>
                      ) : item.amount > 0 ? (
                        <span className="salary-review-amount">
                          -{formatPKR(item.amount)}
                        </span>
                      ) : (
                        <span className="text-slate-400">PKR 0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className="salary-review-status"
                      >
                        {item.reviewStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.type === "Teacher Dispute" ? (
                          <Button
                            size="sm"
                            className="salary-review-btn salary-review-btn-primary"
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
                                  className="salary-review-btn salary-review-btn-primary"
                                  onClick={() => handleSimpleReview(item, "Approve")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="salary-review-btn salary-review-btn-outline"
                                  onClick={() => handleOpenAdjust(item)}
                                >
                                  Adjust
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="salary-review-btn salary-review-btn-danger"
                                  onClick={() => handleSimpleReview(item, "Reject")}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {item.reviewStatus === "Approved" && (
                              <span className="salary-review-action-result">
                                <CheckCircle2 size={13} /> Approved
                              </span>
                            )}
                            {item.reviewStatus === "Rejected" && (
                              <span className="salary-review-action-result">
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
        <DialogContent className="salary-review-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal size={18} />
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
                className="salary-review-dialog-input"
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
                className="salary-review-dialog-input"
              />
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustOpen(false)}
                className="salary-review-btn salary-review-btn-outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingAdjust}
                className="salary-review-btn salary-review-btn-primary"
              >
                {savingAdjust ? "Saving..." : "Save Adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resolve Dispute Dialog */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="salary-review-dialog">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle size={18} />
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
              <div className="salary-review-appeal">
                <strong>
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
                className="salary-review-dialog-input"
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
                className="salary-review-dialog-input"
                required
              />
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDisputeOpen(false)}
                className="salary-review-btn salary-review-btn-outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingDispute}
                className="salary-review-btn salary-review-btn-primary"
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
