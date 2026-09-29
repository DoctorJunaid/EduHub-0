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
import { MessageCircle, Paperclip, X, Check, Send } from "lucide-react";
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

    // Auto-generate subject if not explicitly filled by regular users
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
      // Reset form
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
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <MessageCircle className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg">
            {isAdmin ? "Create New Support Ticket" : "💬 Ask for Help"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isAdmin
              ? "Submit and route an internal or external support ticket."
              : "What do you need help with? Pick a topic and tell us the details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
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

          {/* Subject (Optional for user, mandatory for admin) */}
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
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Urgent">Urgent (2h SLA)</option>
                  <option value="High">High (8h SLA)</option>
                  <option value="Medium">Medium (24h SLA)</option>
                  <option value="Low">Low (72h SLA)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Initial Assignee</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Auto-Assign (Recommended)</option>
                  {contacts.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.role?.replace("_", " ")})
                    </option>
                  ))}
                </select>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Attach a file (optional - max 3 files · 5 MB each)</span>
              </label>
              {attachments.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-primary hover:underline font-medium"
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

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
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
              type="submit"
              disabled={isPending || !description.trim()}
              className="rounded-xl gap-1.5"
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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketDialog;
