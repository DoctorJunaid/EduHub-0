import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { CATEGORY_ICONS } from "./TicketCategoryBadge";
import { getSupportBasePath } from "@/utils/supportRouting";

export const TicketDetailHeader = ({ ticket = {}, isAdmin = false }) => {
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const role = auth?.user?.role;
  const catInfo = CATEGORY_ICONS[ticket.category] || {
    icon: "💬",
    label: ticket.category || "Support",
  };

  const handleBack = () => {
    navigate(getSupportBasePath(role));
  };

  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur-md z-10 px-6 py-4 border-b border-border flex items-center justify-between gap-4 w-full">
      {/* Left: Back button + Category Icon + Title & Subtitle */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Back button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleBack}
          className="h-10 w-10 rounded-xl border border-border shrink-0 hover:bg-muted"
          title="Back to Help & Support"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Category Icon (40px square, rounded, colored/muted background) */}
        <div className="w-10 h-10 rounded-xl bg-muted border border-border/60 flex items-center justify-center text-xl shrink-0">
          <span>{catInfo.icon}</span>
        </div>

        {/* Title and Category subtitle */}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-foreground truncate max-w-2xl leading-tight">
            {ticket.subject || "Conversation"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {isAdmin
              ? `Category: ${catInfo.label} • Created by ${ticket.createdBySnapshot?.name || "User"} (${ticket.createdBySnapshot?.role || "student"})`
              : `Category: ${catInfo.label}`}
          </p>
        </div>
      </div>

      {/* Right: Badges aligned horizontally in header row */}
      <div className="flex items-center gap-2.5 shrink-0">
        {isAdmin && ticket.priority && (
          <TicketPriorityBadge priority={ticket.priority} showSla={true} />
        )}
        <TicketStatusBadge status={ticket.status} isAdmin={isAdmin} />
      </div>
    </header>
  );
};

export default TicketDetailHeader;
