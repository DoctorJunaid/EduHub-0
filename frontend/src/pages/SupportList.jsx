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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-6">
        {/* TOTAL TICKETS */}
        <button
          type="button"
          onClick={() => handleFilterChange("status", "all")}
          className={`bg-white border rounded-xl p-4 shadow-none flex items-start justify-between text-left transition-all cursor-pointer ${
            filters.status === "all"
              ? "border-neutral-900 ring-1 ring-neutral-900/10 shadow-xs"
              : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50"
          }`}
        >
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block truncate">
              Total Tickets
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight block mt-1">
              {totalTickets}
            </span>
            <span className="text-xs text-neutral-500 truncate block mt-1">
              {isStaff ? "Institutional logs" : "Help conversations"}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-600 shrink-0">
            <Headphones className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </button>

        {/* OPEN / ACTION REQUIRED */}
        <button
          type="button"
          onClick={() => handleFilterChange("status", "Open")}
          className={`bg-white border rounded-xl p-4 shadow-none flex items-start justify-between text-left transition-all cursor-pointer ${
            filters.status === "Open"
              ? "border-neutral-900 ring-1 ring-neutral-900/10 shadow-xs"
              : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50"
          }`}
        >
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block truncate">
              Action Required
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight block mt-1">
              {openTickets}
            </span>
            <span className="text-xs text-neutral-500 truncate block mt-1">
              Awaiting triage / reply
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-600 shrink-0">
            <AlertCircle className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </button>

        {/* IN PROGRESS */}
        <button
          type="button"
          onClick={() => handleFilterChange("status", "In Progress")}
          className={`bg-white border rounded-xl p-4 shadow-none flex items-start justify-between text-left transition-all cursor-pointer ${
            filters.status === "In Progress"
              ? "border-neutral-900 ring-1 ring-neutral-900/10 shadow-xs"
              : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50"
          }`}
        >
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block truncate">
              In Progress
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight block mt-1">
              {inProgressTickets}
            </span>
            <span className="text-xs text-neutral-500 truncate block mt-1">
              Under investigation
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-600 shrink-0">
            <Clock className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </button>

        {/* RESOLVED & CLOSED */}
        <button
          type="button"
          onClick={() => handleFilterChange("status", "Resolved")}
          className={`bg-white border rounded-xl p-4 shadow-none flex items-start justify-between text-left transition-all cursor-pointer ${
            filters.status === "Resolved" || filters.status === "Closed"
              ? "border-neutral-900 ring-1 ring-neutral-900/10 shadow-xs"
              : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50"
          }`}
        >
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block truncate">
              Resolved &amp; Closed
            </span>
            <span className="text-2xl font-bold text-neutral-900 tracking-tight block mt-1">
              {resolvedTickets}
            </span>
            <span className="text-xs text-neutral-500 truncate block mt-1">
              Completed resolutions
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-600 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
          </div>
        </button>
      </div>

      {/* 2. Sub-header & Action Buttons Card */}
      <div className="w-full bg-white border border-neutral-200 rounded-xl p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
            <Headphones className="w-5 h-5 text-neutral-700 stroke-[1.75]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight inline-flex items-center gap-2.5">
                {isStaff ? "Manage Support Tickets" : "Manage Conversations"}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-700">
                {total} {total === 1 ? "Record" : "Records"}
              </span>
              {overdueTickets > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/70 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  {overdueTickets} Overdue SLA
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {isStaff
                ? "Triage, assign, escalate, and resolve institutional support requests."
                : isTeacherPortal
                  ? "Ask questions, submit requests regarding schedules, classes, or account support, and track replies."
                  : "Ask questions, get help with your studies, fees, or account, and track replies."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap sm:flex-nowrap">
          {isAdmin && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  role === "super_admin"
                    ? "/super-admin/support"
                    : role === "institute_admin"
                      ? "/institute-admin/support"
                      : "/support/manage",
                )
              }
              className="h-9 px-3.5 text-xs font-medium border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-600" />
              <span>Manage All</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-3.5 text-xs font-medium border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-neutral-900" : "text-neutral-500"}`}
            />
            <span>{isFetching ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewDialogOpen(true)}
            className="h-9 px-4 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isStaff ? "New Ticket" : "Ask for Help"}</span>
          </button>
        </div>
      </div>

      {/* 3. Tickets Table & Unified Filter Toolbar */}
      <div className="w-full bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-none">
        {/* Unified Responsive Filter Toolbar */}
        <div className="p-3.5 sm:px-5 bg-neutral-50/70 border-b border-neutral-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative w-full sm:w-72 shrink-0">
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
                className="h-9 pl-9 pr-8 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 w-full"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => handleFilterChange("search", "")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Segmented Tabs */}
            <div className="bg-neutral-100 p-1 rounded-lg inline-flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 border border-neutral-200/80">
              {tabs.map((tab) => {
                const isActive = filters.status === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleFilterChange("status", tab.id)}
                    className={`text-xs px-3 py-1 rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-white text-neutral-900 font-semibold shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    <span>{tab.shortLabel || tab.label}</span>
                    {typeof tab.count === "number" && (
                      <span className="px-1.5 py-0.2 rounded-full bg-neutral-200/80 text-[10px] text-neutral-700 font-semibold">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dropdowns & Reset */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-auto flex-wrap sm:flex-nowrap">
            {/* Category Dropdown */}
            <select
              value={filters.category || "all"}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="h-9 px-3 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 min-w-[130px] cursor-pointer"
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
                className="h-9 px-3 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 min-w-[130px] cursor-pointer"
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
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs h-9 px-2.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 font-medium inline-flex items-center gap-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white">
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
            <div className="p-4 sm:p-6">
              <ConversationList
                conversations={tickets}
                onNewConversation={() => setIsNewDialogOpen(true)}
              />
            </div>
          )}

          {/* Standardized DataPagination Footer */}
          {!isLoading && total > 0 && (
            <div className="p-4 border-t border-neutral-100 bg-white">
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
