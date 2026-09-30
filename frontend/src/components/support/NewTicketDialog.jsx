import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Paperclip, X, Send } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import toast from "react-hot-toast";
import { useSupportCategories } from "@/hooks/useSupportCategories";
import { useSupportContacts } from "@/hooks/useSupportContacts";

export const NewTicketDialog = ({
  open = false,
  onOpenChange,
  onCreate,
  isPending = false,
  isAdmin = false,
}) => {
  const { categories } = useSupportCategories();
  const { contacts } = useSupportContacts();

  const [category, setCategory] = useState("Academic");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (attachments.length + files.length > 3) {
      toast.error("Maximum 3 files allowed");
      return;
    }

    const newAttachments = [...attachments];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 5MB limit`);
        continue;
      }
      newAttachments.push({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      });
    }
    setAttachments(newAttachments);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!category) {
      toast.error("Please select a topic/category");
      return;
    }

    const finalSubject = subject.trim() || `${category} Inquiry`;
    if (finalSubject.length < 5) {
      toast.error("Subject must be at least 5 characters");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error("Please provide at least 10 characters explaining what you need help with");
      return;
    }

    const payload = {
      category,
      subject: finalSubject,
      description: description.trim(),
      attachments,
      ...(isAdmin ? { priority, assignedTo: assignedTo || undefined } : {}),
    };

    try {
      await onCreate(payload);
      setSubject("");
      setDescription("");
      setAttachments([]);
      setPriority("Medium");
      setAssignedTo("");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] w-[calc(100vw-2rem)] sm:w-[42vw] rounded-2xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {isAdmin ? "Create New Support Ticket" : "💬 Ask for Help"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isAdmin
                  ? "Submit and route an internal or external support ticket."
                  : "What do you need help with? Pick a topic and tell us the details."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Category Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              {isAdmin ? "Category" : "What do you need help with?"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = category === (cat.id || cat);
                return (
                  <button
                    key={cat.id || cat}
                    type="button"
                    onClick={() => setCategory(cat.id || cat)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                        : "border-border/80 bg-card hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <span className="text-base shrink-0">{cat.icon || "💬"}</span>
                    <span className="truncate leading-tight">{cat.label || cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Subject {isAdmin ? "" : "(Optional title)"}
            </label>
            <Input
              type="text"
              placeholder={
                isAdmin
                  ? "Brief summary of the issue..."
                  : "e.g., Question regarding Chapter 4 math homework"
              }
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl text-xs h-9"
            />
          </div>

          {/* Admin Priority & Assignee Controls */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Priority</label>
                <Select value={priority} onValueChange={(val) => setPriority(val)}>
                  <SelectTrigger className="h-9 w-full rounded-xl bg-background text-xs border-input">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Urgent">Urgent (2h SLA)</SelectItem>
                    <SelectItem value="High">High (8h SLA)</SelectItem>
                    <SelectItem value="Medium">Medium (24h SLA)</SelectItem>
                    <SelectItem value="Low">Low (72h SLA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Initial Assignee</label>
                <Select
                  value={assignedTo || "none"}
                  onValueChange={(val) => setAssignedTo(val === "none" ? "" : val)}
                >
                  <SelectTrigger className="h-9 w-full rounded-xl bg-background text-xs border-input">
                    <SelectValue placeholder="Auto-Assign (Recommended)" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Auto-Assign (Recommended)</SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name} ({c.role?.replace("_", " ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Message Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {isAdmin ? "Description" : "Tell us more"}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's going on with as much detail as possible..."
              rows={4}
              className="rounded-xl text-xs resize-none"
              required
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-2 pb-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Attach a file (optional - max 3 files · 5 MB each)</span>
              </label>
              {attachments.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  + Add File
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            />

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-xs text-foreground border border-border"
                  >
                    <Paperclip className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate max-w-[140px]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="text-muted-foreground hover:text-destructive ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <DialogFooter className="p-4 px-6 border-t border-border bg-muted/10 flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-xl px-5 h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !description.trim()}
            className="rounded-xl px-5 h-9 gap-2 font-medium"
          >
            {isPending ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{isAdmin ? "Create Ticket" : "Send Message"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketDialog;
