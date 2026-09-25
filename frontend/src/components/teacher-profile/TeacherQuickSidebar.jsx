import React from "react";
import {
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Copy,
  Check,
  CheckCircle2,
  CalendarPlus,
  Bell,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function TeacherQuickSidebar({
  teacher,
  stats = {},
  onMarkAttendance,
  onAssignSubstitute,
}) {
  const [copiedEmail, setCopiedEmail] = React.useState(false);

  const user = teacher?.userId || teacher?.user || {};
  const email = user.email || teacher?.email || "teacher@eduhub.edu.pk";
  const phone = user.phone || teacher?.phone || "+92 300 1234567";
  const employeeId = teacher?.employeeId || (teacher?._id ? `EMP-${String(teacher._id).slice(-4).toUpperCase()}` : "EMP-001");
  const hireDate = teacher?.hireDate
    ? new Date(teacher.hireDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "Aug 15, 2020";

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Quick Facts Widget */}
      <div className="teacher-widget-card">
        <div className="teacher-widget-title">
          <Briefcase size={14} />
          <span>Quick Facts</span>
        </div>
        <div className="teacher-widget-row">
          <span className="teacher-widget-label">Employee ID</span>
          <span className="teacher-widget-val font-mono">{employeeId}</span>
        </div>
        <div className="teacher-widget-row">
          <span className="teacher-widget-label">Joining Date</span>
          <span className="teacher-widget-val">{hireDate}</span>
        </div>
        <div className="teacher-widget-row">
          <span className="teacher-widget-label">Total Classes</span>
          <span className="teacher-widget-val">{stats.totalClasses || 0}</span>
        </div>
        <div className="teacher-widget-row">
          <span className="teacher-widget-label">Weekly Load</span>
          <span className="teacher-widget-val">{stats.weeklyPeriods || 0} periods</span>
        </div>
        <div className="teacher-widget-row">
          <span className="teacher-widget-label">Attendance Rate</span>
          <span className="teacher-widget-val text-emerald-600 font-mono">
            {stats.attendanceRate30d || 100}%
          </span>
        </div>
        <div className="teacher-widget-row">
          <span className="teacher-widget-label">Substitutes (30d)</span>
          <span className="teacher-widget-val">{stats.substituteDuties30d || 0} covered</span>
        </div>
      </div>

      {/* 2. Contact Widget */}
      <div className="teacher-widget-card">
        <div className="teacher-widget-title">
          <Mail size={14} />
          <span>Contact Details</span>
        </div>
        <div className="teacher-widget-row" style={{ alignItems: "center" }}>
          <span className="teacher-widget-label truncate" style={{ maxWidth: "200px" }}>{email}</span>
          <button
            type="button"
            className="toolbar-btn toolbar-btn-outline"
            style={{ height: "26px", minHeight: "26px", padding: "0 8px", fontSize: "10px" }}
            onClick={() => copyToClipboard(email)}
          >
            {copiedEmail ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
            <span>{copiedEmail ? "Copied" : "Copy"}</span>
          </button>
        </div>
        <div className="teacher-widget-row" style={{ alignItems: "center" }}>
          <span className="teacher-widget-label">{phone}</span>
          <a
            href={`tel:${phone}`}
            className="toolbar-btn toolbar-btn-outline"
            style={{ height: "26px", minHeight: "26px", padding: "0 8px", fontSize: "10px" }}
          >
            <ExternalLink size={11} />
            <span>Call</span>
          </a>
        </div>
      </div>

      {/* 3. Quick Actions Widget */}
      <div className="teacher-widget-card">
        <div className="teacher-widget-title">
          <CheckCircle2 size={14} />
          <span>Quick Actions</span>
        </div>
        <button
          type="button"
          className="toolbar-btn toolbar-btn-outline"
          style={{ width: "100%", justifyContent: "flex-start", height: "32px" }}
          onClick={onMarkAttendance || (() => toast.success("Attendance verified for today"))}
        >
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>Mark Attendance Today</span>
        </button>

        <button
          type="button"
          className="toolbar-btn toolbar-btn-outline"
          style={{ width: "100%", justifyContent: "flex-start", height: "32px" }}
          onClick={onAssignSubstitute || (() => toast.success("Opening substitute assign dialog"))}
        >
          <CalendarPlus size={13} className="text-indigo-600" />
          <span>Assign Substitute</span>
        </button>
      </div>
    </div>
  );
}
