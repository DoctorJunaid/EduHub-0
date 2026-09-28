import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { useSupportTicketDetail, useSupportTickets } from "@/hooks/useSupportTickets";
import TicketDetailHeader from "@/components/support/TicketDetailHeader";
import TicketMessageThread from "@/components/support/TicketMessageThread";
import TicketReplyBox from "@/components/support/TicketReplyBox";
import TicketSidebar from "@/components/support/TicketSidebar";
import AssignDialog from "@/components/support/AssignDialog";
import EscalateDialog from "@/components/support/EscalateDialog";
import CloseTicketDialog from "@/components/support/CloseTicketDialog";
import RatingDialog from "@/components/support/RatingDialog";
import { PageLoader } from "@/components/ui/spinner";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SupportTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const isAdmin =
    currentUser?.role === "campus_admin" ||
    currentUser?.role === "campus_manager" ||
    currentUser?.role === "institute_admin" ||
    currentUser?.role === "super_admin" ||
    currentUser?.role === "principal";

  const {
    ticket,
    messages,
    isLoading,
    isError,
    error,
    replyTicket,
    isReplying,
  } = useSupportTicketDetail(id);

  const {
    assignTicket,
    isAssigning,
    changeStatus,
    escalateTicket,
    isEscalating,
    closeTicket,
    isClosing,
    rateTicket,
    isRating,
  } = useSupportTickets();

  // Modal dialog states
  const [assignOpen, setAssignOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="campus-tab-page p-8">
        <PageLoader text="Loading support ticket thread..." />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="campus-tab-page flex flex-col items-center justify-center p-12 text-center bg-white min-h-[400px]">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-zinc-900 mb-1">
          Support Ticket Not Found
        </h2>
        <p className="text-xs text-zinc-500 max-w-sm mb-4">
          {error?.response?.data?.message || "This ticket could not be found or you do not have permission to access it."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/support")}
          className="text-xs gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Tickets</span>
        </Button>
      </div>
    );
  }

  const isCreator = String(ticket.createdBy?._id || ticket.createdBy) === String(currentUser?._id);
  const isClosed = ticket.status === "Closed" || ticket.status === "Cancelled";

  return (
    <div className="campus-tab-page p-6 max-w-7xl mx-auto">
      {/* 1. Header with Breadcrumb & Badges */}
      <TicketDetailHeader ticket={ticket} />

      {/* 2. Split 2-Column Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Messages Thread & Reply Box */}
        <div className="lg:col-span-8 space-y-4">
          <TicketMessageThread ticket={ticket} messages={messages} />

          <TicketReplyBox
            onSend={replyTicket}
            isSubmitting={isReplying}
            isAdmin={isAdmin}
            isClosed={isClosed}
          />
        </div>

        {/* Right Column: Ticket Details & Metadata Sidebar */}
        <div className="lg:col-span-4">
          <TicketSidebar
            ticket={ticket}
            currentUser={currentUser}
            isAdmin={isAdmin}
            isCreator={isCreator}
            onStatusChange={(newStatus) => changeStatus({ ticketId: ticket._id, status: newStatus })}
            onOpenAssign={() => setAssignOpen(true)}
            onOpenEscalate={() => setEscalateOpen(true)}
            onOpenClose={() => setCloseOpen(true)}
            onOpenRating={() => setRatingOpen(true)}
          />
        </div>
      </div>

      {/* 3. Interactive Modals */}
      <AssignDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssign={(assigneeId) => assignTicket({ ticketId: ticket._id, assigneeId })}
        ticket={ticket}
        isAssigning={isAssigning}
      />

      <EscalateDialog
        open={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        onEscalate={(reason) => escalateTicket({ ticketId: ticket._id, reason })}
        ticket={ticket}
        isEscalating={isEscalating}
      />

      <CloseTicketDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        onConfirmClose={() => closeTicket(ticket._id)}
        ticket={ticket}
        isClosing={isClosing}
      />

      <RatingDialog
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        onSubmitRating={(rating, comment) => rateTicket({ ticketId: ticket._id, rating, comment })}
        ticket={ticket}
        isRating={isRating}
      />
    </div>
  );
}
