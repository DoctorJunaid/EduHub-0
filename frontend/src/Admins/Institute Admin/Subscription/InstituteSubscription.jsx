import { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import {
  CreditCard,
  Building2,
  Users,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LifeBuoy,
  RefreshCw,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "react-router-dom";
import "./InstituteSubscription.css";

const ALL_SYSTEM_FEATURES = [
  { key: "single_campus", label: "Single Campus Branch Operations", category: "Core Operations" },
  { key: "multi_campus", label: "Multi-Campus Branch Governance", category: "Core Operations" },
  { key: "basic_attendance", label: "Student & Faculty Attendance Tracking", category: "Academic Systems" },
  { key: "gradebook", label: "Examinations, Marks & Gradebook", category: "Academic Systems" },
  { key: "daily_diary", label: "Daily Class Diary & Homework Notices", category: "Academic Systems" },
  { key: "advanced_fees", label: "Automated Monthly Fee Invoicing & Tracking", category: "Financial Management" },
  { key: "salary_payroll", label: "Staff Salary Policies & Payroll Tracking", category: "Financial Management" },
  { key: "broadcast_alerts", label: "Network-Wide Broadcast Alert System", category: "Communications" },
  { key: "standard_support", label: "Standard Business-Hours Support", category: "Support & SLA" },
  { key: "priority_support", label: "24/7 Dedicated Priority Support SLA", category: "Support & SLA" },
  { key: "custom_branding", label: "Institutional Identity & White-labeling", category: "Enterprise Services" },
  { key: "audit_compliance", label: "Deep Security & Forensic Audit Compliance", category: "Enterprise Services" },
];

export default function InstituteSubscription() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/institute-admin/subscription");
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  if (loading) {
    return (
      <div className="inst-sub-loading">
        <Spinner size={36} />
        <p>Loading your institution subscription and quota limits...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="inst-sub-empty">
        <AlertCircle size={40} className="empty-icon" />
        <h2>Unable to load subscription</h2>
        <p>Please check your connection or contact Super Admin support.</p>
        <button type="button" className="inst-sub-retry-btn" onClick={loadSubscription}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const { plan, subscription, usage, features } = data;
  const isExpired = subscription?.isExpired;
  const daysRemaining = subscription?.daysRemaining;

  const validUntilStr = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Indefinite / Lifetime";

  const getStatusBadge = () => {
    if (isExpired) {
      return <span className="inst-status-badge expired"><AlertCircle size={13} /> Expired</span>;
    }
    if (subscription?.status === "Active") {
      return <span className="inst-status-badge active"><CheckCircle2 size={13} /> Active</span>;
    }
    if (subscription?.status === "Trial") {
      return <span className="inst-status-badge trial"><Clock size={13} /> In Trial</span>;
    }
    if (subscription?.status === "Suspended") {
      return <span className="inst-status-badge suspended"><AlertCircle size={13} /> Suspended</span>;
    }
    return <span className="inst-status-badge default">{subscription?.status}</span>;
  };

  return (
    <div className="inst-subscription-page">
      {/* Top Header */}
      <div className="inst-sub-header">
        <div>
          <div className="inst-sub-title-row">
            <CreditCard className="title-icon" size={24} />
            <h1>Institution Plan & Quotas</h1>
          </div>
          <p className="inst-sub-subtitle">
            Overview of your institution's active SaaS subscription, operational capacity, and enabled modules.
          </p>
        </div>

        <button
          type="button"
          className="inst-sub-refresh-btn"
          onClick={loadSubscription}
          title="Refresh subscription details"
        >
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Hero Plan Overview Banner */}
      <div className="inst-hero-card">
        <div className="inst-hero-left">
          <div className="inst-plan-tier-wrap">
            <span className="inst-tier-badge">{(plan?.tier || "FREE").toUpperCase()}</span>
            {getStatusBadge()}
          </div>

          <h2 className="inst-plan-name">{plan?.name || "Free Community Tier"}</h2>
          <p className="inst-plan-desc">
            {plan?.description || "Empowers your institution with centralized multi-branch and academic tools."}
          </p>

          <div className="inst-plan-meta-row">
            <div className="meta-item">
              <Calendar size={15} className="meta-icon" />
              <span>Valid Until: <strong>{validUntilStr}</strong></span>
            </div>

            {daysRemaining !== null && (
              <div className={`meta-item countdown ${isExpired ? "expired" : daysRemaining <= 14 ? "warning" : "ok"}`}>
                <Clock size={14} className="meta-icon" />
                <span>
                  {isExpired ? "Subscription Expired" : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`}
                </span>
              </div>
            )}

            <div className="meta-item">
              <ShieldCheck size={15} className="meta-icon" />
              <span>Billing Cycle: <strong>{subscription?.billingCycle || "yearly"}</strong></span>
            </div>
          </div>
        </div>

        <div className="inst-hero-right">
          <div className="inst-pricing-display">
            <span className="price-tag">{plan?.currency || "$"}{plan?.priceMonthly}</span>
            <span className="price-unit">/ month</span>
          </div>
          <span className="price-note">
            Centrally managed by Super Admin
          </span>
        </div>
      </div>

      {/* Operational Quotas Cards */}
      <div className="inst-quotas-section">
        <h3 className="section-title">Institutional Quotas & Capacity</h3>
        <div className="inst-quotas-grid">
          {/* Campuses */}
          <div className="quota-card">
            <div className="quota-card-header">
              <div className="quota-icon-wrap campus">
                <Building2 size={20} />
              </div>
              <div className="quota-card-title">
                <h4>Campus Branches</h4>
                <span>Active physical branches</span>
              </div>
            </div>

            <div className="quota-values-row">
              <span className="quota-big-val">{usage?.campuses?.current || 0}</span>
              <span className="quota-max-val">/ {usage?.campuses?.max >= 9999 ? "Unlimited" : usage?.campuses?.max}</span>
            </div>

            <div className="quota-progress-track">
              <div
                className={`quota-progress-bar ${usage?.campuses?.percentage >= 100 ? "full" : usage?.campuses?.percentage >= 80 ? "warning" : ""}`}
                style={{ width: `${Math.min(100, usage?.campuses?.percentage || 0)}%` }}
              />
            </div>
            <div className="quota-progress-sub">
              <span>{usage?.campuses?.percentage || 0}% used</span>
              <span>
                {usage?.campuses?.max >= 9999
                  ? "Uncapped"
                  : `${Math.max(0, usage?.campuses?.max - usage?.campuses?.current)} remaining`}
              </span>
            </div>
          </div>

          {/* Students */}
          <div className="quota-card">
            <div className="quota-card-header">
              <div className="quota-icon-wrap student">
                <GraduationCap size={20} />
              </div>
              <div className="quota-card-title">
                <h4>Enrolled Students</h4>
                <span>Active pupil directory</span>
              </div>
            </div>

            <div className="quota-values-row">
              <span className="quota-big-val">{usage?.students?.current || 0}</span>
              <span className="quota-max-val">/ {usage?.students?.max >= 99999 ? "Unlimited" : usage?.students?.max}</span>
            </div>

            <div className="quota-progress-track">
              <div
                className={`quota-progress-bar ${usage?.students?.percentage >= 100 ? "full" : usage?.students?.percentage >= 80 ? "warning" : ""}`}
                style={{ width: `${Math.min(100, usage?.students?.percentage || 0)}%` }}
              />
            </div>
            <div className="quota-progress-sub">
              <span>{usage?.students?.percentage || 0}% used</span>
              <span>
                {usage?.students?.max >= 99999
                  ? "Uncapped"
                  : `${Math.max(0, usage?.students?.max - usage?.students?.current)} remaining`}
              </span>
            </div>
          </div>

          {/* Staff */}
          <div className="quota-card">
            <div className="quota-card-header">
              <div className="quota-icon-wrap staff">
                <Users size={20} />
              </div>
              <div className="quota-card-title">
                <h4>Staff & Faculty</h4>
                <span>Teachers, managers & admins</span>
              </div>
            </div>

            <div className="quota-values-row">
              <span className="quota-big-val">{usage?.staff?.current || 0}</span>
              <span className="quota-max-val">/ {usage?.staff?.max >= 9999 ? "Unlimited" : usage?.staff?.max}</span>
            </div>

            <div className="quota-progress-track">
              <div
                className={`quota-progress-bar ${usage?.staff?.percentage >= 100 ? "full" : usage?.staff?.percentage >= 80 ? "warning" : ""}`}
                style={{ width: `${Math.min(100, usage?.staff?.percentage || 0)}%` }}
              />
            </div>
            <div className="quota-progress-sub">
              <span>{usage?.staff?.percentage || 0}% used</span>
              <span>
                {usage?.staff?.max >= 9999
                  ? "Uncapped"
                  : `${Math.max(0, usage?.staff?.max - usage?.staff?.current)} remaining`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Included Features Grid */}
      <div className="inst-features-section">
        <div className="features-section-header">
          <h3 className="section-title">Included Features & Modules</h3>
          <span className="features-count-pill">
            {features?.length || 0} of {ALL_SYSTEM_FEATURES.length} Enabled
          </span>
        </div>

        <div className="inst-features-grid">
          {ALL_SYSTEM_FEATURES.map((feat) => {
            const isIncluded = features?.includes(feat.key);
            return (
              <div
                key={feat.key}
                className={`inst-feature-card ${isIncluded ? "enabled" : "disabled"}`}
              >
                <div className={`feature-status-dot ${isIncluded ? "on" : "off"}`}>
                  {isIncluded ? <Check size={12} /> : <X size={10} />}
                </div>
                <div className="feature-card-content">
                  <span className="feat-name">{feat.label}</span>
                  <span className="feat-sub">{feat.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support / Enterprise Upgrade Banner */}
      <div className="inst-support-banner">
        <div className="banner-icon-wrap">
          <LifeBuoy size={24} />
        </div>
        <div className="banner-content">
          <h4>Need higher quotas or specialized institutional modules?</h4>
          <p>
            Subscriptions and plan upgrades are managed centrally by the EduHub Super Admin team. Contact support or your account administrator to adjust limits or request an enterprise expansion.
          </p>
        </div>
        <Link to="/institute-admin/support" className="banner-contact-btn">
          <span>Contact Support</span>
        </Link>
      </div>
    </div>
  );
}
