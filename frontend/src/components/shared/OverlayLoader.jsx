import React from "react";
import { Spinner } from "@/components/ui/spinner";

export function OverlayLoader({ show = true, className = "" }) {
  if (!show) return null;
  return (
    <div
      className={`absolute inset-0 bg-white/40 dark:bg-zinc-900/40 flex items-center justify-center z-10 rounded-lg pointer-events-none transition-opacity duration-200 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <Spinner className="size-5 text-primary" />
    </div>
  );
}

export default OverlayLoader;
