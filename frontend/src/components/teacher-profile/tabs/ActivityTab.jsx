import React, { useEffect } from "react";
import { History, ShieldCheck, UserCheck, BookOpen, Clock, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";

export default function ActivityTab({
  activityData,
  loading,
  onLoadActivity,
}) {
  useEffect(() => {
    onLoadActivity();
  }, [onLoadActivity]);

  if (loading && !activityData) {
    return <PageLoader text="Loading audit activity trail..." />;
  }

  const logs = activityData || [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
        <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-600" />
          Audit &amp; Account Activity Trail
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Immutable audit record of institutional actions, profile modifications, and assignment updates.
        </p>
      </div>

      <Card className="bg-white border-zinc-200/80 shadow-xs overflow-hidden">
        <CardContent className="p-0 divide-y divide-zinc-100">
          {logs.length === 0 ? (
            <div className="p-10 text-center text-xs text-zinc-500">
              No audit logs recorded for this teacher yet.
            </div>
          ) : (
            logs.map((log) => {
              const formattedTime = log.timestamp
                ? new Date(log.timestamp).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now";

              return (
                <div
                  key={log._id || log.timestamp}
                  className="p-4 flex items-start justify-between gap-4 hover:bg-zinc-50/60 transition-colors text-xs"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900">
                          {log.action}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold bg-zinc-50 text-zinc-600 border-zinc-200"
                        >
                          {log.category || "General"}
                        </Badge>
                      </div>
                      <p className="text-zinc-600 mt-1 leading-relaxed">
                        {log.details}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Triggered by <span className="font-semibold text-zinc-700">{log.actor}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                    {formattedTime}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
