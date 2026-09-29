import React from "react";

export const SupportStatPills = ({ stats = {}, activeFilter = "all", onSelectFilter }) => {
  const pills = [
    {
      id: "all",
      label: "All Conversations",
      count: (stats.waiting || 0) + (stats.lookingAt || 0) + (stats.answered || 0) + (stats.done || 0),
      emoji: "💬",
      activeClass: "bg-primary text-primary-foreground shadow-sm",
      defaultClass: "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground",
    },
    {
      id: "Open",
      label: "Waiting",
      count: stats.waiting || 0,
      emoji: "🟢",
      activeClass: "bg-emerald-600 text-white shadow-sm",
      defaultClass: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    },
    {
      id: "In Progress",
      label: "Looking at",
      count: stats.lookingAt || 0,
      emoji: "🟡",
      activeClass: "bg-amber-600 text-white shadow-sm",
      defaultClass: "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    },
    {
      id: "Resolved",
      label: "Answered",
      count: stats.answered || 0,
      emoji: "🔵",
      activeClass: "bg-blue-600 text-white shadow-sm",
      defaultClass: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    },
    {
      id: "Closed",
      label: "Done",
      count: stats.done || 0,
      emoji: "⚪",
      activeClass: "bg-slate-700 text-white shadow-sm",
      defaultClass: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill) => {
        const isActive = activeFilter === pill.id;
        return (
          <button
            key={pill.id}
            type="button"
            onClick={() => onSelectFilter && onSelectFilter(pill.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isActive ? pill.activeClass : pill.defaultClass
            }`}
          >
            <span className="text-xs leading-none">{pill.emoji}</span>
            <span>{pill.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
              isActive ? "bg-white/25 text-white" : "bg-black/5 dark:bg-white/10"
            }`}>
              {pill.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SupportStatPills;
