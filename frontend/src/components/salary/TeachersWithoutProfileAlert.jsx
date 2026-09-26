import React from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TeachersWithoutProfileAlert({ count = 0, onAddProfile }) {
  if (!count || count <= 0) return null;

  return (
    <div className="salary-profiles-warning-banner bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-center justify-between gap-4 text-xs transition-all shadow-2xs box-border">
      <div className="salary-profiles-warning-message flex items-center gap-3 min-w-0">
        <div className="salary-profiles-warning-icon h-7 w-7 rounded-lg bg-amber-100 border border-amber-300/80 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-800" />
        </div>
        <div className="salary-profiles-warning-copy min-w-0 flex items-center gap-2 flex-wrap">
          <span className="font-bold text-amber-950 text-xs whitespace-nowrap">
            {count} {count === 1 ? 'teacher needs' : 'teachers need'} a salary profile
          </span>
          <span className="hidden lg:inline-block text-[11px] text-amber-800/90 whitespace-nowrap">
            — unconfigured staff are skipped during monthly payroll runs
          </span>
        </div>
      </div>

      <Button
        type="button"
        onClick={onAddProfile}
        size="sm"
        className="salary-profiles-warning-action shrink-0 whitespace-nowrap text-xs"
      >
        <Plus size={13} strokeWidth={2.5} />
        <span>Configure Profile</span>
      </Button>
    </div>
  );
}
