import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { Shield, LifeBuoy, AlertTriangle, RefreshCw, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportKpiCards from "@/components/support/SupportKpiCards";
import TicketFilters from "@/components/support/TicketFilters";
import TicketListTable from "@/components/support/TicketListTable";
import EmptyTicketsState from "@/components/support/EmptyTicketsState";
import NewTicketDialog from "./NewTicketDialog";
import DataPagination from "@/components/shared/DataPagination";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { useSupportStats } from "@/hooks/useSupportStats";
import { useSupportCategories } from "@/hooks/useSupportCategories";
import { useSupportContacts } from "@/hooks/useSupportContacts";

export default function SupportManage() {
  const currentUser = useSelector(selectCurrentUser);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "All",
    category: "All",
    priority: "All",
    search: "",
    scope: "all", // Admin wide scope
    assignedTo: "",
  });

  const { stats } = useSupportStats();
  const { categories = [] } = useSupportCategories();
  const { contacts = [] } = useSupportContacts();

  const {
    tickets,
    total,
    pageCount,
    isLoading,
    isFetching,
    refetch,
    createTicket,
    isCreating,
  } = useSupportTickets(filters);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      status: "All",
      category: "All",
      priority: "All",
      search: "",
      scope: "all",
      assignedTo: "",
    });
  };

  return (
    <div className="campus-tab-page p-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">
              Support Management & SLA Center
            </h1>
            <span className="text-[11px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
              Admin Scope
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Monitor institution-wide tickets, enforce SLA targets, and manage staff dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-3 text-xs font-semibold border-zinc-200 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>

          <Button
            onClick={() => setDialogOpen(true)}
            className="h-9 px-4 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Ticket</span>
          </Button>
        </div>
      </div>

      {/* 2. Admin KPI & SLA Cards */}
      <SupportKpiCards stats={stats} isAdmin={true} />

      {/* 3. Filters Toolbar with Assignee support */}
      <TicketFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        categories={categories}
        showAssigneeFilter={true}
        assignees={contacts}
      />

      {/* 4. Tickets Table or Empty State */}
      {!isLoading && tickets.length === 0 ? (
        <EmptyTicketsState
          onNewTicket={() => setDialogOpen(true)}
          isFiltered={
            Boolean(filters.search) ||
            filters.status !== "All" ||
            filters.category !== "All" ||
            Boolean(filters.assignedTo)
          }
        />
      ) : (
        <>
          <TicketListTable
            tickets={tickets}
            isLoading={isLoading}
            showCreator={true}
          />

          <DataPagination
            page={filters.page}
            pageSize={filters.limit}
            total={total}
            pageCount={pageCount}
            onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
            onPageSizeChange={(size) => setFilters((prev) => ({ ...prev, limit: size, page: 1 }))}
            itemLabel="support tickets"
          />
        </>
      )}

      {/* 5. Create Ticket Dialog */}
      <NewTicketDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreateTicket={createTicket}
        isCreating={isCreating}
      />
    </div>
  );
}
