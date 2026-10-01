import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import { Plus, SlidersHorizontal, Search, X } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import DataPagination from "@/components/shared/DataPagination";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
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
  const currentUser = auth?.user;
  const role = currentUser?.role || "student";
  const isAdmin = ["super_admin", "institute_admin", "campus_admin"].includes(role);

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

  const { data, isLoading } = useSupportTickets(queryParams);
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

  const tabs = isAdmin
    ? [
        { id: "all", label: "All Tickets", count: stats.total || totalCount },
        { id: "Open", label: "Open", count: stats.open || stats.waiting || 0 },
        { id: "In Progress", label: "In Progress", count: stats.inProgress || stats.lookingAt || 0 },
        { id: "Resolved", label: "Resolved", count: stats.resolved || stats.answered || 0 },
        { id: "Closed", label: "Closed", count: stats.closed || stats.done || 0 },
      ]
    : [
        { id: "all", label: "All Conversations", count: totalCount },
        { id: "Open", label: "Waiting for reply", count: stats.waiting || 0 },
        { id: "In Progress", label: "Being looked at", count: stats.lookingAt || 0 },
        { id: "Resolved", label: "Answered", count: stats.answered || 0 },
        { id: "Closed", label: "Done", count: stats.done || 0 },
      ];

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.category && filters.category !== "all") ||
      (filters.status && filters.status !== "all") ||
      (filters.priority && filters.priority !== "all")
  );

  return (
    <div className="academics-config-page mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      {/* 1. Floating Pill Tabs Bar (matches AcademicsConfig tab list) */}
      <div className="academics-config-tab-list flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm sm:w-fit">
        {tabs.map((tab) => {
          const isActive = filters.status === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleFilterChange("status", tab.id)}
              className={`h-9 flex-none rounded-lg px-3 sm:px-4 text-xs sm:text-sm font-medium transition-all inline-flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-zinc-800 text-zinc-100"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Main Card Container (matches AcademicsConfig card) */}
      <Card className="academics-config-card gap-0 overflow-hidden rounded-xl border border-zinc-200 bg-white py-0 shadow-sm">
        <CardHeader className="academics-config-card-header border-b border-zinc-100 px-5 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-zinc-900">
                {isAdmin ? "Manage Support Tickets" : "Manage Conversations"}
              </CardTitle>
              <CardDescription className="text-sm text-zinc-500 mt-1">
                {isAdmin
                  ? "Triage, assign, escalate, and resolve institutional support requests."
                  : "Ask questions, get help with your studies, fees, or account, and track replies."}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
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
                        : "/support/manage"
                    )
                  }
                  className="h-10 rounded-lg border-zinc-200 text-zinc-900 hover:bg-zinc-50 text-xs sm:text-sm font-medium"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Manage All
                </Button>
              )}

              <Button
                type="button"
                onClick={() => setIsNewDialogOpen(true)}
                className="h-10 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-xs sm:text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAdmin ? "New Ticket" : "Ask for Help"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="academics-config-card-content px-5 pb-5 sm:px-6 sm:pb-6 pt-5 space-y-4">
          {/* Search & Filter Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0 flex-wrap">
              {/* Search input */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={isAdmin ? "Search tickets by #, subject, or creator..." : "Search conversations..."}
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 outline-none transition-all"
                />
              </div>

              {/* Category dropdown */}
              <select
                value={filters.category || "all"}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="!w-auto h-10 px-3 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 outline-none transition-all cursor-pointer shrink-0"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id || c} value={c.id || c}>
                    {c.icon ? `${c.icon} ` : ""}{c.label || c}
                  </option>
                ))}
              </select>

              {isAdmin && (
                <>
                  <select
                    value={filters.priority || "all"}
                    onChange={(e) => handleFilterChange("priority", e.target.value)}
                    className="!w-auto h-10 px-3 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 outline-none transition-all cursor-pointer shrink-0"
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

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-zinc-500 hover:text-zinc-900 text-xs h-9 self-start sm:self-auto"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Reset Filters
              </Button>
            )}
          </div>

          {/* Table View */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-zinc-200 bg-zinc-50/50">
              <Spinner className="w-8 h-8 text-zinc-900" />
              <p className="text-xs text-zinc-500 mt-3 font-medium">Loading conversations...</p>
            </div>
          ) : isAdmin ? (
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

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <div className="pt-2">
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
              />
            </div>
          )}
        </CardContent>
      </Card>

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
