import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function ProgressBar({ currentStep, steps = [] }) {
  if (!steps.length) return null;

  const activeIdx = steps.findIndex((s) => s.id === currentStep);
  const percentage = activeIdx >= 0 ? Math.round(((activeIdx + 1) / steps.length) * 100) : 0;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          Seeding in progress...
        </span>
        <span className="text-indigo-600 dark:text-indigo-400 font-mono">{percentage}%</span>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        {steps.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-colors ${
                isDone
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                  : isCurrent
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400 shadow-sm"
                  : "bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-600"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 flex-shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 flex-shrink-0" />
              )}
              <span className="truncate">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
