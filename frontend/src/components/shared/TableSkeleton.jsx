import React from "react";
import { Spinner } from "@/components/ui/spinner";

export default function TableSkeleton({ rows, columns, className = "", text = "Loading data..." }) {
  return (
    <div className={`w-full flex flex-col items-center justify-center min-h-[220px] py-12 gap-3 ${className}`} aria-label="Loading table data">
      <Spinner className="size-8 text-primary" />
      {text && <p className="text-xs font-medium text-muted-foreground tracking-wide">{text}</p>}
    </div>
  );
}

