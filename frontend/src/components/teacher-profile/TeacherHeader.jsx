import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  BookOpen,
  CalendarCheck,
  Wallet,
  MoreVertical,
  UserX,
  Trash2,
  Bell,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";

export default function TeacherHeader({
  teacher,
  onEditProfile,
  onAssignClasses,
  onSwitchTab,
}) {
  const navigate = useNavigate();

  const user = teacher?.userId || teacher?.user || {};
  const name = user.name || teacher?.name || "Teacher Profile";
  const initials = (name || "TP")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "TP";

  const designation = teacher?.designation || user.designation || "Teaching Staff";
  const department = teacher?.department || user.department || "Academic Department";
  const isActive = teacher?.isActive !== false && user.isActive !== false;

  return (
    <div className="teacher-profile-topbar">
      <div className="teacher-topbar-left">
        <button
          type="button"
          onClick={() => navigate("/faculty")}
          className="toolbar-btn toolbar-btn-outline"
          title="Back to Faculty Directory"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>

        <div className="teacher-topbar-avatar">
          {initials}
        </div>

        <div className="teacher-topbar-info">
          <div className="teacher-topbar-name-row">
            <span className="teacher-topbar-name">{name}</span>
            <span className={`campus-status-pill ${isActive ? "status-active" : "status-inactive"}`}>
              <span className="status-dot" />
              {isActive ? "Active Teacher" : "Inactive"}
            </span>
          </div>
          <div className="teacher-topbar-sub">
            {designation} &bull; {department} &bull; ID: <span className="font-mono font-semibold text-zinc-900">{teacher?.employeeId || "EMP-001"}</span>
          </div>
        </div>
      </div>

      <div className="teacher-topbar-actions">
        <button
          type="button"
          className="toolbar-btn toolbar-btn-outline"
          onClick={onEditProfile}
        >
          <Edit size={13} />
          <span>Edit Details</span>
        </button>

        <button
          type="button"
          className="toolbar-btn toolbar-btn-primary"
          onClick={onAssignClasses}
        >
          <BookOpen size={13} />
          <span>Assign Classes</span>
        </button>

        <button
          type="button"
          className="toolbar-btn toolbar-btn-outline"
          onClick={() => onSwitchTab && onSwitchTab("attendance")}
        >
          <CalendarCheck size={13} />
          <span>Attendance</span>
        </button>

        <button
          type="button"
          className="toolbar-btn toolbar-btn-outline"
          onClick={() => onSwitchTab && onSwitchTab("payroll")}
        >
          <Wallet size={13} />
          <span>Salary</span>
        </button>
      </div>
    </div>
  );
}
