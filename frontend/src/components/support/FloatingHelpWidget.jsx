import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LifeBuoy,
  X,
  Plus,
  ChevronRight,
  MessageCircle,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupportTickets, useCreateTicket } from "@/hooks/useSupportTickets";
import { useSupportStats } from "@/hooks/useSupportStats";
import { CATEGORY_ICONS } from "./TicketCategoryBadge";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { NewTicketDialog } from "./NewTicketDialog";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import { getSupportBasePath, getSupportTicketPath } from "@/utils/supportRouting";

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
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto"
      >
        {/* Expanded Floating Popover Card */}
        {isOpen && (
          <div className="mb-4 w-[360px] sm:w-[400px] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header with generous padding */}
            <div className="px-6 py-4 border-b border-border/80 bg-muted/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-foreground leading-tight truncate">
                    Help & Support
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    We're here to help with any question
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                aria-label="Close help panel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content Body with generous inner padding */}
            <div className="p-6 space-y-5 max-h-[400px] overflow-y-auto">
              {/* Primary Call to Action Button */}
              <Button
                onClick={() => setIsNewDialogOpen(true)}
                className="w-full justify-center gap-2 rounded-xl h-11 text-sm font-semibold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{isAdmin ? "Create New Ticket" : "Ask for Help"}</span>
              </Button>

              {/* Recent Conversations Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {isAdmin ? "Recent Tickets" : "Recent Conversations"}
                  </span>
                  {recentConversations.length > 0 && (
                    <button
                      type="button"
                      onClick={handleViewAll}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>View all</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {recentConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-muted/30 border border-dashed border-border text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">No active conversations</p>
                    <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed mx-auto">
                      Have a question about homework, fees, or your account? Tap above to ask!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentConversations.map((c) => {
                      const catInfo = CATEGORY_ICONS[c.category] || { icon: "💬" };
                      return (
                        <div
                          key={c._id}
                          onClick={() => handleOpenConversation(c._id)}
                          className="group flex items-center justify-between p-3.5 rounded-xl bg-card hover:bg-muted/50 border border-border hover:border-primary/50 cursor-pointer transition-all shadow-xs gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-lg shrink-0 select-none">{catInfo.icon}</span>
                            <div className="min-w-0 space-y-0.5 flex-1">
                              <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {c.subject}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {c.description}
                              </p>
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
            </div>

            {/* Footer with clean spacing */}
            <div className="px-6 py-3.5 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>EduHub Support Desk</span>
              </span>
              <button
                type="button"
                onClick={handleViewAll}
                className="font-semibold text-primary hover:underline flex items-center gap-1 text-xs"
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
            className="relative w-12 h-12 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/20"
            aria-label="Open Help & Support Assistant"
            title="Need Help?"
          >
            <LifeBuoy className="w-6 h-6" />
            {openCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-background">
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
