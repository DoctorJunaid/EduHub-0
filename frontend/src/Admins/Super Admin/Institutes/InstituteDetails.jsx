import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import PageLoader from "@/components/shared/PageLoader";
import { selectInstitutes } from "@/store/Slices/institutesSlice";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import "./Institutes.css";

const emptyMedia =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

export default function InstituteDetails() {
  const navigate = useNavigate();
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
        await navigator.clipboard.writeText(link);
        setCopiedLink(true);
        toast.success("Setup link copied to clipboard!");
        setTimeout(() => setCopiedLink(false), 3000);
      } catch {
        toast.error("Failed to copy link");
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
      } catch (err) {
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

  if (loading) {
    return (
      <section className="institute-details-page">
        <PageLoader text="Loading institute records..." />
      </section>
    );
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
      <div className="institute-details-breadcrumbs">
        <Link to="/super-admin">Dashboard</Link>
        <span className="sep">&gt;</span>
        <Link to="/institutes">Institutes</Link>
        <span className="sep">&gt;</span>
        <span className="current">{institute.name}</span>
      </div>

      <section className="institute-details-header">
        <div className="institute-details-title-wrap">
          <button
            className="institute-details-back"
            onClick={() => navigate("/institutes")}
            aria-label="Back to institutes"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{institute.name}</h1>
            <div className="institute-details-meta-strip">
              <span className="meta-row-icon">
                <Building2 size={16} /> {institute.type || "Institute"}
              </span>
              <span className="meta-row-sep">|</span>
              <span className="meta-row-icon">
                <Mail size={16} /> {institute.email || "No email listed"}
              </span>
              <span className="meta-row-sep">|</span>
              <span className="meta-row-icon">
                <Phone size={16} /> {institute.phone || "No phone listed"}
              </span>
              <span className="meta-row-sep">|</span>
              <span className="meta-row-icon">
                <Calendar size={16} /> Registered:{" "}
                {new Date(institute.createdAt || institute.added || new Date()).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="institute-details-top-actions">
          <span className="status-chip">
            <span className="status-dot" /> {institute.status || "Active"}
          </span>
          {institute.board && <span className="board-chip">{institute.board}</span>}
          <button
            className="public-page-button"
            onClick={() => navigate(`/institutes/${targetId}`)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <SlidersHorizontal size={14} /> Management Console
          </button>
          <button
            className="edit-details-button"
            onClick={() => navigate(`/institutes/${targetId}/edit`)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Pencil size={14} /> Edit Details
          </button>
        </div>
      </section>

      <section className="institute-details-grid">
        <div className="institute-details-main">
          <section className="institute-details-stat-grid">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <article className="institute-details-stat-card" key={idx}>
                  <div className="stat-card-title">
                    <span>{stat.label}</span>
                    <span className="stat-card-icon">
                      <Icon size={18} />
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
                <div style={{ padding: "24px", textAlign: "center", color: "#71717a", fontSize: "13px" }}>
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

        <aside className="institute-details-side">
          <section className="institute-details-cover-panel">
            <h2>Cover Identity</h2>
            <img
              className="institute-details-cover"
              src={institute.coverImageUrl || institute.image || emptyMedia}
              alt={institute.name}
              onError={(e) => {
                e.currentTarget.src = emptyMedia;
              }}
            />
          </section>

          <section className="institute-details-contact-panel" style={{ marginTop: "16px" }}>
            <h2>Institute Administrator</h2>
            {institute.adminId ? (
              <div className="contact-info">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#09090b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" }}>
                    {(institute.adminId.name || "A").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#09090b" }}>{institute.adminId.name}</div>
                    <span style={{ display: "inline-block", padding: "2px 8px", background: institute.adminId.status === "Active" ? "#ecfdf5" : "#fef3c7", color: institute.adminId.status === "Active" ? "#065f46" : "#92400e", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>
                      {institute.adminId.status === "Active" ? "Active Account" : "Pending Password Setup"}
                    </span>
                  </div>
                </div>
                <span className="contact-label">Admin Email</span>
                <span className="contact-value email-value">{institute.adminId.email}</span>
                {institute.adminId.phone && (
                  <>
                    <span className="contact-label">Admin Phone</span>
                    <span className="contact-value">{institute.adminId.phone}</span>
                  </>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f4f4f5" }}>
                  <button
                    onClick={handleResendAdminInvite}
                    disabled={resendingEmail}
                    style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "32px", padding: "0 10px", background: "#09090b", color: "#fff", borderRadius: "6px", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    {resendingEmail ? <Spinner className="size-3 text-white" /> : <Send size={12} />}
                    Resend Email
                  </button>
                  <button
                    onClick={handleCopyAdminLink}
                    style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "32px", padding: "0 10px", background: "#fff", color: "#09090b", borderRadius: "6px", border: "1px solid #e4e4e7", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    {copiedLink ? <Check size={12} style={{ color: "green" }} /> : <Copy size={12} />}
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: "#71717a", textAlign: "center", padding: "12px 0" }}>
                No administrator assigned yet.
                <button
                  onClick={() => navigate(`/institutes/${targetId}`)}
                  style={{ display: "block", margin: "10px auto 0", padding: "6px 14px", borderRadius: "6px", background: "#09090b", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  Assign Admin
                </button>
              </div>
            )}
          </section>

          <section className="institute-details-contact-panel">
            <h2>Contact Information</h2>
            <div className="contact-info">
              <span className="contact-label">Head Office</span>
              <span className="contact-value">
                {institute.headOfficeAddress || "Head office address not set"}
              </span>
              <span className="contact-label">Support Email</span>
              <span className="contact-value email-value">
                {institute.email || "N/A"}
              </span>
              <span className="contact-label">Primary Phone</span>
              <span className="contact-value">{institute.phone || "N/A"}</span>
            </div>
          </section>
        </aside>
      </section>
    </section>
  );
}
