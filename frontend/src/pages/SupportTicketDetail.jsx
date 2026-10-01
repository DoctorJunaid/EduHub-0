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
import { getSupportBasePath } from "@/utils/supportRouting";
import "./SupportTicketDetail.css";

export const SupportTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const currentUser = auth?.user;
  const currentUserId = currentUser?._id || currentUser?.id;
  const role = currentUser?.role || "student";
  const isAdmin = ["super_admin", "institute_admin", "campus_admin"].includes(
    role,
  );

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <Spinner className="w-8 h-8 text-primary" />
        <p className="text-xs text-muted-foreground mt-3">
          Loading conversation...
        </p>
      </div>
    );
  }

  if (error || !data?.ticket) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">
          Conversation Not Found
        </h2>
        <p className="text-sm text-muted-foreground">
          {error?.response?.data?.message ||
            "This conversation may have been removed or you lack permission to view it."}
        </p>
        <button
          onClick={() => navigate(getSupportBasePath(role))}
          className="text-xs text-primary font-semibold hover:underline"
        >
          ← Back to Help & Support
        </button>
      </div>
    );
  }

  const { ticket, messages = [] } = data;
  const isCreator =
    String(ticket.createdBy?._id || ticket.createdBy) === String(currentUserId);
  const isClosed = ticket.status === "Closed" || ticket.status === "Cancelled";
  const canSolve =
    isCreator &&
    !isClosed &&
    (ticket.status === "Resolved" || ticket.status === "In Progress");
  const canRate =
    isCreator &&
    isClosed &&
    (ticket.satisfactionRating === null ||
      ticket.satisfactionRating === undefined);

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
    <section className={`support-ticket-detail support-ticket-detail--${role}`}>
      {/* 1. Header (Sticky at top, px-6 py-4, with status badge) */}
      <TicketDetailHeader ticket={ticket} isAdmin={isAdmin} />

      {/* 2. Main Content Body */}
      <div
        className={`support-ticket-workspace${isAdmin ? " support-ticket-workspace--admin" : ""}`}
      >
        {/* Chat thread + Reply box column */}
        <main className="support-ticket-conversation">
          {/* Rating prompt banner for closed tickets */}
          {canRate && (
            <div className="support-ticket-rating-prompt">
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

          {/* Message Thread (Fills space, scrollable, px-6 py-6) */}
          <MessageThread
            messages={messages}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />

          {/* Reply Box (Pinned to bottom, px-6 py-4, border-t) */}
          <ReplyBox
            onSend={handleSendReply}
            isSending={replyMutation.isPending}
            isClosed={isClosed}
            isAdmin={isAdmin}
            canSolve={canSolve}
            onSolve={() => setIsCloseOpen(true)}
            isSolving={closeMutation.isPending}
          />
        </main>

        {/* Right Sidebar for Admins only */}
        {isAdmin && (
          <aside
            className="support-ticket-sidebar"
            aria-label="Ticket details and controls"
          >
            <TicketSidebar
              ticket={ticket}
              onOpenAssign={() => setIsAssignOpen(true)}
              onOpenEscalate={() => setIsEscalateOpen(true)}
              onOpenClose={() => setIsCloseOpen(true)}
              onChangeStatus={(status) =>
                changeStatusMutation.mutateAsync({
                  ticketId: ticket._id,
                  status,
                })
              }
              isUpdatingStatus={changeStatusMutation.isPending}
            />
          </aside>
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
    </section>
  );
};

export default SupportTicketDetail;
