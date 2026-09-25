import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  GraduationCap,
  Briefcase,
  Building,
  X,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { Spinner } from "@/components/ui/spinner";
import TableSkeleton from "@/components/shared/TableSkeleton";
import toast from "react-hot-toast";
import "./GlobalUsers.css";

const ROLE_BADGES = {
  super_admin: { label: "Super Admin", color: "#6366f1", bg: "#eef2ff", icon: Shield },
  institute_admin: { label: "Institute Admin", color: "#0284c7", bg: "#f0f9ff", icon: Building },
  campus_manager: { label: "Campus Manager", color: "#0d9488", bg: "#f0fdfa", icon: Briefcase },
  campus_admin: { label: "Campus Admin", color: "#0d9488", bg: "#f0fdfa", icon: Briefcase },
  teacher: { label: "Teacher", color: "#ca8a04", bg: "#fefce8", icon: Briefcase },
  student: { label: "Student", color: "#16a34a", bg: "#f0fdf4", icon: GraduationCap },
};

const getCachedUsers = () => {
  try {
    const raw = localStorage.getItem("eduHub_users_cache");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export default function GlobalUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const instituteParam = searchParams.get("institute") || "";

  const [users, setUsers] = useState(getCachedUsers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(instituteParam);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    if (instituteParam) {
      setSearch(instituteParam);
    }
  }, [instituteParam]);

  const fetchUsers = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await axiosInstance.get("/super-admin/users");
      const list = res.data.data || [];
      setUsers(list);
      try {
        localStorage.setItem("eduHub_users_cache", JSON.stringify(list));
      } catch {}
    } catch {
      // SWR fallback - retain cached users
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    // SWR: If we have cached users, fetch silently in background. Otherwise show loader.
    fetchUsers(users.length === 0);
  }, []);

  const handleToggleStatus = async (user) => {
    setTogglingId(user._id || user.id);
    const prevStatus = user.isActive;
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        (u._id || u.id) === (user._id || user.id)
          ? { ...u, isActive: !prevStatus }
          : u
      )
    );

    try {
      const res = await axiosInstance.patch(
        `/super-admin/users/${user._id || user.id}/toggle-status`
      );
      const updatedUser = res.data.data;
      toast.success(
        `${user.name} is now ${updatedUser.isActive ? "Active" : "Inactive"}`
      );
      // Persist cache
      try {
        const next = users.map((u) =>
          (u._id || u.id) === (user._id || user.id) ? updatedUser : u
        );
        localStorage.setItem("eduHub_users_cache", JSON.stringify(next));
      } catch {}
    } catch (err) {
      // Revert optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          (u._id || u.id) === (user._id || user.id)
            ? { ...u, isActive: prevStatus }
            : u
        )
      );
      toast.error(err.response?.data?.message || "Failed to update user status");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.instituteId?.name && u.instituteId.name.toLowerCase().includes(q));

      const matchesRole = roleFilter === "all" || u.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.isActive !== false) ||
        (statusFilter === "inactive" && u.isActive === false);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive !== false).length;
    const admins = users.filter((u) =>
      ["institute_admin", "super_admin"].includes(u.role)
    ).length;
    const students = users.filter((u) => u.role === "student").length;
    return { total, active, admins, students };
  }, [users]);

  return (
    <div className="global-users-page">
      {/* Top Header */}
      <div className="global-users-header">
        <div>
          <div className="global-users-kicker">Super Admin Control</div>
          <h1 className="global-users-title">Global User Directory</h1>
          <p className="global-users-subtitle">
            Govern and control all users across every institute, campus, and role.
          </p>
        </div>
        <button
          className="global-users-refresh-btn"
          onClick={() => fetchUsers(true)}
          disabled={loading}
          title="Refresh user list"
        >
          {loading ? <Spinner className="size-3.5 mr-1" /> : <RefreshCw size={14} />}
          <span>Refresh</span>
        </button>
      </div>

      {/* Mini Stats Banner */}
      <div className="global-users-stats-grid">
        <div className="global-users-stat-card">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-lbl">Total Registered</span>
        </div>
        <div className="global-users-stat-card">
          <span className="stat-num" style={{ color: "#16a34a" }}>
            {stats.active}
          </span>
          <span className="stat-lbl">Active Users</span>
        </div>
        <div className="global-users-stat-card">
          <span className="stat-num" style={{ color: "#0284c7" }}>
            {stats.admins}
          </span>
          <span className="stat-lbl">Platform Admins</span>
        </div>
        <div className="global-users-stat-card">
          <span className="stat-num" style={{ color: "#6366f1" }}>
            {stats.students}
          </span>
          <span className="stat-lbl">Students</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="global-users-toolbar">
        <div className="global-users-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Search by name, email, or institute..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {instituteParam && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0284c7', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
            <span>Institute: {instituteParam}</span>
            <button
              type="button"
              onClick={() => {
                setSearchParams({});
                setSearch("");
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#0284c7', padding: 0 }}
              title="Clear institute filter"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="global-users-filters">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="institute_admin">Institute Admins</option>
            <option value="campus_manager">Campus Managers</option>
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="global-users-table-card">
        <div className="table-responsive">
          <table className="global-users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Institute & Campus</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <TableSkeleton rows={5} columns={5} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    <Users size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                    <p>No users found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const id = u._id || u.id;
                  const roleMeta =
                    ROLE_BADGES[u.role] || {
                      label: u.role,
                      color: "#71717a",
                      bg: "#f4f4f5",
                      icon: Users,
                    };
                  const RoleIcon = roleMeta.icon;
                  const isActive = u.isActive !== false;

                  return (
                    <tr key={id}>
                      <td>
                        <div className="user-profile-cell">
                          <div className="user-avatar">
                            {(u.name || "U").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="user-name">{u.name}</div>
                            <div className="user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="role-pill"
                          style={{
                            color: roleMeta.color,
                            backgroundColor: roleMeta.bg,
                          }}
                        >
                          <RoleIcon size={12} />
                          {roleMeta.label}
                        </span>
                      </td>
                      <td>
                        <div className="institute-campus-cell">
                          <div className="inst-name">
                            {u.instituteId?.name || "Global / Unassigned"}
                          </div>
                          {u.campusId?.name && (
                            <div className="campus-sub">{u.campusId.name}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            isActive ? "active" : "inactive"
                          }`}
                        >
                          <span className="dot" />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        {u.role === "super_admin" ? (
                          <span style={{ fontSize: "12px", color: "#a1a1aa", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Shield size={13} color="#6366f1" /> Root Admin
                          </span>
                        ) : (
                          <button
                            className={`toggle-status-btn ${
                              isActive ? "is-active" : "is-inactive"
                            }`}
                            onClick={() => handleToggleStatus(u)}
                            disabled={togglingId === id}
                            title={
                              isActive ? "Deactivate user" : "Activate user"
                            }
                          >
                            {togglingId === id ? (
                              <Spinner className="size-3.5 mr-1" />
                            ) : isActive ? (
                              <XCircle size={14} />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            {isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
