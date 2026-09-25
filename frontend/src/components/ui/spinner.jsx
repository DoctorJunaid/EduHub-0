import React from "react";
import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";

export function Spinner({ className, ...props }) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin text-zinc-900", className)}
      {...props}
    />
  );
}

export function SpinnerCustom({ className, text, size = "default" }) {
  const sizeClasses = {
    sm: "size-3.5",
    default: "size-4",
    lg: "size-6",
    xl: "size-8",
  };

  return (
    <div className={cn("flex items-center justify-center gap-2.5", className)}>
      <Spinner className={sizeClasses[size] || sizeClasses.default} />
      {text && <span className="text-xs font-medium text-zinc-600">{text}</span>}
    </div>
  );
}

export function PageLoader({ text = "Loading..." }) {
  return (
    <div className="w-full min-h-[400px] flex-1 flex flex-col items-center justify-center gap-3 p-8">
      <Spinner className="size-7 text-zinc-900" />
      {text && <p className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">{text}</p>}
    </div>
  );
}

export default Spinner;
