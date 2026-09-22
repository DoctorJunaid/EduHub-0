import React from 'react';
import { AlertTriangle, UserPlus } from 'lucide-react';

export default function TeachersWithoutProfileAlert({ count = 0, onAddProfile }) {
  if (!count || count <= 0) return null;

  return (
    <div className="mx-5 my-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
        </div>
        <div>
          <strong className="block text-amber-950 font-semibold text-sm">
            {count} {count === 1 ? 'teacher needs' : 'teachers need'} a salary profile
          </strong>
          <span className="text-amber-800 text-[11px]">
            Unconfigured teachers are skipped during payroll generation. Configure their profiles to include them.
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onAddProfile}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
      >
        <UserPlus size={13} className="text-amber-700" />
        Add Salary Profile
      </button>
    </div>
  );
}
