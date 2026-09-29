import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCheck, Search, User } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import { useSupportContacts } from "@/hooks/useSupportContacts";

export const AssignDialog = ({
  open = false,
  onOpenChange,
  ticket = {},
  onConfirm,
  isPending = false,
}) => {
  const { contacts, isLoading } = useSupportContacts();
  const [selectedUserId, setSelectedUserId] = useState(ticket.assignedTo || "");
  const [search, setSearch] = useState("");

  const filteredContacts = contacts.filter((c) => {
    const s = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.role?.toLowerCase().includes(s)
    );
  });

  const handleAssign = async () => {
    if (!selectedUserId) return;
    await onConfirm({ ticketId: ticket._id, assigneeId: selectedUserId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
            <UserCheck className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg">Assign Ticket</DialogTitle>
          <DialogDescription className="text-xs">
            Select a staff member or administrator to take ownership of this ticket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Search Contacts */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search staff members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Contact Selection List */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 border border-border/80 rounded-xl p-2 bg-muted/20">
            {isLoading ? (
              <div className="flex justify-center p-6">
                <Spinner className="w-5 h-5 text-primary" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No staff members found
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedUserId === contact._id;
                return (
                  <div
                    key={contact._id}
                    onClick={() => setSelectedUserId(contact._id)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {contact.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{contact.name}</p>
                      <p
                        className={`text-[10px] capitalize truncate ${
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {contact.role?.replace("_", " ")}
                      </p>
                    </div>
                    {isSelected && <UserCheck className="w-4 h-4 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={!selectedUserId || isPending}
            className="rounded-xl gap-1.5"
          >
            {isPending ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Assign Ticket</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDialog;
