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
  CheckCircle,
  Clock,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import "./SuperAdminBroadcasts.css";

const STORAGE_KEY = "eduHub_super_broadcasts";

const SEVERITY_CONFIG = {
  Info: {
    label: "Notice / Info",
    color: "#0284c7",
    bg: "#f0f9ff",
    border: "#bae6fd",
    icon: Info,
  },
  Announcement: {
    label: "Announcement",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: Megaphone,
  },
  Warning: {
    label: "Scheduled Maintenance",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: AlertTriangle,
  },
  Critical: {
    label: "Emergency Alert",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: AlertOctagon,
  },
};

const DEFAULT_BROADCASTS = [
  {
    id: "b-1",
    title: "System Update: EduHub Core v2.4",
    severity: "Info",
    audience: "All Institutes & Campuses",
    message: "Platform-wide scheduled maintenance completed successfully. All services are nominal.",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

import axiosInstance from "@/api/axiosInstance";

export default function SuperAdminBroadcasts() {
  const institutes = useSelector(selectInstitutes) || [];
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("Info");
  const [audience, setAudience] = useState("All Institutes & Campuses");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/super-admin/broadcasts");
      setBroadcasts(res.data?.data || []);
    } catch (err) {
      toast.error("Failed to load platform broadcasts");
    } finally {
      setLoading(false);
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
    } catch (err) {
      toast.error("Failed to delete broadcast");
    }
  };

  return (
    <div className="super-broadcasts-page">
      {/* Heading */}
      <div className="super-broadcasts-head">
        <div>
          <div className="super-broadcasts-kicker">Network Communications</div>
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
            <Radio size={18} className="head-icon" />
            <div>
              <h3>Compose Broadcast</h3>
              <p>Send an immediate alert to selected tenant groups</p>
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
              <Send size={15} />
              <span>{sending ? "Dispatching..." : "Dispatch Broadcast"}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Active Broadcasts */}
        <div className="super-broadcasts-history">
          <div className="history-header">
            <h3>Active Broadcasts ({broadcasts.length})</h3>
            <span className="live-tag">
              <span className="pulse-dot" /> Live Feeds
            </span>
          </div>

          <div className="broadcasts-list">
            {broadcasts.length === 0 ? (
              <div className="empty-broadcasts">
                <Megaphone size={36} opacity={0.3} />
                <p>No active platform broadcasts right now.</p>
              </div>
            ) : (
              broadcasts.map((b) => {
                const config = SEVERITY_CONFIG[b.severity] || SEVERITY_CONFIG.Info;
                const Icon = config.icon;

                return (
                  <div
                    key={b._id || b.id}
                    className="broadcast-card"
                    style={{ borderLeft: `4px solid ${config.color}` }}
                  >
                    <div className="broadcast-card-top">
                      <div className="broadcast-badge" style={{ backgroundColor: config.bg, color: config.color }}>
                        <Icon size={13} />
                        <span>{config.label}</span>
                      </div>
                      <button
                        className="delete-broadcast-btn"
                        onClick={() => handleDelete(b._id || b.id)}
                        title="Dismiss broadcast"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <h4 className="broadcast-title">{b.title}</h4>
                    <p className="broadcast-message">{b.message}</p>

                    <div className="broadcast-card-foot">
                      <span className="broadcast-audience">
                        <Building2 size={12} /> {b.audience}
                      </span>
                      <span className="broadcast-time">
                        <Clock size={12} />{" "}
                        {new Date(b.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
