import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Building2,
  Calendar,
  GraduationCap,
  Image,
  Mail,
  MapPin,
  Phone,
  Users,
  SlidersHorizontal,
  Pencil,
  User,
  Send,
  Copy,
  Check,
  CreditCard,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { selectInstitutes } from "@/store/Slices/institutesSlice";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import "./Institutes.css";
import { cn } from "@/lib/utils";

const emptyMedia =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

function InstituteDetailsSkeleton({ onBack }) {
  return (
    <section className="institute-details-page">
      <section className="institute-details-top-card">
        <div className="institute-details-back-bar">
          <button
            type="button"
            className="institute-details-back-btn"
            onClick={onBack}
            aria-label="Back to institutes"
          >
            <ArrowLeft size={15} />
            <span>Back to Institutes</span>
          </button>
        </div>

        <div className="institute-details-header-content">
          <div className="institute-details-identity">
            <div className="inst-skel-line" style={{ width: "240px", height: "26px", marginBottom: "8px" }} />
            <div className="institute-details-meta-strip">
              <div className="inst-skel-line" style={{ width: "90px", height: "14px" }} />
              <span className="meta-row-sep">•</span>
              <div className="inst-skel-line" style={{ width: "140px", height: "14px" }} />
              <span className="meta-row-sep">•</span>
              <div className="inst-skel-line" style={{ width: "110px", height: "14px" }} />
            </div>
          </div>

          <div className="institute-details-actions-cluster">
            <div className="institute-details-badges">
              <div className="inst-skel-line" style={{ width: "70px", height: "26px", borderRadius: "999px" }} />
              <div className="inst-skel-line" style={{ width: "80px", height: "26px", borderRadius: "999px" }} />
            </div>
            <div className="institute-details-cta-buttons">
              <div className="inst-skel-line" style={{ width: "160px", height: "34px", borderRadius: "8px" }} />
              <div className="inst-skel-line" style={{ width: "110px", height: "34px", borderRadius: "8px" }} />
            </div>
          </div>
        </div>
      </section>

      <div className="institute-details-grid">
        <div className="institute-details-main">
          <section className="institute-details-stat-grid">
            {[1, 2, 3].map((i) => (
              <article className="institute-details-stat-card" key={i}>
                <div className="stat-card-title">
                  <div className="inst-skel-line" style={{ width: "80px", height: "12px" }} />
                  <div className="stat-card-icon inst-skel-line" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
                </div>
                <div className="inst-skel-line" style={{ width: "50px", height: "26px", marginTop: "12px" }} />
              </article>
            ))}
          </section>

          <section className="institute-details-campus-panel">
            <div className="panel-heading">
              <div className="inst-skel-line" style={{ width: "160px", height: "18px" }} />
            </div>
            <div className="campus-table">
              <div className="campus-table-head">
                <span>Campus Name</span>
                <span>Location / Address</span>
                <span>Status</span>
              </div>
              {[1, 2].map((i) => (
                <div className="campus-table-row" key={i}>
                  <div className="inst-skel-line" style={{ width: "120px", height: "16px" }} />
                  <div className="inst-skel-line" style={{ width: "140px", height: "14px" }} />
                  <div className="inst-skel-line" style={{ width: "60px", height: "20px", borderRadius: "999px" }} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="institute-details-side">
          <section className="institute-details-sidebar-card">
            <div className="inst-skel-line" style={{ width: "120px", height: "16px", marginBottom: "12px" }} />
            <div className="inst-skel-line" style={{ width: "100%", height: "120px", borderRadius: "8px" }} />
          </section>
          <section className="institute-details-sidebar-card">
            <div className="inst-skel-line" style={{ width: "140px", height: "16px", marginBottom: "12px" }} />
            <div className="inst-skel-line" style={{ width: "100%", height: "70px", borderRadius: "8px" }} />
          </section>
          <section className="institute-details-sidebar-card">
            <div className="inst-skel-line" style={{ width: "110px", height: "16px", marginBottom: "12px" }} />
            <div className="inst-skel-line" style={{ width: "100%", height: "50px", borderRadius: "8px" }} />
          </section>
        </aside>
      </div>
    </section>
  );
}

export default function InstituteDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { instituteId } = useParams();

  const institutes = useSelector(selectInstitutes) || [];
  const cachedInstitute = useMemo(
    () => institutes.find((item) => (item.id === instituteId || item._id === instituteId)),
    [institutes, instituteId]
  );

  const [institute, setInstitute] = useState(cachedInstitute || null);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(!cachedInstitute);

  // Admin credentials state
  const [resendingEmail, setResendingEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [latestSetupLink, setLatestSetupLink] = useState("");

  const handleResendAdminInvite = async () => {
    setResendingEmail(true);
    try {
      const res = await axiosInstance.post(`/super-admin/institutes/${instituteId}/resend-admin-invite`);
      toast.success(res.data?.message || "Setup email sent successfully!");
      if (res.data?.data?.resetLink) {
        setLatestSetupLink(res.data.data.resetLink);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send setup email");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleCopyAdminLink = async () => {
    let link = latestSetupLink;
    if (!link) {
      try {
        const res = await axiosInstance.post(`/super-admin/institutes/${instituteId}/resend-admin-invite`);
        link = res.data?.data?.resetLink;
        if (link) setLatestSetupLink(link);
      } catch (err) {
        toast.error("Failed to generate link: " + (err.response?.data?.message || err.message));
        return;
      }
    }
    if (link) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(link);
        } else {
          throw new Error("Clipboard API unavailable");
        }
        setCopiedLink(true);
        toast.success("Setup link copied to clipboard!");
        setTimeout(() => setCopiedLink(false), 3000);
      } catch {
        try {
          const textarea = document.createElement("textarea");
          textarea.value = link;
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          setCopiedLink(true);
          toast.success("Setup link copied to clipboard!");
          setTimeout(() => setCopiedLink(false), 3000);
        } catch {
          toast.error("Failed to copy link");
        }
      }
    }
  };

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [instRes, campRes] = await Promise.all([
          axiosInstance.get(`/super-admin/institutes/${instituteId}`).catch(() => null),
          axiosInstance.get(`/super-admin/campuses?instituteId=${instituteId}`).catch(() => null),
        ]);

        if (!active) return;

        if (instRes?.data?.data) {
          setInstitute(instRes.data.data);
        } else if (cachedInstitute) {
          setInstitute(cachedInstitute);
        }

        if (campRes?.data?.data) {
          setCampuses(campRes.data.data);
        }
      } catch {
        if (active && !cachedInstitute) {
          toast.error("Failed to load institute details");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [instituteId, cachedInstitute]);

  // Sync dynamic institute name into location.state so Header displays the actual institute name
  useEffect(() => {
    if (institute?.name && location.state?.name !== institute.name) {
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, name: institute.name },
      });
    }
  }, [institute?.name, location.pathname, location.state, navigate]);

  if (loading && !institute) {
    return <InstituteDetailsSkeleton onBack={() => navigate("/institutes")} />;
  }

  if (!institute && !loading) {
    return (
      <section className="institute-details-page">
        <div style={{ padding: "40px 20px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid #e4e4e7", maxWidth: "500px", margin: "40px auto" }}>
          <Building2 size={40} style={{ margin: "0 auto 12px", color: "#a1a1aa" }} />
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>Institute Not Found</h3>
          <p style={{ fontSize: "14px", color: "#71717a", margin: "0 0 20px" }}>
            The institute you requested could not be located.
          </p>
          <button
            onClick={() => navigate("/institutes")}
            style={{
              height: "36px",
              padding: "0 16px",
              borderRadius: "8px",
              border: "1px solid #e4e4e7",
              background: "#fff",
              color: "#09090b",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Return to Institutes
          </button>
        </div>
      </section>
    );
  }

  const stats = [
    {
      label: "Total Campuses",
      value: campuses.length || institute.campusCount || 0,
      icon: MapPin,
    },
    {
      label: "Enrolled Students",
      value: institute.studentCount || institute.studentRecords?.length || 0,
      icon: Users,
    },
    {
      label: "Total Faculty",
      value: institute.facultyCount || 0,
      icon: GraduationCap,
    },
  ];

  const targetId = institute._id || institute.id || instituteId;

  return (
    <section className="institute-details-page">
      {/* ── TOP HEADER CARD (BACK NAV + IDENTITY + ACTIONS) ── */}
      <section className="institute-details-top-card">
        <div className="institute-details-back-bar">
          <button
            type="button"
            className="institute-details-back-btn"
            onClick={() => navigate("/institutes")}
            aria-label="Back to institutes"
          >
            <ArrowLeft size={15} />
            <span>Back to Institutes</span>
          </button>
        </div>

        <div className="institute-details-header-content">
          <div className="institute-details-identity">
            <h1 className="institute-details-title">{institute.name}</h1>
            <div className="institute-details-meta-strip">
              <span className="meta-row-icon">
                <Building2 size={14} /> {institute.type || "Institute"}
              </span>
              <span className="meta-row-sep">•</span>
              <span className="meta-row-icon">
                <Mail size={14} /> {institute.email || "No email listed"}
              </span>
              <span className="meta-row-sep">•</span>
              <span className="meta-row-icon">
                <Phone size={14} /> {institute.phone || "No phone listed"}
              </span>
              <span className="meta-row-sep">•</span>
              <span className="meta-row-icon">
                <Calendar size={14} /> Registered:{" "}
                {new Date(institute.createdAt || institute.added || new Date()).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="institute-details-actions-cluster">
            <div className="institute-details-badges">
              <span className="status-chip">
                <span className="status-dot" /> {institute.status || "Active"}
              </span>
              {institute.board && <span className="board-chip">{institute.board}</span>}
            </div>
            <div className="institute-details-cta-buttons">
              <button
                type="button"
                className="institute-console-btn"
                onClick={() => navigate(`/institutes/${targetId}`)}
              >
                <SlidersHorizontal size={14} />
                <span>Management Console</span>
              </button>
              <button
                type="button"
                className="institute-edit-btn"
                onClick={() => navigate(`/institutes/${targetId}/edit`)}
              >
                <Pencil size={14} />
                <span>Edit Details</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TWO-COLUMN MAIN WORKSPACE ── */}
      <div className="institute-details-grid">
        {/* LEFT COLUMN: KPI CARDS + CAMPUSES */}
        <div className="institute-details-main">
          <section className="institute-details-stat-grid">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <article className="institute-details-stat-card" key={idx}>
                  <div className="stat-card-title">
                    <span>{stat.label}</span>
                    <span className="stat-card-icon">
                      <Icon size={16} />
                    </span>
                  </div>
                  <div className="stat-card-value">{stat.value}</div>
                </article>
              );
            })}
          </section>

          <section className="institute-details-campus-panel">
            <div className="panel-heading">
              <h2>Campus Locations ({campuses.length})</h2>
            </div>
            <div className="campus-table">
              <div className="campus-table-head">
                <span>Campus Name</span>
                <span>Location / Address</span>
                <span>Status</span>
              </div>
              {campuses.length === 0 ? (
                <div className="campus-empty-state">
                  No campus branches registered yet for this network.
                </div>
              ) : (
                campuses.map((campus, index) => (
                  <div className="campus-table-row" key={campus._id || campus.id || index}>
                    <span className="campus-name">{campus.name}</span>
                    <span className="campus-location">
                      {campus.location || campus.address?.city || campus.address?.street || "Not specified"}
                    </span>
                    <span className="campus-status">{campus.status || "Active"}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: 4 COHESIVE SIDEBAR CARDS */}
        <aside className="institute-details-side">
          {/* Card 1: Cover Identity */}
          <section className="institute-details-sidebar-card">
            <h2 className="sidebar-card-title">
              <Image size={15} /> Cover Identity
            </h2>
            <div className="institute-details-cover-wrap">
              <img
                className="institute-details-cover"
                src={institute.coverImageUrl || institute.image || emptyMedia}
                alt={institute.name}
                onError={(e) => {
                  e.currentTarget.src = emptyMedia;
                }}
              />
            </div>
          </section>

          {/* Card 2: Institute Administrator */}
          <section className="institute-details-sidebar-card">
            <h2 className="sidebar-card-title">
              <User size={15} /> Institute Administrator
            </h2>
            {institute.adminId ? (
              <div className="admin-card-body">
                <div className="admin-user-row">
                  <div className="admin-avatar">
                    {(institute.adminId.name || "A").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="admin-user-info">
                    <div className="admin-user-name">{institute.adminId.name}</div>
                    <span
                      className={cn(
                        "admin-status-badge",
                        institute.adminId.status === "Active" ? "active" : "pending"
                      )}
                    >
                      {institute.adminId.status === "Active" ? "Active Account" : "Pending Password Setup"}
                    </span>
                  </div>
                </div>

                <div className="admin-contact-group">
                  <span className="sidebar-meta-label">Admin Email</span>
                  <span className="sidebar-meta-value">{institute.adminId.email}</span>
                  {institute.adminId.phone && (
                    <>
                      <span className="sidebar-meta-label" style={{ marginTop: "6px" }}>Admin Phone</span>
                      <span className="sidebar-meta-value">{institute.adminId.phone}</span>
                    </>
                  )}
                </div>

                <div className="admin-actions-row">
                  <button
                    type="button"
                    onClick={handleResendAdminInvite}
                    disabled={resendingEmail}
                    className="admin-action-btn primary"
                  >
                    {resendingEmail ? <Spinner className="size-3 text-white" /> : <Send size={12} />}
                    <span>Resend Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAdminLink}
                    className="admin-action-btn outline"
                  >
                    {copiedLink ? <Check size={12} style={{ color: "#16a34a" }} /> : <Copy size={12} />}
                    <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="admin-empty-state">
                <p>No administrator assigned yet.</p>
                <button
                  type="button"
                  onClick={() => navigate(`/institutes/${targetId}`)}
                  className="admin-assign-btn"
                >
                  Assign Admin
                </button>
              </div>
            )}
          </section>

          {/* Card 3: SaaS Subscription */}
          <section className="institute-details-sidebar-card">
            <div className="sidebar-card-header-row">
              <h2 className="sidebar-card-title">
                <CreditCard size={15} /> SaaS Subscription
              </h2>
              <span className="status-chip subscription">
                {institute.subscriptionStatus || "Active"}
              </span>
            </div>

            <div className="subscription-body">
              <div className="subscription-row">
                <span className="subscription-label">Plan Tier:</span>
                <strong className="subscription-value">
                  {institute.planId?.name || (institute.planTier ? institute.planTier.toUpperCase() : "Free Tier")}
                </strong>
              </div>
              <div className="subscription-row">
                <span className="subscription-label">Billing Cycle:</span>
                <strong className="subscription-value">
                  {institute.subscriptionBillingCycle || "Yearly"}
                </strong>
              </div>
              <div className="subscription-row">
                <span className="subscription-label">Valid Until:</span>
                <strong className="subscription-value">
                  {institute.subscriptionEndDate ? new Date(institute.subscriptionEndDate).toLocaleDateString() : "Lifetime"}
                </strong>
              </div>

              <Link
                to="/super-admin/subscriptions"
                className="subscription-manage-link"
              >
                <CreditCard size={13} />
                <span>Manage Subscriptions</span>
              </Link>
            </div>
          </section>

          {/* Card 4: Contact Information */}
          <section className="institute-details-sidebar-card">
            <h2 className="sidebar-card-title">
              <Building2 size={15} /> Contact Information
            </h2>
            <div className="contact-info-body">
              <span className="sidebar-meta-label">Head Office</span>
              <span className="sidebar-meta-value">
                {institute.headOfficeAddress || "Head office address not set"}
              </span>
              <span className="sidebar-meta-label" style={{ marginTop: "8px" }}>Support Email</span>
              <span className="sidebar-meta-value email-value">
                {institute.email || "N/A"}
              </span>
              <span className="sidebar-meta-label" style={{ marginTop: "8px" }}>Primary Phone</span>
              <span className="sidebar-meta-value">{institute.phone || "N/A"}</span>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
