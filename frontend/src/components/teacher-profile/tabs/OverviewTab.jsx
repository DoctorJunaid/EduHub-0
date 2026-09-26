import React from "react";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";

export default function OverviewTab({ teacher }) {
  const user = teacher?.userId || {};
  const name = user.name || "Teacher";
  const email = user.email || "—";
  const phone = user.phone || "—";
  const employeeId = teacher?.employeeId || "EMP-001";
  const department = teacher?.department || "General Academics";
  const designation = teacher?.designation || "Teaching Staff";
  const qualification = teacher?.qualification || "Masters Degree";
  const experience = teacher?.experience
    ? `${teacher.experience} years`
    : "5+ years";
  const joiningDate = teacher?.hireDate
    ? new Date(teacher.hireDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Aug 15, 2020";
  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : joiningDate;

  const isActive = teacher?.isActive !== false && user.isActive !== false;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Personal Information Card */}
        <Card className="bg-white border-zinc-200/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 divide-y divide-zinc-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Full Name</span>
              <span className="font-semibold text-zinc-900">{name}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Official Email</span>
              <span className="font-medium text-zinc-800">{email}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Phone Number</span>
              <span className="font-medium text-zinc-800">{phone}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Qualification</span>
              <span className="font-semibold text-zinc-900">
                {qualification}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">
                Teaching Experience
              </span>
              <span className="font-semibold text-zinc-900">{experience}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">
                National ID / CNIC
              </span>
              <span className="font-mono text-zinc-800">42101-*******-1</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Employment Information Card */}
        <Card className="bg-white border-zinc-200/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-zinc-600" />
              Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 divide-y divide-zinc-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Employee ID</span>
              <span className="font-mono font-bold text-zinc-900">
                {employeeId}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Designation</span>
              <span className="font-semibold text-zinc-900">{designation}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Department</span>
              <span className="font-semibold text-zinc-900">{department}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Employment Type</span>
              <Badge
                variant="outline"
                className="bg-zinc-50 text-zinc-700 border-zinc-200 font-semibold"
              >
                Permanent (Full-time)
              </Badge>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Joining Date</span>
              <span className="font-semibold text-zinc-900">{joiningDate}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Reporting To</span>
              <span className="font-semibold text-zinc-900">
                Head of Department / Campus Principal
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Account Status & Security Card */}
      <Card className="bg-white border-zinc-200/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100">
          <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-600" />
            Account Status & System Security
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {isActive ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Portal Access
                </p>
                <p className="font-bold text-zinc-900">
                  {isActive ? "Active & Verified" : "Suspended"}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Last Portal Login
                </p>
                <p className="font-bold text-zinc-900">Today, 08:15 AM</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Member Since
                </p>
                <p className="font-bold text-zinc-900">{createdAt}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
