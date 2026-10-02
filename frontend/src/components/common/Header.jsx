import {
  Search,
  ChevronDown,
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  School,
  GraduationCap,
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
import { useInstitution, INSTITUTION_TYPES } from "@/context/InstitutionContext";
import CampusSwitcher from "./CampusSwitcher";
import GlobalSearchBar from "./GlobalSearchBar";

import { useSelector } from "react-redux";

const Header = ({
  user,
  homePath,
  homeLabel,
  breadcrumbItems,
  onViewProfile,
  onSignOut,
  showProfile = false,
  showNotifications = true,
  searchPlaceholder,
  handleSearch = () => {},
}) => {
  const facultyRecords = useSelector((state) => state.faculty?.records || []);
  const {
    institutionType,
    setInstitutionType,
    isSchool,
    isUniversity,
    instituteName,
    instituteBoard,
    userRole,
  } = useInstitution();
  const effectiveSearchPlaceholder =
    searchPlaceholder ||
    (isSchool
      ? "Search students, teachers, classes, subjects..."
      : "Search students, faculty, programs, classes...");

  const focusProfile = useRef(false);
  const notificationRef = useRef(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const currentRole = user?.role || userRole;

  useEffect(() => {
    let active = true;
    const loadAlerts = async () => {
      try {
        const token = localStorage.getItem("eduHubToken");
        if (!token) return;

        // Restrict institute alerts loading to institute_admin only (prevents redundant calls for super_admin)
        if (currentRole !== "institute_admin") {
          return;
        }

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
        // Fallback gracefully if not logged in or unauthorized
      }
    };
    loadAlerts();
    return () => {
      active = false;
    };
  }, [currentRole]);

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
      if (e.key === "Escape") {
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
        ).map((segment, index, arr) => {
          let label = segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());

          if (segment.toLowerCase() === "messages" || segment.toLowerCase() === "support") {
            label = "Help & Support";
          }

          const isHexOrId =
            /^[0-9a-fA-F]{24}$/.test(segment) ||
            /^fac-\d+$/i.test(segment) ||
            /^stu-\d+$/i.test(segment) ||
            /^[0-9a-fA-F-]{36}$/.test(segment);

          if (isHexOrId) {
            if (location.state?.teacherName) {
              label = location.state.teacherName;
            } else if (location.state?.name) {
              label = location.state.name;
            } else {
              const matched = facultyRecords.find(
                (f) =>
                  f.id === segment ||
                  f._id === segment ||
                  f.userId === segment ||
                  f.user?._id === segment ||
                  f.user === segment
              );
              if (matched?.name) {
                label = matched.name;
              } else {
                const cachedName = typeof sessionStorage !== "undefined"
                  ? sessionStorage.getItem(`teacherName_${segment}`)
                  : null;
                if (cachedName) {
                  label = cachedName;
                } else {
                  const prevSegment = arr[index - 1]?.toLowerCase();
                  if (
                    prevSegment === "faculty" ||
                    prevSegment === "teachers" ||
                    prevSegment === "teacher" ||
                    prevSegment === "faculty-profile"
                  ) {
                    label = "Teacher Profile";
                  } else if (prevSegment === "students" || prevSegment === "student") {
                    label = "Student Profile";
                  } else if (prevSegment === "campuses") {
                    label = "Campus Details";
                  } else if (prevSegment === "institutes") {
                    label = "Institute Details";
                  } else {
                    label = "Profile Details";
                  }
                }
              }
            }
          }

          const isLast = index === arr.length - 1;
          const pathToSegment = `/${segments.slice(0, segments.indexOf(segment) + 1).join("/")}`;

          return (
            <span key={segment} className="breadcrumb-current">
              /{" "}
              {!isLast ? (
                <Link
                  to={pathToSegment}
                  style={{ color: "inherit", textDecoration: "none" }}
                  className="hover:underline"
                >
                  {label}
                </Link>
              ) : (
                <span>{label}</span>
              )}
            </span>
          );
        })}
      </nav>

      <GlobalSearchBar
        placeholder={effectiveSearchPlaceholder}
        userRole={currentRole}
        onSearchSubmit={handleSearch}
      />

      <div className="header-actions">
        {currentRole !== "super_admin" && <CampusSwitcher />}

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
