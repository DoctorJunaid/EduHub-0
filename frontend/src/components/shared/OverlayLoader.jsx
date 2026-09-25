import React from "react";
import { Spinner } from "@/components/ui/spinner";

export function OverlayLoader({ show = true, className = "" }) {
  if (!show) return null;
  return (
    <div
      className={`absolute inset-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg ${className}`}
      role="status"
      aria-label="Loading"
    >
      <Spinner className="size-6 text-primary" />
    </div>
  );
}

export default OverlayLoader;
