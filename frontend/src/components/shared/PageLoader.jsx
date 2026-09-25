import React from "react";
import { Spinner } from "@/components/ui/spinner";

export function PageLoader({ message = "Loading...", text, className = "" }) {
  const displayText = text || message;
  return (
    <div className={`w-full min-h-[400px] flex-1 flex flex-col items-center justify-center gap-3 p-8 ${className}`}>
      <Spinner className="size-8 text-primary" />
      {displayText && (
        <p className="text-sm font-medium text-muted-foreground tracking-wide">{displayText}</p>
      )}
    </div>
  );
}

export default PageLoader;
