import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Headset,
  X,
  Plus,
  ChevronRight,
  MessageCircle,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { useSupportTickets, useCreateTicket } from "@/hooks/useSupportTickets";
import { useSupportStats } from "@/hooks/useSupportStats";
import { getCategoryIcon } from "./supportCategories";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { NewTicketDialog } from "./NewTicketDialog";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import { getSupportBasePath, getSupportTicketPath } from "@/utils/supportRouting";
import "./FloatingHelpWidget.css";

export const FloatingHelpWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector(selectAuth);

  const currentUser = auth?.user;
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/set-password" ||
    location.pathname === "/";

  const shouldFetch = Boolean(currentUser && !isAuthPage);

  const { data: ticketsData } = useSupportTickets(
    { limit: 3, page: 1 },
    { enabled: shouldFetch && isOpen }
  );

  const { stats } = useSupportStats({
    enabled: shouldFetch,
  });

  const createTicketMutation = useCreateTicket();

  if (isAuthPage || !currentUser) {
    return null;
  }

  const openCount = stats?.badgeCount || 0;
  const recentConversations = ticketsData?.tickets || [];
  const isAdmin = ["super_admin", "institute_admin", "campus_admin"].includes(
    currentUser?.role
  );

  const handleOpenConversation = (id) => {
    setIsOpen(false);
    navigate(getSupportTicketPath(currentUser?.role, id));
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate(getSupportBasePath(currentUser?.role));
  };

  return (
    <>
      <aside
        aria-label="Help and Support Assistant"
        className="fhw-container"
      >
        {/* Expanded Floating Popover Card */}
        {isOpen && (
          <div className="fhw-panel">
            {/* Header with generous padding */}
            <div className="fhw-header">
              <div className="fhw-header-left">
                <div className="fhw-header-icon" aria-hidden="true">
                  <Headset className="w-5 h-5" />
                </div>
                <div className="fhw-header-titles">
                  <h4 className="fhw-header-title">Help & Support</h4>
                  <p className="fhw-header-subtitle">
                    We're here to help with any question
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="fhw-close-btn"
                aria-label="Close help panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body with clean vertical rhythm */}
            <div className="fhw-body">
              {/* Primary Call to Action Button */}
              <button
                type="button"
                onClick={() => setIsNewDialogOpen(true)}
                className="fhw-cta-btn"
              >
                <Plus className="w-4 h-4" />
                <span>{isAdmin ? "Create New Ticket" : "Ask for Help"}</span>
              </button>

              {/* Recent Conversations Section */}
              <div className="fhw-section-header">
                <span className="fhw-section-title">
                  {isAdmin ? "Recent Tickets" : "Recent Conversations"}
                </span>
                {recentConversations.length > 0 && (
                  <button
                    type="button"
                    onClick={handleViewAll}
                    className="fhw-view-all-btn"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {recentConversations.length === 0 ? (
                <div className="fhw-empty-card">
                  <div className="fhw-empty-icon-wrap" aria-hidden="true">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <p className="fhw-empty-title">No active conversations</p>
                  <p className="fhw-empty-desc">
                    Have a question about homework, fees, or your account? Tap above to ask!
                  </p>
                </div>
              ) : (
                <div className="fhw-ticket-list">
                  {recentConversations.map((c) => {
                    const CatIcon = getCategoryIcon(c.category);
                    return (
                      <div
                        key={c._id}
                        onClick={() => handleOpenConversation(c._id)}
                        className="fhw-ticket-item"
                      >
                        <div className="fhw-ticket-info">
                          <div className="fhw-ticket-cat-icon">
                            <CatIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="fhw-ticket-texts">
                            <p className="fhw-ticket-subject">{c.subject}</p>
                            <p className="fhw-ticket-desc">{c.description}</p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <TicketStatusBadge status={c.status} isAdmin={isAdmin} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with clean spacing */}
            <div className="fhw-footer">
              <span className="fhw-footer-left">
                <HelpCircle className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>EduHub Support Desk</span>
              </span>
              <button
                type="button"
                onClick={handleViewAll}
                className="fhw-footer-link"
              >
                <span>Open Full Help Center</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Trigger Circle Button (Shown when popover is closed) */}
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="fhw-trigger-btn"
            aria-label="Open Help & Support Assistant"
            title="Need Help?"
          >
            <Headset className="w-5 h-5" />
            {openCount > 0 && (
              <span className="fhw-badge">
                {openCount}
              </span>
            )}
          </button>
        )}
      </aside>

      {/* New Ticket / Ask for Help Dialog */}
      <NewTicketDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onCreate={(payload) => createTicketMutation.mutateAsync(payload)}
        isPending={createTicketMutation.isPending}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default FloatingHelpWidget;
