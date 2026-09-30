import React from "react";
import { Search, X } from "lucide-react";

export const TicketFilters = ({
  filters = {},
  onChange,
  onReset,
  categories = [],
  isAdmin = false,
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.category && filters.category !== "all") ||
      (filters.status && filters.status !== "all") ||
      (filters.priority && filters.priority !== "all")
  );

  return (
    <div className="flex items-center justify-between gap-3 px-6 py-2.5 bg-[#fafafa] border-b border-[#e4e4e7] min-h-[48px] box-border w-full flex-wrap sm:flex-nowrap">
      {/* Left side: Search input + Selects */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
        {/* Search input with search icon */}
        <div className="relative flex items-center w-full sm:max-w-[260px] shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#71717a] pointer-events-none" />
          <input
            type="text"
            placeholder={
              isAdmin
                ? "Search tickets by #, subject, or creator..."
                : "Search conversations..."
            }
            value={filters.search || ""}
            onChange={(e) => onChange("search", e.target.value)}
            className="w-full !h-[34px] pl-8 pr-3 text-xs bg-white border border-[#e4e4e7] rounded-md text-[#09090b] placeholder:text-[#71717a] outline-none focus:border-[#09090b] transition-colors"
          />
        </div>

        {/* Category dropdown */}
        <select
          value={filters.category || "all"}
          onChange={(e) => onChange("category", e.target.value)}
          className="!w-auto min-w-[130px] max-w-[200px] !h-[34px] !py-0 px-2.5 text-xs font-medium bg-white border border-[#e4e4e7] rounded-md text-[#09090b] outline-none focus:border-[#09090b] transition-colors cursor-pointer shrink-0"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id || c} value={c.id || c}>
              {c.icon ? `${c.icon} ` : ""}{c.label || c}
            </option>
          ))}
        </select>

        {/* Admin-only Filters: Status, Priority */}
        {isAdmin && (
          <>
            <select
              value={filters.status || "all"}
              onChange={(e) => onChange("status", e.target.value)}
              className="!w-auto min-w-[120px] max-w-[160px] !h-[34px] !py-0 px-2.5 text-xs font-medium bg-white border border-[#e4e4e7] rounded-md text-[#09090b] outline-none focus:border-[#09090b] transition-colors cursor-pointer shrink-0"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Escalated">Escalated</option>
              <option value="Overdue">Overdue SLA</option>
            </select>

            <select
              value={filters.priority || "all"}
              onChange={(e) => onChange("priority", e.target.value)}
              className="!w-auto min-w-[120px] max-w-[160px] !h-[34px] !py-0 px-2.5 text-xs font-medium bg-white border border-[#e4e4e7] rounded-md text-[#09090b] outline-none focus:border-[#09090b] transition-colors cursor-pointer shrink-0"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </>
        )}
      </div>

      {/* Right side: Reset filter button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="h-8 px-2.5 text-xs font-medium text-[#71717a] hover:text-[#09090b] hover:bg-white border border-transparent hover:border-[#e4e4e7] rounded-md inline-flex items-center gap-1 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};

export default TicketFilters;
