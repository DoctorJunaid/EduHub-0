import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Headset, Paperclip, X, Plus } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import toast from "react-hot-toast";
import { useSupportCategories } from "@/hooks/useSupportCategories";
import { useSupportContacts } from "@/hooks/useSupportContacts";
import {
  CANONICAL_SUPPORT_CATEGORIES,
} from "./supportCategories";
import "./NewTicketDialog.css";

export const NewTicketDialog = ({
  open = false,
  onOpenChange,
  onCreate,
  isPending = false,
  isAdmin = false,
}) => {
  const { categories = [] } = useSupportCategories();
  const { contacts = [] } = useSupportContacts();

  const [category, setCategory] = useState("Academic");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // Use canonical categories list (or API list if loaded)
  const categoryList =
    categories && categories.length > 0
      ? categories
      : CANONICAL_SUPPORT_CATEGORIES;

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
      toast.error("Please select a category");
      return;
    }

    const finalSubject = subject.trim() || `${category} Inquiry`;
    if (finalSubject.length < 5) {
      toast.error("Subject must be at least 5 characters");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error(
        "Please provide at least 10 characters explaining what you need help with"
      );
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
      console.error("Create ticket error:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ntd-dialog-content">
        {/* Modal Header */}
        <div className="ntd-header">
          <div className="ntd-header-left">
            <div className="ntd-header-icon" aria-hidden="true">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="ntd-title">
                {isAdmin ? "Create New Support Ticket" : "Ask for Help"}
              </DialogTitle>
              <DialogDescription className="ntd-subtitle">
                {isAdmin
                  ? "Submit and route an internal or external support ticket."
                  : "What do you need help with? Pick a topic and tell us the details."}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="ntd-form">
          {/* Category Selector Grid */}
          <div className="ntd-field-group">
            <label className="ntd-label">
              {isAdmin ? "Category" : "What do you need help with?"}
            </label>
            <div className="ntd-category-grid">
              {categoryList.map((cat) => {
                const catId = cat.id || cat;
                const catLabel = cat.label || cat;
                const isSelected = category === catId;
                const IconComp =
                  cat.Icon ||
                  CANONICAL_SUPPORT_CATEGORIES.find((c) => c.id === catId)?.Icon ||
                  Headset;
                return (
                  <button
                    key={catId}
                    type="button"
                    onClick={() => setCategory(catId)}
                    className={`ntd-category-btn ${isSelected ? "is-selected" : ""}`}
                  >
                    <IconComp className="ntd-category-icon" />
                    <span className="ntd-category-label">{catLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div className="ntd-field-group">
            <label className="ntd-label" htmlFor="ticket-subject">
              Subject {isAdmin ? "" : "(Optional title)"}
            </label>
            <input
              id="ticket-subject"
              type="text"
              placeholder={
                isAdmin
                  ? "Brief summary of the issue..."
                  : "e.g., Question regarding Chapter 4 math homework"
              }
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="ntd-input"
            />
          </div>

          {/* Admin Priority & Assignee Controls */}
          {isAdmin && (
            <div className="ntd-admin-row">
              <div className="ntd-field-group">
                <label className="ntd-label">Priority</label>
                <Select value={priority} onValueChange={(val) => setPriority(val)}>
                  <SelectTrigger className="ntd-select-trigger">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={6}
                    align="start"
                    className="isu-select-content priority-content"
                  >
                    <SelectItem value="Urgent" className="isu-select-item">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>Urgent (2h SLA)</span>
                    </SelectItem>
                    <SelectItem value="High" className="isu-select-item">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      <span>High (8h SLA)</span>
                    </SelectItem>
                    <SelectItem value="Medium" className="isu-select-item">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Medium (24h SLA)</span>
                    </SelectItem>
                    <SelectItem value="Low" className="isu-select-item">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>Low (72h SLA)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="ntd-field-group">
                <label className="ntd-label">Initial Assignee</label>
                <Select
                  value={assignedTo || "none"}
                  onValueChange={(val) =>
                    setAssignedTo(val === "none" ? "" : val)
                  }
                >
                  <SelectTrigger className="ntd-select-trigger">
                    <SelectValue placeholder="Auto-Assign (Recommended)" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={6}
                    align="start"
                    className="isu-select-content"
                    style={{ minWidth: "220px", maxHeight: "280px" }}
                  >
                    <SelectItem value="none" className="isu-select-item">
                      <span>Auto-Assign (Recommended)</span>
                    </SelectItem>
                    {contacts.map((c) => (
                      <SelectItem
                        key={c._id}
                        value={c._id}
                        className="isu-select-item"
                      >
                        <span className="truncate">
                          {c.name} ({c.role?.replace("_", " ")})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="ntd-field-group">
            <label className="ntd-label" htmlFor="ticket-description">
              {isAdmin ? "Description" : "Tell us more"}
            </label>
            <textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's going on with as much detail as possible..."
              rows={4}
              className="ntd-textarea"
              required
            />
          </div>

          {/* Attachments Section */}
          <div className="ntd-attachment-box">
            <div className="ntd-attachment-header">
              <span className="ntd-attachment-desc">
                <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                <span>Attach a file (optional — max 3 files · 5 MB each)</span>
              </span>
              {attachments.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="ntd-add-file-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add File</span>
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
                  <div key={i} className="ntd-attachment-chip">
                    <Paperclip className="w-3 h-3 text-zinc-400" />
                    <span className="truncate max-w-[160px] font-medium">
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="ntd-attachment-remove"
                      title="Remove attachment"
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
        <div className="ntd-footer">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="ntd-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !description.trim()}
            className="ntd-submit-btn"
          >
            {isPending ? (
              <>
                <Spinner className="w-4 h-4 text-white" />
                <span>Creating...</span>
              </>
            ) : (
              <span>{isAdmin ? "Create Ticket" : "Send Message"}</span>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketDialog;
