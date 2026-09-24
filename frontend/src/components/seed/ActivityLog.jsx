import React from "react";
import { History, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function ActivityLog({ logs = [] }) {
  if (!logs.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
          <History className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No Seeding Activity Logged Yet
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Execute any seed or clear operation above to see a timestamped log of results here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Recent Seed Operations (Last 10)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {logs.length} operations recorded
        </span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {logs.map((log) => (
          <div
            key={log.id}
            className="py-3 flex items-start justify-between gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors px-2 rounded-lg"
          >
            <div className="flex items-start gap-3">
              {log.status === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {log.action}
                  </span>
                  {log.duration && (
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
                      {log.duration}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {log.result}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400 flex-shrink-0">
              <Clock className="w-3 h-3" />
              <span>{log.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
