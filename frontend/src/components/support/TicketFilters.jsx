import React from "react";
import { Search, X, Plus, Layers } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CANONICAL_SUPPORT_CATEGORIES,
  getCategoryIcon,
} from "./supportCategories";

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

  const categoryList =
    categories && categories.length > 0
      ? categories
      : CANONICAL_SUPPORT_CATEGORIES;

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
          <SelectContent
            position="popper"
            sideOffset={6}
            align="start"
            className="isu-select-content category-content"
          >
            <SelectItem value="all" className="isu-select-item">
              <Layers className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>All Categories</span>
            </SelectItem>
            {categoryList.map((c) => {
              const catId = c.id || c;
              const catLabel = c.label || c;
              const CatIcon = getCategoryIcon(catId);
              return (
                <SelectItem
                  key={catId}
                  value={catId}
                  className="isu-select-item"
                >
                  <CatIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="truncate">{catLabel}</span>
                </SelectItem>
              );
            })}
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
              <SelectContent
                position="popper"
                sideOffset={6}
                align="start"
                className="isu-select-content status-content"
              >
                <SelectItem value="all" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-zinc-300 shrink-0" />
                  <span>All Statuses</span>
                </SelectItem>
                <SelectItem value="Open" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>Open</span>
                </SelectItem>
                <SelectItem value="In Progress" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>In Progress</span>
                </SelectItem>
                <SelectItem value="Resolved" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Resolved</span>
                </SelectItem>
                <SelectItem value="Closed" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                  <span>Closed</span>
                </SelectItem>
                <SelectItem value="Escalated" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <span>Escalated</span>
                </SelectItem>
                <SelectItem value="Overdue" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>Overdue SLA</span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority || "all"}
              onValueChange={(val) => onChange("priority", val)}
            >
              <SelectTrigger className="isu-select-trigger">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={6}
                align="start"
                className="isu-select-content priority-content"
              >
                <SelectItem value="all" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-zinc-300 shrink-0" />
                  <span>All Priorities</span>
                </SelectItem>
                <SelectItem value="Urgent" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>Urgent</span>
                </SelectItem>
                <SelectItem value="High" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                  <span>High</span>
                </SelectItem>
                <SelectItem value="Medium" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Medium</span>
                </SelectItem>
                <SelectItem value="Low" className="isu-select-item">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>Low</span>
                </SelectItem>
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
