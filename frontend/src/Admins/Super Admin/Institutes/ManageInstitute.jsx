import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { updateInstitute } from "@/store/Slices/institutesSlice";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import { Building2, User, MapPin, Loader2, Save, Plus, RefreshCw, Pencil, Send, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";

const selectStyle = {
  height: "36px", width: "100%", borderRadius: "6px",
  border: "1px solid #e4e4e7", background: "#fff",
  color: "#09090b", fontSize: "14px", fontWeight: 500,
  padding: "0 12px", outline: "none", cursor: "pointer", boxSizing: "border-box",
};

const TAB_DETAILS = "details";
const TAB_ADMIN   = "admin";
const TAB_CAMPUSES = "campuses";

export default function ManageInstitute({ institute, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(institute?.initialTab || TAB_DETAILS);

  /* ── Details ─────────────────────────────── */
  const [details, setDetails] = useState({
    name:   institute?.name   || "",
    type:   institute?.type   || "University",
    board:  institute?.board  || "",
    email:  institute?.email  || "",
    phone:  institute?.phone  || "",
    status: institute?.status || "Active",
  });
  const [savingDetails, setSavingDetails] = useState(false);

  useEffect(() => {
    if (institute) {
      setDetails({
        name:   institute.name   || "",
        type:   institute.type   || "University",
        board:  institute.board  || "",
        email:  institute.email  || "",
        phone:  institute.phone  || "",
        status: institute.status || "Active",
      });
    }
  }, [institute]);

  const handleDetailChange = (e) =>
    setDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const saveDetails = async () => {
    setSavingDetails(true);
    try {
      await dispatch(updateInstitute({ id: institute._id || institute.id, ...details })).unwrap();
      toast.success("Institute details updated!");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update institute");
    } finally {
      setSavingDetails(false);
    }
  };

  /* ── Admin ────────────────────────────────── */
  const [adminInfo, setAdminInfo] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({ name: "", email: "" });
  const [assigning, setAssigning] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Resend / Link / Edit Admin State
  const [resendingAdminEmail, setResendingAdminEmail] = useState(false);
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);
  const [latestAdminSetupLink, setLatestAdminSetupLink] = useState("");
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [editAdminForm, setEditAdminForm] = useState({ name: "", email: "", phone: "", status: "Active" });
  const [savingAdmin, setSavingAdmin] = useState(false);

  const loadAdmin = async () => {
    if (!institute._id && !institute.id) return;
    setAdminLoading(true);
    try {
      const res = await axiosInstance.get(`/super-admin/institutes/${institute._id || institute.id}`);
      const inst = res.data.data;
      setAdminInfo(inst?.adminId || null);
      if (inst?.adminId) {
        setEditAdminForm({
          name: inst.adminId.name || "",
          email: inst.adminId.email || "",
          phone: inst.adminId.phone || "",
          status: inst.adminId.status || "Active",
        });
      }
    } catch {
      setAdminInfo(null);
    } finally {
      setAdminLoading(false);
    }
  };

  const assignAdmin = async () => {
    if (!assignForm.email) { toast.error("Admin email is required"); return; }
    setAssigning(true);
    try {
      const res = await axiosInstance.post(
        `/super-admin/institutes/${institute._id || institute.id}/assign-admin`,
        {
          email: assignForm.email.trim(),
          newAdminData: {
            name: assignForm.name ? assignForm.name.trim() : "Institute Admin",
            email: assignForm.email.trim(),
            password: "temp123456",
          },
        }
      );
      toast.success("Admin assigned! Setup email dispatched.");
      if (res.data?.data?.resetLink) {
        setLatestAdminSetupLink(res.data.data.resetLink);
      }
      setShowAssignForm(false);
      setAssignForm({ name: "", email: "" });
      loadAdmin();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign admin");
    } finally {
      setAssigning(false);
    }
  };

  const resendAdminInvite = async () => {
    setResendingAdminEmail(true);
    try {
      const res = await axiosInstance.post(`/super-admin/institutes/${institute._id || institute.id}/resend-admin-invite`);
      toast.success(res.data?.message || "Setup email sent successfully!");
      if (res.data?.data?.resetLink) {
        setLatestAdminSetupLink(res.data.data.resetLink);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send setup email");
    } finally {
      setResendingAdminEmail(false);
    }
  };

  const copyAdminLink = async () => {
    let link = latestAdminSetupLink;
    if (!link) {
      try {
        const res = await axiosInstance.post(`/super-admin/institutes/${institute._id || institute.id}/resend-admin-invite`);
        link = res.data?.data?.resetLink;
        if (link) setLatestAdminSetupLink(link);
      } catch (err) {
        toast.error("Failed to generate link: " + (err.response?.data?.message || err.message));
        return;
      }
    }
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setCopiedAdminLink(true);
        toast.success("Setup link copied to clipboard!");
        setTimeout(() => setCopiedAdminLink(false), 3000);
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  const saveAdminDetails = async (e) => {
    e.preventDefault();
    setSavingAdmin(true);
    try {
      const res = await axiosInstance.put(`/super-admin/institutes/${institute._id || institute.id}/admin`, editAdminForm);
      toast.success("Admin details updated successfully!");
      setAdminInfo(res.data?.data || { ...adminInfo, ...editAdminForm });
      setIsEditingAdmin(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update admin");
    } finally {
      setSavingAdmin(false);
    }
  };

  /* ── Campuses ─────────────────────────────── */
  const [campuses, setCampuses] = useState([]);
  const [campusLoading, setCampusLoading] = useState(false);
  const [addCampusForm, setAddCampusForm] = useState({ name: "", location: "", status: "Active" });
  const [addingCampus, setAddingCampus] = useState(false);
  const [showCampusForm, setShowCampusForm] = useState(false);

  const loadCampuses = async () => {
    if (!institute._id && !institute.id) return;
    setCampusLoading(true);
    try {
      const res = await axiosInstance.get(`/super-admin/campuses?instituteId=${institute._id || institute.id}`);
      setCampuses(res.data.data || []);
    } catch {
      setCampuses([]);
    } finally {
      setCampusLoading(false);
    }
  };

  const addCampus = async () => {
    if (!addCampusForm.name) { toast.error("Campus name is required"); return; }
    setAddingCampus(true);
    try {
      await axiosInstance.post("/super-admin/campuses", {
        ...addCampusForm,
        address: { city: addCampusForm.location },
        location: addCampusForm.location,
        instituteId: institute._id || institute.id,
      });
      toast.success("Campus added!");
      setShowCampusForm(false);
      setAddCampusForm({ name: "", location: "", status: "Active" });
      loadCampuses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add campus");
    } finally {
      setAddingCampus(false);
    }
  };

  useEffect(() => {
    if (activeTab === TAB_ADMIN)    loadAdmin();
    if (activeTab === TAB_CAMPUSES) loadCampuses();
  }, [activeTab]);

  const tabs = [
    { id: TAB_DETAILS,  label: "Details",  icon: Building2 },
    { id: TAB_ADMIN,    label: "Admin",    icon: User },
    { id: TAB_CAMPUSES, label: "Campuses", icon: MapPin },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #e4e4e7", paddingBottom: "0" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "6px 6px 0 0",
              border: "none", background: activeTab === id ? "#09090b" : "transparent",
              color: activeTab === id ? "#fff" : "#52525b",
              fontWeight: 600, fontSize: "13px", cursor: "pointer",
              borderBottom: activeTab === id ? "2px solid #09090b" : "none",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: DETAILS ── */}
      {activeTab === TAB_DETAILS && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Institute Name</label>
              <Input name="name" value={details.name} onChange={handleDetailChange} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Type</label>
              <select name="type" value={details.type} onChange={handleDetailChange} style={selectStyle}>
                <option>University</option>
                <option>College</option>
                <option>School</option>
                <option>Institute</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Board / Affiliation</label>
              <Input name="board" value={details.board} onChange={handleDetailChange} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Institute Email</label>
              <Input type="email" name="email" value={details.email} onChange={handleDetailChange} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Phone</label>
              <Input name="phone" value={details.phone} onChange={handleDetailChange} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Status</label>
              <select name="status" value={details.status} onChange={handleDetailChange} style={selectStyle}>
                <option>Active</option>
                <option>Pending</option>
                <option>Suspended</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => navigate(`/institutes/${institute._id || institute.id}/edit`)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "36px",
                padding: "0 16px",
                borderRadius: "6px",
                border: "1px solid #e4e4e7",
                background: "#fff",
                color: "#09090b",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <Pencil size={14} /> Edit Full Profile
            </button>
            <button
              onClick={saveDetails}
              disabled={savingDetails}
              style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 20px", borderRadius: "6px", border: "none", background: "#09090b", color: "#fff", fontWeight: 600, fontSize: "14px", cursor: "pointer", opacity: savingDetails ? 0.7 : 1 }}
            >
              {savingDetails ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
              {savingDetails ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: ADMIN ── */}
      {activeTab === TAB_ADMIN && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {adminLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#71717a", padding: "16px 0" }}>
              <Loader2 size={16} /> Loading admin info...
            </div>
          ) : adminInfo ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "#f9fafb", borderRadius: "10px", border: "1px solid #e4e4e7", padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#09090b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "16px", flexShrink: 0 }}>
                  {(adminInfo.name || "A").slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#09090b" }}>{adminInfo.name}</span>
                    <span style={{ padding: "2px 8px", background: adminInfo.status === "Active" ? "#ecfdf5" : "#fef3c7", color: adminInfo.status === "Active" ? "#065f46" : "#92400e", borderRadius: "999px", fontSize: "11px", fontWeight: 700, border: `1px solid ${adminInfo.status === "Active" ? "#a7f3d0" : "#fde68a"}` }}>
                      {adminInfo.status === "Active" ? "Active" : "Pending Setup"}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>{adminInfo.email}</div>
                  {adminInfo.phone && <div style={{ fontSize: "12px", color: "#71717a" }}>{adminInfo.phone}</div>}
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={resendAdminInvite}
                  disabled={resendingAdminEmail}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 14px", borderRadius: "6px", border: "none", background: "#09090b", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer", opacity: resendingAdminEmail ? 0.7 : 1 }}
                >
                  {resendingAdminEmail ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
                  {resendingAdminEmail ? "Sending..." : "Resend Setup Email"}
                </button>

                <button
                  onClick={copyAdminLink}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 14px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", color: "#09090b", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                >
                  {copiedAdminLink ? <Check size={13} style={{ color: "green" }} /> : <Copy size={13} />}
                  {copiedAdminLink ? "Link Copied!" : "Copy Setup Link"}
                </button>

                <button
                  onClick={() => setIsEditingAdmin(!isEditingAdmin)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 14px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", color: "#09090b", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                >
                  <Pencil size={13} /> {isEditingAdmin ? "Cancel Edit" : "Edit Admin Details"}
                </button>

                <button
                  onClick={() => setShowAssignForm(!showAssignForm)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 14px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", color: "#09090b", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                >
                  <User size={13} /> Reassign Admin
                </button>

                <button
                  onClick={loadAdmin}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 14px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", color: "#52525b", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {/* Direct Link Banner if generated */}
              {latestAdminSetupLink && (
                <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534" }}>ACTIVE SETUP LINK:</div>
                    <div style={{ fontSize: "12px", color: "#15803d", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{latestAdminSetupLink}</div>
                  </div>
                  <button onClick={copyAdminLink} style={{ height: "28px", padding: "0 10px", fontSize: "12px", borderRadius: "6px", border: "1px solid #bbf7d0", background: "#fff", cursor: "pointer", flexShrink: 0 }}>
                    {copiedAdminLink ? "Copied" : "Copy"}
                  </button>
                </div>
              )}

              {/* Inline Edit Form */}
              {isEditingAdmin && (
                <form onSubmit={saveAdminDetails} style={{ background: "#f9fafb", borderRadius: "10px", border: "1px solid #e4e4e7", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", margin: 0 }}>Edit Admin Profile</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Full Name</label>
                      <Input value={editAdminForm.name} onChange={(e) => setEditAdminForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Email Address</label>
                      <Input type="email" value={editAdminForm.email} onChange={(e) => setEditAdminForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Phone Number</label>
                      <Input value={editAdminForm.phone} onChange={(e) => setEditAdminForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Account Status</label>
                      <select value={editAdminForm.status} onChange={(e) => setEditAdminForm(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button type="button" onClick={() => setIsEditingAdmin(false)} style={{ height: "32px", padding: "0 14px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", color: "#09090b", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                    <button type="submit" disabled={savingAdmin} style={{ display: "flex", alignItems: "center", gap: "6px", height: "32px", padding: "0 14px", borderRadius: "6px", border: "none", background: "#09090b", color: "#fff", fontWeight: 600, fontSize: "12px", cursor: "pointer", opacity: savingAdmin ? 0.7 : 1 }}>
                      {savingAdmin ? <Loader2 size={12} className="spin" /> : <Save size={12} />}
                      {savingAdmin ? "Saving..." : "Save Admin Profile"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "16px", background: "#fafafa", borderRadius: "10px", border: "1px dashed #e4e4e7", color: "#71717a", fontSize: "13px", textAlign: "center" }}>
                No admin assigned to this institute yet.
              </div>
              <div>
                <button
                  onClick={() => setShowAssignForm(!showAssignForm)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 14px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", color: "#09090b", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                >
                  <User size={13} /> Assign Admin
                </button>
              </div>
            </div>
          )}

          {showAssignForm && (
            <div style={{ background: "#f9fafb", borderRadius: "10px", border: "1px solid #e4e4e7", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", margin: 0 }}>New Admin Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Full Name</label>
                  <Input placeholder="Admin Full Name" value={assignForm.name} onChange={(e) => setAssignForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Email Address</label>
                  <Input type="email" placeholder="admin@institute.com" value={assignForm.email} onChange={(e) => setAssignForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <p style={{ fontSize: "11px", color: "#71717a", margin: 0 }}>
                A setup email will be sent to the admin so they can set their own password.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button onClick={() => setShowAssignForm(false)} style={{ height: "34px", padding: "0 16px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", color: "#09090b", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={assignAdmin} disabled={assigning} style={{ display: "flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 16px", borderRadius: "6px", border: "none", background: "#09090b", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer", opacity: assigning ? 0.7 : 1 }}>
                  {assigning ? <Loader2 size={13} /> : <User size={13} />}
                  {assigning ? "Assigning..." : "Assign Admin"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CAMPUSES ── */}
      {activeTab === TAB_CAMPUSES && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#52525b", fontWeight: 600 }}>{campuses.length} campus{campuses.length !== 1 ? "es" : ""} registered</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={loadCampuses} style={{ display: "flex", alignItems: "center", gap: "6px", height: "32px", padding: "0 12px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", color: "#52525b", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
                <RefreshCw size={12} /> Refresh
              </button>
              <button onClick={() => setShowCampusForm(!showCampusForm)} style={{ display: "flex", alignItems: "center", gap: "6px", height: "32px", padding: "0 12px", borderRadius: "6px", border: "none", background: "#09090b", color: "#fff", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
                <Plus size={12} /> Add Campus
              </button>
            </div>
          </div>

          {showCampusForm && (
            <div style={{ background: "#f9fafb", borderRadius: "10px", border: "1px solid #e4e4e7", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", margin: 0 }}>New Campus</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Campus Name</label>
                  <Input placeholder="e.g. Main Campus" value={addCampusForm.name} onChange={(e) => setAddCampusForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Location</label>
                  <Input placeholder="e.g. Islamabad" value={addCampusForm.location} onChange={(e) => setAddCampusForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#52525b" }}>Status</label>
                  <select value={addCampusForm.status} onChange={(e) => setAddCampusForm(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button onClick={() => setShowCampusForm(false)} style={{ height: "34px", padding: "0 16px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", color: "#09090b", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={addCampus} disabled={addingCampus} style={{ display: "flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 16px", borderRadius: "6px", border: "none", background: "#09090b", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer", opacity: addingCampus ? 0.7 : 1 }}>
                  {addingCampus ? <Loader2 size={13} /> : <Plus size={13} />}
                  {addingCampus ? "Adding..." : "Add Campus"}
                </button>
              </div>
            </div>
          )}

          {campusLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#71717a", padding: "16px 0" }}>
              <Loader2 size={16} /> Loading campuses...
            </div>
          ) : campuses.length === 0 ? (
            <div style={{ padding: "24px", background: "#fafafa", borderRadius: "10px", border: "1px dashed #e4e4e7", color: "#71717a", fontSize: "13px", textAlign: "center" }}>
              No campuses added yet. Click "Add Campus" to create the first one.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {campuses.map((campus) => (
                <div key={campus._id || campus.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f9fafb", borderRadius: "10px", border: "1px solid #e4e4e7" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#09090b" }}>{campus.name}</div>
                    {(campus.location || campus.address?.city || campus.address?.street) && (
                      <div style={{ fontSize: "11px", color: "#71717a", marginTop: "2px" }}>
                        {campus.location || campus.address?.city || campus.address?.street}
                      </div>
                    )}
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: campus.status === "Active" ? "#09090b" : "#f4f4f5", color: campus.status === "Active" ? "#fff" : "#52525b" }}>
                    {campus.status || "Active"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
