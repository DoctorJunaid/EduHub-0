import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { Plus, LifeBuoy, ShieldCheck, RefreshCw } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";

export default function SupportList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useSelector(selectCurrentUser);
  const isAdmin =
    currentUser?.role === "campus_admin" ||
    currentUser?.role === "campus_manager" ||
    currentUser?.role === "institute_admin" ||
    currentUser?.role === "super_admin" ||
    currentUser?.role === "principal";

  const [dialogOpen, setDialogOpen] = useState(false);

  // Auto-open modal if ?new=true
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setDialogOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "All",
    category: "All",
    priority: "All",
    search: "",
    scope: "my",
  });

  const { stats, isLoading: isStatsLoading } = useSupportStats();
  const { categories = [] } = useSupportCategories();

  const {
    tickets,
    total,
    pageCount,
    isLoading: isTicketsLoading,
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
      scope: "my",
    });
  };

  return (
    <div className="campus-tab-page p-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">
              Help & Support
            </h1>
            <span className="text-[11px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">
              Ticket Desk
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Submit inquiry tickets, track issues, and collaborate with administration.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-3 text-xs font-semibold border-zinc-200 gap-1.5"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            onClick={() => setDialogOpen(true)}
            className="h-9 px-4 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Support Ticket</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <SupportKpiCards stats={stats} isAdmin={isAdmin} />

      {/* 3. Filters Toolbar */}
      <TicketFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        categories={categories}
      />

      {/* 4. Tickets Table or Empty State */}
      {!isTicketsLoading && tickets.length === 0 ? (
        <EmptyTicketsState
          onNewTicket={() => setDialogOpen(true)}
          isFiltered={
            Boolean(filters.search) ||
            filters.status !== "All" ||
            filters.category !== "All" ||
            filters.priority !== "All"
          }
        />
      ) : (
        <>
          <TicketListTable
            tickets={tickets}
            isLoading={isTicketsLoading}
            showCreator={isAdmin}
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
