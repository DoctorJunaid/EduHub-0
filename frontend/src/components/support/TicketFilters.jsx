import React from "react";
import { Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function TicketFilters({
  filters = {},
  onChange,
  onReset,
  categories = [],
  showAssigneeFilter = false,
  assignees = [],
}) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.status && filters.status !== "All") ||
    (filters.category && filters.category !== "All") ||
    (filters.priority && filters.priority !== "All") ||
    (filters.assignedTo && filters.assignedTo !== "All");

  return (
    <div className="campus-toolbar bg-white border border-zinc-200/80 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search input */}
        <div className="relative min-w-[200px] max-w-[260px] flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tickets, subjects, staff..."
            value={filters.search || ""}
            onChange={(e) => onChange("search", e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 transition-colors"
          />
        </div>

        {/* Status selector */}
        <Select
          value={filters.status || "All"}
          onValueChange={(val) => onChange("status", val)}
        >
          <SelectTrigger className="h-8 w-[125px] text-xs bg-zinc-50 border-zinc-200">
            <SelectValue placeholder="Status: All" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Escalated">Escalated</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Category selector */}
        <Select
          value={filters.category || "All"}
          onValueChange={(val) => onChange("category", val)}
        >
          <SelectTrigger className="h-8 w-[145px] text-xs bg-zinc-50 border-zinc-200">
            <SelectValue placeholder="Category: All" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="All">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority selector */}
        <Select
          value={filters.priority || "All"}
          onValueChange={(val) => onChange("priority", val)}
        >
          <SelectTrigger className="h-8 w-[125px] text-xs bg-zinc-50 border-zinc-200">
            <SelectValue placeholder="Priority: All" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="All">All Priorities</SelectItem>
            <SelectItem value="Urgent">Urgent</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee selector for Manage mode */}
        {showAssigneeFilter && assignees.length > 0 && (
          <Select
            value={filters.assignedTo || "All"}
            onValueChange={(val) => onChange("assignedTo", val === "All" ? "" : val)}
          >
            <SelectTrigger className="h-8 w-[145px] text-xs bg-zinc-50 border-zinc-200">
              <SelectValue placeholder="Assignee: All" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="All">All Assignees</SelectItem>
              {assignees.map((a) => (
                <SelectItem key={a._id} value={a._id}>
                  {a.name} ({a.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 text-xs text-zinc-500 hover:text-zinc-900 px-2 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
