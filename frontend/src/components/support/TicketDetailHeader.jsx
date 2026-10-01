import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { getSupportBasePath } from "@/utils/supportRouting";

export const TicketDetailHeader = ({ ticket = {}, isAdmin = false }) => {
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const role = auth?.user?.role;
  const category = ticket.category || "Support";

  const handleBack = () => {
    navigate(getSupportBasePath(role));
  };

  return (
    <header className="ticket-detail-header">
      <div className="ticket-detail-header__main">
        <Button
          variant="outline"
          size="icon"
          onClick={handleBack}
          className="ticket-detail-header__back"
          aria-label="Back to Help & Support"
          title="Back to Help & Support"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="ticket-detail-header__copy">
          <h1 className="ticket-detail-header__title">
            {ticket.subject || "Conversation"}
          </h1>
          <p className="ticket-detail-header__meta">
            {isAdmin
              ? `Category: ${category} • Created by ${ticket.createdBySnapshot?.name || "User"} (${ticket.createdBySnapshot?.role || "student"})`
              : `Category: ${category}`}
          </p>
        </div>
      </div>

      <div className="ticket-detail-header__badges">
        {isAdmin && ticket.priority && (
          <TicketPriorityBadge priority={ticket.priority} showSla={true} />
        )}
        <TicketStatusBadge status={ticket.status} isAdmin={isAdmin} />
      </div>
    </header>
  );
};

export default TicketDetailHeader;
