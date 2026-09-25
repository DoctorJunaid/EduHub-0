import React from "react";
import { Users, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/spinner";

export default function KpiCards({ stats = {}, loading = false, selectedDateLabel = "Today" }) {
  const cards = [
    {
      title: "Total Faculty & Staff",
      value: stats?.total ?? 0,
      icon: Users,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      description: "Registered campus staff",
    },
    {
      title: selectedDateLabel === "Today" ? "Present Today" : `Present on ${selectedDateLabel}`,
      value: stats?.present ?? 0,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      description: "On-time check-ins",
    },
    {
      title: "Late",
      value: stats?.late ?? 0,
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      description: "Checked in after start time",
    },
    {
      title: "Absent",
      value: stats?.absent ?? 0,
      icon: XCircle,
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
      description: "Unreported or confirmed absent",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <Card key={idx} className="p-0 border border-border shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {item.title}
                </p>
                {loading ? (
                  <div className="h-8 flex items-center my-1">
                    <Spinner className="size-5 text-primary" />
                  </div>
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {item.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
              >
                <IconComponent className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
