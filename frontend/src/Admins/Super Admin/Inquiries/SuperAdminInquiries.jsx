import { useState, useEffect } from "react";
import {
  Inbox,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import "./SuperAdminInquiries.css";

const STATUS_CONFIG = {
  New: { label: "New Lead", bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Contacted: { label: "Contacted", bg: "#fefce8", color: "#ca8a04", border: "#fde047" },
  Converted: { label: "Converted to Institute", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Archived: { label: "Archived", bg: "#f4f4f5", color: "#71717a", border: "#e4e4e7" },
};

export default function SuperAdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [convertingId, setConvertingId] = useState(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.instituteType = typeFilter;
      if (search.trim()) params.search = search.trim();

      const res = await axiosInstance.get("/super-admin/inquiries", { params });
      setInquiries(res.data?.data || []);
    } catch (err) {
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
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
      const res = await axiosInstance.post(`/super-admin/inquiries/${inquiry._id}/convert`);
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
      {/* Top Header */}
      <div className="inquiries-head">
        <div>
          <div className="inquiries-kicker">Platform Growth & Pipeline</div>
          <h1 className="inquiries-title">Public Inquiries & Leads</h1>
          <p className="inquiries-subtitle">
            Review incoming requests from schools, colleges, and academies submitted via the landing page, and convert them directly into active institutes.
          </p>
        </div>
        <button className="inquiries-refresh-btn" onClick={fetchInquiries} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="inquiries-metrics-grid">
        <div className="inquiry-stat-card">
          <span className="stat-label">Total Leads</span>
          <span className="stat-value">{counts.total}</span>
        </div>
        <div className="inquiry-stat-card">
          <span className="stat-label">New Submissions</span>
          <span className="stat-value" style={{ color: "#2563eb" }}>{counts.new}</span>
        </div>
        <div className="inquiry-stat-card">
          <span className="stat-label">In Discussion</span>
          <span className="stat-value" style={{ color: "#ca8a04" }}>{counts.contacted}</span>
        </div>
        <div className="inquiry-stat-card">
          <span className="stat-label">Converted Institutes</span>
          <span className="stat-value" style={{ color: "#16a34a" }}>{counts.converted}</span>
        </div>
      </div>

      {/* Filters */}
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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Pipeline Stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Converted">Converted</option>
            <option value="Archived">Archived</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Institution Types</option>
            <option value="School">School</option>
            <option value="College">College</option>
            <option value="University">University</option>
            <option value="Academy">Academy</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="inquiries-table-card">
        {loading && inquiries.length === 0 ? (
          <div className="inquiries-loading">
            <Spinner className="size-6" />
            <p>Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="inquiries-empty">
            <Inbox size={42} opacity={0.3} />
            <h3>No Inquiries Found</h3>
            <p>No landing page inquiries currently match your criteria.</p>
          </div>
        ) : (
          <div className="inquiries-list">
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
                        style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    <div className="inquiry-contact-details">
                      <span><strong>Contact Person:</strong> {inq.fullName}</span>
                      <span><Mail size={13} /> {inq.email}</span>
                      <span><Phone size={13} /> {inq.phone}</span>
                      <span><Calendar size={13} /> {new Date(inq.createdAt).toLocaleDateString()}</span>
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
                        className="convert-btn"
                        onClick={() => handleConvert(inq)}
                        disabled={isConverting}
                      >
                        {isConverting ? (
                          <Spinner className="size-3.5 mr-1" />
                        ) : (
                          <Sparkles size={14} className="mr-1" />
                        )}
                        Convert to Institute
                      </button>
                    ) : (
                      <span className="converted-badge">
                        <CheckCircle2 size={15} color="#16a34a" /> Live Tenant
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
