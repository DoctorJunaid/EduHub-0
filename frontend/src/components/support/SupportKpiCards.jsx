import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Inbox, Clock, CheckCircle2, Archive, AlertTriangle, AlertCircle } from "lucide-react";

export const SupportKpiCards = ({ stats = {}, onSelectFilter, activeStatus = "all" }) => {
  const kpiData = [
    {
      id: "Open",
      label: "Open Tickets",
      value: stats.waiting ?? 0,
      icon: Inbox,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      id: "In Progress",
      label: "In Progress",
      value: stats.lookingAt ?? 0,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      id: "Resolved",
      label: "Resolved",
      value: stats.answered ?? 0,
      icon: CheckCircle2,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      id: "Closed",
      label: "Closed",
      value: stats.done ?? 0,
      icon: Archive,
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
    },
    {
      id: "Overdue",
      label: "Overdue SLA",
      value: stats.overdue ?? 0,
      icon: AlertCircle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      highlight: (stats.overdue || 0) > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {kpiData.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeStatus === kpi.id;
        return (
          <Card
            key={kpi.id}
            onClick={() => onSelectFilter && onSelectFilter(isSelected ? "all" : kpi.id)}
            className={`cursor-pointer transition-all hover:shadow-md border ${
              isSelected
                ? "ring-2 ring-primary border-primary bg-primary/5"
                : "border-border/60 hover:border-border"
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">{kpi.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SupportKpiCards;
