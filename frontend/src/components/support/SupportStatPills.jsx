import React from "react";

export const SupportStatPills = ({ stats = {}, activeFilter = "all", onSelectFilter }) => {
  const tabs = [
    {
      id: "all",
      label: "All Conversations",
      count: (stats.waiting || 0) + (stats.lookingAt || 0) + (stats.answered || 0) + (stats.done || 0),
    },
    {
      id: "Open",
      label: "Waiting for reply",
      count: stats.waiting || 0,
      badgeClass: "text-[#15803d] bg-[#dcfce7]",
      activeBadgeClass: "text-white bg-[#16a34a]",
    },
    {
      id: "In Progress",
      label: "Being looked at",
      count: stats.lookingAt || 0,
      badgeClass: "text-[#854d0e] bg-[#fef9c3]",
      activeBadgeClass: "text-white bg-[#ca8a04]",
    },
    {
      id: "Resolved",
      label: "Answered",
      count: stats.answered || 0,
      badgeClass: "text-[#1d4ed8] bg-[#dbeafe]",
      activeBadgeClass: "text-white bg-[#2563eb]",
    },
    {
      id: "Closed",
      label: "Done",
      count: stats.done || 0,
      badgeClass: "text-[#52525b] bg-[#e4e4e7]",
      activeBadgeClass: "text-white bg-[#71717a]",
    },
  ];

  return (
    <div className="flex items-center justify-between w-full">
      <div className="inline-flex items-center gap-0.5 p-1 bg-[#f4f4f5] border border-[#e4e4e7] rounded-lg">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectFilter && onSelectFilter(tab.id)}
              className={`h-[30px] inline-flex items-center gap-2 px-3 rounded-[6px] text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-white text-[#09090b] font-semibold border border-[#e4e4e7] shadow-2xs"
                  : "text-[#52525b] hover:text-[#18181b] hover:bg-white/60"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[17px] px-1.5 rounded-full text-[10px] font-bold leading-none transition-colors ${
                  isActive
                    ? (tab.activeBadgeClass || "bg-[#18181b] text-white")
                    : (tab.badgeClass || "bg-[#e4e4e7] text-[#52525b]")
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SupportStatPills;
