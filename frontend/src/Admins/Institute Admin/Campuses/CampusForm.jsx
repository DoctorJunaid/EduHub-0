import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { validateCampus, campusStatuses } from "./campusData";
import { Send, Copy, Check, Info, Plus, Pencil } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";

export default function CampusForm({ campus, onSave, onCancel, loading, headerAction = null }) {
  const [values, setValues] = useState({
    name: campus?.name ?? "",
    address: (typeof campus?.address === "object" ? campus.address?.street : campus?.address) ?? "",
    status: campus?.status ?? "Active",
    managerName: "",
    managerEmail: "",
    managerPhone: "",
  });

  // "assign_now" | "add_later"
  const [managerMode, setManagerMode] = useState("assign_now");
  const [error, setError] = useState("");

  // Existing campus manager actions
  const [resendingEmail, setResendingEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingExistingManager, setIsEditingExistingManager] = useState(false);
  const [existingManagerForm, setExistingManagerForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "Active",
  });
  const [savingExistingManager, setSavingExistingManager] = useState(false);

  useEffect(() => {
    if (campus?.managerId && typeof campus.managerId === "object") {
      setExistingManagerForm({
        name: campus.managerId.name || "",
        email: campus.managerId.email || "",
        phone: campus.managerId.phone || "",
        status: campus.managerId.status || "Active",
      });
    }
  }, [campus]);

  const submit = (event, addAnother = false) => {
    if (event) event.preventDefault();

    const message = validateCampus(values);
    setError(message);
    if (message) return;

    const payload = {
      ...values,
      name: values.name.trim(),
      address: { street: values.address.trim() },
      ...(campus ? { id: campus.id } : {}),
    };

    if (managerMode === "add_later" && !campus) {
      delete payload.managerName;
      delete payload.managerEmail;
      delete payload.managerPhone;
    }

    onSave(payload, { addAnother });
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn("navigator.clipboard failed, attempting fallback:", err);
    }
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error("Fallback copy failed:", err);
      return false;
    }
  };

  const campusId = campus?.id || campus?._id;

  const handleResendInvite = async () => {
    if (!campusId) return;
    setResendingEmail(true);
    try {
      const res = await axiosInstance.post(`/institute-admin/campuses/${campusId}/resend-invite`);
      toast.success(res.data?.message || "Setup email sent successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend setup email.");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleCopyLink = async () => {
    if (!campusId) return;
    try {
      const res = await axiosInstance.post(`/institute-admin/campuses/${campusId}/resend-invite`);
      const link = res.data?.data?.resetLink;
      if (link) {
        const ok = await copyToClipboard(link);
        if (ok) {
          setCopiedLink(true);
          toast.success("Setup link copied to clipboard!");
          setTimeout(() => setCopiedLink(false), 3000);
        } else {
          toast.error("Failed to copy link to clipboard.");
        }
      }
    } catch (err) {
      toast.error("Failed to generate setup link: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveExistingManager = async (e) => {
    e.preventDefault();
    if (!campusId) return;
    setSavingExistingManager(true);
    try {
      await axiosInstance.put(`/institute-admin/campuses/${campusId}/manager`, existingManagerForm);
      toast.success("Manager details updated!");
      setIsEditingExistingManager(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update manager.");
    } finally {
      setSavingExistingManager(false);
    }
  };

  const existingManager = campus?.managerId && typeof campus.managerId === "object" ? campus.managerId : null;

  return (
    <form
      onSubmit={(e) => submit(e, false)}
      className={`campus-form-block ${headerAction ? "has-integrated-header" : ""}`}
      noValidate
      aria-describedby={error ? "campus-form-error" : undefined}
    >
      {/* ── SECTION 1: Campus Details ── */}
      {headerAction ? (
        <header className="campus-form-card-header">
          {headerAction}
          <div>
            <h1 className="campus-form-card-title">Campus Details</h1>
            <p className="campus-form-card-description">
              Configure the campus branch name, address, and status.
            </p>
          </div>
        </header>
      ) : (
        <div className="campus-section-heading">
          <h3 className="campus-section-title">Campus Details</h3>
          <p className="campus-section-desc">Configure the campus branch name, address, and status.</p>
        </div>
      )}

      <div className="campus-form-body">

      <div className="campus-form-grid">
        <div className="campus-form-field">
          <Label htmlFor="campus-name">
            Campus Name
          </Label>
          <Input
            id="campus-name"
            name="name"
            required
            placeholder="e.g. Peshawar Campus / Main Branch"
            aria-invalid={!!error && !values.name.trim()}
            value={values.name}
            onChange={(event) => {
              setValues({ ...values, name: event.target.value });
              setError("");
            }}
            className="h-10 text-sm"
          />
        </div>

        <div className="campus-form-field">
          <Label htmlFor="campus-address">
            Physical Address
          </Label>
          <Input
            id="campus-address"
            name="address"
            required
            placeholder="Street, area, city"
            aria-invalid={!!error && !values.address.trim()}
            value={values.address}
            onChange={(event) => {
              setValues({ ...values, address: event.target.value });
              setError("");
            }}
            className="h-10 text-sm"
          />
        </div>

        <div className="campus-form-field branch-status-field">
          <Label htmlFor="campus-status">
            Branch Status
          </Label>
          <Select
            value={values.status}
            onValueChange={(status) => {
              setValues({ ...values, status });
              setError("");
            }}
          >
            <SelectTrigger id="campus-status" aria-required="true" className="h-10 w-full sm:w-[280px] bg-background">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {campusStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── CREATE MODE: Add Manager Now vs Add Manager Later ── */}
      {!campus && (
        <>
          <div className="campus-section-divider" />
          <div className="campus-section-heading">
            <h3 className="campus-section-title">
              Campus Manager Credentials
            </h3>
            <p className="campus-section-desc">
              Choose whether to appoint a manager now or assign one later.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="campus-manager-mode-grid">
            <button
              type="button"
              onClick={() => {
                setManagerMode("assign_now");
                setError(null);
              }}
              className={`campus-manager-mode-card ${managerMode === "assign_now" ? "selected" : ""}`}
              aria-pressed={managerMode === "assign_now"}
            >
              <div className="campus-manager-mode-card-title">
                Assign Manager Now
              </div>
              <div className="campus-manager-mode-card-desc">
                Send setup email with credentials link immediately
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setManagerMode("add_later");
                setError(null);
              }}
              className={`campus-manager-mode-card ${managerMode === "add_later" ? "selected" : ""}`}
              aria-pressed={managerMode === "add_later"}
            >
              <div className="campus-manager-mode-card-title">
                Add Manager Later
              </div>
              <div className="campus-manager-mode-card-desc">
                Create campus branch now, appoint manager at any time
              </div>
            </button>
          </div>

          {managerMode === "assign_now" ? (
            <div className="campus-manager-fields-container">
              <div className="campus-manager-fields-grid">
                <div className="campus-form-field">
                  <Label htmlFor="manager-name">
                    Manager Full Name
                  </Label>
                  <Input
                    id="manager-name"
                    name="managerName"
                    placeholder="e.g. Ali Ahmed"
                    value={values.managerName}
                    onChange={(event) => {
                      setValues({ ...values, managerName: event.target.value });
                    }}
                    className="h-10 text-sm bg-white"
                  />
                </div>
                <div className="campus-form-field">
                  <Label htmlFor="manager-email">
                    Manager Email Address
                  </Label>
                  <Input
                    id="manager-email"
                    name="managerEmail"
                    type="email"
                    placeholder="manager@campus.edu"
                    value={values.managerEmail}
                    onChange={(event) => {
                      setValues({ ...values, managerEmail: event.target.value });
                    }}
                    className="h-10 text-sm bg-white"
                  />
                </div>
                <div className="campus-form-field">
                  <Label htmlFor="manager-phone">
                    Manager Phone (Optional)
                  </Label>
                  <Input
                    id="manager-phone"
                    name="managerPhone"
                    type="tel"
                    placeholder="+92 300 0000000"
                    value={values.managerPhone}
                    onChange={(event) => {
                      setValues({ ...values, managerPhone: event.target.value });
                    }}
                    className="h-10 text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="campus-manager-later-notice">
              <Info size={18} className="shrink-0 text-slate-500" />
              <div>
                This branch will be saved without an assigned manager. You will see an <strong>Unassigned</strong> tag with a 1-click <strong>+ Assign</strong> button on the campus list.
              </div>
            </div>
          )}
        </>
      )}

      {/* ── EDIT MODE: Existing Campus Manager Credentials ── */}
      {campus && (
        <>
          <div className="campus-section-divider" />
          <div className="campus-section-heading">
            <h3 className="campus-section-title">
              Campus Manager & Credentials
            </h3>
            <p className="campus-section-desc">
              Review, edit credentials, or resend setup invitation emails.
            </p>
          </div>

          {existingManager ? (
            <div className="campus-manager-card">
              <div className="campus-manager-identity-row">
                <div className="campus-manager-identity-left">
                  <div className="campus-manager-avatar">
                    {(existingManager.name || "M").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="campus-manager-details">
                    <h4 className="campus-manager-name">{existingManager.name}</h4>
                    <p className="campus-manager-email">{existingManager.email}</p>
                  </div>
                </div>
                <span
                  className={`campus-manager-badge ${
                    existingManager.status === "Active" ? "active" : "pending"
                  }`}
                >
                  <span className="campus-manager-badge-dot" />
                  {existingManager.status === "Active" ? "Active" : "Pending Setup"}
                </span>
              </div>

              <div className="campus-manager-divider" />

              <div className="campus-manager-actions">
                <Button
                  type="button"
                  onClick={handleResendInvite}
                  disabled={resendingEmail}
                  className="h-9 px-4 gap-2 text-xs font-semibold"
                >
                  {resendingEmail ? <Spinner className="size-3.5 text-white" /> : <Send size={13} />}
                  <span>Resend Setup Email</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-9 px-4 gap-2 text-xs font-semibold"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedLink ? "Copied!" : "Copy Setup Link"}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingExistingManager(!isEditingExistingManager)}
                  className="h-9 px-4 gap-2 text-xs font-semibold"
                >
                  <Pencil size={13} />
                  <span>{isEditingExistingManager ? "Cancel Edit" : "Edit Profile"}</span>
                </Button>
              </div>

              {/* Inline Edit Existing Manager */}
              {isEditingExistingManager && (
                <div className="campus-manager-edit-panel">
                  <div className="campus-manager-edit-grid">
                    <div className="campus-form-field">
                      <Label htmlFor="edit-mgr-name">Full Name</Label>
                      <Input
                        id="edit-mgr-name"
                        value={existingManagerForm.name}
                        onChange={(e) => setExistingManagerForm({ ...existingManagerForm, name: e.target.value })}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div className="campus-form-field">
                      <Label htmlFor="edit-mgr-email">Email</Label>
                      <Input
                        id="edit-mgr-email"
                        value={existingManagerForm.email}
                        onChange={(e) => setExistingManagerForm({ ...existingManagerForm, email: e.target.value })}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div className="campus-form-field">
                      <Label htmlFor="edit-mgr-phone">Phone</Label>
                      <Input
                        id="edit-mgr-phone"
                        value={existingManagerForm.phone}
                        onChange={(e) => setExistingManagerForm({ ...existingManagerForm, phone: e.target.value })}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div className="campus-form-field">
                      <Label htmlFor="edit-mgr-status">Status</Label>
                      <Select
                        value={existingManagerForm.status}
                        onValueChange={(val) => setExistingManagerForm({ ...existingManagerForm, status: val })}
                      >
                        <SelectTrigger id="edit-mgr-status" className="h-9 text-xs bg-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="campus-manager-edit-footer">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveExistingManager}
                      disabled={savingExistingManager}
                      className="h-8 text-xs font-semibold"
                    >
                      {savingExistingManager && <Spinner className="size-3 mr-1 text-white" />}
                      Save Manager Profile
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "20px", background: "#fafafa", borderRadius: "12px", border: "1px dashed #e4e4e7" }}>
              <div style={{ fontSize: "13.5px", color: "#71717a", marginBottom: "14px" }}>
                No manager assigned to this campus branch yet. Enter details to appoint a manager:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                <div className="campus-form-field">
                  <Label htmlFor="appoint-mgr-name">Manager Full Name</Label>
                  <Input
                    id="appoint-mgr-name"
                    placeholder="e.g. Asad Malik"
                    value={values.managerName}
                    onChange={(e) => setValues({ ...values, managerName: e.target.value })}
                    className="h-10 text-sm bg-white"
                  />
                </div>
                <div className="campus-form-field">
                  <Label htmlFor="appoint-mgr-email">Manager Email</Label>
                  <Input
                    id="appoint-mgr-email"
                    type="email"
                    placeholder="manager@campus.edu"
                    value={values.managerEmail}
                    onChange={(e) => setValues({ ...values, managerEmail: e.target.value })}
                    className="h-10 text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <p
          id="campus-form-error"
          className="campus-error"
          role="alert"
          style={{ color: "#e11d48", fontSize: "13.5px", fontWeight: 500, marginTop: "16px", marginBottom: "0" }}
        >
          {error}
        </p>
      )}

      {/* ── ACTION FOOTER ── */}
      <div className="campus-form-footer">
        <div className="campus-form-footer-actions">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-10 px-5 text-sm font-medium"
          >
            Cancel
          </Button>

          {!campus && (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => submit(null, true)}
              className="h-10 px-5 text-sm font-medium gap-2 border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            >
              <Plus size={16} />
              <span>Save & Add Another Campus</span>
            </Button>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-10 px-6 text-sm font-semibold shadow-xs"
          >
            {loading && <Spinner className="mr-2 size-4 text-white" />}
            {campus ? "Save Changes" : "Create Campus"}
          </Button>
        </div>
      </div>
      </div>
    </form>
  );
}
