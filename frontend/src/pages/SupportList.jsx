import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import {
  Plus,
  SlidersHorizontal,
  Search,
  X,
  RefreshCw,
  Headphones,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Spinner from "@/components/ui/spinner";
import DataPagination from "@/components/shared/DataPagination";
import { Button } from "@/components/ui/button";

import { useSupportTickets, useCreateTicket } from "@/hooks/useSupportTickets";
import { useSupportStats } from "@/hooks/useSupportStats";
import { useSupportCategories } from "@/hooks/useSupportCategories";

import ConversationList from "@/components/support/ConversationList";
import TicketListTable from "@/components/support/TicketListTable";
import NewTicketDialog from "@/components/support/NewTicketDialog";

export const SupportList = () => {
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const role = auth?.user?.role || "student";
  const isAdmin = [
    "super_admin",
    "institute_admin",
    "campus_admin",
    "campus_manager",
    "principal",
  ].includes(role);
  const isStaff = isAdmin || role === "accountant";
  const isTeacherPortal = ["teacher", "faculty"].includes(role);

  // Filter and pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    priority: "all",
    search: "",
  });
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  // Queries
  const { stats = {} } = useSupportStats();
  const { categories = [] } = useSupportCategories();

  const queryParams = {
    page,
    limit,
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.category !== "all" ? { category: filters.category } : {}),
    ...(filters.priority !== "all" ? { priority: filters.priority } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  };

  const { data, isLoading, isFetching, refetch } = useSupportTickets(queryParams);
  const createTicketMutation = useCreateTicket();

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      status: "all",
      category: "all",
      priority: "all",
      search: "",
    });
    setPage(1);
  };

  const handleCreateTicket = async (payload) => {
    await createTicketMutation.mutateAsync(payload);
  };

  const tickets = data?.tickets || [];
  const total = data?.total || 0;
  const pageCount = data?.pageCount || 1;

  const totalCount =
    (stats.waiting || 0) +
    (stats.lookingAt || 0) +
    (stats.answered || 0) +
    (stats.done || 0);

  const totalTickets = stats.total ?? totalCount ?? total;
  const openTickets = stats.open ?? stats.waiting ?? 0;
  const inProgressTickets = stats.inProgress ?? stats.lookingAt ?? 0;
  const resolvedTickets = (stats.resolved ?? stats.answered ?? 0) + (stats.closed ?? stats.done ?? 0);
  const overdueTickets = stats.overdue ?? 0;

  const tabs = isStaff
    ? [
        {
          id: "all",
          label: "All Tickets",
          shortLabel: "All",
          count: totalTickets,
          dotColor: "bg-neutral-400",
        },
        {
          id: "Open",
          label: "Open",
          shortLabel: "Open",
          count: openTickets,
          dotColor: "bg-rose-500",
        },
        {
          id: "In Progress",
          label: "In Progress",
          shortLabel: "In Progress",
          count: inProgressTickets,
          dotColor: "bg-amber-500",
        },
        {
          id: "Resolved",
          label: "Resolved",
          shortLabel: "Resolved",
          count: stats.resolved || stats.answered || 0,
          dotColor: "bg-blue-500",
        },
        {
          id: "Closed",
          label: "Closed",
          shortLabel: "Closed",
          count: stats.closed || stats.done || 0,
          dotColor: "bg-neutral-400",
        },
      ]
    : [
        {
          id: "all",
          label: "All Conversations",
          shortLabel: "All",
          count: totalCount,
          dotColor: "bg-neutral-400",
        },
        {
          id: "Open",
          label: "Waiting for reply",
          shortLabel: "Waiting",
          count: stats.waiting || 0,
          dotColor: "bg-rose-500",
        },
        {
          id: "In Progress",
          label: "Being looked at",
          shortLabel: "In Progress",
          count: stats.lookingAt || 0,
          dotColor: "bg-amber-500",
        },
        {
          id: "Resolved",
          label: "Answered",
          shortLabel: "Answered",
          count: stats.answered || 0,
          dotColor: "bg-blue-500",
        },
        {
          id: "Closed",
          label: "Done",
          shortLabel: "Done",
          count: stats.done || 0,
          dotColor: "bg-neutral-400",
        },
      ];

  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.category && filters.category !== "all") ||
    (filters.status && filters.status !== "all") ||
    (filters.priority && filters.priority !== "all"),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5 pb-16">
      {/* 1. Flush 4-Card KPI Overview Track (Interactive Filter Buttons) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
        {/* TOTAL TICKETS */}
        <button
          type="button"
          onClick={() => handleFilterChange("status", "all")}
          className={`bg-white border rounded-xl p-4 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer ${
            filters.status === "all"
              ? "border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm"
              : "border-neutral-200/90 hover:border-neutral-300 hover:bg-neutral-50/50"
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
              Total Tickets
            </span>
            <span className="text-2xl font-black text-neutral-900 tracking-tight block mt-0.5">
              {totalTickets}
            </span>
            <span className="text-[11px] text-neutral-500 truncate block mt-0.5">
              {isStaff ? "Institutional logs" : "Help conversations"}
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              filters.status === "all"
                ? "bg-neutral-900 text-white shadow-xs"
                : "bg-neutral-100 border border-neutral-200/80 text-neutral-700"
            }`}
          >
            <Headphones className="w-5 h-5" />
          </div>
        </button>

        {/* OPEN / ACTION REQUIRED */}
        <button
          type="button"
          onClick={() => handleFilterChange("status", "Open")}
          className={`bg-white border rounded-xl p-4 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer ${
            filters.status === "Open"
              ? "border-rose-600 ring-2 ring-rose-600/15 shadow-sm"
              : "border-neutral-200/90 hover:border-rose-200 hover:bg-rose-50/30"
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block truncate">
              Action Required
            </span>
            <span className="text-2xl font-black text-neutral-900 tracking-tight block mt-0.5">
              {openTickets}
            </span>
            <span className="text-[11px] text-rose-600 font-medium truncate block mt-0.5">
              Awaiting triage / reply
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              filters.status === "Open"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 border border-rose-200/80 text-rose-600"
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
        </button>

        {/* IN PROGRESS */}
        <button
          type="button"
          onClick={() => handleFilterChange("status", "In Progress")}
          className={`bg-white border rounded-xl p-4 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer ${
            filters.status === "In Progress"
              ? "border-amber-600 ring-2 ring-amber-600/15 shadow-sm"
              : "border-neutral-200/90 hover:border-amber-200 hover:bg-amber-50/30"
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block truncate">
              In Progress
            </span>
            <span className="text-2xl font-black text-neutral-900 tracking-tight block mt-0.5">
              {inProgressTickets}
            </span>
            <span className="text-[11px] text-amber-600 font-medium truncate block mt-0.5">
              Under investigation
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              filters.status === "In Progress"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 border border-amber-200/80 text-amber-600"
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
        </button>

        {/* RESOLVED & CLOSED */}
        <button
          type="button"
          onClick={() => handleFilterChange("status", "Resolved")}
          className={`bg-white border rounded-xl p-4 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer ${
            filters.status === "Resolved" || filters.status === "Closed"
              ? "border-emerald-600 ring-2 ring-emerald-600/15 shadow-sm"
              : "border-neutral-200/90 hover:border-emerald-200 hover:bg-emerald-50/30"
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block truncate">
              Resolved &amp; Closed
            </span>
            <span className="text-2xl font-black text-neutral-900 tracking-tight block mt-0.5">
              {resolvedTickets}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium truncate block mt-0.5">
              Completed resolutions
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              filters.status === "Resolved" || filters.status === "Closed"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 border border-emerald-200/80 text-emerald-600"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* 2. Main Executive Card Container */}
      <div className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        {/* Header Title + Action Buttons */}
        <div className="p-5 sm:p-6 pb-4 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                  {isStaff ? "Manage Support Tickets" : "Manage Conversations"}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {total} {total === 1 ? "Record" : "Records"}
                </span>
                {overdueTickets > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shadow-2xs">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    {overdueTickets} Overdue SLA
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {isStaff
                  ? "Triage, assign, escalate, and resolve institutional support requests."
                  : isTeacherPortal
                    ? "Ask questions, submit requests regarding schedules, classes, or account support, and track replies."
                    : "Ask questions, get help with your studies, fees, or account, and track replies."}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto flex-wrap sm:flex-nowrap">
            {isAdmin && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(
                    role === "super_admin"
                      ? "/super-admin/support"
                      : role === "institute_admin"
                        ? "/institute-admin/support"
                        : "/support/manage",
                  )
                }
                className="h-9 px-3 rounded-lg border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-600" />
                <span>Manage All</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 px-3 rounded-lg border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-semibold gap-1.5 shadow-2xs shrink-0"
              title="Refresh list"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-neutral-900" : "text-neutral-500"}`}
              />
              <span>{isFetching ? "Refreshing..." : "Refresh"}</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsNewDialogOpen(true)}
              className="h-9 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isStaff ? "New Ticket" : "Ask for Help"}</span>
            </Button>
          </div>
        </div>

        {/* Unified Responsive Filter Toolbar (Search + Segmented Status Pills + Dropdowns on ONE cohesive row) */}
        <div className="p-3.5 sm:px-6 bg-neutral-50/70 border-b border-neutral-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
            {/* Search Input - explicit fixed width so it NEVER collapses! */}
            <div className="relative w-full sm:w-[280px] shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  isStaff
                    ? "Search tickets, subject, creator..."
                    : "Search conversations..."
                }
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="h-9 w-full pl-9 pr-8 text-xs rounded-lg border border-neutral-200 bg-white placeholder:text-neutral-400 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors shadow-2xs"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => handleFilterChange("search", "")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Segmented Status Buttons (All, Open, In Progress, Resolved, Closed) */}
            <div className="flex items-center rounded-lg bg-neutral-200/60 p-0.5 border border-neutral-200 shrink-0 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const isActive = filters.status === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleFilterChange("status", tab.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/40"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${tab.dotColor}`} />
                    <span>{tab.shortLabel || tab.label}</span>
                    {typeof tab.count === "number" && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dropdowns & Reset Button */}
          <div className="flex items-center gap-2 shrink-0 self-start xl:self-auto flex-wrap">
            {/* Category Dropdown */}
            <select
              value={filters.category || "all"}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="h-9 px-3 text-xs font-semibold rounded-lg border border-neutral-200 bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors cursor-pointer shadow-2xs"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c} value={c.id || c}>
                  {c.icon ? `${c.icon} ` : ""}
                  {c.label || c}
                </option>
              ))}
            </select>

            {/* Priority Dropdown */}
            {isStaff && (
              <select
                value={filters.priority || "all"}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="h-9 px-3 text-xs font-semibold rounded-lg border border-neutral-200 bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors cursor-pointer shadow-2xs"
              >
                <option value="all">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            )}

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs h-9 px-2.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 font-semibold"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-neutral-200 bg-neutral-50/50">
              <Spinner className="w-8 h-8 text-neutral-900" />
              <p className="text-xs text-neutral-500 mt-3 font-medium">
                Loading support tickets...
              </p>
            </div>
          ) : isStaff ? (
            <TicketListTable
              tickets={tickets}
              onNewTicket={() => setIsNewDialogOpen(true)}
            />
          ) : (
            <ConversationList
              conversations={tickets}
              onNewConversation={() => setIsNewDialogOpen(true)}
            />
          )}

          {/* Standardized DataPagination Footer */}
          {!isLoading && total > 0 && (
            <div className="pt-2 border-t border-neutral-100">
              <DataPagination
                currentPage={page}
                totalPages={pageCount}
                totalItems={total}
                pageSize={limit}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setLimit(newSize);
                  setPage(1);
                }}
                pageSizeOptions={[10, 20, 30, 50]}
                itemLabel="tickets"
              />
            </div>
          )}
        </div>
      </div>

      {/* New Ticket / Ask for Help Dialog */}
      <NewTicketDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onCreate={handleCreateTicket}
        isPending={createTicketMutation.isPending}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default SupportList;
