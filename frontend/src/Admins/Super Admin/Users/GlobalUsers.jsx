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
  AlertTriangle,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { Spinner } from "@/components/ui/spinner";
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

function GlobalUserSkeletonRow() {
  return (
    <tr className="user-skel-row">
      <td>
        <div className="user-profile-cell">
          <div className="user-skel-line user-skel-avatar" />
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div className="user-skel-line user-skel-name" />
            <div className="user-skel-line user-skel-email" />
          </div>
        </div>
      </td>
      <td>
        <div className="user-skel-line user-skel-pill" />
      </td>
      <td>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div className="user-skel-line user-skel-inst" />
          <div className="user-skel-line user-skel-campus" />
        </div>
      </td>
      <td>
        <div className="user-skel-line user-skel-status" />
      </td>
      <td>
        <div className="user-skel-line user-skel-btn" />
      </td>
    </tr>
  );
}

export default function GlobalUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const instituteParam = searchParams.get("institute") || "";

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState(instituteParam);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    if (instituteParam) {
      setSearch(instituteParam);
    }
  }, [instituteParam]);

  const fetchUsers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = {
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter === "active") params.isActive = "true";
      if (statusFilter === "inactive") params.isActive = "false";

      const res = await axiosInstance.get("/super-admin/users", { params });
      if (res.data?.data) {
        setUsers(res.data.data);
        setTotalUsers(res.data.total ?? res.data.data.length);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      setLoadError(err.response?.data?.message || "Failed to load users");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, roleFilter, statusFilter]);

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

  const filteredUsers = users;

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
      {/* Mini Stats Banner */}
      <div className="global-users-stats-grid">
        <div className="global-users-stat-card">
          {loading && users.length === 0 ? (
            <div className="user-skel-stat-val" />
          ) : loadError && users.length === 0 ? (
            <span className="stat-num" aria-label="Unavailable">—</span>
          ) : (
            <span className="stat-num">{stats.total}</span>
          )}
          <span className="stat-lbl">Total Registered</span>
        </div>
        <div className="global-users-stat-card">
          {loading && users.length === 0 ? (
            <div className="user-skel-stat-val" />
          ) : loadError && users.length === 0 ? (
            <span className="stat-num" aria-label="Unavailable">—</span>
          ) : (
            <span className="stat-num">{stats.active}</span>
          )}
          <span className="stat-lbl">Active Users</span>
        </div>
        <div className="global-users-stat-card">
          {loading && users.length === 0 ? (
            <div className="user-skel-stat-val" />
          ) : loadError && users.length === 0 ? (
            <span className="stat-num" aria-label="Unavailable">—</span>
          ) : (
            <span className="stat-num">{stats.admins}</span>
          )}
          <span className="stat-lbl">Platform Admins</span>
        </div>
        <div className="global-users-stat-card">
          {loading && users.length === 0 ? (
            <div className="user-skel-stat-val" />
          ) : loadError && users.length === 0 ? (
            <span className="stat-num" aria-label="Unavailable">—</span>
          ) : (
            <span className="stat-num">{stats.students}</span>
          )}
          <span className="stat-lbl">Students</span>
        </div>
      </div>

      {/* Main Global Users Management Panel */}
      <div className="global-users-panel">
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
            <div className="institute-filter-chip">
              <span>Institute: {instituteParam}</span>
              <button
                type="button"
                className="chip-clear-btn"
                onClick={() => {
                  setSearchParams({});
                  setSearch("");
                }}
                title="Clear institute filter"
                aria-label="Clear institute filter"
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

          <button
            className="global-users-refresh-btn"
            onClick={() => fetchUsers(true)}
            disabled={loading}
            title="Refresh user list"
          >
            {loading ? <Spinner className="size-3.5 mr-1" /> : <RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
            <span>Refresh</span>
          </button>
        </div>

        {/* Users Table */}
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
                <>
                  <GlobalUserSkeletonRow />
                  <GlobalUserSkeletonRow />
                  <GlobalUserSkeletonRow />
                  <GlobalUserSkeletonRow />
                  <GlobalUserSkeletonRow />
                </>
              ) : loadError && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell" role="alert">
                    <AlertTriangle size={28} style={{ margin: "0 auto 8px", opacity: 0.55 }} />
                    <p>Unable to load users.</p>
                    <button type="button" className="users-retry-btn" onClick={fetchUsers}>
                      Retry
                    </button>
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

        {/* Server-side Pagination controls */}
        <div className="global-users-pagination">
          <span className="pagination-info">
            Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalUsers)} of {totalUsers} total users
          </span>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="pagination-current">
              {page} / {totalPages}
            </span>
            <button
              className="pagination-btn"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
