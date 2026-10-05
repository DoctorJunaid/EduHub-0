import { useState, useEffect } from "react";
import {
  Inbox,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  Building2,
  Search,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import "./SuperAdminInquiries.css";

const STATUS_CONFIG = {
  New: {
    label: "New Lead",
    bg: "#f4f4f5",
    color: "#18181b",
    border: "#e4e4e7",
  },
  Contacted: {
    label: "Contacted",
    bg: "#fefce8",
    color: "#854d0e",
    border: "#fef08a",
  },
  Converted: {
    label: "Converted to Institute",
    bg: "#f0fdf4",
    color: "#166534",
    border: "#bbf7d0",
  },
  Archived: {
    label: "Archived",
    bg: "#f4f4f5",
    color: "#71717a",
    border: "#e4e4e7",
  },
};

function InquirySkeletonCard() {
  return (
    <div className="inquiry-item-card inquiry-skeleton-card">
      <div className="inquiry-main">
        <div className="inquiry-header-row">
          <div className="skeleton-line skeleton-tag" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-pill" />
        </div>
        <div className="inquiry-contact-details">
          <div className="skeleton-line skeleton-contact-item" />
          <div className="skeleton-line skeleton-contact-item" />
          <div className="skeleton-line skeleton-contact-item" />
        </div>
        <div className="skeleton-line skeleton-quote" />
      </div>
      <div className="inquiry-actions">
        <div className="skeleton-line skeleton-dropdown" />
        <div className="skeleton-line skeleton-btn" />
      </div>
    </div>
  );
}

export default function SuperAdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [convertingId, setConvertingId] = useState(null);

  const fetchInquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.instituteType = typeFilter;
      if (search.trim()) params.search = search.trim();

      const res = await axiosInstance.get("/super-admin/inquiries", { params });
      setInquiries(res.data?.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load inquiries";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInquiries();
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, typeFilter, search]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/super-admin/inquiries/${id}/status`, { status: newStatus });
      toast.success(`Inquiry marked as ${newStatus}`);
      setInquiries((prev) =>
        prev.map((inq) => (inq._id === id ? { ...inq, status: newStatus } : inq))
      );
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleConvert = async (inquiry) => {
    if (!window.confirm(`Convert "${inquiry.instituteName}" into a registered institute on EduHub? This will create the institute and generate admin invite credentials.`)) {
      return;
    }

    setConvertingId(inquiry._id);
    try {
      await axiosInstance.post(`/super-admin/inquiries/${inquiry._id}/convert`);
      toast.success("Institute successfully registered from lead!");
      setInquiries((prev) =>
        prev.map((inq) =>
          inq._id === inquiry._id ? { ...inq, status: "Converted" } : inq
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to convert inquiry");
    } finally {
      setConvertingId(null);
    }
  };

  const counts = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === "New").length,
    contacted: inquiries.filter((i) => i.status === "Contacted").length,
    converted: inquiries.filter((i) => i.status === "Converted").length,
  };

  return (
    <div className="super-inquiries-page">
      {/* KPI Cards: Stable 4-Column Grid */}
      <div className="inquiries-metrics-grid">
        <div className="inquiry-stat-card">
          <span className="stat-label">Total Leads</span>
          {initialLoading ? (
            <div className="stat-value-skeleton" />
          ) : error && inquiries.length === 0 ? (
            <span className="stat-value" aria-label="Unavailable">—</span>
          ) : (
            <span className="stat-value">{counts.total}</span>
          )}
        </div>
        <div className="inquiry-stat-card">
          <span className="stat-label">New Submissions</span>
          {initialLoading ? (
            <div className="stat-value-skeleton" />
          ) : error && inquiries.length === 0 ? (
            <span className="stat-value" aria-label="Unavailable">—</span>
          ) : (
            <span className="stat-value">{counts.new}</span>
          )}
        </div>
        <div className="inquiry-stat-card">
          <span className="stat-label">In Discussion</span>
          {initialLoading ? (
            <div className="stat-value-skeleton" />
          ) : error && inquiries.length === 0 ? (
            <span className="stat-value" aria-label="Unavailable">—</span>
          ) : (
            <span className="stat-value">{counts.contacted}</span>
          )}
        </div>
        <div className="inquiry-stat-card">
          <span className="stat-label">Converted Institutes</span>
          {initialLoading ? (
            <div className="stat-value-skeleton" />
          ) : error && inquiries.length === 0 ? (
            <span className="stat-value" aria-label="Unavailable">—</span>
          ) : (
            <span className="stat-value">{counts.converted}</span>
          )}
        </div>
      </div>

      {/* Filters Bar: Stays in place during loading */}
      <div className="inquiries-filters-bar">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by institute, contact name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-wrap">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Pipeline Stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Converted">Converted</option>
            <option value="Archived">Archived</option>
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Institution Types</option>
            <option value="School">School</option>
            <option value="College">College</option>
            <option value="University">University</option>
            <option value="Academy">Academy</option>
          </select>

          <button
            type="button"
            className="inquiries-refresh-btn"
            onClick={fetchInquiries}
            disabled={loading}
            title="Refresh inquiries"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Results Container: Retains Identical Structure Across All States */}
      <div className="inquiries-table-card">
        {error ? (
          <div className="inquiries-error-state">
            <AlertTriangle size={32} className="inquiries-error-icon" />
            <h3 className="inquiries-error-title">Unable to Load Inquiries</h3>
            <p className="inquiries-error-msg">{error}</p>
            <button
              type="button"
              className="inquiries-retry-btn"
              onClick={fetchInquiries}
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        ) : initialLoading ? (
          <div className="inquiries-list">
            <InquirySkeletonCard />
            <InquirySkeletonCard />
            <InquirySkeletonCard />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="inquiries-empty">
            <Inbox size={40} className="inquiries-empty-icon" />
            <h3 className="inquiries-empty-title">No Inquiries Found</h3>
            <p className="inquiries-empty-desc">
              {search || statusFilter !== "all" || typeFilter !== "all"
                ? "No landing page inquiries match your current search or filter criteria."
                : "No landing page inquiries have been submitted yet."}
            </p>
            {(search || statusFilter !== "all" || typeFilter !== "all") && (
              <button
                type="button"
                className="inquiries-reset-btn"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={`inquiries-list ${loading ? "is-refreshing" : ""}`}>
            {inquiries.map((inq) => {
              const cfg = STATUS_CONFIG[inq.status] || STATUS_CONFIG.New;
              const isConverting = convertingId === inq._id;

              return (
                <div key={inq._id} className="inquiry-item-card">
                  <div className="inquiry-main">
                    <div className="inquiry-header-row">
                      <div className="inquiry-inst-info">
                        <span className="inquiry-type-tag">{inq.instituteType}</span>
                        <h3 className="inquiry-inst-name">{inq.instituteName}</h3>
                      </div>
                      <span
                        className="inquiry-status-pill"
                        style={{
                          backgroundColor: cfg.bg,
                          color: cfg.color,
                          borderColor: cfg.border,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    <div className="inquiry-contact-details">
                      <span>
                        <strong className="contact-prefix">Contact:</strong> {inq.fullName}
                      </span>
                      <span>
                        <Mail size={13} className="contact-icon" /> {inq.email}
                      </span>
                      <span>
                        <Phone size={13} className="contact-icon" /> {inq.phone}
                      </span>
                      <span>
                        <Calendar size={13} className="contact-icon" />{" "}
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {inq.message && (
                      <div className="inquiry-message-quote">
                        "{inq.message}"
                      </div>
                    )}
                  </div>

                  <div className="inquiry-actions">
                    <select
                      className="status-dropdown"
                      value={inq.status || "New"}
                      onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                    >
                      <option value="New">Stage: New</option>
                      <option value="Contacted">Stage: Contacted</option>
                      <option value="Converted">Stage: Converted</option>
                      <option value="Archived">Stage: Archived</option>
                    </select>

                    {inq.status !== "Converted" ? (
                      <button
                        type="button"
                        className="convert-btn"
                        onClick={() => handleConvert(inq)}
                        disabled={isConverting}
                      >
                        {isConverting ? (
                          <Spinner className="size-3.5" />
                        ) : (
                          <Building2 size={13} />
                        )}
                        <span>Convert to Institute</span>
                      </button>
                    ) : (
                      <span className="converted-badge">
                        <CheckCircle2 size={14} />
                        <span>Live Tenant</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
