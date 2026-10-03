import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
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

function TicketDetailLoadingShell({ role, isAdmin }) {
  return (
    <section
      className={`support-ticket-detail support-ticket-detail--${role} support-ticket-detail--loading`}
      aria-busy="true"
      role="status"
      aria-label="Loading support conversation"
    >
      <header className="ticket-detail-header ticket-detail-header--loading" aria-hidden="true">
        <div className="ticket-detail-header__main">
          <span className="ticket-detail-skeleton ticket-detail-skeleton--back" />
          <div className="ticket-detail-header__copy">
            <span className="ticket-detail-skeleton ticket-detail-skeleton--title" />
            <span className="ticket-detail-skeleton ticket-detail-skeleton--meta" />
          </div>
        </div>
        <div className="ticket-detail-header__badges">
          {isAdmin && <span className="ticket-detail-skeleton ticket-detail-skeleton--badge" />}
          <span className="ticket-detail-skeleton ticket-detail-skeleton--badge" />
        </div>
      </header>

      <div className={`support-ticket-workspace${isAdmin ? " support-ticket-workspace--admin" : ""}`}>
        <main className="support-ticket-conversation">
          <div className="ticket-message-thread ticket-message-thread--loading" aria-hidden="true">
            <span className="ticket-detail-skeleton ticket-detail-skeleton--message ticket-detail-skeleton--message-own" />
            <span className="ticket-detail-skeleton ticket-detail-skeleton--message ticket-detail-skeleton--message-other" />
            <span className="ticket-detail-skeleton ticket-detail-skeleton--message ticket-detail-skeleton--message-own-short" />
          </div>
          <div className="ticket-reply-box ticket-reply-box--loading" aria-hidden="true">
            <span className="ticket-detail-skeleton ticket-detail-skeleton--reply-label" />
            <div className="ticket-detail-skeleton-reply-row">
              <span className="ticket-detail-skeleton ticket-detail-skeleton--attachment" />
              <span className="ticket-detail-skeleton ticket-detail-skeleton--reply-input" />
              <span className="ticket-detail-skeleton ticket-detail-skeleton--send" />
            </div>
            <span className="ticket-detail-skeleton ticket-detail-skeleton--reply-hint" />
          </div>
        </main>

        {isAdmin && (
          <aside className="support-ticket-sidebar" aria-hidden="true">
            <div className="ticket-sidebar-content ticket-sidebar-content--loading">
              <div className="ticket-sidebar-card ticket-sidebar-card--sla ticket-sidebar-skeleton-card">
                <span className="ticket-detail-skeleton ticket-sidebar-skeleton-title" />
                <span className="ticket-detail-skeleton ticket-sidebar-skeleton-line" />
              </div>
              <div className="ticket-sidebar-card ticket-sidebar-card--controls ticket-sidebar-skeleton-card">
                <span className="ticket-detail-skeleton ticket-sidebar-skeleton-title" />
                <span className="ticket-detail-skeleton ticket-sidebar-skeleton-line" />
                <span className="ticket-detail-skeleton ticket-sidebar-skeleton-line" />
                <span className="ticket-detail-skeleton ticket-sidebar-skeleton-action" />
                <span className="ticket-detail-skeleton ticket-sidebar-skeleton-action" />
              </div>
              <div className="ticket-sidebar-card ticket-sidebar-card--requester ticket-sidebar-skeleton-card">
                <span className="ticket-detail-skeleton ticket-sidebar-skeleton-title" />
                <span className="ticket-detail-skeleton ticket-sidebar-skeleton-line" />
              </div>
              <div className="ticket-sidebar-card ticket-sidebar-card--timeline ticket-sidebar-skeleton-card">
                <span className="ticket-detail-skeleton ticket-sidebar-skeleton-title" />
                <span className="ticket-detail-skeleton ticket-sidebar-skeleton-line" />
              </div>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}

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
    return <TicketDetailLoadingShell role={role} isAdmin={isAdmin} />;
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
