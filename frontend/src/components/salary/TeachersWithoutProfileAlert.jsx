import React from 'react';
import { AlertTriangle, Plus } from 'lucide-react';

export default function TeachersWithoutProfileAlert({ count = 0, onAddProfile }) {
  if (!count || count <= 0) return null;

  return (
    <div className="mx-4 sm:mx-5 my-2.5 px-3.5 py-2.5 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-center justify-between gap-3 text-xs transition-all shadow-2xs box-border">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-7 w-7 rounded-lg bg-amber-100 border border-amber-300/80 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-800" />
        </div>
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <span className="font-bold text-amber-950 text-xs whitespace-nowrap">
            {count} {count === 1 ? 'teacher needs' : 'teachers need'} a salary profile
          </span>
          <span className="hidden lg:inline-block text-[11px] text-amber-800/90 whitespace-nowrap">
            — unconfigured staff are skipped during monthly payroll runs
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onAddProfile}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0 whitespace-nowrap"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          boxShadow: '0 2px 8px rgba(30,41,59,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <Plus size={13} strokeWidth={2.5} />
        <span>Configure Profile</span>
      </button>
    </div>
  );
}
