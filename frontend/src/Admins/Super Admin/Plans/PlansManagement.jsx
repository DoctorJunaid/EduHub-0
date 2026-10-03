import { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  GraduationCap,
  RefreshCw,
  X,
  AlertTriangle,
  Info,
  Clock,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import "./PlansManagement.css";

const INITIAL_FORM = {
  tier: "",
  name: "",
  description: "",
  priceMonthly: 0,
  priceYearly: 0,
  currency: "PKR",
  maxCampuses: 1,
  maxStudents: 50,
  maxStaff: 10,
  trialDays: 0,
  isPopular: false,
  isActive: true,
};

function PlanSkeletonCard({ isFeatured = false }) {
  return (
    <div className={`plan-card plan-skeleton-card ${isFeatured ? "is-popular" : ""}`}>
      {isFeatured && (
        <span className="plan-badge-popular">
          <span>MOST POPULAR</span>
        </span>
      )}
      <div className="plan-card-top-row">
        <div className="plan-skel-line plan-skel-slug" />
        <div className="plan-skel-line plan-skel-pill" />
      </div>
      <div className="plan-skel-line plan-skel-title" />
      <div className="plan-skel-line plan-skel-desc" />
      <div className="plan-skel-line plan-skel-desc short" />

      <div className="plan-pricing-box plan-skel-pricing-box">
        <div className="plan-skel-line plan-skel-price" />
        <div className="plan-skel-line plan-skel-period" />
      </div>

      <div className="plan-limits-section">
        <div className="plan-skel-line plan-skel-section-label" />
        <div className="plan-limits-row">
          <div className="limit-pill plan-skel-pill-limit">
            <div className="plan-skel-line plan-skel-limit-val" />
          </div>
          <div className="limit-pill plan-skel-pill-limit">
            <div className="plan-skel-line plan-skel-limit-val" />
          </div>
          <div className="limit-pill plan-skel-pill-limit">
            <div className="plan-skel-line plan-skel-limit-val" />
          </div>
        </div>
      </div>

      <div className="plan-card-footer plan-skel-footer">
        <div className="plan-skel-line plan-skel-stat" />
        <div className="plan-actions-row">
          <div className="plan-skel-line plan-skel-btn" />
          <div className="plan-skel-line plan-skel-btn" />
          <div className="plan-skel-line plan-skel-btn icon" />
        </div>
      </div>
    </div>
  );
}

export default function PlansManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await axiosInstance.get("/super-admin/plans");
      setPlans(res.data.data || []);
      setHasLoaded(true);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load SaaS plans";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      tier: plan.tier || "",
      name: plan.name || "",
      description: plan.description || "",
      priceMonthly: plan.priceMonthly ?? 0,
      priceYearly: plan.priceYearly ?? 0,
      currency: plan.currency || "PKR",
      maxCampuses: plan.maxCampuses ?? 1,
      maxStudents: plan.maxStudents ?? 50,
      maxStaff: plan.maxStaff ?? 10,
      trialDays: plan.trialDays ?? 0,
      isPopular: Boolean(plan.isPopular),
      isActive: plan.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.tier.trim()) {
      toast.error("Please provide both a plan name and tier identifier.");
      return;
    }

    setSaving(true);
    try {
      if (editingPlan) {
        await axiosInstance.put(`/super-admin/plans/${editingPlan._id || editingPlan.id}`, formData);
        toast.success("Plan updated successfully!");
      } else {
        await axiosInstance.post("/super-admin/plans", formData);
        toast.success("New SaaS plan created successfully!");
      }
      setModalOpen(false);
      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      const res = await axiosInstance.patch(`/super-admin/plans/${plan._id || plan.id}/toggle-status`);
      toast.success(res.data?.message || "Plan status updated");
      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const confirmDelete = (plan) => {
    setPlanToDelete(plan);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/super-admin/plans/${planToDelete._id || planToDelete.id}`);
      toast.success("Plan deleted successfully");
      setDeleteModalOpen(false);
      setPlanToDelete(null);
      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete plan");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="plans-page-container">
      {/* Top Action Bar */}
      <div className="plans-top-bar">
        <div className="plans-top-actions">
          <button
            type="button"
            className="plans-refresh-btn"
            onClick={loadPlans}
            disabled={loading}
            title="Refresh plans list"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="plans-create-btn"
            onClick={openCreateModal}
          >
            <Plus size={15} />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid / Skeletons / Empty */}
      <div className="plans-grid">
        {loading && !hasLoaded ? (
          <>
            <PlanSkeletonCard />
            <PlanSkeletonCard isFeatured={true} />
            <PlanSkeletonCard />
          </>
        ) : loadError && !hasLoaded ? (
          <div className="plans-empty-card plans-error-card" role="alert">
            <AlertTriangle size={40} className="empty-icon" />
            <h3>Unable to Load Subscription Plans</h3>
            <p>{loadError}</p>
            <button type="button" className="plans-refresh-btn" onClick={loadPlans}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="plans-empty-card">
            <Layers size={48} className="empty-icon" />
            <h3>No Subscription Plans Configured</h3>
            <p>Create your first plan to start defining institutional quotas and features.</p>
            <button type="button" className="plans-create-btn" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Create Plan</span>
            </button>
          </div>
        ) : (
          plans.map((plan) => {
            const id = plan._id || plan.id;
            const isPopular = plan.isPopular;
            const isActive = plan.isActive !== false;
            const instituteCount = plan.instituteCount || 0;

            return (
              <div
                key={id}
                className={`plan-card ${isPopular ? "is-popular" : ""} ${!isActive ? "is-inactive" : ""}`}
              >
                {isPopular && (
                  <span className="plan-badge-popular">
                    <span>MOST POPULAR</span>
                  </span>
                )}

                <div className="plan-card-top-row">
                  <span className="plan-tier-slug">{plan.tier.toUpperCase()}</span>
                  <span className={`plan-status-pill ${isActive ? "active" : "inactive"}`}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <h2 className="plan-card-name">{plan.name}</h2>

                <p className="plan-description">
                  {plan.description || "Comprehensive multi-tenant subscription plan for educational institutions."}
                </p>

                {/* Pricing Box */}
                <div className="plan-pricing-box">
                  <div className="plan-price-main">
                    <span className="price-currency">{plan.currency || "PKR"}</span>
                    <span className="price-amount">{Number(plan.priceMonthly || 0).toLocaleString()}</span>
                    <span className="price-period">/ month</span>
                  </div>
                  <div className="plan-price-sub">
                    {Number(plan.priceMonthly) === 0
                      ? "Free tier forever"
                      : `or ${plan.currency || "PKR"} ${Number(plan.priceYearly || 0).toLocaleString()} billed annually`}
                  </div>
                </div>

                {/* Quota Limits Overview */}
                <div className="plan-limits-section">
                  <h4 className="plan-section-label">Tier Limits & Quota Capacity</h4>
                  <div className="plan-limits-row">
                    <div className="limit-pill" title="Maximum Students Allowed">
                      <GraduationCap size={15} className="limit-icon" />
                      <span className="limit-val">{plan.maxStudents >= 99999 ? "Unlimited" : Number(plan.maxStudents).toLocaleString()}</span>
                      <span className="limit-label">Students</span>
                    </div>

                    <div className="limit-pill" title="Maximum Staff Members Allowed">
                      <Users size={14} className="limit-icon" />
                      <span className="limit-val">{plan.maxStaff >= 9999 ? "Unlimited" : Number(plan.maxStaff).toLocaleString()}</span>
                      <span className="limit-label">Staff</span>
                    </div>

                    <div className="limit-pill" title="Maximum Campuses Allowed">
                      <Building2 size={14} className="limit-icon" />
                      <span className="limit-val">{plan.maxCampuses >= 9999 ? "Unlimited" : plan.maxCampuses}</span>
                      <span className="limit-label">Campuses</span>
                    </div>
                  </div>
                  {plan.trialDays > 0 && (
                    <div className="plan-trial-badge">
                      <Clock size={12} />
                      <span>{plan.trialDays}-day free trial included</span>
                    </div>
                  )}
                </div>

                {/* Footer and Management Actions */}
                <div className="plan-card-footer">
                  <div className="plan-assigned-stat" title="Institutions currently operating under this plan">
                    <Building2 size={13} />
                    <span>
                      <strong>{instituteCount}</strong> institution{instituteCount === 1 ? "" : "s"} subscribed
                    </span>
                  </div>

                  <div className="plan-actions-row">
                    <button
                      type="button"
                      className="plan-action-btn edit"
                      onClick={() => openEditModal(plan)}
                      title="Edit plan configuration"
                    >
                      <Pencil size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className={`plan-action-btn toggle ${isActive ? "deactivate" : "activate"}`}
                      onClick={() => handleToggleStatus(plan)}
                      title={isActive ? "Deactivate plan" : "Activate plan"}
                    >
                      <span>{isActive ? "Deactivate" : "Activate"}</span>
                    </button>

                    <button
                      type="button"
                      className="plan-action-btn delete"
                      onClick={() => confirmDelete(plan)}
                      title={instituteCount > 0 ? "Cannot delete plan with active institutions" : "Delete plan"}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {modalOpen && (
        <div className="plans-modal-backdrop" onClick={() => !saving && setModalOpen(false)}>
          <div className="plans-modal" onClick={(e) => e.stopPropagation()}>
            <div className="plans-modal-header">
              <div className="modal-title-wrap">
                <Layers size={20} className="modal-title-icon" />
                <h3>{editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create New Subscription Plan"}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="plans-modal-form">
              {/* Basic Details */}
              <div className="form-section-title">General Information</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Plan Identifier (Slug) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. starter, pro, enterprise"
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                    disabled={saving}
                  />
                  <span className="field-hint">Unique lowercase code (e.g. starter, campus-plus)</span>
                </div>

                <div className="form-group">
                  <label>Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Academy Plan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  placeholder="Summarize who this tier is designed for and key advantages..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={saving}
                />
              </div>

              {/* Pricing */}
              <div className="form-section-title">Pricing & Billing</div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Monthly Price</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.priceMonthly}
                    onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>Yearly Price (Discounted)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.priceYearly}
                    onChange={(e) => setFormData({ ...formData, priceYearly: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>Currency</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Quotas */}
              <div className="form-section-title">Operational Quotas</div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Max Campuses</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxCampuses}
                    onChange={(e) => setFormData({ ...formData, maxCampuses: e.target.value })}
                    disabled={saving}
                  />
                  <span className="field-hint">e.g. 1 for Free, 5 for Pro, 9999 for Enterprise</span>
                </div>

                <div className="form-group">
                  <label>Max Students</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                    disabled={saving}
                  />
                  <span className="field-hint">Total enrolled students across all branches</span>
                </div>

                <div className="form-group">
                  <label>Max Staff Members</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStaff}
                    onChange={(e) => setFormData({ ...formData, maxStaff: e.target.value })}
                    disabled={saving}
                  />
                  <span className="field-hint">Teachers, managers, and staff accounts</span>
                </div>
              </div>

              {/* Trial & Flags */}
              <div className="form-section-title">Settings & Badges</div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Trial Days (0 = None)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.trialDays}
                    onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="form-checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                      disabled={saving}
                    />
                    <span>Highlight as "Most Popular"</span>
                  </label>
                </div>

                <div className="form-checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      disabled={saving}
                    />
                    <span>Plan is Active for assignment</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="plans-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner size={16} />
                      <span>Saving Plan...</span>
                    </>
                  ) : (
                    <span>{editingPlan ? "Update Plan" : "Create Plan"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteModalOpen && planToDelete && (
        <div className="plans-modal-backdrop" onClick={() => !deleting && setDeleteModalOpen(false)}>
          <div className="plans-modal delete-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-content">
              <div className="delete-icon-wrap">
                <AlertTriangle size={32} />
              </div>
              <h3>Delete Plan "{planToDelete.name}"?</h3>
              <p>
                Are you sure you want to remove this plan? This action cannot be undone.
              </p>
              {planToDelete.instituteCount > 0 && (
                <div className="delete-warning-banner">
                  <Info size={16} />
                  <span>
                    Warning: <strong>{planToDelete.instituteCount} institution(s)</strong> are currently assigned to this plan. You must reassign them to another plan before deletion.
                  </span>
                </div>
              )}
            </div>

            <div className="plans-modal-footer">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-delete-btn"
                onClick={handleDelete}
                disabled={deleting || planToDelete.instituteCount > 0}
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
