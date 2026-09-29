import React from "react";
import { MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EmptyConversationsState = ({ onNewConversation, isAdmin = false }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 my-6">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
        <MessageCircle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {isAdmin ? "No support tickets found" : "No conversations yet"}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {isAdmin
          ? "There are currently no tickets matching your search or filters."
          : "Have a question or need help with classes, fees, or your account? Tap below to ask."}
      </p>
      {onNewConversation && (
        <Button onClick={onNewConversation} className="mt-5 gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          <span>{isAdmin ? "Create Ticket" : "Ask for Help"}</span>
        </Button>
      )}
    </div>
  );
};

export default EmptyConversationsState;
