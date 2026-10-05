import {
  Building2,
  Users,
  MapPin,
  ArrowLeft,
  Plus,
  Inbox,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchGlobalStats, selectGlobalStats, selectSuperAdminStatus } from "@/store/Slices/superAdminSlice";
import {
  fetchInstitutes,
  selectInstitutes,
  selectInstitutesStatus,
  addInstitute,
} from "@/store/Slices/institutesSlice";
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import InstituteForm from "../Institutes/InstituteForm";
import ManageInstitute from "../Institutes/ManageInstitute";
import toast from "react-hot-toast";
import "./SuperAdminDashboard.css";

const INQUIRY_STATUS_CONFIG = {
  New: { label: "New Lead", bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Contacted: { label: "Contacted", bg: "#fefce8", color: "#ca8a04", border: "#fde047" },
  Converted: { label: "Converted", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Archived: { label: "Archived", bg: "#f4f4f5", color: "#71717a", border: "#e4e4e7" },
};

function DashboardInstituteSkeletonRow() {
  return (
    <article className="super-admin-institute-row dashboard-skel-row">
      <div className="super-admin-institute-main">
        <div className="dash-skel-line dash-skel-thumb" />
        <div className="super-admin-institute-copy" style={{ gap: "6px" }}>
          <div className="dash-skel-line dash-skel-name" />
          <div className="dash-skel-line dash-skel-sub" />
        </div>
      </div>
      <div className="super-admin-institute-meta">
        <div className="dash-skel-line dash-skel-pill" />
        <div className="dash-skel-line dash-skel-btn" style={{ width: "88px" }} />
        <div className="dash-skel-line dash-skel-btn" style={{ width: "76px" }} />
      </div>
    </article>
  );
}

const FILTER_TYPES = [
  { key: "all", label: "All Types" },
  { key: "University", label: "Universities" },
  { key: "College", label: "Colleges" },
  { key: "School", label: "Schools" },
];

export default function SuperAdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const globalStats = useSelector(selectGlobalStats);
  const statsStatus = useSelector(selectSuperAdminStatus);
  const statsLoading = (statsStatus === "idle" || statsStatus === "loading") && !globalStats;
  const instituteData = useSelector(selectInstitutes) || [];
  const institutesStatus = useSelector(selectInstitutesStatus);
  const instituteError = useSelector((state) => state.institutes.error);
  const institutesLoading = (institutesStatus === "idle" || institutesStatus === "loading") && instituteData.length === 0;
  const location = useLocation();
  const selectedInstitute = location.state?.selectedInstitute;
  const [searchTerm, setSearchTerm] = useState(
    () => localStorage.getItem("eduHubSuperSearch") || "",
  );
  const [typeFilter, setTypeFilter] = useState("all");
  const [manageDrawerInstitute, setManageDrawerInstitute] = useState(null);

  // Live Registration Inquiries from Landing Page
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [convertingId, setConvertingId] = useState(null);

  const fetchInquiries = async () => {
    try {
      setInquiriesLoading(true);
      const res = await axiosInstance.get("/super-admin/inquiries");
      setInquiries(res.data?.data || []);
    } catch (err) {
      console.warn("Failed to load dashboard inquiries:", err.message);
    } finally {
      setInquiriesLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchGlobalStats());
    dispatch(fetchInstitutes());
    fetchInquiries();
  }, [dispatch]);

  const handleMarkContacted = async (id) => {
    try {
      await axiosInstance.patch(`/super-admin/inquiries/${id}/status`, { status: "Contacted" });
      toast.success("Lead marked as Contacted");
      setInquiries((prev) =>
        prev.map((inq) => (inq._id === id ? { ...inq, status: "Contacted" } : inq))
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleConvertLead = async (inquiry) => {
    if (!window.confirm(`Convert "${inquiry.instituteName}" to a registered institution on EduHub?`)) {
      return;
    }
    setConvertingId(inquiry._id);
    try {
      await axiosInstance.post(`/super-admin/inquiries/${inquiry._id}/convert`);
      toast.success(`Registered ${inquiry.instituteName} successfully!`);
      setInquiries((prev) =>
        prev.map((inq) => (inq._id === inquiry._id ? { ...inq, status: "Converted" } : inq))
      );
      dispatch(fetchInstitutes());
      dispatch(fetchGlobalStats());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to convert inquiry");
    } finally {
      setConvertingId(null);
    }
  };

  useEffect(() => {
    const onSearch = (event) => {
      const nextQuery = event.detail?.query || "";
      setSearchTerm(nextQuery);
    };

    window.addEventListener("eduHubSuperSearch", onSearch);
    return () => window.removeEventListener("eduHubSuperSearch", onSearch);
  }, []);

  const searchValue = searchTerm.trim().toLowerCase();

  const visibleInstitutes = instituteData.filter((institute) => {
    const matchesType =
      typeFilter === "all" ||
      institute.type?.toLowerCase() === typeFilter.toLowerCase();

    const matchesSearch =
      (institute.name || "").toLowerCase().includes(searchValue) ||
      (institute.type || "").toLowerCase().includes(searchValue) ||
      (institute.board || "").toLowerCase().includes(searchValue) ||
      String(institute.campusCount || 0).includes(searchValue);

    return matchesType && matchesSearch;
  });

  const handleManage = (institute) => {
    const id = institute._id || institute.id;
    navigate(`/institutes/${id}`);
  };

  const handleCampusClick = (institute) => {
    setManageDrawerInstitute({ ...institute, initialTab: "campuses" });
  };

  const handleStudentsClick = (institute) => {
    navigate(`/super-admin/users?institute=${encodeURIComponent(institute.name || "")}`);
  };

  const pendingLeadsCount = inquiries.filter((i) => i.status === "New").length;

  const statsArray = [
    {
      label: "Total Users",
      value: globalStats?.users?.total || 0,
      detail: "Across all active networks",
      icon: Users,
    },
    {
      label: "Registered Institutes",
      value: globalStats?.institutes?.total || 0,
      detail: "Total networks in system",
      icon: Building2,
    },
    {
      label: "Total Campuses",
      value: globalStats?.campuses?.total || 0,
      detail: "Branches globally",
      icon: MapPin,
    },
    {
      label: "Landing Page Leads",
      value: pendingLeadsCount,
      detail: `${inquiries.length} total submissions`,
      icon: Inbox,
      highlight: pendingLeadsCount > 0,
    },
  ];

  return (
    <section className="super-admin-dashboard">
      {manageDrawerInstitute ? (
        <div className="super-admin-manage-fullscreen">
          <div className="super-admin-drawer-head">
            <button
              className="super-admin-back-button"
              onClick={() => setManageDrawerInstitute(null)}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span className="super-admin-drawer-kicker">
                Institute Management
              </span>
              <h3 className="super-admin-drawer-title">
                {manageDrawerInstitute.mode === "new"
                  ? "Add Institute"
                  : manageDrawerInstitute.name}
              </h3>
            </div>
          </div>

          <div className="super-admin-manage-card-wrap">
            {manageDrawerInstitute.mode === "new" ? (
              <InstituteForm
                onSave={async (values) => {
                  try {
                    await dispatch(addInstitute(values)).unwrap();
                    toast.success("Institute added successfully!");
                    setManageDrawerInstitute(null);
                  } catch (error) {
                    toast.error(
                      typeof error === "string" ? error : "Failed to add institute",
                    );
                    throw error;
                  }
                }}
                onCancel={() => setManageDrawerInstitute(null)}
              />
            ) : (
              <ManageInstitute
                institute={manageDrawerInstitute}
                onClose={() => setManageDrawerInstitute(null)}
              />
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="super-admin-stats-grid">
            {statsArray.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <article className="super-admin-stat-card" key={index}>
                  <div className="super-admin-stat-head">
                    <span className="super-admin-stat-label">{stat.label}</span>
                    <div className="super-admin-stat-icon" aria-hidden="true">
                      <Icon size={16} />
                    </div>
                  </div>
                  {statsLoading ? (
                    <div className="super-admin-stat-skeleton" />
                  ) : statsStatus === "failed" && !globalStats ? (
                    <div className="super-admin-stat-value" aria-label="Unavailable">—</div>
                  ) : (
                    <div className="super-admin-stat-value">{stat.value ?? 0}</div>
                  )}
                  <div className="super-admin-stat-detail">{stat.detail}</div>
                </article>
              );
            })}
          </div>

          {/* ── LANDING PAGE LEADS & INQUIRIES WIDGET ── */}
          <section className="super-admin-inquiries-panel">
            <div className="super-admin-panel-head">
              <div className="super-admin-panel-titles">
                <div className="super-admin-panel-title-row">
                  <div className="super-admin-panel-title-icon">
                    <Inbox size={15} />
                  </div>
                  <h2>Landing Page Inquiries & Registrations</h2>
                </div>
                <p>Live partner registrations submitted from the public landing page</p>
              </div>

              <div className="super-admin-panel-actions">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchInquiries}
                  className="super-admin-header-btn super-admin-refresh-btn"
                  title="Refresh leads"
                >
                  <RefreshCw size={13} className={inquiriesLoading ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/super-admin/inquiries")}
                  className="super-admin-header-btn super-admin-view-all-btn"
                >
                  <span>View All Inquiries ({inquiries.length})</span>
                  <ArrowRight size={13} />
                </Button>
              </div>
            </div>

            <div className="super-admin-inquiry-list" style={{ marginTop: "16px" }}>
              {inquiriesLoading ? (
                <div style={{ padding: "20px 0", textAlign: "center" }}>
                  <Spinner size={24} className="mx-auto text-emerald-600" />
                  <p style={{ fontSize: "13px", color: "#71717a", marginTop: "8px" }}>Loading incoming inquiries...</p>
                </div>
              ) : inquiries.length === 0 ? (
                <div className="super-admin-empty-state" style={{ padding: "24px 16px" }}>
                  <div className="super-admin-empty-icon" aria-hidden="true">
                    <Inbox size={24} />
                  </div>
                  <p className="super-admin-empty-title">No pending registration leads</p>
                  <p className="super-admin-empty-desc">
                    When prospective institutions submit the registration form on the public landing page, they will show up here instantly in real-time.
                  </p>
                </div>
              ) : (
                inquiries.slice(0, 5).map((inquiry) => {
                  const cfg = INQUIRY_STATUS_CONFIG[inquiry.status] || INQUIRY_STATUS_CONFIG.New;
                  const dateStr = inquiry.createdAt
                    ? new Date(inquiry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "Recently";

                  return (
                    <article className="super-admin-inquiry-row" key={inquiry._id}>
                      <div className="super-admin-inquiry-main">
                        <div className="super-admin-inquiry-icon">
                          <Building2 size={20} />
                        </div>
                        <div className="super-admin-inquiry-info">
                          <div className="super-admin-inquiry-title-row">
                            <h3 className="super-admin-inquiry-inst-name">{inquiry.instituteName}</h3>
                            <span className="super-admin-inquiry-type-tag">{inquiry.instituteType}</span>
                            <span
                              className="super-admin-inquiry-status-badge"
                              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          <div className="super-admin-inquiry-rep">
                            <span>Representative: <strong>{inquiry.fullName}</strong></span>
                            {inquiry.createdAt && (
                              <span style={{ color: "#a1a1aa", marginLeft: "10px", fontSize: "11px" }}>
                                <Clock size={11} style={{ display: "inline", marginRight: "3px" }} />
                                {dateStr}
                              </span>
                            )}
                          </div>

                          <div className="super-admin-inquiry-contacts">
                            <a href={`mailto:${inquiry.email}`}>
                              <Mail size={12} /> {inquiry.email}
                            </a>
                            <a href={`tel:${inquiry.phone}`}>
                              <Phone size={12} /> {inquiry.phone}
                            </a>
                          </div>

                          {inquiry.message && (
                            <div className="super-admin-inquiry-note">
                              {inquiry.message}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="super-admin-inquiry-side">
                        {inquiry.status === "New" && (
                          <button
                            type="button"
                            className="super-admin-inquiry-btn super-admin-inquiry-btn-contact"
                            onClick={() => handleMarkContacted(inquiry._id)}
                          >
                            Mark Contacted
                          </button>
                        )}
                        {inquiry.status !== "Converted" && (
                          <button
                            type="button"
                            className="super-admin-inquiry-btn super-admin-inquiry-btn-convert"
                            disabled={convertingId === inquiry._id}
                            onClick={() => handleConvertLead(inquiry)}
                          >
                            {convertingId === inquiry._id ? (
                              <Spinner className="size-3 text-white" />
                            ) : (
                              <Building2 size={13} />
                            )}
                            Convert to Institute
                          </button>
                        )}
                        {inquiry.status === "Converted" && (
                          <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle2 size={14} /> Registered
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* ── REGISTERED INSTITUTES LIST ── */}
          <section className="super-admin-institutes-panel">
            <div className="super-admin-panel-head">
              <div className="super-admin-panel-titles">
                <h2>Registered Institutes</h2>
                <p>Overview of top-performing networks</p>
              </div>

              <Button
                className="super-admin-add-button"
                onClick={() => setManageDrawerInstitute({ mode: "new" })}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add Institute</span>
              </Button>
            </div>

            <div className="super-admin-panel-toolbar">
              <div
                className="super-admin-filters-group"
                role="group"
                aria-label="Filter institutes by type"
              >
                {FILTER_TYPES.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    className={`super-admin-filter-pill ${typeFilter === type.key ? "active" : ""}`}
                    onClick={() => setTypeFilter(type.key)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="super-admin-institute-list">
              {institutesLoading ? (
                <>
                  <DashboardInstituteSkeletonRow />
                  <DashboardInstituteSkeletonRow />
                  <DashboardInstituteSkeletonRow />
                </>
              ) : institutesStatus === "failed" && instituteData.length === 0 ? (
                <div className="super-admin-empty-state" role="alert">
                  <div className="super-admin-empty-icon" aria-hidden="true">
                    <Building2 size={26} />
                  </div>
                  <p className="super-admin-empty-title">Unable to load institutes</p>
                  <p className="super-admin-empty-desc">{instituteError || "The institute list could not be loaded."}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(fetchInstitutes())}
                    className="super-admin-empty-action"
                  >
                    Retry
                  </Button>
                </div>
              ) : visibleInstitutes.length === 0 ? (
                <div className="super-admin-empty-state">
                  <div className="super-admin-empty-icon" aria-hidden="true">
                    <Building2 size={26} />
                  </div>
                  <p className="super-admin-empty-title">No institutes found</p>
                  <p className="super-admin-empty-desc">
                    {searchTerm || typeFilter !== "all"
                      ? "No institutions match your search or filter criteria. Try selecting another filter."
                      : "No institutions have been registered in the system yet."}
                  </p>
                  {(searchTerm || typeFilter !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTypeFilter("all");
                        setSearchTerm("");
                      }}
                      className="super-admin-empty-action"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                visibleInstitutes.map((institute, index) => {
                  const instId = institute._id || institute.id;

                  return (
                    <article
                      className={`super-admin-institute-row ${
                        selectedInstitute === institute.name ? "selected" : ""
                      }`}
                      key={instId || index}
                    >
                      <div className="super-admin-institute-main">
                        <img
                          className="super-admin-institute-image"
                          src={
                            institute.image ||
                            "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=80&q=80"
                          }
                          alt=""
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=80&q=80";
                          }}
                        />
                        <div className="super-admin-institute-copy">
                          <h3 className="super-admin-institute-name">
                            {institute.name}
                          </h3>
                          <p className="super-admin-institute-type">
                            {institute.type || "Institution"} ·{" "}
                            {institute.board || "General"}
                          </p>
                        </div>
                      </div>

                      <div className="super-admin-institute-meta">
                        <button
                          type="button"
                          className="super-admin-campus-count super-admin-clickable"
                          onClick={() => handleCampusClick(institute)}
                          aria-label={`Show campuses for ${institute.name}`}
                        >
                          {institute.campusCount || 0} Campuses
                        </button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="super-admin-row-btn super-admin-view-users-btn"
                          onClick={() => handleStudentsClick(institute)}
                          aria-label={`Show users for ${institute.name}`}
                        >
                          View Users
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          className="super-admin-row-btn super-admin-manage-btn"
                          onClick={() => handleManage(institute)}
                          aria-label={`Manage ${institute.name}`}
                        >
                          Manage
                        </Button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

