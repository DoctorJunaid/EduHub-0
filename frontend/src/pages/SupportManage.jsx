import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import {
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DataPagination from "@/components/shared/DataPagination";
import toast from "react-hot-toast";

import {
  useSupportTickets,
  useCreateTicket,
  useAssignTicket,
  useCloseTicket,
} from "@/hooks/useSupportTickets";
import { useSupportStats } from "@/hooks/useSupportStats";
import { useSupportCategories } from "@/hooks/useSupportCategories";

import TicketListTable from "@/components/support/TicketListTable";
import TicketFilters from "@/components/support/TicketFilters";
import NewTicketDialog from "@/components/support/NewTicketDialog";
import AssignDialog from "@/components/support/AssignDialog";
import { getSupportBasePath } from "@/utils/supportRouting";
import "./SupportManage.css";

function SupportTicketTableSkeleton() {
  const columns = ["", "Ticket #", "Subject", "Creator", "Category", "Priority", "Status", "Assigned To", "Last Activity"];

  return (
    <div className="isu-loading-table overflow-x-auto rounded-xl border border-zinc-200 bg-white" role="status" aria-label="Loading support tickets">
      <table className="w-full text-left text-sm border-collapse" aria-hidden="true">
        <thead className="bg-zinc-50 border-b border-zinc-200">
          <tr className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            {columns.map((column, index) => (
              <th className="p-3.5" key={`${column}-${index}`}>
                {column || <span className="isu-skeleton-cell isu-skeleton-checkbox" />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {Array.from({ length: 5 }, (_, row) => (
            <tr key={row}>
              {columns.map((column, index) => (
                <td className="p-3.5" key={`${column}-${index}`}>
                  <span className={`isu-skeleton-cell isu-skeleton-col-${index}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const SupportManage = () => {
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const currentUser = auth?.user;
  const role = currentUser?.role || "student";
  const isAdmin = ["super_admin", "institute_admin", "campus_admin"].includes(role);

  useEffect(() => {
    if (!isAdmin) {
      navigate(getSupportBasePath(role));
    }
  }, [isAdmin, role, navigate]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);

  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    priority: "all",
    assignedTo: "",
    search: "",
    startDate: "",
    endDate: "",
  });

  const { stats, isLoading: statsLoading, error: statsError } = useSupportStats();
  const { categories = [] } = useSupportCategories();

  const queryParams = {
    page,
    limit,
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.category !== "all" ? { category: filters.category } : {}),
    ...(filters.priority !== "all" ? { priority: filters.priority } : {}),
    ...(filters.assignedTo ? { assignedTo: filters.assignedTo } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
  };

  const { data, isLoading, error: ticketsError, refetch: refetchTickets } = useSupportTickets(queryParams);
  const createMutation = useCreateTicket();
  const assignMutation = useAssignTicket();
  const closeMutation = useCloseTicket();

  const tickets = data?.tickets || [];
  const total = data?.total || 0;
  const pageCount = data?.pageCount || 1;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setSelectedIds([]);
  };

  const handleResetFilters = () => {
    setFilters({
      status: "all",
      category: "all",
      priority: "all",
      assignedTo: "",
      search: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
    setSelectedIds([]);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(tickets.map((t) => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkClose = async () => {
    if (!selectedIds.length) return;
    try {
      await Promise.all(selectedIds.map((id) => closeMutation.mutateAsync(id)));
      toast.success(`${selectedIds.length} tickets closed successfully`);
      setSelectedIds([]);
    } catch {
      toast.error("Failed to close some tickets");
    }
  };

  const handleBulkAssign = async ({ assigneeId }) => {
    if (!selectedIds.length || !assigneeId) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          assignMutation.mutateAsync({ ticketId: id, assigneeId })
        )
      );
      toast.success(`${selectedIds.length} tickets assigned`);
      setSelectedIds([]);
      setIsBulkAssignOpen(false);
    } catch {
      toast.error("Failed to assign tickets");
    }
  };

  if (!isAdmin) return null;

  return (
    <section className="institute-support" aria-label="Support Management Console">
      {/* SLA Metric Cards */}
      <div className="isu-stats">
        <div className="isu-stat-card">
          <span className="isu-stat-label">SLA Breach / Overdue</span>
          <div className="isu-stat-row">
            <span className="isu-stat-value red">
              {statsLoading ? <span className="isu-stat-skeleton-value" /> : statsError && !stats ? "—" : stats?.overdue ?? 0}
            </span>
            <div className="isu-stat-icon red" aria-hidden="true">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="isu-stat-sub">Tickets requiring urgent attention</p>
        </div>

        <div className="isu-stat-card">
          <span className="isu-stat-label">Avg First Response</span>
          <div className="isu-stat-row">
            <span className="isu-stat-value blue">
              {statsLoading ? <span className="isu-stat-skeleton-value" /> : statsError && !stats ? "—" : stats?.avgFirstResponseHours ? `${stats.avgFirstResponseHours}h` : "—"}
            </span>
            <div className="isu-stat-icon blue" aria-hidden="true">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="isu-stat-sub">Average staff response time</p>
        </div>

        <div className="isu-stat-card">
          <span className="isu-stat-label">Avg Resolution Time</span>
          <div className="isu-stat-row">
            <span className="isu-stat-value emerald">
              {statsLoading ? <span className="isu-stat-skeleton-value" /> : statsError && !stats ? "—" : stats?.avgResolutionHours ? `${stats.avgResolutionHours}h` : "—"}
            </span>
            <div className="isu-stat-icon emerald" aria-hidden="true">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="isu-stat-sub">From open to marked resolved</p>
        </div>
      </div>

      {/* Bulk Action Bar if items are selected */}
      {selectedIds.length > 0 && (
        <div className="isu-bulk-bar">
          <span className="isu-bulk-text">
            {selectedIds.length} {selectedIds.length === 1 ? "ticket" : "tickets"} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBulkAssignOpen(true)}
              className="rounded-lg text-xs h-8 gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign Selected</span>
            </Button>
            <Button
              size="sm"
              onClick={handleBulkClose}
              className="rounded-lg text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Close Selected</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Container Card: Filter Bar + Table */}
      <div className="isu-panel">
        {/* Filter Bar */}
        <TicketFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          categories={categories}
          isAdmin={true}
          onNewTicket={() => setIsNewDialogOpen(true)}
        />

        {/* Table Content */}
        <div className="isu-panel-body" aria-busy={isLoading}>
          {isLoading ? (
            <SupportTicketTableSkeleton />
          ) : ticketsError && !data ? (
            <div className="isu-ticket-load-error" role="alert">
              <AlertTriangle className="w-7 h-7" aria-hidden="true" />
              <p>Unable to load support tickets.</p>
              <Button size="sm" variant="outline" onClick={() => refetchTickets()}>
                Retry
              </Button>
            </div>
          ) : (
            <TicketListTable
              tickets={tickets}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onNewTicket={() => setIsNewDialogOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className={`isu-pagination-slot${isLoading ? " is-loading" : ""}`} aria-busy={isLoading}>
        {isLoading ? (
          <div className="isu-pagination-skeleton" aria-hidden="true">
            <span className="isu-skeleton-cell" />
            <span className="isu-skeleton-cell" />
          </div>
        ) : total > 0 ? (
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
        ) : null}
      </div>

      {/* New Ticket Dialog */}
      <NewTicketDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onCreate={(payload) => createMutation.mutateAsync(payload)}
        isPending={createMutation.isPending}
        isAdmin={true}
      />

      {/* Bulk Assign Dialog */}
      <AssignDialog
        open={isBulkAssignOpen}
        onOpenChange={setIsBulkAssignOpen}
        ticket={{}}
        onConfirm={handleBulkAssign}
        isPending={assignMutation.isPending}
      />
    </section>
  );
};

export default SupportManage;
