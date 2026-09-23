import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { validateCampus, campusStatuses } from "./campusData";
import { Loader2, User, Send, Copy, Check, UserPlus, Info, Plus } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";

export default function CampusForm({ campus, onSave, onCancel, loading }) {
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

  const handleResendInvite = async () => {
    if (!campus?.id) return;
    setResendingEmail(true);
    try {
      const res = await axiosInstance.post(`/institute-admin/campuses/${campus.id}/resend-invite`);
      toast.success(res.data?.message || "Setup email sent successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend setup email.");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleCopyLink = async () => {
    if (!campus?.id) return;
    try {
      const res = await axiosInstance.post(`/institute-admin/campuses/${campus.id}/resend-invite`);
      const link = res.data?.data?.resetLink;
      if (link) {
        await navigator.clipboard.writeText(link);
        setCopiedLink(true);
        toast.success("Setup link copied to clipboard!");
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch (err) {
      toast.error("Failed to generate setup link: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveExistingManager = async (e) => {
    e.preventDefault();
    if (!campus?.id) return;
    setSavingExistingManager(true);
    try {
      await axiosInstance.put(`/institute-admin/campuses/${campus.id}/manager`, existingManagerForm);
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
      className="campus-form-block"
      noValidate
      aria-describedby={error ? "campus-form-error" : undefined}
      style={{ maxWidth: "680px" }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>Campus Details</h3>
        <p style={{ fontSize: "14px", color: "#71717a" }}>Configure the campus branch name, address, and status.</p>
      </div>

      <div className="campus-form-field" style={{ marginBottom: "16px" }}>
        <Label htmlFor="campus-name" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
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
        />
      </div>

      <div className="campus-form-field" style={{ marginBottom: "16px" }}>
        <Label htmlFor="campus-address" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
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
        />
      </div>

      <div className="campus-form-field" style={{ marginBottom: "24px" }}>
        <Label htmlFor="campus-status" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
          Branch Status
        </Label>
        <Select
          value={values.status}
          onValueChange={(status) => {
            setValues({ ...values, status });
            setError("");
          }}
        >
          <SelectTrigger id="campus-status" aria-required="true">
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

      {/* ── CREATE MODE: Add Manager Now vs Add Manager Later ── */}
      {!campus && (
        <div style={{ marginTop: "32px", borderTop: "1px solid #e4e4e7", paddingTop: "24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "4px" }}>
              Campus Manager Credentials
            </h3>
            <p style={{ fontSize: "13px", color: "#71717a" }}>
              Choose whether to appoint a manager now or assign one later.
            </p>
          </div>

          {/* Mode Selector */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={() => setManagerMode("assign_now")}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "8px",
                border: managerMode === "assign_now" ? "2px solid #09090b" : "1px solid #e4e4e7",
                background: managerMode === "assign_now" ? "#f9fafb" : "#fff",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#09090b" }}>
                Assign Manager Now
              </div>
              <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>
                Send setup email with credentials link immediately
              </div>
            </button>

            <button
              type="button"
              onClick={() => setManagerMode("add_later")}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "8px",
                border: managerMode === "add_later" ? "2px solid #09090b" : "1px solid #e4e4e7",
                background: managerMode === "add_later" ? "#f9fafb" : "#fff",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#09090b" }}>
                Add Manager Later
              </div>
              <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>
                Create campus branch now, appoint manager at any time
              </div>
            </button>
          </div>

          {managerMode === "assign_now" ? (
            <div style={{ background: "#fafafa", padding: "16px", borderRadius: "10px", border: "1px solid #e4e4e7" }}>
              <div className="campus-form-field" style={{ marginBottom: "14px" }}>
                <Label htmlFor="manager-name" style={{ display: "block", marginBottom: "6px" }}>
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
                />
              </div>
              <div className="campus-form-field" style={{ marginBottom: "14px" }}>
                <Label htmlFor="manager-email" style={{ display: "block", marginBottom: "6px" }}>
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
                />
              </div>
              <div className="campus-form-field">
                <Label htmlFor="manager-phone" style={{ display: "block", marginBottom: "6px" }}>
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
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 16px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                color: "#1e40af",
                fontSize: "13px",
              }}
            >
              <Info size={18} style={{ flexShrink: 0 }} />
              <div>
                This branch will be saved without an assigned manager. You will see an <strong>Unassigned</strong> tag with a 1-click <strong>+ Assign</strong> button on the campus list.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EDIT MODE: Existing Campus Manager Credentials ── */}
      {campus && (
        <div style={{ marginTop: "32px", borderTop: "1px solid #e4e4e7", paddingTop: "24px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "4px" }}>
            Campus Manager & Credentials
          </h3>
          <p style={{ fontSize: "13px", color: "#71717a", marginBottom: "16px" }}>
            Review, edit credentials, or resend setup invitation emails.
          </p>

          {existingManager ? (
            <div style={{ border: "1px solid #e4e4e7", borderRadius: "10px", padding: "16px", background: "#f9fafb" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#18181b",
                      color: "#fff",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {(existingManager.name || "M").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{existingManager.name}</div>
                    <div style={{ fontSize: "12px", color: "#71717a" }}>{existingManager.email}</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: existingManager.status === "Active" ? "#ecfdf5" : "#fef3c7",
                    color: existingManager.status === "Active" ? "#065f46" : "#92400e",
                  }}
                >
                  {existingManager.status === "Active" ? "Active" : "Pending Setup"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #e4e4e7" }}>
                <button
                  type="button"
                  onClick={handleResendInvite}
                  disabled={resendingEmail}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "32px",
                    padding: "0 12px",
                    background: "#09090b",
                    color: "#fff",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {resendingEmail ? <Loader2 size={12} className="spin" /> : <Send size={12} />}
                  Resend Setup Email
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "32px",
                    padding: "0 12px",
                    background: "#fff",
                    color: "#09090b",
                    borderRadius: "6px",
                    border: "1px solid #e4e4e7",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {copiedLink ? <Check size={12} style={{ color: "green" }} /> : <Copy size={12} />}
                  {copiedLink ? "Copied!" : "Copy Setup Link"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingExistingManager(!isEditingExistingManager)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "32px",
                    padding: "0 12px",
                    background: "#fff",
                    color: "#09090b",
                    borderRadius: "6px",
                    border: "1px solid #e4e4e7",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {isEditingExistingManager ? "Cancel Edit" : "Edit Profile"}
                </button>
              </div>

              {/* Inline Edit Existing Manager */}
              {isEditingExistingManager && (
                <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #e4e4e7" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <Label style={{ fontSize: "11px", marginBottom: "4px", display: "block" }}>Full Name</Label>
                      <Input
                        value={existingManagerForm.name}
                        onChange={(e) => setExistingManagerForm({ ...existingManagerForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label style={{ fontSize: "11px", marginBottom: "4px", display: "block" }}>Email</Label>
                      <Input
                        value={existingManagerForm.email}
                        onChange={(e) => setExistingManagerForm({ ...existingManagerForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label style={{ fontSize: "11px", marginBottom: "4px", display: "block" }}>Phone</Label>
                      <Input
                        value={existingManagerForm.phone}
                        onChange={(e) => setExistingManagerForm({ ...existingManagerForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label style={{ fontSize: "11px", marginBottom: "4px", display: "block" }}>Status</Label>
                      <select
                        value={existingManagerForm.status}
                        onChange={(e) => setExistingManagerForm({ ...existingManagerForm, status: e.target.value })}
                        style={{ height: "36px", width: "100%", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", padding: "0 8px", fontSize: "13px" }}
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveExistingManager}
                      disabled={savingExistingManager}
                    >
                      {savingExistingManager && <Loader2 size={12} className="spin mr-1" />}
                      Save Manager Profile
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "16px", background: "#fafafa", borderRadius: "10px", border: "1px dashed #e4e4e7" }}>
              <div style={{ fontSize: "13px", color: "#71717a", marginBottom: "12px" }}>
                No manager assigned to this campus branch yet. Enter details to appoint a manager:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <Label style={{ fontSize: "12px", marginBottom: "4px", display: "block" }}>Manager Full Name</Label>
                  <Input
                    placeholder="e.g. Asad Malik"
                    value={values.managerName}
                    onChange={(e) => setValues({ ...values, managerName: e.target.value })}
                  />
                </div>
                <div>
                  <Label style={{ fontSize: "12px", marginBottom: "4px", display: "block" }}>Manager Email</Label>
                  <Input
                    type="email"
                    placeholder="manager@campus.edu"
                    value={values.managerEmail}
                    onChange={(e) => setValues({ ...values, managerEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          id="campus-form-error"
          className="campus-error"
          role="alert"
          style={{ color: "red", fontSize: "14px", marginTop: "16px", marginBottom: "0" }}
        >
          {error}
        </p>
      )}

      <div
        className="campus-form-actions"
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-start",
          alignItems: "center",
          marginTop: "28px",
          flexWrap: "wrap",
        }}
      >
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {campus ? "Save Changes" : "Create Campus"}
        </Button>

        {!campus && (
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => submit(null, true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} />
            Save & Add Another Campus
          </Button>
        )}
      </div>
    </form>
  );
}
