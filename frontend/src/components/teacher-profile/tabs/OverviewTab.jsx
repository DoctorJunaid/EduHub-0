import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  IdCard,
  Building2,
  UserCheck,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

export default function OverviewTab({ teacher }) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const user = teacher?.userId || teacher?.user || {};
  const name = user.name || teacher?.name || "Mr. Zeeshan Ali";
  const email = user.email || teacher?.email || "zeeshan.ali@eduhub.com";
  const phone = user.phone || teacher?.phone || "+92 300 5666777";
  const employeeId = teacher?.employeeId || "EMP-ISB-006";
  const department = teacher?.department || "General Sciences";
  const designation = teacher?.designation || "Lecturer & Substitute Specialist";
  const qualification = teacher?.qualification || "M.Sc General Sciences";
  const experience = teacher?.experience ? `${teacher.experience} years` : "5 years";
  const joiningDate = teacher?.hireDate
    ? new Date(teacher.hireDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Jan 15, 2024";
  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Sep 25, 2026";

  const isActive = teacher?.isActive !== false && user.isActive !== false;

  const handleCopyEmail = () => {
    if (!email || email === "—") return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top 2 Cards: Personal Information & Employment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* 1. Personal Information */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <User size={14} />
                </div>
                <h3 className="text-xs font-bold text-slate-900">Personal Information</h3>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Full Name */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <User size={13} className="text-slate-400" />
                  Full Name
                </span>
                <span className="font-semibold text-slate-900 text-xs text-right">{name}</span>
              </div>

              {/* Official Email */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <Mail size={13} className="text-slate-400" />
                  Official Email
                </span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="font-medium text-slate-800 text-xs truncate max-w-[180px] sm:max-w-[220px]">
                    {email}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer shrink-0"
                    title="Copy email"
                  >
                    {copiedEmail ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <Phone size={13} className="text-slate-400" />
                  Phone Number
                </span>
                <span className="font-medium text-slate-800 text-xs text-right">{phone}</span>
              </div>

              {/* Qualification */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <GraduationCap size={13} className="text-slate-400" />
                  Qualification
                </span>
                <span className="font-semibold text-slate-900 text-xs text-right">{qualification}</span>
              </div>

              {/* Teaching Experience */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <Award size={13} className="text-slate-400" />
                  Teaching Experience
                </span>
                <span className="font-semibold text-slate-900 text-xs text-right">{experience}</span>
              </div>

              {/* National ID / CNIC */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <IdCard size={13} className="text-slate-400" />
                  National ID / CNIC
                </span>
                <span className="font-mono text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                  42101-*******-1
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Employment Details */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Briefcase size={14} />
                </div>
                <h3 className="text-xs font-bold text-slate-900">Employment Details</h3>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Employee ID */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <IdCard size={13} className="text-slate-400" />
                  Employee ID
                </span>
                <span className="font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded text-[11px]">
                  {employeeId}
                </span>
              </div>

              {/* Designation */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <Award size={13} className="text-slate-400" />
                  Designation
                </span>
                <span className="font-semibold text-slate-900 text-xs text-right truncate max-w-[200px]">
                  {designation}
                </span>
              </div>

              {/* Department */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <Building2 size={13} className="text-slate-400" />
                  Department
                </span>
                <span className="font-semibold text-slate-900 text-xs text-right">{department}</span>
              </div>

              {/* Employment Type */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <Briefcase size={13} className="text-slate-400" />
                  Employment Type
                </span>
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-semibold text-[10px] py-0.5 px-2">
                  Permanent (Full-time)
                </Badge>
              </div>

              {/* Joining Date */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <Calendar size={13} className="text-slate-400" />
                  Joining Date
                </span>
                <span className="font-semibold text-slate-900 text-xs text-right">{joiningDate}</span>
              </div>

              {/* Reporting To */}
              <div className="flex items-center justify-between py-2.5 px-1">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                  <UserCheck size={13} className="text-slate-400" />
                  Reporting To
                </span>
                <span className="font-semibold text-slate-800 text-xs text-right truncate max-w-[190px]">
                  HOD / Campus Principal
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Account Status & System Security */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs w-full">
        <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <ShieldCheck size={14} />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Account Status &amp; System Security</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Portal Access */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
              }`}
            >
              {isActive ? <CheckCircle2 size={16} /> : <Clock size={16} />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-medium">Portal Access</p>
              <p className="text-xs font-bold text-slate-900 truncate">
                {isActive ? "Active & Verified" : "Suspended"}
              </p>
            </div>
          </div>

          {/* Last Portal Login */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-medium">Last Portal Login</p>
              <p className="text-xs font-bold text-slate-900 truncate">Today, 08:15 AM</p>
            </div>
          </div>

          {/* Member Since */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-medium">Member Since</p>
              <p className="text-xs font-bold text-slate-900 truncate">{createdAt}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
