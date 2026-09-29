import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import Spinner from "@/components/ui/spinner";
import {
  useSupportTicket,
  useReplyToTicket,
  useAssignTicket,
  useChangeTicketStatus,
  useEscalateTicket,
  useCloseTicket,
  useRateTicket,
} from "@/hooks/useSupportTickets";

import TicketDetailHeader from "@/components/support/TicketDetailHeader";
import MessageThread from "@/components/support/MessageThread";
import ReplyBox from "@/components/support/ReplyBox";
import TicketSidebar from "@/components/support/TicketSidebar";
import EscalateDialog from "@/components/support/EscalateDialog";
import AssignDialog from "@/components/support/AssignDialog";
import CloseTicketDialog from "@/components/support/CloseTicketDialog";
import RatingDialog from "@/components/support/RatingDialog";

export const SupportTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const currentUser = auth?.user;
  const currentUserId = currentUser?._id;
  const role = currentUser?.role || "student";
  const isAdmin = ["super_admin", "institute_admin", "campus_admin"].includes(role);

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // Queries and mutations
  const { data, isLoading, error } = useSupportTicket(id);
  const replyMutation = useReplyToTicket();
  const assignMutation = useAssignTicket();
  const changeStatusMutation = useChangeTicketStatus();
  const escalateMutation = useEscalateTicket();
  const closeMutation = useCloseTicket();
  const rateMutation = useRateTicket();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8 text-primary" />
        <p className="text-xs text-muted-foreground mt-3">Loading conversation...</p>
      </div>
    );
  }

  if (error || !data?.ticket) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Conversation Not Found</h2>
        <p className="text-sm text-muted-foreground">
          {error?.response?.data?.message || "This conversation may have been removed or you lack permission to view it."}
        </p>
        <button
          onClick={() => navigate("/support")}
          className="text-xs text-primary font-semibold hover:underline"
        >
          ← Back to Help & Support
        </button>
      </div>
    );
  }

  const { ticket, messages = [] } = data;
  const isCreator = String(ticket.createdBy?._id || ticket.createdBy) === String(currentUserId);
  const isClosed = ticket.status === "Closed" || ticket.status === "Cancelled";
  const canSolve = isCreator && !isClosed && (ticket.status === "Resolved" || ticket.status === "In Progress");
  const canRate = isCreator && isClosed && (ticket.satisfactionRating === null || ticket.satisfactionRating === undefined);

  const handleSendReply = async (payload) => {
    await replyMutation.mutateAsync({ ticketId: ticket._id, payload });
  };

  const handleCloseTicket = async () => {
    await closeMutation.mutateAsync(ticket._id);
    if (isCreator) {
      setIsRatingOpen(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Header */}
      <TicketDetailHeader ticket={ticket} isAdmin={isAdmin} />

      {/* Main Content Layout (1 column for regular users, 2 columns for admins) */}
      <div className={`grid grid-cols-1 ${isAdmin ? "lg:grid-cols-3 gap-6" : "gap-4"}`}>
        {/* Left / Main Chat Box */}
        <div className={`${isAdmin ? "lg:col-span-2" : "w-full"} flex flex-col h-[74vh] sm:h-[78vh] rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden`}>
          {/* Thread */}
          <MessageThread
            messages={messages}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />

          {/* Rating Banner for closed tickets that haven't been rated */}
          {canRate && (
            <div className="p-3 bg-amber-500/10 border-t border-b border-amber-500/20 flex items-center justify-between text-xs">
              <span className="font-medium text-amber-800 dark:text-amber-200">
                ⭐ How was your support experience?
              </span>
              <button
                type="button"
                onClick={() => setIsRatingOpen(true)}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors"
              >
                Rate Conversation
              </button>
            </div>
          )}

          {/* Reply Box */}
          <ReplyBox
            onSend={handleSendReply}
            isSending={replyMutation.isPending}
            isClosed={isClosed}
            isAdmin={isAdmin}
            canSolve={canSolve}
            onSolve={() => setIsCloseOpen(true)}
            isSolving={closeMutation.isPending}
          />
        </div>

        {/* Right Sidebar (Admin Only) */}
        {isAdmin && (
          <div className="lg:col-span-1">
            <TicketSidebar
              ticket={ticket}
              onOpenAssign={() => setIsAssignOpen(true)}
              onOpenEscalate={() => setIsEscalateOpen(true)}
              onOpenClose={() => setIsCloseOpen(true)}
              onChangeStatus={(status) =>
                changeStatusMutation.mutateAsync({ ticketId: ticket._id, status })
              }
              isUpdatingStatus={changeStatusMutation.isPending}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      {isAdmin && (
        <>
          <AssignDialog
            open={isAssignOpen}
            onOpenChange={setIsAssignOpen}
            ticket={ticket}
            onConfirm={(params) => assignMutation.mutateAsync(params)}
            isPending={assignMutation.isPending}
          />

          <EscalateDialog
            open={isEscalateOpen}
            onOpenChange={setIsEscalateOpen}
            ticket={ticket}
            onConfirm={(params) => escalateMutation.mutateAsync(params)}
            isPending={escalateMutation.isPending}
          />
        </>
      )}

      <CloseTicketDialog
        open={isCloseOpen}
        onOpenChange={setIsCloseOpen}
        ticket={ticket}
        onConfirm={handleCloseTicket}
        isPending={closeMutation.isPending}
        isAdmin={isAdmin}
      />

      <RatingDialog
        open={isRatingOpen}
        onOpenChange={setIsRatingOpen}
        ticket={ticket}
        onConfirm={(params) => rateMutation.mutateAsync(params)}
        isPending={rateMutation.isPending}
      />
    </div>
  );
};

export default SupportTicketDetail;
