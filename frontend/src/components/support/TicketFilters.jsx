import React from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const TicketFilters = ({
  filters = {},
  onChange,
  onReset,
  categories = [],
  isAdmin = false,
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.status && filters.status !== "all") ||
      (filters.category && filters.category !== "all") ||
      (filters.priority && filters.priority !== "all") ||
      filters.assignedTo ||
      filters.startDate ||
      filters.endDate
  );

  return (
    <div className="p-4 bg-card border border-border/80 rounded-2xl space-y-3 shadow-xs">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={
              isAdmin
                ? "Search by ticket #, subject, creator or keyword..."
                : "Search your conversations..."
            }
            value={filters.search || ""}
            onChange={(e) => onChange("search", e.target.value)}
            className="pl-9 bg-background/50 h-10 rounded-xl"
          />
        </div>

        {/* Filters and Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={filters.category || "all"}
            onChange={(e) => onChange("category", e.target.value)}
            className="h-10 px-3 py-1.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id || c} value={c.id || c}>
                {c.icon ? `${c.icon} ` : ""}{c.label || c}
              </option>
            ))}
          </select>

          {/* Admin-only Filters: Priority, Status, Date */}
          {isAdmin && (
            <>
              <select
                value={filters.status || "all"}
                onChange={(e) => onChange("status", e.target.value)}
                className="h-10 px-3 py-1.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                className="h-10 px-3 py-1.5 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-10 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-xl"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketFilters;
