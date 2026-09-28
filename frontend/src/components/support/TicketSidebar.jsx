import React from "react";
import {
  User,
  Shield,
  Clock,
  ArrowUpCircle,
  CheckCircle2,
  Lock,
  Star,
  UserCheck,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketPriorityBadge from "./TicketPriorityBadge";
import TicketCategoryBadge from "./TicketCategoryBadge";

export default function TicketSidebar({
  ticket,
  currentUser,
  isAdmin = false,
  isCreator = false,
  onStatusChange,
  onOpenAssign,
  onOpenEscalate,
  onOpenClose,
  onOpenRating,
}) {
  if (!ticket) return null;

  const creatorName = ticket.createdBySnapshot?.name || ticket.createdBy?.name || "User";
  const creatorEmail = ticket.createdBySnapshot?.email || ticket.createdBy?.email || "";
  const creatorRole = ticket.createdBySnapshot?.role || ticket.createdBy?.role || "Student";

  const assigneeName = ticket.assignedToSnapshot?.name || ticket.assignedTo?.name || "Unassigned";
  const assigneeRole = ticket.assignedToSnapshot?.role || ticket.assignedTo?.role || "";

  const isClosed = ticket.status === "Closed" || ticket.status === "Cancelled";
  const canEscalate = isAdmin && (ticket.escalationLevel || 1) < 3 && !isClosed;
  const canClose = (isCreator || isAdmin) && !isClosed;
  const canRate = isCreator && isClosed && !ticket.satisfactionRating;

  return (
    <div className="space-y-4">
      {/* 1. Quick Actions Panel (If Admin / Creator) */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Ticket Management
        </h3>

        {/* Status Dropdown (Admin) */}
        {isAdmin ? (
          <div>
            <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
              Change Status
            </label>
            <Select value={ticket.status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-8 text-xs bg-zinc-50 border-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Escalated">Escalated</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-zinc-500">Current Status:</span>
            <TicketStatusBadge status={ticket.status} />
          </div>
        )}

        {/* Admin Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          {isAdmin && !isClosed && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAssign}
              className="w-full h-8 text-xs font-semibold border-zinc-200 hover:bg-zinc-50 justify-start gap-2"
            >
              <UserCheck className="w-3.5 h-3.5 text-zinc-600" />
              <span>Assign to Staff Member</span>
            </Button>
          )}

          {canEscalate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenEscalate}
              className="w-full h-8 text-xs font-semibold text-purple-700 bg-purple-50/50 border-purple-200 hover:bg-purple-100 justify-start gap-2"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Escalate Ticket (Level {(ticket.escalationLevel || 1) + 1})</span>
            </Button>
          )}

          {canClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenClose}
              className="w-full h-8 text-xs font-semibold text-zinc-700 border-zinc-200 hover:bg-zinc-100 justify-start gap-2"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Mark as Closed</span>
            </Button>
          )}

          {canRate && (
            <Button
              size="sm"
              onClick={onOpenRating}
              className="w-full h-8 text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 justify-start gap-2"
            >
              <Star className="w-3.5 h-3.5" />
              <span>Rate Satisfaction & Feedback</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Key Attributes Card */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-2xs divide-y divide-zinc-100 text-xs">
        {/* Creator */}
        <div className="pb-3">
          <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Created By</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-[10px] text-zinc-700">
              {creatorName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-zinc-900 leading-tight">{creatorName}</p>
              <p className="text-[10px] text-zinc-400 capitalize">{creatorRole.replace(/_/g, " ")}</p>
            </div>
          </div>
        </div>

        {/* Assignee */}
        <div className="py-3">
          <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Assigned To</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px]">
              {assigneeName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-zinc-900 leading-tight">{assigneeName}</p>
              {assigneeRole && (
                <p className="text-[10px] text-zinc-400 capitalize">{assigneeRole.replace(/_/g, " ")}</p>
              )}
            </div>
          </div>
        </div>

        {/* Category & Priority */}
        <div className="py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Category</span>
            <TicketCategoryBadge category={ticket.category} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Priority</span>
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Escalation Level</span>
            <span className="font-semibold text-zinc-900">Level {ticket.escalationLevel || 1}</span>
          </div>
        </div>

        {/* Satisfaction Rating (if submitted) */}
        {ticket.satisfactionRating && (
          <div className="py-3 bg-amber-50/50 -mx-4 px-4 rounded-lg my-1">
            <span className="text-[11px] font-semibold text-amber-800 block mb-1">User Satisfaction</span>
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < ticket.satisfactionRating ? "fill-amber-400 text-amber-400" : "text-zinc-300"
                  }`}
                />
              ))}
              <span className="text-xs text-zinc-700 ml-1">({ticket.satisfactionRating}/5)</span>
            </div>
            {ticket.satisfactionComment && (
              <p className="text-[11px] text-zinc-600 mt-1 italic">
                "{ticket.satisfactionComment}"
              </p>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="pt-3 space-y-1.5 text-[11px] text-zinc-500">
          <div className="flex items-center justify-between">
            <span>Opened:</span>
            <span className="font-medium text-zinc-800">
              {new Date(ticket.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          {ticket.firstResponseAt && (
            <div className="flex items-center justify-between">
              <span>First Response:</span>
              <span className="font-medium text-zinc-800">
                {new Date(ticket.firstResponseAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
          {ticket.resolvedAt && (
            <div className="flex items-center justify-between">
              <span>Resolved:</span>
              <span className="font-medium text-zinc-800">
                {new Date(ticket.resolvedAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
          {ticket.closedAt && (
            <div className="flex items-center justify-between">
              <span>Closed:</span>
              <span className="font-medium text-zinc-800">
                {new Date(ticket.closedAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
