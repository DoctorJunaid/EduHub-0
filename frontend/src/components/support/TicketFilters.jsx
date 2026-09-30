import React from "react";
import { Search, X, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TicketFilters = ({
  filters = {},
  onChange,
  onReset,
  categories = [],
  isAdmin = false,
  onNewTicket,
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.category && filters.category !== "all") ||
      (filters.status && filters.status !== "all") ||
      (filters.priority && filters.priority !== "all")
  );

  return (
    <div className="isu-toolbar">
      {/* Grid of controls: Search + Dropdowns */}
      <div className={`isu-toolbar-grid ${!isAdmin ? "user-grid" : ""}`}>
        {/* Search input with search icon */}
        <div className="isu-search-wrapper">
          <Search className="isu-search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder={
              isAdmin
                ? "Search tickets by #, subject, or creator..."
                : "Search conversations..."
            }
            value={filters.search || ""}
            onChange={(e) => onChange("search", e.target.value)}
            className="isu-search-input"
          />
        </div>

        {/* Category dropdown */}
        <Select
          value={filters.category || "all"}
          onValueChange={(val) => onChange("category", val)}
        >
          <SelectTrigger className="isu-select-trigger">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id || c} value={c.id || c}>
                {c.icon ? `${c.icon} ` : ""}{c.label || c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Admin-only Filters: Status, Priority */}
        {isAdmin && (
          <>
            <Select
              value={filters.status || "all"}
              onValueChange={(val) => onChange("status", val)}
            >
              <SelectTrigger className="isu-select-trigger">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Escalated">Escalated</SelectItem>
                <SelectItem value="Overdue">Overdue SLA</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority || "all"}
              onValueChange={(val) => onChange("priority", val)}
            >
              <SelectTrigger className="isu-select-trigger">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Right side: Reset filter button and New Ticket action */}
      <div className="isu-toolbar-actions">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="isu-reset-btn"
            title="Reset active filters"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
        {onNewTicket && (
          <button
            type="button"
            onClick={onNewTicket}
            className="isu-new-btn"
            title="Create a new support ticket"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketFilters;
