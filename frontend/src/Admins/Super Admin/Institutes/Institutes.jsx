import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  Search,
  SlidersHorizontal,
  Users,
  Star,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import "./Institutes.css";
import {
  fetchInstitutes,
  selectInstitutes,
  selectInstitutesStatus,
  addInstitute,
  deleteInstitute,
} from "@/store/Slices/institutesSlice";
import InstituteForm from "./InstituteForm";
import ManageInstitute from "./ManageInstitute";
import toast from "react-hot-toast";

function InstituteSkeletonRow() {
  return (
    <tr className="institute-list-row institute-skeleton-row">
      <td className="col-name">
        <div className="institute-name-cell">
          <div className="inst-skel-line inst-skel-thumb" />
          <div className="inst-skel-text-wrap">
            <div className="inst-skel-line inst-skel-name" />
            <div className="inst-skel-line inst-skel-date" />
          </div>
        </div>
      </td>
      <td className="col-type">
        <div className="institute-type-cell">
          <div className="inst-skel-line inst-skel-pill" />
          <div className="inst-skel-line inst-skel-pill short" />
        </div>
      </td>
      <td className="col-rating">
        <div className="rating-cell">
          <div className="inst-skel-line inst-skel-rating" />
        </div>
      </td>
      <td className="col-actions">
        <div className="action-icons">
          <div className="inst-skel-line inst-skel-btn" />
          <div className="inst-skel-line inst-skel-btn" />
          <div className="inst-skel-line inst-skel-btn" />
          <div className="inst-skel-line inst-skel-btn" />
          <div className="inst-skel-line inst-skel-btn" />
        </div>
      </td>
    </tr>
  );
}

export default function Institutes() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const institutes = useSelector(selectInstitutes);
  const status = useSelector(selectInstitutesStatus);
  const instituteError = useSelector((state) => state.institutes.error);
  const loading = (status === "idle" || status === "loading") && institutes.length === 0;
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [manageDrawer, setManageDrawer] = useState(null);

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
    navigate(`/institutes/${institute.id || institute._id}/view`);
  };

  const openEditInstitute = (institute) => {
    navigate(`/institutes/${institute.id || institute._id}/edit`);
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
          <Button
            className="institutes-add-btn"
            onClick={() => setManageDrawer({ mode: "new" })}
          >
            <Plus size={16} className="mr-1.5" />
            <span>Add Institute</span>
          </Button>
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
                <th className="col-name">Institute Name</th>
                <th className="col-type">Board / Type</th>
                <th className="col-rating">Rating</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <InstituteSkeletonRow />
                  <InstituteSkeletonRow />
                  <InstituteSkeletonRow />
                  <InstituteSkeletonRow />
                  <InstituteSkeletonRow />
                </>
              ) : status === "failed" && institutes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="institutes-empty-cell" role="alert">
                    <div className="institutes-empty-content">
                      <AlertTriangle size={32} className="empty-icon" />
                      <p className="empty-title">Unable to load institutes</p>
                      <p className="empty-sub">{instituteError || "The institute list could not be loaded."}</p>
                      <button
                        type="button"
                        className="institutes-retry-btn"
                        onClick={() => dispatch(fetchInstitutes())}
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={4} className="institutes-empty-cell">
                    <div className="institutes-empty-content">
                      <Building2 size={36} className="empty-icon" />
                      <p className="empty-title">No institutes found</p>
                      <p className="empty-sub">
                        {query || typeFilter !== "all" || statusFilter !== "all"
                          ? "No institutes matched your search or active filters."
                          : "No educational institutions registered yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : visible.map((institute) => (
                  <tr
                    key={institute.id || institute._id}
                    onClick={() => openInstituteDetails(institute)}
                    className="institute-list-row"
                  >
                  <td className="col-name">
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

                  <td className="col-type">
                    <div className="institute-type-cell">
                      <span className="type-label">{institute.type}</span>
                      <span className="board-label">{institute.board}</span>
                    </div>
                  </td>

                  <td className="col-rating">
                    <div className="rating-cell">
                      <Star size={14} fill="#f9b203" stroke="#f9b203" />
                      <span>{institute.rating}</span>
                    </div>
                  </td>

                  <td className="col-actions">
                    <div className="action-icons">
                      <button
                        className="icon-button eye"
                        onClick={(event) => {
                          event.stopPropagation();
                          openInstituteDetails(institute);
                        }}
                        title="View details & campuses"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="icon-button edit"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditInstitute(institute);
                        }}
                        title="Edit institute details"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button manage"
                        onClick={(event) => {
                          event.stopPropagation();
                          setManageDrawer({ ...institute, initialTab: "details" });
                        }}
                        title="Quick Manage Console"
                      >
                        <SlidersHorizontal size={16} />
                      </button>
                      <button
                        className="icon-button students"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/super-admin/users?institute=${encodeURIComponent(institute.name)}`);
                        }}
                        title="View users directory"
                      >
                        <Users size={16} />
                      </button>
                      <button
                        className="icon-button delete"
                        onClick={(event) => {
                          event.stopPropagation();
                          setInstituteToDelete(institute);
                        }}
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
                {deleting ? <Spinner className="size-3.5 text-white" /> : <Trash2 size={14} />}
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
