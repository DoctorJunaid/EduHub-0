import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import { Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import DataPagination from "@/components/shared/DataPagination";

import { useSupportTickets, useCreateTicket } from "@/hooks/useSupportTickets";
import { useSupportStats } from "@/hooks/useSupportStats";
import { useSupportCategories } from "@/hooks/useSupportCategories";

import SupportKpiCards from "@/components/support/SupportKpiCards";
import SupportStatPills from "@/components/support/SupportStatPills";
import ConversationList from "@/components/support/ConversationList";
import TicketListTable from "@/components/support/TicketListTable";
import TicketFilters from "@/components/support/TicketFilters";
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

  const { data, isLoading, isFetching } = useSupportTickets(queryParams);
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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {isAdmin ? "🆘 Support Tickets" : "💬 Help & Support"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isAdmin
              ? "Manage, triage, and resolve student, staff, and campus support requests."
              : "Ask questions, get help with your studies, fees, or account, and view replies."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => navigate("/support/manage")}
              className="gap-1.5 rounded-xl text-xs h-10 border-border"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Manage All →</span>
            </Button>
          )}

          <Button
            onClick={() => setIsNewDialogOpen(true)}
            className="gap-2 rounded-xl text-xs sm:text-sm font-semibold h-10 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdmin ? "New Ticket" : "Ask for Help"}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards (Admins) vs Friendly Stat Pills (Regular Users) */}
      {isAdmin ? (
        <SupportKpiCards
          stats={stats}
          activeStatus={filters.status}
          onSelectFilter={(status) => handleFilterChange("status", status)}
        />
      ) : (
        <SupportStatPills
          stats={stats}
          activeFilter={filters.status}
          onSelectFilter={(status) => handleFilterChange("status", status)}
        />
      )}

      {/* Search and Filters */}
      <TicketFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        categories={categories}
        isAdmin={isAdmin}
      />

      {/* Main List Section */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner className="w-8 h-8 text-primary" />
            <p className="text-xs text-muted-foreground mt-3">Loading help conversations...</p>
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
