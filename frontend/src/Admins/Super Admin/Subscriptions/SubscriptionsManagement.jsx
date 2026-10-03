import { useState, useEffect, useMemo } from "react";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import {
  Building2,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  Edit3,
  CalendarPlus,
  ShieldAlert,
  History,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
  Layers,
  User,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import "./SubscriptionsManagement.css";

function SubscriptionSkeletonRow() {
  return (
    <tr className="sub-row sub-skeleton-row">
      <td className="cell-inst">
        <div className="skeleton-box skeleton-inst-avatar" />
        <div className="inst-meta">
          <div className="skeleton-box skeleton-inst-name" />
          <div className="inst-subline">
            <div className="skeleton-box skeleton-inst-badge" />
            <div className="skeleton-box skeleton-inst-email" />
          </div>
        </div>
      </td>
      <td className="cell-plan">
        <div className="skeleton-box skeleton-plan-badge" />
        <div className="skeleton-box skeleton-plan-name" />
        <div className="skeleton-box skeleton-plan-cycle" />
      </td>
      <td className="cell-status">
        <div className="skeleton-box skeleton-status-badge" />
      </td>
      <td className="cell-dates">
        <div className="skeleton-box skeleton-date-line" />
        <div className="skeleton-box skeleton-countdown" />
      </td>
      <td className="cell-quotas">
        <div className="quota-bars-wrap">
          <div className="quota-bar-item">
            <div className="skeleton-box skeleton-quota-bar" />
          </div>
          <div className="quota-bar-item">
            <div className="skeleton-box skeleton-quota-bar" />
          </div>
          <div className="quota-bar-item">
            <div className="skeleton-box skeleton-quota-bar" />
          </div>
        </div>
      </td>
      <td className="cell-actions">
        <div className="action-buttons-group">
          <div className="skeleton-box skeleton-btn-primary" />
          <div className="skeleton-box skeleton-btn-secondary" />
          <div className="skeleton-box skeleton-btn-secondary" />
          <div className="skeleton-box skeleton-btn-icon" />
        </div>
      </td>
    </tr>
  );
}

export default function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Assign / Change Plan Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [assignForm, setAssignForm] = useState({
    planId: "",
    billingCycle: "yearly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "Active",
    note: "",
  });
  const [assigning, setAssigning] = useState(false);

  // Extend Modal
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendForm, setExtendForm] = useState({
    extendDays: 30,
    newEndDate: "",
    note: "",
  });
  const [extending, setExtending] = useState(false);

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: "Active",
    note: "",
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsRes, plansRes] = await Promise.all([
        axiosInstance.get("/super-admin/subscriptions"),
        axiosInstance.get("/super-admin/plans"),
      ]);
      setSubscriptions(subsRes.data?.data || []);
      setPlans(plansRes.data?.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load subscriptions";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch =
        sub.instituteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.instituteEmail && sub.instituteEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sub.plan?.name && sub.plan.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedStatusFilter === "all") return true;
      if (selectedStatusFilter === "active") return sub.subscriptionStatus === "Active";
      if (selectedStatusFilter === "trial") return sub.subscriptionStatus === "Trial";
      if (selectedStatusFilter === "suspended") return sub.subscriptionStatus === "Suspended";
      if (selectedStatusFilter === "expired") return sub.isExpired || sub.subscriptionStatus === "Expired";
      return true;
    });
  }, [subscriptions, searchQuery, selectedStatusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = subscriptions.length;
    const active = subscriptions.filter((s) => s.subscriptionStatus === "Active" && !s.isExpired).length;
    const trial = subscriptions.filter((s) => s.subscriptionStatus === "Trial").length;
    const suspendedOrExpired = subscriptions.filter(
      (s) => s.subscriptionStatus === "Suspended" || s.isExpired || s.subscriptionStatus === "Expired"
    ).length;

    return { total, active, trial, suspendedOrExpired };
  }, [subscriptions]);

  // Handlers for Modals
  const openAssignModal = (sub) => {
    setSelectedInstitute(sub);
    const defaultPlanId = sub.plan?.id || plans[0]?._id || "";
    const startDate = sub.startDate ? new Date(sub.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    const endDate = sub.endDate ? new Date(sub.endDate).toISOString().split("T")[0] : "";

    setAssignForm({
      planId: defaultPlanId,
      billingCycle: sub.billingCycle || "yearly",
      startDate,
      endDate,
      status: sub.subscriptionStatus || "Active",
      note: "",
    });
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.planId) {
      toast.error("Please select a target plan");
      return;
    }

    setAssigning(true);
    try {
      await axiosInstance.post("/super-admin/subscriptions/assign", {
        instituteId: selectedInstitute.instituteId,
        ...assignForm,
      });
      toast.success("Subscription updated successfully!");
      setAssignModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign subscription");
    } finally {
      setAssigning(false);
    }
  };

  const openExtendModal = (sub) => {
    setSelectedInstitute(sub);
    setExtendForm({
      extendDays: 30,
      newEndDate: "",
      note: "",
    });
    setExtendModalOpen(true);
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    setExtending(true);
    try {
      await axiosInstance.patch(`/super-admin/subscriptions/${selectedInstitute.instituteId}/extend`, extendForm);
      toast.success("Subscription validity extended successfully!");
      setExtendModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to extend subscription");
    } finally {
      setExtending(false);
    }
  };

  const openStatusModal = (sub) => {
    setSelectedInstitute(sub);
    setStatusForm({
      status: sub.subscriptionStatus || "Active",
      note: "",
    });
    setStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      await axiosInstance.patch(`/super-admin/subscriptions/${selectedInstitute.instituteId}/status`, statusForm);
      toast.success("Subscription status updated!");
      setStatusModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openHistoryModal = async (sub) => {
    setSelectedInstitute(sub);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await axiosInstance.get(`/super-admin/subscriptions/${sub.instituteId}/history`);
      setHistoryData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusBadge = (sub) => {
    if (sub.isExpired || sub.subscriptionStatus === "Expired") {
      return <span className="sub-badge expired"><AlertCircle size={12} /> Expired</span>;
    }
    if (sub.subscriptionStatus === "Active") {
      return <span className="sub-badge active"><CheckCircle2 size={12} /> Active</span>;
    }
    if (sub.subscriptionStatus === "Trial") {
      return <span className="sub-badge trial"><Clock size={12} /> In Trial</span>;
    }
    if (sub.subscriptionStatus === "Suspended") {
      return <span className="sub-badge suspended"><ShieldAlert size={12} /> Suspended</span>;
    }
    if (sub.subscriptionStatus === "Canceled") {
      return <span className="sub-badge canceled"><XCircle size={12} /> Canceled</span>;
    }
    return <span className="sub-badge default">{sub.subscriptionStatus}</span>;
  };

  return (
    <div className="subscriptions-page-container">
      {/* Metrics Row: 4 Equal Columns */}
      <div className="subs-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap">
            <Building2 size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Institutions</span>
            {initialLoading ? (
              <div className="metric-value-skeleton" />
            ) : error && subscriptions.length === 0 ? (
              <span className="metric-value" aria-label="Unavailable">—</span>
            ) : (
              <span className="metric-value">{metrics.total}</span>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap">
            <CheckCircle2 size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Active Subscriptions</span>
            {initialLoading ? (
              <div className="metric-value-skeleton" />
            ) : error && subscriptions.length === 0 ? (
              <span className="metric-value" aria-label="Unavailable">—</span>
            ) : (
              <span className="metric-value">{metrics.active}</span>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap">
            <Clock size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Active Trials</span>
            {initialLoading ? (
              <div className="metric-value-skeleton" />
            ) : error && subscriptions.length === 0 ? (
              <span className="metric-value" aria-label="Unavailable">—</span>
            ) : (
              <span className="metric-value">{metrics.trial}</span>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap">
            <ShieldAlert size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Suspended / Expired</span>
            {initialLoading ? (
              <div className="metric-value-skeleton" />
            ) : error && subscriptions.length === 0 ? (
              <span className="metric-value" aria-label="Unavailable">—</span>
            ) : (
              <span className="metric-value">{metrics.suspendedOrExpired}</span>
            )}
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="subs-controls-bar">
        <div className="subs-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by institution name, email, or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="clear-search" onClick={() => setSearchQuery("")} title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="subs-controls-right">
          <div className="subs-filter-tabs">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "trial", label: "Trial" },
              { id: "suspended", label: "Suspended" },
              { id: "expired", label: "Expired" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`filter-tab ${selectedStatusFilter === tab.id ? "active" : ""}`}
                onClick={() => setSelectedStatusFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="subs-refresh-btn"
            onClick={loadData}
            disabled={loading}
            title="Refresh subscriptions"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table: Persistent Shell Across All States */}
      <div className="subs-table-card">
        <div className="subs-table-wrap">
          <table className="subs-table">
            <thead>
              <tr>
                <th style={{ width: "24%" }}>Institution</th>
                <th style={{ width: "16%" }}>Assigned Plan</th>
                <th style={{ width: "10%" }}>Status</th>
                <th style={{ width: "18%" }}>Validity & Dates</th>
                <th style={{ width: "18%" }}>Quota Consumption</th>
                <th style={{ width: "14%" }} className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody className={loading && !initialLoading ? "is-refreshing" : ""}>
              {error ? (
                <tr>
                  <td colSpan={6}>
                    <div className="subs-error-state">
                      <AlertCircle size={32} className="subs-error-icon" />
                      <h3 className="subs-error-title">Unable to Load Subscriptions</h3>
                      <p className="subs-error-msg">{error}</p>
                      <button
                        type="button"
                        className="subs-retry-btn"
                        onClick={loadData}
                      >
                        <RefreshCw size={13} />
                        <span>Retry</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : initialLoading ? (
                <>
                  <SubscriptionSkeletonRow />
                  <SubscriptionSkeletonRow />
                  <SubscriptionSkeletonRow />
                  <SubscriptionSkeletonRow />
                  <SubscriptionSkeletonRow />
                </>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="subs-empty">
                      <Building2 size={40} className="empty-icon" />
                      <h3 className="subs-empty-title">No Subscriptions Found</h3>
                      <p className="subs-empty-desc">
                        {searchQuery || selectedStatusFilter !== "all"
                          ? "No institutions match your current search or filter criteria."
                          : "No institutional subscriptions have been configured yet."}
                      </p>
                      {(searchQuery || selectedStatusFilter !== "all") && (
                        <button
                          type="button"
                          className="subs-reset-btn"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedStatusFilter("all");
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const planName = sub.plan?.name || sub.plan?.tier?.toUpperCase() || "Free Plan";
                  const tier = sub.plan?.tier || "free";
                  const startDateStr = sub.startDate ? new Date(sub.startDate).toLocaleDateString() : "—";
                  const endDateStr = sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "Lifetime";

                  return (
                    <tr key={sub.instituteId} className="sub-row">
                      {/* Institution */}
                      <td className="cell-inst">
                        <div className="inst-avatar">
                          <Building2 size={16} />
                        </div>
                        <div className="inst-meta">
                          <span className="inst-name">{sub.instituteName}</span>
                          <div className="inst-subline">
                            <span className="inst-type-badge">{sub.instituteType || "School"}</span>
                            <span className="inst-email">{sub.instituteEmail}</span>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="cell-plan">
                        <span className={`plan-tier-badge ${tier}`}>{tier.toUpperCase()}</span>
                        <span className="plan-display-name">{planName}</span>
                        <span className="plan-billing-cycle">{sub.billingCycle} billing</span>
                      </td>

                      {/* Status */}
                      <td className="cell-status">{getStatusBadge(sub)}</td>

                      {/* Validity */}
                      <td className="cell-dates">
                        <div className="date-line">
                          <span className="date-label">Valid:</span>
                          <span className="date-val">{startDateStr} → {endDateStr}</span>
                        </div>
                        {sub.daysRemaining !== null && (
                          <div className={`countdown-tag ${sub.isExpired ? "expired" : sub.daysRemaining <= 14 ? "warning" : "ok"}`}>
                            <Clock size={11} />
                            <span>
                              {sub.isExpired
                                ? "Expired"
                                : `${sub.daysRemaining} day${sub.daysRemaining === 1 ? "" : "s"} left`}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Quotas */}
                      <td className="cell-quotas">
                        <div className="quota-bars-wrap">
                          {/* Campuses */}
                          <div className="quota-bar-item" title="Campuses Allocated">
                            <div className="quota-header">
                              <span>Campuses</span>
                              <span>{sub.usage.campuses.current} / {sub.usage.campuses.max >= 9999 ? "∞" : sub.usage.campuses.max}</span>
                            </div>
                            <div className="quota-track">
                              <div
                                className={`quota-fill ${sub.usage.campuses.percent >= 100 ? "full" : ""}`}
                                style={{ width: `${sub.usage.campuses.percent}%` }}
                              />
                            </div>
                          </div>

                          {/* Students */}
                          <div className="quota-bar-item" title="Enrolled Students">
                            <div className="quota-header">
                              <span>Students</span>
                              <span>{sub.usage.students.current} / {sub.usage.students.max >= 99999 ? "∞" : sub.usage.students.max}</span>
                            </div>
                            <div className="quota-track">
                              <div
                                className={`quota-fill ${sub.usage.students.percent >= 100 ? "full" : ""}`}
                                style={{ width: `${sub.usage.students.percent}%` }}
                              />
                            </div>
                          </div>

                          {/* Staff */}
                          <div className="quota-bar-item" title="Staff Members">
                            <div className="quota-header">
                              <span>Staff</span>
                              <span>{sub.usage.staff.current} / {sub.usage.staff.max >= 9999 ? "∞" : sub.usage.staff.max}</span>
                            </div>
                            <div className="quota-track">
                              <div
                                className={`quota-fill ${sub.usage.staff.percent >= 100 ? "full" : ""}`}
                                style={{ width: `${sub.usage.staff.percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="cell-actions">
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="table-act-btn plan"
                            onClick={() => openAssignModal(sub)}
                            title="Assign or change plan"
                          >
                            <Edit3 size={13} />
                            <span>Change Plan</span>
                          </button>

                          <button
                            type="button"
                            className="table-act-btn extend"
                            onClick={() => openExtendModal(sub)}
                            title="Extend validity dates"
                          >
                            <CalendarPlus size={13} />
                            <span>Extend</span>
                          </button>

                          <button
                            type="button"
                            className="table-act-btn status"
                            onClick={() => openStatusModal(sub)}
                            title="Change subscription status"
                          >
                            <ShieldAlert size={13} />
                            <span>Status</span>
                          </button>

                          <button
                            type="button"
                            className="table-act-btn history"
                            onClick={() => openHistoryModal(sub)}
                            title="View audit history"
                          >
                            <History size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ASSIGN / CHANGE PLAN MODAL ── */}
      {assignModalOpen && selectedInstitute && (
        <div className="subs-modal-backdrop" onClick={() => !assigning && setAssignModalOpen(false)}>
          <div className="subs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="subs-modal-header">
              <div className="modal-title-wrap">
                <Layers size={20} />
                <h3>Assign Plan: {selectedInstitute.instituteName}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setAssignModalOpen(false)}
                disabled={assigning}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="subs-modal-form">
              <div className="current-sub-info-banner">
                <Building2 size={16} />
                <span>
                  Currently on <strong>{selectedInstitute.plan?.name || "Free Plan"}</strong> ({selectedInstitute.subscriptionStatus})
                </span>
              </div>

              <div className="form-group">
                <label>Select Target Plan *</label>
                <select
                  required
                  value={assignForm.planId}
                  onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                  disabled={assigning}
                >
                  <option value="" disabled>-- Select a Plan --</option>
                  {plans.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} ({p.tier.toUpperCase()}) — {p.currency || "PKR"} {Number(p.priceMonthly || 0).toLocaleString()}/mo | Max {p.maxStudents >= 99999 ? "Unlimited" : Number(p.maxStudents).toLocaleString()} Students, {p.maxCampuses >= 9999 ? "Unlimited" : p.maxCampuses} Campuses
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Billing Cycle</label>
                  <select
                    value={assignForm.billingCycle}
                    onChange={(e) => setAssignForm({ ...assignForm, billingCycle: e.target.value })}
                    disabled={assigning}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly (Annual)</option>
                    <option value="lifetime">Lifetime / Indefinite</option>
                    <option value="custom">Custom Duration</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Initial Status</label>
                  <select
                    value={assignForm.status}
                    onChange={(e) => setAssignForm({ ...assignForm, status: e.target.value })}
                    disabled={assigning}
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={assignForm.startDate}
                    onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                    disabled={assigning}
                  />
                </div>

                <div className="form-group">
                  <label>Expiry / Renewal Date (Optional)</label>
                  <input
                    type="date"
                    value={assignForm.endDate}
                    onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
                    disabled={assigning}
                  />
                  <span className="field-hint">Auto-calculated if left blank based on billing cycle</span>
                </div>
              </div>

              <div className="form-group">
                <label>Admin Note / Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Manually upgraded following enterprise contract signing..."
                  value={assignForm.note}
                  onChange={(e) => setAssignForm({ ...assignForm, note: e.target.value })}
                  disabled={assigning}
                />
              </div>

              <div className="subs-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setAssignModalOpen(false)}
                  disabled={assigning}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={assigning}
                >
                  {assigning ? (
                    <>
                      <Spinner size={16} />
                      <span>Assigning Plan...</span>
                    </>
                  ) : (
                    <span>Confirm Assignment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EXTEND MODAL ── */}
      {extendModalOpen && selectedInstitute && (
        <div className="subs-modal-backdrop" onClick={() => !extending && setExtendModalOpen(false)}>
          <div className="subs-modal modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="subs-modal-header">
              <div className="modal-title-wrap">
                <CalendarPlus size={20} />
                <h3>Extend Subscription Validity</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setExtendModalOpen(false)}
                disabled={extending}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExtendSubmit} className="subs-modal-form">
              <div className="current-sub-info-banner">
                <Calendar size={16} />
                <span>
                  Current Expiry: <strong>{selectedInstitute.endDate ? new Date(selectedInstitute.endDate).toLocaleDateString() : "Not Set"}</strong>
                </span>
              </div>

              <div className="quick-extend-row">
                <label className="quick-label">Quick Add:</label>
                <div className="quick-buttons">
                  {[
                    { days: 30, label: "+30 Days" },
                    { days: 90, label: "+90 Days" },
                    { days: 180, label: "+6 Months" },
                    { days: 365, label: "+1 Year" },
                  ].map((btn) => (
                    <button
                      key={btn.days}
                      type="button"
                      className={`quick-btn ${extendForm.extendDays === btn.days && !extendForm.newEndDate ? "selected" : ""}`}
                      onClick={() => setExtendForm({ ...extendForm, extendDays: btn.days, newEndDate: "" })}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Or Set Specific Expiry Date</label>
                <input
                  type="date"
                  value={extendForm.newEndDate}
                  onChange={(e) => setExtendForm({ ...extendForm, newEndDate: e.target.value, extendDays: 0 })}
                  disabled={extending}
                />
              </div>

              <div className="form-group">
                <label>Extension Reason / Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Courtesy grace period extension granted by Super Admin"
                  value={extendForm.note}
                  onChange={(e) => setExtendForm({ ...extendForm, note: e.target.value })}
                  disabled={extending}
                />
              </div>

              <div className="subs-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setExtendModalOpen(false)}
                  disabled={extending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={extending}
                >
                  {extending ? "Extending..." : "Save Extension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STATUS CHANGE MODAL ── */}
      {statusModalOpen && selectedInstitute && (
        <div className="subs-modal-backdrop" onClick={() => !updatingStatus && setStatusModalOpen(false)}>
          <div className="subs-modal modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="subs-modal-header">
              <div className="modal-title-wrap">
                <ShieldAlert size={20} />
                <h3>Change Subscription Status</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setStatusModalOpen(false)}
                disabled={updatingStatus}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="subs-modal-form">
              <div className="current-sub-info-banner">
                <span>
                  Institution: <strong>{selectedInstitute.instituteName}</strong> (Current: {selectedInstitute.subscriptionStatus})
                </span>
              </div>

              <div className="form-group">
                <label>New Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  disabled={updatingStatus}
                >
                  <option value="Active">Active (Full operational access)</option>
                  <option value="Trial">Trial (Evaluating features)</option>
                  <option value="Suspended">Suspended (Mutations blocked)</option>
                  <option value="Expired">Expired (Plan validity finished)</option>
                  <option value="Canceled">Canceled (Terminated)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reason / Audit Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Account suspended due to administrative review..."
                  value={statusForm.note}
                  onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                  disabled={updatingStatus}
                />
              </div>

              <div className="subs-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setStatusModalOpen(false)}
                  disabled={updatingStatus}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Updating..." : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── HISTORY MODAL ── */}
      {historyModalOpen && selectedInstitute && (
        <div className="subs-modal-backdrop" onClick={() => setHistoryModalOpen(false)}>
          <div className="subs-modal modal-history" onClick={(e) => e.stopPropagation()}>
            <div className="subs-modal-header">
              <div className="modal-title-wrap">
                <History size={20} />
                <h3>Subscription Audit Log: {selectedInstitute.instituteName}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setHistoryModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="subs-history-body">
              {loadingHistory ? (
                <div className="history-loading">
                  <Spinner size={24} />
                  <p>Retrieving subscription timeline...</p>
                </div>
              ) : !historyData || historyData.history?.length === 0 ? (
                <div className="history-empty">
                  <History size={32} className="empty-icon" />
                  <p>No historical subscription changes recorded yet for this institution.</p>
                </div>
              ) : (
                <div className="history-timeline">
                  {historyData.history.map((item, idx) => {
                    const dateStr = item.changedAt ? new Date(item.changedAt).toLocaleString() : "—";
                    const adminName = item.changedBy?.name || "Super Admin";

                    return (
                      <div key={item._id || idx} className="timeline-item">
                        <div className="timeline-marker" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-action">{item.action || "Subscription Update"}</span>
                            <span className="timeline-date">{dateStr}</span>
                          </div>

                          <div className="timeline-meta-row">
                            <span className="meta-pill plan">Plan: {item.planName || item.planTier}</span>
                            <span className="meta-pill status">Status: {item.status}</span>
                            {item.endDate && (
                              <span className="meta-pill end">
                                Valid Until: {new Date(item.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {item.note && <p className="timeline-note">"{item.note}"</p>}

                          <div className="timeline-author">
                            <User size={12} />
                            <span>Action recorded by: <strong>{adminName}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="subs-modal-footer">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setHistoryModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
