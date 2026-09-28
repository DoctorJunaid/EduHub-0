import React from "react";
import { LifeBuoy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyTicketsState({ onNewTicket, isFiltered = false }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-zinc-200/80 rounded-xl my-4 min-h-[320px]">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 mb-4 shadow-2xs">
        <LifeBuoy className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 mb-1">
        {isFiltered ? "No Matching Support Tickets" : "No Support Tickets Found"}
      </h3>
      <p className="text-xs text-zinc-500 max-w-sm mb-5">
        {isFiltered
          ? "Try adjusting your search terms or filters to find what you are looking for."
          : "Need help? Open a new support ticket to contact your campus administration or teachers."}
      </p>
      {onNewTicket && (
        <Button
          onClick={onNewTicket}
          className="inline-flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold px-4 h-9 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Ticket</span>
        </Button>
      )}
    </div>
  );
}
