import React from "react";
import {
  Inbox,
  Clock,
  CheckCircle2,
  Archive,
  AlertTriangle,
  Zap,
} from "lucide-react";

export default function SupportKpiCards({ stats = {}, isAdmin = false }) {
  const openCount = stats.open || 0;
  const inProgressCount = stats.inProgress || 0;
  const resolvedCount = stats.resolved || 0;
  const closedCount = stats.closed || 0;
  const overdueCount = stats.sla?.ticketsOverdue || 0;
  const avgResponse = stats.sla?.avgFirstResponseHours || 0;

  return (
    <div className="campus-kpi-track grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 mb-4">
      {/* 1. Open Tickets */}
      <div className="campus-kpi-card bg-white border border-zinc-200/80 rounded-xl p-3.5 flex items-center gap-3 shadow-2xs">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Inbox className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
            Open Tickets
          </span>
          <span className="text-xl font-extrabold text-zinc-900 leading-tight">
            {openCount}
          </span>
        </div>
      </div>

      {/* 2. In Progress */}
      <div className="campus-kpi-card bg-white border border-zinc-200/80 rounded-xl p-3.5 flex items-center gap-3 shadow-2xs">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
            In Progress
          </span>
          <span className="text-xl font-extrabold text-zinc-900 leading-tight">
            {inProgressCount}
          </span>
        </div>
      </div>

      {/* 3. Resolved */}
      <div className="campus-kpi-card bg-white border border-zinc-200/80 rounded-xl p-3.5 flex items-center gap-3 shadow-2xs">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
            Resolved
          </span>
          <span className="text-xl font-extrabold text-zinc-900 leading-tight">
            {resolvedCount}
          </span>
        </div>
      </div>

      {/* 4. Closed or SLA (if Admin) */}
      {isAdmin && overdueCount > 0 ? (
        <div className="campus-kpi-card bg-white border border-rose-200 rounded-xl p-3.5 flex items-center gap-3 shadow-2xs bg-rose-50/30">
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 block">
              SLA Overdue
            </span>
            <span className="text-xl font-extrabold text-rose-700 leading-tight">
              {overdueCount}
            </span>
          </div>
        </div>
      ) : (
        <div className="campus-kpi-card bg-white border border-zinc-200/80 rounded-xl p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
              Closed
            </span>
            <span className="text-xl font-extrabold text-zinc-900 leading-tight">
              {closedCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
