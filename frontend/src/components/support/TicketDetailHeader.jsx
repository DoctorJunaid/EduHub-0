import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketCategoryBadge, CATEGORY_ICONS } from "./TicketCategoryBadge";

export const TicketDetailHeader = ({ ticket = {}, isAdmin = false }) => {
  const navigate = useNavigate();
  const catInfo = CATEGORY_ICONS[ticket.category] || { icon: "💬", label: ticket.category || "Support" };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/support")}
          className="rounded-xl h-9 w-9 shrink-0 hover:bg-muted"
          title="Back to Help & Support"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-muted/70 flex items-center justify-center text-lg shrink-0">
            {catInfo.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                {ticket.subject}
              </h2>
              {isAdmin && ticket.ticketNumber && (
                <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                  {ticket.ticketNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? `Created by ${ticket.createdBySnapshot?.name || "User"} (${ticket.createdBySnapshot?.role || "student"})`
                : `Category: ${catInfo.label}`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto pl-12 sm:pl-0">
        {isAdmin && <TicketPriorityBadge priority={ticket.priority} showSla={true} />}
        <TicketStatusBadge status={ticket.status} isAdmin={isAdmin} />
      </div>
    </div>
  );
};

export default TicketDetailHeader;
