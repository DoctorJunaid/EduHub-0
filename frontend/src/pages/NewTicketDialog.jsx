import React, { useState } from "react";
import { Plus, Headset, AlertCircle, X, Paperclip } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSupportCategories } from "@/hooks/useSupportCategories";
import toast from "react-hot-toast";

export default function NewTicketDialog({
  open,
  onClose,
  onCreateTicket,
  isCreating = false,
}) {
  const { categories = [] } = useSupportCategories();

  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    priority: "Medium",
    description: "",
    attachments: [],
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!formData.category) {
      toast.error("Please select a ticket category");
      return;
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 5) {
      toast.error("Subject must be at least 5 characters long");
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 20) {
      toast.error("Description must be at least 20 characters long");
      return;
    }

    try {
      await onCreateTicket(formData);
      setFormData({
        subject: "",
        category: "",
        priority: "Medium",
        description: "",
        attachments: [],
      });
      onClose();
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[540px] p-6">
        <DialogHeader className="pb-3 border-b border-zinc-100">
          <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Headset className="w-5 h-5 text-zinc-700" />
            Create Help & Support Ticket
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Submit a support ticket and our administration team will review and respond.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
          {/* Category & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.category}
                onValueChange={(val) => handleChange("category", val)}
              >
                <SelectTrigger className="h-9 text-xs bg-zinc-50 border-zinc-200">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent position="popper">
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Priority
              </label>
              <Select
                value={formData.priority}
                onValueChange={(val) => handleChange("priority", val)}
              >
                <SelectTrigger className="h-9 text-xs bg-zinc-50 border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Urgent">Urgent (2 Hours)</SelectItem>
                  <SelectItem value="High">High (8 Hours)</SelectItem>
                  <SelectItem value="Medium">Medium (24 Hours)</SelectItem>
                  <SelectItem value="Low">Low (72 Hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="font-semibold text-zinc-700 block mb-1">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={100}
              placeholder="e.g. Cannot access class timetable or marks"
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              className="w-full h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-zinc-700 block mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              minLength={20}
              maxLength={2000}
              placeholder="Please describe your problem or inquiry in detail (minimum 20 characters)..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full p-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 resize-none transition-colors"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="h-8 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 gap-1.5"
            >
              {isCreating ? (
                <Spinner className="size-3.5 text-white" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
