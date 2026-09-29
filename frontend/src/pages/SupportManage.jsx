import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import {
  ArrowLeft,
  Plus,
  SlidersHorizontal,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";
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
import { useSupportContacts } from "@/hooks/useSupportContacts";

import TicketListTable from "@/components/support/TicketListTable";
import TicketFilters from "@/components/support/TicketFilters";
import NewTicketDialog from "@/components/support/NewTicketDialog";
import AssignDialog from "@/components/support/AssignDialog";

export const SupportManage = () => {
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const currentUser = auth?.user;
  const role = currentUser?.role || "student";
  const isAdmin = ["super_admin", "institute_admin", "campus_admin"].includes(role);

  // If not admin, redirect to regular support
  if (!isAdmin) {
    navigate("/support");
    return null;
  }

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

  const { stats = {} } = useSupportStats();
  const { categories = [] } = useSupportCategories();
  const { contacts = [] } = useSupportContacts();

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

  const { data, isLoading } = useSupportTickets(queryParams);
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
    } catch (err) {
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
    } catch (err) {
      toast.error("Failed to assign tickets");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/support")}
            className="rounded-xl h-9 w-9"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Support Management Console
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Comprehensive SLA analytics, triage, bulk actions, and ticket assignment.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsNewDialogOpen(true)}
          className="gap-2 rounded-xl text-xs sm:text-sm font-semibold h-10 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </Button>
      </div>

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">SLA Breach / Overdue</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {stats.overdue ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground">Tickets requiring urgent attention</p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Avg First Response</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.avgFirstResponseHours ? `${stats.avgFirstResponseHours}h` : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">Average staff response time</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.avgResolutionHours ? `${stats.avgResolutionHours}h` : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">From open to marked resolved</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <TicketFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        categories={categories}
        isAdmin={true}
      />

      {/* Bulk Action Bar if items are selected */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-primary">
            {selectedIds.length} {selectedIds.length === 1 ? "ticket" : "tickets"} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBulkAssignOpen(true)}
              className="rounded-xl text-xs h-8 gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign Selected</span>
            </Button>
            <Button
              size="sm"
              onClick={handleBulkClose}
              className="rounded-xl text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Close Selected</span>
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner className="w-8 h-8 text-primary" />
            <p className="text-xs text-muted-foreground mt-3">Loading tickets...</p>
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
    </div>
  );
};

export default SupportManage;
