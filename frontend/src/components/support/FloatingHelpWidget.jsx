import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LifeBuoy, X, Plus, HelpCircle, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupportStats } from "@/hooks/useSupportStats";

export default function FloatingHelpWidget({ onOpenNewTicket }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { stats } = useSupportStats();

  // Hide on auth pages
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/set-password" ||
    location.pathname === "/";

  if (isAuthPage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end select-none">
      {/* Mini Help Panel */}
      {open && (
        <div className="mb-3 w-80 bg-white border border-zinc-200/90 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-150">
          <div className="bg-zinc-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">EduHub Help & Support</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 text-xs">
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500 font-medium">Your Open Tickets</p>
                <p className="text-base font-extrabold text-zinc-900 leading-tight">
                  {stats.badgeCount || 0} active
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  navigate("/support");
                }}
                className="h-7 px-2.5 text-[11px] font-semibold border-zinc-200"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-1.5 pt-1">
              <Button
                onClick={() => {
                  setOpen(false);
                  if (onOpenNewTicket) onOpenNewTicket();
                  else navigate("/support?new=true");
                }}
                className="w-full h-8 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg justify-start gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Support Ticket</span>
              </Button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/support");
                }}
                className="w-full h-8 px-3 text-xs text-zinc-700 hover:bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Support Center Dashboard</span>
                </span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-11 h-11 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open Help & Support"
        title="Need Help? Open Support Center"
      >
        {open ? <X className="w-5 h-5" /> : <LifeBuoy className="w-5 h-5 text-emerald-400" />}
      </button>
    </div>
  );
}
