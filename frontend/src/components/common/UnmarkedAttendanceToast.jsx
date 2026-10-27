import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldAlert, ArrowRight, X } from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import * as classTeacherApi from "@/api/classTeacher.api";
import "./UnmarkedAttendanceToast.css";

export default function UnmarkedAttendanceToast() {
  const location = useLocation();
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user;
  const userRole = String(currentUser?.role || auth?.selectedRole || "").toLowerCase();

  const [alertData, setAlertData] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  // Compute today's date string YYYY-MM-DD
  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const sessionDismissKey = `eduhub_att_alert_dismissed_${todayDateStr}`;

  // Check if user already dismissed in this session
  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem(sessionDismissKey);
      if (isDismissed === "true") {
        setDismissed(true);
      }
    } catch {
      // ignore storage access issues
    }
  }, [sessionDismissKey]);

  // Fetch pending attendance status based on role
  useEffect(() => {
    if (dismissed || !currentUser) return;

    let isMounted = true;

    // 1. Campus Admin / Principal / Institute Admin / Campus Manager
    const isCampusAdmin = [
      "campus_admin",
      "campus_manager",
      "principal",
      "institute_admin",
      "super_admin",
    ].includes(userRole);

    if (isCampusAdmin) {
      classTeacherApi
        .getUnmarkedClassesToday()
        .then((res) => {
          if (!isMounted) return;
          const count = Number(res?.unmarkedCount ?? res?.data?.unmarkedCount ?? 0);
          const classes = res?.unmarkedClasses || res?.data?.unmarkedClasses || [];
          if (count > 0) {
            setAlertData({
              type: "admin",
              unmarkedCount: count,
              classes,
              title: "Morning Attendance Alert",
              badge: `${count} ${count === 1 ? "Class" : "Classes"} Pending`,
              description: `Student attendance has not been recorded for ${count} class ${count === 1 ? "section" : "sections"} today:`,
              actionLabel: "Review Classes",
              actionLink: "/student-attendance",
            });
          } else {
            setAlertData(null);
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }

    // 2. Teacher / Faculty
    const isTeacher = ["teacher", "faculty", "class_teacher"].includes(userRole);
    if (isTeacher) {
      classTeacherApi
        .getMyClassAssignment()
        .then(async (assignmentRes) => {
          if (!isMounted) return;
          const assignment = assignmentRes?.data || assignmentRes;
          if (assignment?.isClassTeacher && assignment?.classInfo) {
            const classInfo = assignment.classInfo;
            try {
              const attRes = await classTeacherApi.getMyClassAttendance();
              if (!isMounted) return;
              const attData = attRes?.data || attRes;
              if (attData && !attData.isMarkedToday) {
                setAlertData({
                  type: "teacher",
                  unmarkedCount: 1,
                  className: classInfo.className || "Assigned Class",
                  title: "Morning Attendance Alert",
                  badge: "Pending Today",
                  description: `Attendance has not been recorded for ${classInfo.className} today. Please record attendance for your class.`,
                  actionLabel: "Mark Attendance",
                  actionLink: "/teacher/my-class/attendance",
                });
              } else {
                setAlertData(null);
              }
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {});

      return () => {
        isMounted = false;
      };
    }
  }, [userRole, dismissed]);

  // Don't show toast on active attendance-marking pages
  const isAttendancePage =
    location.pathname.includes("/attendance") ||
    location.pathname.includes("/student-attendance") ||
    location.pathname.includes("/faculty-attendance");

  if (dismissed || isAttendancePage || !alertData) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(sessionDismissKey, "true");
    } catch {
      // ignore storage access issues
    }
  };

  const visibleClasses = alertData.classes?.slice(0, 3) || [];
  const remainingCount = Math.max(0, (alertData.classes?.length || 0) - 3);

  return (
    <aside
      className="att-toast-container"
      role="alert"
      aria-live="polite"
      aria-label="Pending attendance alert"
    >
      <div className="att-toast-accent-line" />
      <div className="att-toast-body">
        {/* Header */}
        <div className="att-toast-header">
          <div className="att-toast-header-left">
            <div className="att-toast-icon-wrap" aria-hidden="true">
              <ShieldAlert size={17} />
            </div>
            <div className="att-toast-title-stack">
              <h3 className="att-toast-title">{alertData.title}</h3>
              <span className="att-toast-badge">{alertData.badge}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="att-toast-close-btn"
            title="Dismiss alert"
            aria-label="Dismiss morning attendance alert"
          >
            <X size={15} />
          </button>
        </div>

        {/* Message */}
        <p className="att-toast-description">{alertData.description}</p>

        {/* Admin Class Chips */}
        {alertData.type === "admin" && alertData.classes?.length > 0 && (
          <div className="att-toast-chips">
            {visibleClasses.map((c, idx) => (
              <span key={c.classId || idx} className="att-toast-chip">
                {c.className || c.gradeName}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="att-toast-chip-more">+{remainingCount} more</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="att-toast-footer">
          <div className="att-toast-status-indicator">
            <span className="att-toast-status-dot" />
            <span>Today's Task</span>
          </div>

          <Link to={alertData.actionLink} className="att-toast-action-btn">
            <span>{alertData.actionLabel}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
