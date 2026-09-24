import React from "react";
import {
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  CalendarCheck,
  UserCheck,
  Wallet,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

export default function SeedStatsCard({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Grades",
      value: stats?.grades ?? 12,
      subtext: "Class 1 to Class 12",
      icon: Layers,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-100 dark:border-blue-900",
    },
    {
      label: "Sections & Classes",
      value: stats?.sections ?? 48,
      subtext: "Sections A, B, C, D",
      icon: BookOpen,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      border: "border-indigo-100 dark:border-indigo-900",
    },
    {
      label: "Teachers",
      value: stats?.teachers ?? 60,
      subtext: "60 faculty members",
      icon: GraduationCap,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      border: "border-purple-100 dark:border-purple-900",
    },
    {
      label: "Enrolled Students",
      value: stats?.students ?? 1440,
      subtext: "30 per section × 48",
      icon: Users,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-100 dark:border-emerald-900",
    },
    {
      label: "Timetable Slots",
      value: stats?.timetableSlots ?? 2016,
      subtext: "Weekly conflict-free",
      icon: CalendarDays,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-100 dark:border-amber-900",
    },
    {
      label: "Attendance Records",
      value: (stats?.studentAttendance || 0) + (stats?.teacherAttendance || 0),
      subtext: "30 days past logs",
      icon: CalendarCheck,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/40",
      border: "border-teal-100 dark:border-teal-900",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Current School Structure & Data Records
        </h3>
        <span className="text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          Campus Admins Untouched
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${item.border} ${item.bg} flex flex-col justify-between transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {item.label}
                </span>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {item.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
