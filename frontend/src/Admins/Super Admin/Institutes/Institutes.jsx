import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  Users,
  Star,
  X,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  Building2,
  ArrowLeft,
} from "lucide-react";
import "./Institutes.css";
import {
  fetchInstitutes,
  selectInstitutes,
  addInstitute,
  updateInstitute,
  deleteInstitute,
  optimisticStatusChange,
} from "@/store/Slices/institutesSlice";
import InstituteForm from "./InstituteForm";
import ManageInstitute from "./ManageInstitute";
import toast from "react-hot-toast";

export default function Institutes() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const institutes = useSelector(selectInstitutes);
  Star,
  X,
  UserPlus,
  CreditCard,
  ShieldCheck,
  Users,
  MapPin,
} from "lucide-react";
import "./Institutes.css";
import { instituteRecords, saveInstitutes } from "./instituteData";

const seedInstitutes = instituteRecords;

export default function Institutes() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [manageDrawer, setManageDrawer] = useState(null);
  const [data, setData] = useState(seedInstitutes);
  const [statusMenuFor, setStatusMenuFor] = useState(null);
  const [instituteToDelete, setInstituteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchInstitutes());
  }, [dispatch]);

  const data = institutes || [];

  const visible = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return data.filter((item) => {
      const matchesQuery =
        !clean ||
        item.name?.toLowerCase().includes(clean) ||
        item.type?.toLowerCase().includes(clean) ||
        item.board?.toLowerCase().includes(clean) ||
        item.status?.toLowerCase().includes(clean);

      const matchesType =
        typeFilter === "all" ||
        item.type?.toLowerCase() === typeFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        item.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesQuery && matchesType && matchesStatus;
    });
  }, [data, query, typeFilter, statusFilter]);

  const updateStatus = async (instituteId, nextStatus) => {
    dispatch(optimisticStatusChange({ id: instituteId, status: nextStatus }));
  const updateStatus = (instituteId, nextStatus) => {
    const nextItems = data.map((item) =>
      item.id === instituteId ? { ...item, status: nextStatus } : item,
    );
    setData(nextItems);
    saveInstitutes(nextItems);
    setStatusMenuFor(null);
    try {
      await dispatch(updateInstitute({ id: instituteId, status: nextStatus })).unwrap();
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Failed to update status");
      dispatch(fetchInstitutes());
    }
  };

  const confirmDelete = async () => {
    if (!instituteToDelete) return;
    setDeleting(true);
    try {
      await dispatch(deleteInstitute(instituteToDelete.id || instituteToDelete._id)).unwrap();
      toast.success(`${instituteToDelete.name} deleted successfully`);
      setInstituteToDelete(null);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Failed to delete institute");
    } finally {
      setDeleting(false);
    }
  };

  const openInstituteDetails = (institute) => {
    navigate(`/institutes/${institute.id}`);
  };

  const openEditInstitute = (institute) => {
    navigate(`/institutes/${institute.id}/edit`);
  };

  return (
    <section className="super-admin-institutes-page">
      {manageDrawer ? (
        <div
          className="super-admin-manage-fullscreen"
          style={{ animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        >
          <div
            className="super-admin-drawer-head"
            style={{
              marginBottom: "12px",
              paddingBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "12px",
              borderBottom: "none",
            }}
          >
            <button
              className="super-admin-back-button"
              onClick={() => setManageDrawer(null)}
              aria-label="Back to institutes"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "1px solid #e4e4e7",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span
                className="super-admin-drawer-kicker"
                style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "#71717a" }}
              >
                Institute Management
              </span>
              <h3 style={{ fontSize: "20px", margin: "0", fontWeight: 700 }}>
                {manageDrawer.mode === "new"
                  ? "Add New Institute"
                  : manageDrawer.name}
              </h3>
            </div>
          </div>

          <div
            className="super-admin-manage-card-wrap"
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e4e4e7",
              padding: "20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.02)",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {manageDrawer.mode === "new" ? (
              <InstituteForm
                onSave={async (values) => {
                  try {
                    await dispatch(addInstitute(values)).unwrap();
                    toast.success("Institute added successfully!");
                    setManageDrawer(null);
                  } catch (error) {
                    toast.error(
                      typeof error === "string" ? error : "Failed to add institute"
                    );
                    throw error;
                  }
                }}
                onCancel={() => setManageDrawer(null)}
              />
            ) : (
              <ManageInstitute
                institute={manageDrawer}
                onClose={() => setManageDrawer(null)}
              />
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="institutes-top">
            <div className="breadcrumb-row">
              <span className="breadcrumb-home">Dashboard</span>
              <span className="breadcrumb-sep">&gt;</span>
              <span className="breadcrumb-current">Institutes</span>
            </div>

            <div className="institutes-title-row">
              <div>
                <h1>Institutes</h1>
                <p>Manage all registered networks across the global system.</p>
              </div>
              <button
                className="add-institute-button"
                onClick={() => setManageDrawer({ mode: "new" })}
              >
                <span>+</span> Add Institute
              </button>
            </div>
          </div>

      <section className="institutes-table-panel">
        <div className="institutes-toolbar">
          <div className="institutes-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search institutes, programs, locations..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button
            className={`institutes-filter ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "38px",
              padding: "0 14px",
              borderRadius: "8px",
              border: showFilters ? "1px solid #09090b" : "1px solid #e4e4e7",
              background: showFilters ? "#09090b" : "#fff",
              color: showFilters ? "#fff" : "#09090b",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <SlidersHorizontal size={16} />
            <span>Filters{(typeFilter !== "all" || statusFilter !== "all") ? " (Active)" : ""}</span>
          </button>
        </div>

        {/* Real Collapsible Filters Bar */}
        {showFilters && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              background: "#fafafa",
              borderRadius: "10px",
              border: "1px solid #e4e4e7",
              margin: "12px 0 16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#71717a", textTransform: "uppercase" }}>Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ height: "32px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", padding: "0 8px", fontSize: "13px", fontWeight: 500 }}
              >
                <option value="all">All Types</option>
                <option value="University">University</option>
                <option value="College">College</option>
                <option value="School">School</option>
                <option value="Institute">Institute</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#71717a", textTransform: "uppercase" }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: "32px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", padding: "0 8px", fontSize: "13px", fontWeight: 500 }}
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {(typeFilter !== "all" || statusFilter !== "all" || query) && (
              <button
                type="button"
                onClick={() => {
                  setTypeFilter("all");
                  setStatusFilter("all");
                  setQuery("");
                }}
                style={{
                  height: "30px",
                  padding: "0 10px",
                  borderRadius: "6px",
                  border: "1px solid #e4e4e7",
                  background: "#fff",
                  color: "#dc2626",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        <div className="institutes-table-wrap">
          <table className="institutes-table">
            <thead>
              <tr>
                <th>Institute Name</th>
                <th>Board / Type</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((institute) => (
                <tr
                  key={institute.id}
                  onClick={() => openInstituteDetails(institute)}
                  className="institute-list-row"
                >
                  <td>
                    <div className="institute-name-cell">
                      <img
                        className="institute-thumb"
                        src={institute.image || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=80&q=80"}
                        alt=""
                      />
                      <div>
                        <div className="institute-name">{institute.name}</div>
                        <div className="institute-date">
                          Added{" "}
                          {new Date(institute.createdAt || institute.added || new Date()).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="institute-type-cell">
                      <span className="type-label">{institute.type}</span>
                      <span className="board-label">{institute.board}</span>
                    </div>
                  </td>

                  <td>
                    <div className="status-wrap">
                      <button
                        className={`status-badge status-${institute.status.toLowerCase()}`}
                        onClick={() =>
                          setStatusMenuFor(
                            statusMenuFor === institute.id
                              ? null
                              : institute.id,
                          )
                        }
                      >
                        <span className="badge-dot" /> {institute.status}
                      </button>
                      {statusMenuFor === institute.id && (
                        <select
                          className="status-select"
                          value={institute.status}
                          onChange={(event) =>
                            updateStatus(institute.id, event.target.value)
                          }
                          onBlur={() => setStatusMenuFor(null)}
                          aria-label={`Change status for ${institute.name}`}
                        >
                          <option value="Active">Active</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Pending">Pending</option>
                        </select>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="rating-cell">
                      <Star size={14} fill="#f9b203" stroke="#f9b203" />
                      <span>{institute.rating}</span>
                    </div>
                  </td>

                  <td>
                    <div className="action-icons">
                      <button
                        className="icon-button eye"
                        onClick={() => setManageDrawer({ ...institute, initialTab: "campuses" })}
                        title="Manage Campuses"
                        onClick={(event) => {
                          event.stopPropagation();
                          openInstituteDetails(institute);
                        }}
                        title="View profile"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="icon-button edit"
                        onClick={() => setManageDrawer({ ...institute, initialTab: "details" })}
                        title="Manage Institute"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditInstitute(institute);
                        }}
                        title="Edit institute"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button students"
                        onClick={() => navigate(`/super-admin/users?institute=${encodeURIComponent(institute.name)}`)}
                        title="Open Global Users Directory"
                        onClick={(event) => {
                          event.stopPropagation();
                          setStudentsDrawer(institute);
                        }}
                        title="View students"
                      >
                        <Users size={16} />
                      </button>
                      <button
                        className="icon-button delete"
                        onClick={() => setInstituteToDelete(institute)}
                        title="Delete institute"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

        </>
      )}

      {/* Delete Confirmation Modal */}
      {instituteToDelete && createPortal(
        <div
          className="institute-modal-backdrop"
          onClick={() => setInstituteToDelete(null)}
          style={{ zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            className="institute-drawer"
            style={{
              maxWidth: "460px",
              padding: "24px",
              borderRadius: "16px",
              border: "1px solid #fee2e2",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              background: "#fff",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#fef2f2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", color: "#09090b", fontWeight: 700 }}>
                  Delete Institute
                </h3>
                <span style={{ fontSize: "12px", color: "#71717a" }}>
                  This action is permanent and cannot be undone
                </span>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.5, margin: "12px 0 20px" }}>
              Are you sure you want to delete <strong>{instituteToDelete.name}</strong>?
              This will also cascade delete all campuses, courses, and data under this institute.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setInstituteToDelete(null)}
                style={{
                  height: "36px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  border: "1px solid #e4e4e7",
                  background: "#fff",
                  color: "#09090b",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                style={{
                  height: "36px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>,
        document.body
            <div className="manage-body">
              <div className="manage-card">
                <span className="manage-icon">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <span className="manage-label">Credentials</span>
                  <span className="manage-value">
                    Admin portal access ·{" "}
                    {manageDrawer.mode === "new"
                      ? "New Institute"
                      : manageDrawer.name}
                  </span>
                </div>
              </div>
              <div className="manage-card">
                <span className="manage-icon">
                  <MapPin size={20} />
                </span>
                <div>
                  <span className="manage-label">Campuses</span>
                  <span className="manage-value">
                    {manageDrawer.mode === "new"
                      ? "0 Campus Branches"
                      : `${manageDrawer.campuses ?? manageDrawer.campusDetails?.length ?? 0} Campus Branch${(manageDrawer.campuses ?? manageDrawer.campusDetails?.length ?? 0) === 1 ? "" : "es"}`}
                  </span>
                </div>
              </div>
              <div className="manage-card">
                <span className="manage-icon">
                  <CreditCard size={20} />
                </span>
                <div>
                  <span className="manage-label">Billing Status</span>
                  <span className="manage-value">Monthly plan · Active</span>
                </div>
              </div>
              <div className="manage-card">
                <span className="manage-icon">
                  <UserPlus size={20} />
                </span>
                <div>
                  <span className="manage-label">Assigned Admins</span>
                  <span className="manage-value">Institute Admin</span>
                </div>
              </div>
              <div className="manage-actions">
                <button
                  className="save-button"
                  onClick={() => setManageDrawer(null)}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
