import {
  Search,
  ChevronDown,
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import axiosInstance from "@/api/axiosInstance";

const Header = ({
  user,
  homePath,
  homeLabel,
  breadcrumbItems,
  onViewProfile,
  onSignOut,
  showProfile = false,
  showNotifications = true,
  searchPlaceholder = "Search students, faculty, classes...",
  handleSearch = () => {},
}) => {
  const focusProfile = useRef(false);
  const notificationRef = useRef(null);
  const searchInputRef = useRef(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let active = true;
    const loadAlerts = async () => {
      try {
        const token = localStorage.getItem("eduHubToken");
        if (!token) return;
        const res = await axiosInstance.get("/institute-admin/alerts");
        const list = res.data?.data || [];
        if (active && Array.isArray(list) && list.length > 0) {
          setNotifications(
            list.map((item, idx) => ({
              id: item._id || item.id || idx,
              title: item.title || `${item.severity} Announcement`,
              description: item.message,
              time: item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Recent",
              unread: true,
              type:
                item.severity?.toLowerCase() === "critical"
                  ? "warning"
                  : item.severity?.toLowerCase() === "warning"
                    ? "warning"
                    : "info",
            }))
          );
        }
      } catch {
        // Fallback gracefully if not logged in or offline
      }
    };
    loadAlerts();
    return () => {
      active = false;
    };
  }, []);

  const institute = user?.role === "Institute Admin";
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const student = user?.role === "Student";

  const unreadCount = notifications.filter((n) => n.unread).length;

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, unread: false } : item
      )
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, unread: false }))
    );
  };

  const profileButton = (
    <button
      type="button"
      className="profile-button"
      aria-label="Open profile menu"
    >
      <span className="profile-avatar">{user?.initials}</span>
      <span className="profile-name" title={user?.role}>
        {user?.name}
        {(institute || student) && (
          <small className="block text-muted-foreground">
            {user.roleLabel || user.role}
          </small>
        )}
      </span>
      <ChevronDown size={16} aria-hidden="true" />
    </button>
  );

  return (
    <header className="header">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to={homePath || (institute ? "/institute-admin" : "/dashboard")}>
          {homeLabel || (institute ? "Dashboard" : "Home")}
        </Link>
        {(
          breadcrumbItems ||
          segments.filter(
            (segment) => !institute || segment !== "institute-admin",
          )
        ).map((segment) => (
          <span key={segment} className="breadcrumb-current">
            /{" "}
            {segment
              .replace(/-/g, " ")
              .replace(/\b\w/g, (letter) => letter.toUpperCase())}
          </span>
        ))}
      </nav>

      <div className="search-box header-search">
        <Search size={15} aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input
          ref={searchInputRef}
          type="search"
          placeholder={searchPlaceholder}
          defaultValue={localStorage.getItem("eduHubSuperSearch") || ""}
          onChange={handleSearch}
          aria-label="Search students, faculty, classes"
        />
        <span className="search-shortcut" title="Press ⌘K or Ctrl+K to search">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </span>
      </div>

      <div className="header-actions">
        {showNotifications && (
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
                  <span className="notification-panel-title">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="notification-count-pill">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notification-mark-read-btn"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <Bell size={24} />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`notification-item ${
                        item.unread ? "unread" : ""
                      }`}
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      <div className={`notification-item-icon ${item.type}`}>
                        {item.type === "info" && <Info size={14} />}
                        {item.type === "success" && (
                          <CheckCircle2 size={14} />
                        )}
                        {item.type === "warning" && (
                          <AlertTriangle size={14} />
                        )}
                      </div>
                      <div className="notification-item-content">
                        <div className="notification-item-header">
                          <span className="notification-item-title">
                            {item.title}
                          </span>
                          <span className="notification-item-time">
                            {item.time}
                          </span>
                        </div>
                        <p className="notification-item-desc">
                          {item.description}
                        </p>
                      </div>
                      {item.unread && (
                        <span className="notification-unread-dot" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="notification-panel-footer">
                <Link
                  to={institute ? "/institute-admin/alerts" : "/messages"}
                  className="notification-footer-link"
                  onClick={() => setNotificationsOpen(false)}
                >
                  View all broadcast alerts &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

        {showProfile && (
          onViewProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>{profileButton}</DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="student-profile-menu"
                onCloseAutoFocus={(event) => {
                  if (focusProfile.current) {
                    event.preventDefault();
                    focusProfile.current = false;
                    onViewProfile();
                  }
                }}
              >
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    focusProfile.current = true;
                  }}
                >
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={onSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            profileButton
          )
        )}
      </div>
    </header>
  );
};

export default Header;
