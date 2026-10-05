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
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";
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
  const navigate = useNavigate();

  const currentRole = user?.role || userRole;

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestDesktopPermission,
    pushPermission,
  } = useNotifications();

  const institute = user?.role === "Institute Admin";
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const student = user?.role === "Student";

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

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      await markAsRead(item._id);
    }
    setNotificationsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
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
                        <div className={`notification-item-icon ${isCrit ? "warning" : item.severity === "success" ? "success" : "info"}`}>
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
                            <span className="notification-item-title">
                              {item.title}
                            </span>
                            <span className="notification-item-time">
                              {timeAgo}
                            </span>
                          </div>
                          <p className="notification-item-desc">
                            {item.message}
                          </p>
                        </div>
                        {isUnread && (
                          <span className="notification-unread-dot" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="notification-panel-footer">
                <Link
                  to={
                    currentRole === "super_admin"
                      ? "/super-admin/broadcasts"
                      : institute
                      ? "/institute-admin/alerts"
                      : "/support"
                  }
                  className="notification-footer-link"
                  onClick={() => setNotificationsOpen(false)}
                >
                  {currentRole === "super_admin"
                    ? "Manage Platform Broadcasts &rarr;"
                    : "View all broadcast alerts &rarr;"}
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
