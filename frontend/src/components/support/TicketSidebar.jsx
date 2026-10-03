import React from "react";
import { format } from "date-fns";
import {
  Clock,
  AlertTriangle,
  ArrowUpCircle,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import Spinner from "@/components/ui/spinner";

export const TicketSidebar = ({
  ticket = {},
  onOpenAssign,
  onOpenEscalate,
  onOpenClose,
  onChangeStatus,
  isUpdatingStatus = false,
}) => {
  const isClosed = ticket.status === "Closed" || ticket.status === "Cancelled";
  const escalationLevel = ticket.escalationLevel || 1;

  return (
    <div className="ticket-sidebar-content">
      {/* SLA Timer Card */}
      <Card className="ticket-sidebar-card ticket-sidebar-card--sla">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>SLA Target</span>
            </span>
            <TicketPriorityBadge priority={ticket.priority} showSla={true} />
          </div>

          <div className="pt-1">
            {ticket.isOverdue ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Overdue SLA Target</span>
              </div>
            ) : isClosed ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Resolved & Closed</span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
                <span>Time Remaining:</span>
                <span className="font-bold">
                  {ticket.slaRemainingHours
                    ? `${Math.round(ticket.slaRemainingHours)} hours`
                    : "Within SLA"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Controls & Metadata Card */}
      <Card className="ticket-sidebar-card ticket-sidebar-card--controls">
        <CardContent className="p-4 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ticket Controls
          </h4>

          {/* Status Changer */}
          <div className="space-y-1.5">
            <label htmlFor="ticket-status" className="text-xs font-medium text-foreground">
              Status
            </label>
            <div className="ticket-sidebar-status-control">
              <Select
                value={ticket.status || "Open"}
                disabled={isUpdatingStatus || isClosed}
                onValueChange={(status) => onChangeStatus && onChangeStatus(status)}
              >
                <SelectTrigger id="ticket-status" className="ticket-sidebar-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start" className="ticket-sidebar-status-options">
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {isUpdatingStatus && (
                <div className="ticket-sidebar-status-spinner" aria-label="Updating status">
                  <Spinner className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>

          {/* Assignee Box & Button */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Assigned Staff
              </label>
              {!isClosed && onOpenAssign && (
                <button
                  type="button"
                  onClick={onOpenAssign}
                  className="ticket-sidebar-change"
                >
                  Change
                </button>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-muted/50 border border-border flex items-center gap-2">
              <div className="ticket-sidebar-assignee-avatar" aria-hidden="true">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {ticket.assignedToSnapshot?.name || "Unassigned"}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {(ticket.assignedToSnapshot?.role || "Support Staff").replaceAll("_", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Escalate and Close */}
          {!isClosed && (
            <div className="pt-2 flex flex-col gap-2">
              {escalationLevel < 3 && onOpenEscalate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenEscalate}
                  className="w-full justify-center gap-1.5 h-9 rounded-xl text-xs font-medium border-amber-500/30 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>
                    Escalate (Level {escalationLevel} → {escalationLevel + 1})
                  </span>
                </Button>
              )}

              {onOpenClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenClose}
                  className="w-full justify-center gap-1.5 h-9 rounded-xl text-xs font-medium border-rose-500/30 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Close Ticket</span>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Creator Info Card */}
      <Card className="ticket-sidebar-card ticket-sidebar-card--requester">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Requester Details
          </h4>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {ticket.createdBySnapshot?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {ticket.createdBySnapshot?.name || "User"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {ticket.createdBySnapshot?.email || "No email"}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                Role: {ticket.createdBySnapshot?.role || "student"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <Card className="ticket-sidebar-card ticket-sidebar-card--timeline">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Timeline
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Created:</span>
              <span className="font-medium text-foreground">
                {ticket.createdAt
                  ? format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>First Response:</span>
              <span className="font-medium text-foreground">
                {ticket.firstResponseAt
                  ? format(new Date(ticket.firstResponseAt), "MMM d, h:mm a")
                  : "Pending"}
              </span>
            </div>
            {ticket.resolvedAt && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Resolved:</span>
                <span className="font-medium text-foreground">
                  {format(new Date(ticket.resolvedAt), "MMM d, h:mm a")}
                </span>
              </div>
            )}
            {ticket.closedAt && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Closed:</span>
                <span className="font-medium text-foreground">
                  {format(new Date(ticket.closedAt), "MMM d, h:mm a")}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketSidebar;
