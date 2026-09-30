import React from "react";
import { MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EmptyConversationsState = ({ onNewConversation, isAdmin = false }) => {
  return (
    <div className="isu-empty">
      <div className="isu-empty-icon" aria-hidden="true">
        <MessageCircle className="w-6 h-6" />
      </div>
      <h3>
        {isAdmin ? "No support tickets found" : "No conversations yet"}
      </h3>
      <p>
        {isAdmin
          ? "There are currently no tickets matching your search or filters."
          : "Have a question or need help with classes, fees, or your account? Tap below to ask."}
      </p>
      {onNewConversation && (
        <Button
          type="button"
          onClick={onNewConversation}
          className="isu-empty-btn"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{isAdmin ? "Create Ticket" : "Ask for Help"}</span>
        </Button>
      )}
    </div>
  );
};

export default EmptyConversationsState;
