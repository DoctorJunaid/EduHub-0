import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUpRight,
} from "lucide-react";
import { getLandingPageUrl } from "@/config/urls";
import { useSupportStats } from "@/hooks/useSupportStats";
import { qk } from "@/lib/queryKeys";
import { dateKey } from "@/lib/dates";
import { getTodayClasses, getMySummary, getMySessions } from "@/api/classSession.api";
import { getTeacherClasses, getTeacherAssignments } from "@/api/assignment.api";
import { getTeacherAttendanceClasses } from "@/api/teacherAttendance.api";
import { getTeacherDiaryClasses, getTeacherDiaryEntries } from "@/api/diary.api";
import { getTeacherGradebookClasses } from "@/api/gradebook.api";
import { getMySalaryProfile } from "@/api/salaryProfile.api";

const Sidebar = ({
  items = [],
  collapsed = false,
  onToggle,
  onSignOut,
  user = { name: "Admin User", initials: "A" },
}) => {
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const { stats } = useSupportStats();
  const badgeCount = stats?.badgeCount || 0;

  const handlePrefetch = (path) => {
    if (!path) return;
    const currentMonthKey = dateKey(new Date()).slice(0, 7);

    if (path === "/teacher") {
      queryClient.prefetchQuery({
        queryKey: qk.teacherTodayClasses(),
        queryFn: async () => (await getTodayClasses()).data?.data || [],
        staleTime: 5 * 60 * 1000,
      });
      queryClient.prefetchQuery({
        queryKey: qk.teacherSummary({ month: currentMonthKey }),
        queryFn: async () => (await getMySummary({ month: currentMonthKey })).data?.data || null,
        staleTime: 5 * 60 * 1000,
      });
    } else if (path === "/teacher/credits") {
      queryClient.prefetchQuery({
        queryKey: qk.teacherSessions({ tab: "today", month: currentMonthKey, date: dateKey(new Date()) }),
        queryFn: async () => (await getMySessions({ date: dateKey(new Date()) })).data?.data || [],
        staleTime: 5 * 60 * 1000,
      });
      queryClient.prefetchQuery({
        queryKey: qk.teacherSummary({ month: currentMonthKey }),
        queryFn: async () => (await getMySummary({ month: currentMonthKey })).data?.data || null,
        staleTime: 5 * 60 * 1000,
      });
    } else if (path === "/teacher/classes") {
      queryClient.prefetchQuery({
        queryKey: qk.teacherClasses(),
        queryFn: async () => (await getTeacherClasses()).data?.data || [],
        staleTime: 5 * 60 * 1000,
      });
    } else if (path === "/teacher/assignments") {
      queryClient.prefetchQuery({
        queryKey: qk.teacherAssignments(),
        queryFn: async () => (await getTeacherAssignments()).data?.data || [],
        staleTime: 5 * 60 * 1000,
      });
      queryClient.prefetchQuery({
        queryKey: qk.teacherClasses(),
        queryFn: async () => (await getTeacherClasses()).data?.data || [],
        staleTime: 5 * 60 * 1000,
      });
    } else if (path === "/teacher/attendance") {
      queryClient.prefetchQuery({
        queryKey: qk.teacherAttendanceClasses(),
        queryFn: async () => (await getTeacherAttendanceClasses()).data?.data || [],
        staleTime: 5 * 60 * 1000,
      });
    } else if (path === "/teacher/diary") {
      queryClient.prefetchQuery({
        queryKey: qk.teacherDiaryClasses(),
        queryFn: async () => (await getTeacherDiaryClasses()).data?.data || [],
        staleTime: 5 * 60 * 1000,
      });
      queryClient.prefetchQuery({
        queryKey: qk.teacherDiaryEntries(),
        queryFn: async () => (await getTeacherDiaryEntries()).data?.data || [],
        staleTime: 5 * 60 * 1000,
      });
    } else if (path === "/teacher/gradebook") {
      queryClient.prefetchQuery({
        queryKey: qk.teacherGradebookClasses(),
        queryFn: async () => (await getTeacherGradebookClasses()).data?.data || [],
        staleTime: 5 * 60 * 1000,
      });
    } else if (path === "/my-salary") {
      queryClient.prefetchQuery({
        queryKey: qk.mySalary(),
        queryFn: async () => (await getMySalaryProfile()).data?.data || null,
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  return (
    <aside
      className={`sidebar ${collapsed ? "is-collapsed" : ""}`}
      aria-label="Sidebar"
    >
      <div className="sidebar-brand-row">
        <a
          href={getLandingPageUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-brand"
          title="Visit EduHub Public Website (opens in new tab)"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <span className="sidebar-label">EduHub</span>
          <ArrowUpRight
            size={13}
            style={{ opacity: 0.6, marginLeft: 2 }}
            aria-hidden="true"
          />
        </a>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls="sidebar-navigation"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      <nav
        id="sidebar-navigation"
        className="sidebar-nav"
        aria-label="Main navigation"
      >
        {items.map((item, index) => {
          const isActive =
            pathname === item.path ||
            (item.path === "/dashboard" && pathname === "/") ||
            (!item.exact &&
              item.path !== "/dashboard" &&
              item.path !== "/super-admin" &&
              pathname.startsWith(`${item.path}/`) &&
              !items.some(
                (other) =>
                  other !== item &&
                  other.path &&
                  (pathname === other.path ||
                    pathname.startsWith(`${other.path}/`)),
              ));
          return (
            <Fragment key={item.path || item.label}>
              {item.group && item.group !== items[index - 1]?.group && (
                <div className="sidebar-section-heading">{item.group}</div>
              )}
              {!item.path ? (
                <span
                  className="sidebar-item"
                  aria-disabled="true"
                  title={`${item.label} is not available yet`}
                >
                  <span className="sidebar-item-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                </span>
              ) : (
                <Link
                  to={item.path}
                  onMouseEnter={() => handlePrefetch(item.path)}
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon && (
                    <span className="sidebar-item-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className="sidebar-label flex items-center justify-between flex-1">
                    <span>{item.label}</span>
                    {item.path?.includes("support") && badgeCount > 0 && (
                      <span className="ml-auto bg-emerald-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                        {badgeCount}
                      </span>
                    )}
                  </span>
                </Link>
              )}
            </Fragment>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div
          className="sidebar-profile"
          title={collapsed ? user.name : undefined}
          aria-label={user.name}
        >
          <span className="sidebar-profile-avatar">{user.initials}</span>
          <div className="sidebar-label sidebar-profile-copy">
            <span className="sidebar-profile-name">{user.name}</span>
            {(user.role === "Institute Admin" || user.role === "Student") && (
              <span className="sidebar-profile-role">{user.email}</span>
            )}
            {user.role && (
              <span className="sidebar-profile-role">{user.role}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="sidebar-signout"
          onClick={onSignOut}
          disabled={!onSignOut}
          aria-label="Sign Out"
          title={!onSignOut ? "Sign out unavailable" : "Sign Out"}
        >
          <LogOut size={20} aria-hidden="true" />
          <span className="sidebar-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
