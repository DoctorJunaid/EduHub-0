import React from "react";
import { Skeleton } from "../ui/skeleton";

export default function TableSkeleton({ rows = 5, columns = 5, className = "" }) {
  return (
    <div className={`w-full space-y-3 p-4 ${className}`} aria-label="Loading table data">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-24 rounded" />
        ))}
      </div>
      {[...Array(rows)].map((_, rIdx) => (
        <div key={rIdx} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
          {[...Array(columns)].map((_, cIdx) => (
            <Skeleton
              key={cIdx}
              className={`h-4 rounded ${
                cIdx === 0 ? "w-36" : cIdx === columns - 1 ? "w-16" : "w-24"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
