import { useState, useEffect } from "react";
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  Send,
  Copy,
  Check,
  Pencil,
  UserPlus,
  Loader2,
  ExternalLink,
  ShieldAlert,
  GraduationCap,
  Users,
  MapPin,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import "./ManageCampusModal.css";

export default function ManageCampusModal({ campus, open, onClose, onCampusUpdated }) {
  const [activeTab, setActiveTab] = useState("manager"); // "manager" | "overview"
  const [campusData, setCampusData] = useState(campus || null);
  const [loadingCampus, setLoadingCampus] = useState(false);

  // Manager Actions State
  const [resendingEmail, setResendingEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [latestSetupLink, setLatestSetupLink] = useState("");

  // Edit Manager State
  const [isEditingManager, setIsEditingManager] = useState(false);
  const [editManagerForm, setEditManagerForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "Active",
  });
  const [savingManager, setSavingManager] = useState(false);

  // Appoint / Assign Manager State
  const [isAssigningManager, setIsAssigningManager] = useState(false);
  const [assignForm, setAssignForm] = useState({
    name: "",
    email: "",
    phone: "",
    sendEmail: true,
  });
  const [appointingManager, setAppointingManager] = useState(false);

  // Sync state and fetch fresh details with counts
  useEffect(() => {
    if (!open || !campus?.id) return;

    let isMounted = true;
    setCampusData(campus);
    setLatestSetupLink("");
    setCopiedLink(false);
    setIsEditingManager(false);
    setIsAssigningManager(false);

    const fetchDetails = async () => {
      setLoadingCampus(true);
      try {
        const res = await axiosInstance.get(`/institute-admin/campuses/${campus.id}`);
        if (isMounted && res.data?.data) {
          setCampusData(res.data.data);
          if (res.data.data.managerId) {
            setEditManagerForm({
              name: res.data.data.managerId.name || "",
              email: res.data.data.managerId.email || "",
              phone: res.data.data.managerId.phone || "",
              status: res.data.data.managerId.status || "Active",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load campus details:", err);
      } finally {
        if (isMounted) setLoadingCampus(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [open, campus]);

  if (!open || !campusData) return null;

  const manager = campusData.managerId;
  const addressText =
    typeof campusData.address === "object"
      ? campusData.address?.street || campusData.address?.city || ""
      : campusData.address || "";

  // 1. Resend Setup Email
  const handleResendInvite = async () => {
    setResendingEmail(true);
    try {
      const res = await axiosInstance.post(`/institute-admin/campuses/${campusData._id || campusData.id}/resend-invite`);
      toast.success(res.data?.message || "Setup email sent successfully!");
      if (res.data?.data?.resetLink) {
        setLatestSetupLink(res.data.data.resetLink);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend setup email.");
    } finally {
      setResendingEmail(false);
    }
  };

  // 2. Copy Setup Link
  const handleCopyLink = async () => {
    let linkToCopy = latestSetupLink;

    if (!linkToCopy) {
      // Fetch or generate link
      try {
        const res = await axiosInstance.post(`/institute-admin/campuses/${campusData._id || campusData.id}/resend-invite`);
        linkToCopy = res.data?.data?.resetLink;
        if (linkToCopy) setLatestSetupLink(linkToCopy);
      } catch (err) {
        toast.error("Could not generate link: " + (err.response?.data?.message || err.message));
        return;
      }
    }

    if (linkToCopy) {
      try {
        await navigator.clipboard.writeText(linkToCopy);
        setCopiedLink(true);
        toast.success("Setup link copied to clipboard!");
        setTimeout(() => setCopiedLink(false), 3000);
      } catch {
        toast.error("Failed to copy to clipboard.");
      }
    }
  };

  // 3. Save Edited Manager Details
  const handleSaveManager = async (e) => {
    e.preventDefault();
    setSavingManager(true);
    try {
      const res = await axiosInstance.put(
        `/institute-admin/campuses/${campusData._id || campusData.id}/manager`,
        editManagerForm
      );
      toast.success("Manager details updated!");
      setCampusData((prev) => ({
        ...prev,
        managerId: res.data?.data || { ...prev.managerId, ...editManagerForm },
      }));
      setIsEditingManager(false);
      if (onCampusUpdated) onCampusUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update manager.");
    } finally {
      setSavingManager(false);
    }
  };

  // 4. Appoint New Manager
  const handleAppointManager = async (e) => {
    e.preventDefault();
    if (!assignForm.email) {
      toast.error("Manager email is required");
      return;
    }
    setAppointingManager(true);
    try {
      const res = await axiosInstance.post(
        `/institute-admin/campuses/${campusData._id || campusData.id}/assign-manager`,
        assignForm
      );
      toast.success("Campus Manager appointed successfully!");
      if (res.data?.data?.resetLink) {
        setLatestSetupLink(res.data.data.resetLink);
      }
      if (res.data?.data?.manager) {
        setCampusData((prev) => ({
          ...prev,
          managerId: res.data.data.manager,
        }));
      }
      setIsAssigningManager(false);
      setAssignForm({ name: "", email: "", phone: "", sendEmail: true });
      if (onCampusUpdated) onCampusUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to appoint manager.");
    } finally {
      setAppointingManager(false);
    }
  };

  return (
    <div className="mcm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mcm-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="mcm-header">
          <div className="mcm-header-left">
            <div className="mcm-icon-box">
              <Building2 size={22} />
            </div>
            <div className="mcm-title-wrap">
              <h2>{campusData.name}</h2>
              <p>ID: {campusData.id || campusData._id} • {addressText || "No address specified"}</p>
            </div>
          </div>
          <button className="mcm-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="mcm-tabs">
          <button
            className={`mcm-tab ${activeTab === "manager" ? "active" : ""}`}
            onClick={() => setActiveTab("manager")}
          >
            <User size={16} />
            Campus Manager & Credentials
          </button>
          <button
            className={`mcm-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Building2 size={16} />
            Branch Overview & Stats
          </button>
        </div>

        {/* Modal Content */}
        <div className="mcm-body">
          {loadingCampus ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#71717a" }}>
              <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>Loading campus records...</p>
            </div>
          ) : activeTab === "manager" ? (
            <div>
              {manager ? (
                <div>
                  {/* Manager Credentials Card */}
                  <div className="mcm-manager-card">
                    <div className="mcm-manager-header">
                      <div className="mcm-manager-profile">
                        <div className="mcm-manager-avatar">
                          {(manager.name || "M").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="mcm-manager-meta">
                          <h3>{manager.name}</h3>
                          <p>{manager.email}</p>
                        </div>
                      </div>
                      <div>
                        <Badge
                          variant="secondary"
                          style={{
                            background: manager.status === "Active" ? "#ecfdf5" : "#fef3c7",
                            color: manager.status === "Active" ? "#065f46" : "#92400e",
                            border: `1px solid ${manager.status === "Active" ? "#a7f3d0" : "#fde68a"}`,
                            fontWeight: 700,
                            padding: "4px 10px",
                          }}
                        >
                          {manager.status === "Active" ? "Active Account" : "Pending Password Setup"}
                        </Badge>
                      </div>
                    </div>

                    {/* Credential Details Grid */}
                    <div className="mcm-cred-grid">
                      <div className="mcm-cred-item">
                        <span className="mcm-cred-label">Login Email</span>
                        <span className="mcm-cred-value">{manager.email}</span>
                      </div>
                      <div className="mcm-cred-item">
                        <span className="mcm-cred-label">Phone Contact</span>
                        <span className="mcm-cred-value">{manager.phone || "Not provided"}</span>
                      </div>
                      <div className="mcm-cred-item">
                        <span className="mcm-cred-label">System Role</span>
                        <span className="mcm-cred-value">Campus Manager (Admin)</span>
                      </div>
                      <div className="mcm-cred-item">
                        <span className="mcm-cred-label">Credentials Status</span>
                        <span className="mcm-cred-value">
                          {manager.status === "Active" ? "Password Configured" : "Awaiting First Login"}
                        </span>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="mcm-actions-bar">
                      <button
                        className="mcm-btn-primary"
                        onClick={handleResendInvite}
                        disabled={resendingEmail}
                        title="Resend password setup email to manager"
                      >
                        {resendingEmail ? (
                          <Loader2 size={14} className="spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        {resendingEmail ? "Sending..." : "Resend Setup Email"}
                      </button>

                      <button
                        className="mcm-btn-outline"
                        onClick={handleCopyLink}
                        title="Copy direct password setup URL to clipboard"
                      >
                        {copiedLink ? <Check size={14} style={{ color: "green" }} /> : <Copy size={14} />}
                        {copiedLink ? "Link Copied!" : "Copy Setup Link"}
                      </button>

                      <button
                        className="mcm-btn-outline"
                        onClick={() => {
                          setIsEditingManager(!isEditingManager);
                          setIsAssigningManager(false);
                        }}
                      >
                        <Pencil size={14} />
                        {isEditingManager ? "Cancel Edit" : "Edit Manager Details"}
                      </button>

                      <button
                        className="mcm-btn-outline"
                        onClick={() => {
                          setIsAssigningManager(!isAssigningManager);
                          setIsEditingManager(false);
                        }}
                      >
                        <UserPlus size={14} />
                        Reassign Manager
                      </button>
                    </div>
                  </div>

                  {/* Direct Link Display if generated */}
                  {latestSetupLink && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px 16px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div style={{ overflow: "hidden" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                          Active Setup URL:
                        </span>
                        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#15803d", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {latestSetupLink}
                        </p>
                      </div>
                      <button
                        className="mcm-btn-outline"
                        style={{ height: "30px", fontSize: "12px", padding: "0 10px", flexShrink: 0 }}
                        onClick={handleCopyLink}
                      >
                        {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                        {copiedLink ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}

                  {/* Edit Manager Form */}
                  {isEditingManager && (
                    <form
                      onSubmit={handleSaveManager}
                      style={{
                        marginTop: "20px",
                        padding: "20px",
                        background: "#fafafa",
                        border: "1px solid #e4e4e7",
                        borderRadius: "12px",
                      }}
                    >
                      <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 700 }}>
                        Edit Manager Profile
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        <div>
                          <Label style={{ display: "block", marginBottom: "6px" }}>Full Name</Label>
                          <Input
                            value={editManagerForm.name}
                            onChange={(e) => setEditManagerForm({ ...editManagerForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label style={{ display: "block", marginBottom: "6px" }}>Email</Label>
                          <Input
                            type="email"
                            value={editManagerForm.email}
                            onChange={(e) => setEditManagerForm({ ...editManagerForm, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label style={{ display: "block", marginBottom: "6px" }}>Phone Number</Label>
                          <Input
                            value={editManagerForm.phone}
                            onChange={(e) => setEditManagerForm({ ...editManagerForm, phone: e.target.value })}
                            placeholder="+92 300 0000000"
                          />
                        </div>
                        <div>
                          <Label style={{ display: "block", marginBottom: "6px" }}>Account Status</Label>
                          <select
                            value={editManagerForm.status}
                            onChange={(e) => setEditManagerForm({ ...editManagerForm, status: e.target.value })}
                            style={{
                              height: "36px",
                              width: "100%",
                              borderRadius: "6px",
                              border: "1px solid #e4e4e7",
                              background: "#fff",
                              padding: "0 10px",
                              fontSize: "14px",
                            }}
                          >
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          type="button"
                          className="mcm-btn-outline"
                          onClick={() => setIsEditingManager(false)}
                          disabled={savingManager}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="mcm-btn-primary" disabled={savingManager}>
                          {savingManager ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                          {savingManager ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Empty Manager State */
                <div className="mcm-empty-manager">
                  <div className="mcm-empty-icon">
                    <User size={24} />
                  </div>
                  <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 700 }}>
                    No Manager Appointed
                  </h3>
                  <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#71717a", maxWidth: "420px", marginInline: "auto" }}>
                    This campus branch was created with the <strong>"Add Manager Later"</strong> option. You can appoint a Campus Manager at any time below.
                  </p>
                  {!isAssigningManager && (
                    <button
                      className="mcm-btn-primary"
                      onClick={() => setIsAssigningManager(true)}
                    >
                      <UserPlus size={14} />
                      Appoint Campus Manager Now
                    </button>
                  )}
                </div>
              )}

              {/* Appoint / Reassign Manager Form */}
              {isAssigningManager && (
                <form
                  onSubmit={handleAppointManager}
                  style={{
                    marginTop: "20px",
                    padding: "20px",
                    background: "#f9fafb",
                    border: "1px solid #e4e4e7",
                    borderRadius: "12px",
                  }}
                >
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 700 }}>
                    {manager ? "Reassign Campus Manager" : "Appoint Campus Manager"}
                  </h4>
                  <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#71717a" }}>
                    An invitation email will be dispatched containing the secure password setup link.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                    <div>
                      <Label style={{ display: "block", marginBottom: "6px" }}>Manager Full Name</Label>
                      <Input
                        placeholder="e.g. Tariq Khan"
                        value={assignForm.name}
                        onChange={(e) => setAssignForm({ ...assignForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label style={{ display: "block", marginBottom: "6px" }}>Manager Email Address</Label>
                      <Input
                        type="email"
                        placeholder="manager@branch.edu"
                        value={assignForm.email}
                        onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <Label style={{ display: "block", marginBottom: "6px" }}>Phone (Optional)</Label>
                      <Input
                        placeholder="+92 300 0000000"
                        value={assignForm.phone}
                        onChange={(e) => setAssignForm({ ...assignForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button
                      type="button"
                      className="mcm-btn-outline"
                      onClick={() => setIsAssigningManager(false)}
                      disabled={appointingManager}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="mcm-btn-primary" disabled={appointingManager}>
                      {appointingManager ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />}
                      {appointingManager ? "Appointing..." : "Appoint & Send Setup Email"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Branch Overview Tab */
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Stat Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ background: "#f9fafb", padding: "16px", borderRadius: "10px", border: "1px solid #e4e4e7" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#71717a", fontSize: "13px", fontWeight: 600 }}>
                    <Users size={16} /> Enrolled Students
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#09090b", marginTop: "8px" }}>
                    {campusData.studentCount || 0}
                  </div>
                </div>

                <div style={{ background: "#f9fafb", padding: "16px", borderRadius: "10px", border: "1px solid #e4e4e7" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#71717a", fontSize: "13px", fontWeight: 600 }}>
                    <GraduationCap size={16} /> Faculty / Teachers
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#09090b", marginTop: "8px" }}>
                    {campusData.teacherCount || 0}
                  </div>
                </div>
              </div>

              {/* Branch Details */}
              <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 700 }}>
                  Facility & Location Information
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#71717a", textTransform: "uppercase" }}>
                      Branch Status
                    </span>
                    <div style={{ marginTop: "4px" }}>
                      <Badge variant="secondary" style={{ fontWeight: 700 }}>
                        {campusData.status || "Active"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#71717a", textTransform: "uppercase" }}>
                      Physical Address
                    </span>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "4px" }}>
                      {addressText || "Not specified"}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#71717a", textTransform: "uppercase" }}>
                      Primary Phone
                    </span>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "4px" }}>
                      {campusData.phone || "Not specified"}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#71717a", textTransform: "uppercase" }}>
                      Branch Email
                    </span>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "4px" }}>
                      {campusData.email || "Not specified"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
