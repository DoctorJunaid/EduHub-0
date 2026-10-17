import { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loggedOut, selectCurrentUser } from "@/store/Slices/authSlice";
import { ROLE_LABELS } from "@/auth/roles";
import Sidebar from "@/components/common/Sidebar";
import GlobalSearchBar from "@/components/common/GlobalSearchBar";
import { ADMIN_NAV } from "@/constants/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import {
  Menu,
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function SuperAdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);

  const userName = user?.name || "Super Admin";
  const userInitials = userName.trim().slice(0, 2).toUpperCase() || "SA";
  const userRole = user?.role ? (ROLE_LABELS[user.role] || user.role) : "Super Admin";

  const profile = {
    ...user,
    name: userName,
    initials: userInitials,
    role: userRole,
  };

  const signOut = () => {
    dispatch(loggedOut());
    navigate("/login", { replace: true });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Handle outside click for notification popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsOpen]);

  // Notifications hook
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestDesktopPermission,
    pushPermission,
  } = useNotifications();

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      await markAsRead(item._id);
    }
    setNotificationsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  // Breadcrumbs parsing
  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumbSegments = segments.filter(
    (seg) => seg !== "super-admin"
  );

  const formatBreadcrumb = (seg) => {
    if (seg === "plans") return "Plans & Pricing";
    if (seg === "subscriptions") return "Subscriptions";
    if (seg === "users") return "Global Users";
    if (seg === "inquiries") return "Inquiries & Leads";
    if (seg === "broadcasts") return "Broadcast Alerts";
    if (seg === "audit-logs") return "Audit Logs";
    if (seg === "support") return "Help & Support";
    if (seg === "messages") return "Help & Support";
    if (seg === "institutes") return "Institutes Directory";
    if (seg === "new") return "Add New";
    if (seg === "edit") return "Edit";
    if (seg === "view") return "Details";
    return seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="dashboard-shell super-admin-shell w-full h-screen overflow-hidden flex">
      {/* ── Mobile Slide-Over Backdrop ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Slide-Over Drawer (< 1024px) ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={(e) => {
          if (e.target.closest("a") || e.target.closest(".sidebar-signout")) {
            setDrawerOpen(false);
          }
        }}
      >
        <Sidebar
          user={profile}
          onSignOut={() => {
            setDrawerOpen(false);
            signOut();
          }}
          items={ADMIN_NAV}
          collapsed={false}
          onToggle={() => setDrawerOpen(false)}
        />
      </div>

      {/* ── Desktop Static Sidebar (lg: 1024px+) ── */}
      <div className="hidden lg:flex shrink-0 h-full">
        <Sidebar
          user={profile}
          onSignOut={signOut}
          items={ADMIN_NAV}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
      </div>

      {/* ── Main Area (Header + Main Content Outlet) ── */}
      <div className="main-area flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="header flex items-center justify-between min-w-0 shrink-0">
          {/* Left section: Hamburger button + Breadcrumbs */}
          <div className="flex items-center min-w-0 shrink" style={{ gap: "10px" }}>
            {/* Hamburger Button (< 1024px) */}
            <button
              type="button"
              className="lg:hidden flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
              style={{ padding: "8px" }}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              title="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs Navigation with Truncation on Small Screens */}
            <nav className="breadcrumbs flex items-center min-w-0" aria-label="Breadcrumb">
              <Link
                to="/super-admin"
                className="truncate max-w-[150px] sm:max-w-[240px] md:max-w-none text-zinc-800 font-semibold hover:underline"
                style={{ textDecoration: "none" }}
              >
                Super Admin Master Console
              </Link>
              {breadcrumbSegments.map((segment) => (
                <span key={segment} className="breadcrumb-current flex items-center min-w-0">
                  <span className="mx-1 text-zinc-400">/</span>
                  <span className="truncate max-w-[120px] sm:max-w-[180px] md:max-w-none">
                    {formatBreadcrumb(segment)}
                  </span>
                </span>
              ))}
            </nav>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex flex-1 max-w-[440px] mx-3 min-w-0">
            <GlobalSearchBar
              placeholder="Search institutes, campuses, users, plans..."
              userRole="super_admin"
            />
          </div>

          {/* Right section: Notifications Bell & Actions */}
          <div className="header-actions flex items-center shrink-0" style={{ gap: "12px" }}>
            <div className="header-notifications-wrap" ref={notificationRef}>
              <button
                type="button"
                className={`header-icon-btn ${notificationsOpen ? "active" : ""}`}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="notification-badge-dot" />}
              </button>

              {notificationsOpen && (
                <div
                  className="notification-panel"
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div className="notification-panel-head">
                    <div className="notification-panel-title-wrap">
                      <span className="notification-panel-title">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="notification-count-pill">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {pushPermission !== "granted" && pushPermission !== "unsupported" && (
                        <button
                          type="button"
                          onClick={requestDesktopPermission}
                          className="text-[11px] text-zinc-600 hover:text-zinc-900 transition-colors flex items-center gap-1 font-medium bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded cursor-pointer"
                          title="Enable Desktop Web Push Notifications"
                        >
                          <Bell size={11} />
                          <span>Push</span>
                        </button>
                      )}
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="notification-mark-read-btn"
                          onClick={() => markAllAsRead()}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <Bell size={24} />
                        <p>No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const isUnread = !item.isRead;
                        const timeAgo = item.createdAt
                          ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                          : "Just now";
                        const isCrit = item.severity === "critical" || item.severity === "high";

                        return (
                          <div
                            key={item._id}
                            className={`notification-item ${isUnread ? "unread" : ""}`}
                            onClick={() => handleNotificationClick(item)}
                            role="button"
                            tabIndex={0}
                          >
                            <div
                              className={`notification-item-icon ${
                                isCrit ? "warning" : item.severity === "success" ? "success" : "info"
                              }`}
                            >
                              {isCrit ? (
                                <AlertTriangle size={14} />
                              ) : item.type === "ticket_created" || item.type === "ticket_reply" ? (
                                <Info size={14} />
                              ) : (
                                <CheckCircle2 size={14} />
                              )}
                            </div>
                            <div className="notification-item-content">
                              <div className="notification-item-header">
                                <span className="notification-item-title">{item.title}</span>
                                <span className="notification-item-time">{timeAgo}</span>
                              </div>
                              <p className="notification-item-desc">{item.message}</p>
                            </div>
                            {isUnread && <span className="notification-unread-dot" />}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="notification-panel-footer">
                    <Link
                      to="/super-admin/broadcasts"
                      className="notification-footer-link"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      Manage Platform Broadcasts &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Content Outlet Wrapper (Zero Outer Page Stretch) ── */}
        <main className="content-area content-area-flush flex-1 min-w-0 w-full overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
