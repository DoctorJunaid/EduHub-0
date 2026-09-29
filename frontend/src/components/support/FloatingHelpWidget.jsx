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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { useSupportTickets, useCreateTicket } from "@/hooks/useSupportTickets";
import { useSupportStats } from "@/hooks/useSupportStats";
import { CATEGORY_ICONS } from "./TicketCategoryBadge";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { NewTicketDialog } from "./NewTicketDialog";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";

export const FloatingHelpWidget = () => {
  // 1. All hooks called unconditionally at top level
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

  // Queries called unconditionally
  const { data: ticketsData } = useSupportTickets(
    { limit: 3, page: 1 },
    { enabled: shouldFetch && isOpen }
  );

  const { stats } = useSupportStats({
    enabled: shouldFetch,
  });

  const createTicketMutation = useCreateTicket();

  // 2. Early return AFTER all hooks are called
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
    navigate(`/support/${id}`);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate("/support");
  };

  return (
    <>
      <aside
        aria-label="Help and Support Assistant"
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      >
        {/* Expanded Floating Popover Card with Strict shadcn Structure */}
        {isOpen && (
          <Card className="mb-3 w-80 sm:w-96 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-5 duration-200 py-0 gap-0">
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 border-b border-border/70 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold text-foreground leading-tight">
                    Help & Inquiries
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    We're here to help with your questions
                  </CardDescription>
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
            </CardHeader>

            {/* Content Body */}
            <CardContent className="p-4 sm:p-5 space-y-4 max-h-[380px] overflow-y-auto">
              {/* Primary Call to Action Button */}
              <Button
                onClick={() => setIsNewDialogOpen(true)}
                className="w-full justify-center gap-2 rounded-xl h-10 font-medium shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{isAdmin ? "Create New Ticket" : "Ask for Help"}</span>
              </Button>

              {/* Recent Conversations Section */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isAdmin ? "Recent Tickets" : "Recent Conversations"}
                  </span>
                  {recentConversations.length > 0 && (
                    <button
                      type="button"
                      onClick={handleViewAll}
                      className="text-xs text-primary hover:underline font-medium flex items-center gap-0.5 transition-colors"
                    >
                      <span>View all</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {recentConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-muted/30 border border-dashed border-border/80 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">No active conversations</p>
                    <p className="text-[11px] text-muted-foreground max-w-[220px] leading-relaxed mx-auto">
                      Have a question about homework, fees, or your account? Tap above to ask!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentConversations.map((c) => {
                      const catInfo = CATEGORY_ICONS[c.category] || { icon: "💬" };
                      return (
                        <div
                          key={c._id}
                          onClick={() => handleOpenConversation(c._id)}
                          className="group flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/50 border border-border/80 hover:border-primary/40 cursor-pointer transition-all shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="text-base shrink-0 select-none">{catInfo.icon}</span>
                            <div className="min-w-0 space-y-0.5">
                              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {c.subject}
                              </p>
                              <p className="text-[11px] text-muted-foreground line-clamp-1">
                                {c.description}
                              </p>
                            </div>
                          </div>
                          <TicketStatusBadge status={c.status} isAdmin={isAdmin} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="flex items-center justify-between p-3.5 sm:p-4 bg-muted/20 border-t border-border/70 text-xs">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
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
            </CardFooter>
          </Card>
        )}

        {/* Floating Trigger Circle Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/20 ${
            isOpen
              ? "bg-muted text-foreground border border-border hover:bg-muted/80"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
          aria-label={isOpen ? "Close Help Assistant" : "Open Help & Support Assistant"}
          title="Need Help?"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <>
              <LifeBuoy className="w-5 h-5" />
              {openCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-background">
                  {openCount}
                </span>
              )}
            </>
          )}
        </button>
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
