import React from "react";
import { AlertOctagon, Trash2, RotateCcw } from "lucide-react";

export default function DangerZoneCard({
  onClearTeachers,
  onClearStudents,
  onClearAll,
  onResetAll,
  loading,
}) {
  return (
    <div className="rounded-2xl border-2 border-rose-200 dark:border-rose-950/60 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Danger Zone (Targeted Data Reset)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Permanently purges test users and records. All actions require typed keyword confirmation.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900 font-semibold">
          Destructive Operations
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {/* Action 1: Clear Teachers */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">
              Clear All Teachers
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Deletes all teachers, salaries, attendance, and timetable assignments.
            </p>
          </div>
          <button
            onClick={onClearTeachers}
            disabled={loading}
            className="w-full py-2 px-3 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Teachers
          </button>
        </div>

        {/* Action 2: Clear Students */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">
              Clear All Students
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Deletes all student accounts, profiles, fee logs, and student attendance.
            </p>
          </div>
          <button
            onClick={onClearStudents}
            disabled={loading}
            className="w-full py-2 px-3 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Students
          </button>
        </div>

        {/* Action 3: Clear All */}
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300">
              Clear Teachers & Students
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Purges all teachers and students while keeping Admin logins 100% intact.
            </p>
          </div>
          <button
            onClick={onClearAll}
            disabled={loading}
            className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Everything
          </button>
        </div>

        {/* Action 4: Reset & Full Re-Seed */}
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Reset & Full Re-Seed
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clears everything and rebuilds full Class 1-12 matrix with timetable.
            </p>
          </div>
          <button
            onClick={onResetAll}
            disabled={loading}
            className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset & Re-Seed
          </button>
        </div>
      </div>
    </div>
  );
}
