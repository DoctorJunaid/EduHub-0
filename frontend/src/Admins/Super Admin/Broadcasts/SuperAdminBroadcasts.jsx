import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectInstitutes } from "@/store/Slices/institutesSlice";
import {
  Radio,
  Send,
  Info,
  AlertTriangle,
  AlertOctagon,
  Megaphone,
  Trash2,
  Clock,
  Building2,
  RotateCw,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/api/axiosInstance";
import "./SuperAdminBroadcasts.css";

const SEVERITY_CONFIG = {
  Info: {
    label: "Notice / Info",
    color: "#3f3f46",
    bg: "#f4f4f5",
    border: "#e4e4e7",
    icon: Info,
  },
  Announcement: {
    label: "Announcement",
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: Megaphone,
  },
  Warning: {
    label: "Scheduled Maintenance",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: AlertTriangle,
  },
  Critical: {
    label: "Emergency Alert",
    color: "#b91c1c",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: AlertOctagon,
  },
};

function BroadcastSkeletonCard() {
  return (
    <div className="broadcast-card broadcast-skeleton-card">
      <div className="broadcast-card-top">
        <div className="skeleton-line skeleton-badge" />
        <div className="skeleton-line skeleton-delete" />
      </div>
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-desc" />
      <div className="skeleton-line skeleton-desc short" />
      <div className="broadcast-card-foot">
        <div className="skeleton-line skeleton-foot-item" />
        <div className="skeleton-line skeleton-foot-item short" />
      </div>
    </div>
  );
}

export default function SuperAdminBroadcasts() {
  const institutes = useSelector(selectInstitutes) || [];
  const [broadcasts, setBroadcasts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("Info");
  const [audience, setAudience] = useState("All Institutes & Campuses");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchBroadcasts = async () => {
    try {
      setError(null);
      const res = await axiosInstance.get("/super-admin/broadcasts");
      setBroadcasts(res.data?.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load platform broadcasts";
      setError(msg);
      toast.error(msg);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Please provide both title and message.");
      return;
    }

    setSending(true);
    try {
      await axiosInstance.post("/super-admin/broadcasts", {
        title: title.trim(),
        message: message.trim(),
        severity,
        audience,
      });

      setTitle("");
      setMessage("");
      setSeverity("Info");
      toast.success("Broadcast dispatched across all platform networks!");
      fetchBroadcasts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish broadcast");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/super-admin/broadcasts/${id}`);
      toast.success("Broadcast removed.");
      setBroadcasts((prev) => prev.filter((b) => (b._id || b.id) !== id));
    } catch {
      toast.error("Failed to delete broadcast");
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="super-broadcasts-page">
      {/* Heading */}
      <div className="super-broadcasts-head">
        <div>
          <h1 className="super-broadcasts-title">Platform Broadcast Alerts</h1>
          <p className="super-broadcasts-subtitle">
            Broadcast platform-wide alerts, maintenance notices, and emergency advisories across all tenant portals.
          </p>
        </div>
      </div>

      <div className="super-broadcasts-layout">
        {/* Left Column: Composer */}
        <div className="super-broadcasts-compose-card">
          <div className="card-header">
            <div className="compose-icon-wrap">
              <Radio size={16} />
            </div>
            <div>
              <h3 className="compose-title">Compose Broadcast</h3>
              <p className="compose-desc">Send an immediate alert to selected tenant groups</p>
            </div>
          </div>

          <form onSubmit={handlePublish} className="compose-form">
            <div className="form-group">
              <label>Alert Title</label>
              <input
                type="text"
                placeholder="e.g. Scheduled Maintenance: Tonight at 12:00 AM"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Target Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="broadcast-select"
                >
                  <option>All Institutes & Campuses</option>
                  <option>Institute Admins Only</option>
                  <option>Campus Managers Only</option>
                  <option>All Students & Faculty</option>
                  {institutes.map((inst) => (
                    <option key={inst.id || inst._id} value={`Institute: ${inst.name}`}>
                      Institute: {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="broadcast-select"
                >
                  <option value="Info">Notice / Info</option>
                  <option value="Announcement">Announcement</option>
                  <option value="Warning">Scheduled Maintenance</option>
                  <option value="Critical">Critical Emergency</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Message Content</label>
              <textarea
                rows={4}
                placeholder="Type your official announcement or instructions here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="publish-broadcast-btn"
            >
              <Send size={14} />
              <span>{sending ? "Dispatching..." : "Dispatch Broadcast"}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Active Broadcasts */}
        <div className="super-broadcasts-history">
          <div className="history-header">
            <h3>
              Active Broadcasts {!initialLoading && `(${broadcasts.length})`}
            </h3>
            <span className="live-tag">
              <span className="pulse-dot" /> Live Feeds
            </span>
          </div>

          <div className="broadcasts-list">
            {initialLoading ? (
              <>
                <BroadcastSkeletonCard />
                <BroadcastSkeletonCard />
                <BroadcastSkeletonCard />
              </>
            ) : error ? (
              <div className="error-broadcasts">
                <div className="error-icon-box">
                  <AlertTriangle size={20} />
                </div>
                <h4>Failed to load broadcasts</h4>
                <p>{error}</p>
                <button onClick={fetchBroadcasts} className="retry-broadcast-btn">
                  <RotateCw size={13} />
                  <span>Retry</span>
                </button>
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="empty-broadcasts">
                <div className="empty-icon-box">
                  <Megaphone size={22} />
                </div>
                <h4>No active platform broadcasts</h4>
                <p>Dispatched platform-wide alerts and advisories will appear here in real-time.</p>
              </div>
            ) : (
              broadcasts.map((b) => {
                const config = SEVERITY_CONFIG[b.severity] || SEVERITY_CONFIG.Info;
                const Icon = config.icon;

                return (
                  <div
                    key={b._id || b.id}
                    className="broadcast-card"
                  >
                    <div className="broadcast-card-top">
                      <div
                        className="broadcast-badge"
                        style={{
                          backgroundColor: config.bg,
                          color: config.color,
                          borderColor: config.border,
                        }}
                      >
                        <Icon size={12} />
                        <span>{config.label}</span>
                      </div>
                      <button
                        className="delete-broadcast-btn"
                        onClick={() => handleDelete(b._id || b.id)}
                        title="Dismiss broadcast"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <h4 className="broadcast-title">{b.title}</h4>
                    <p className="broadcast-message">{b.message}</p>

                    <div className="broadcast-card-foot">
                      <span className="broadcast-audience">
                        <Building2 size={12} /> {b.audience}
                      </span>
                      <span className="broadcast-time">
                        <Clock size={12} /> {formatTimestamp(b.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
