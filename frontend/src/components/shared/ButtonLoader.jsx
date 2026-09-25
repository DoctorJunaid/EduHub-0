import React from "react";
import { Spinner } from "@/components/ui/spinner";

export function ButtonLoader({ className = "mr-2 size-4 text-inherit" }) {
  return <Spinner className={className} />;
}

export default ButtonLoader;
