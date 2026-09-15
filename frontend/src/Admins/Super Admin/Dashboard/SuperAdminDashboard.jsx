import {
  Building2,
  GraduationCap,
  Users,
  MapPin,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchGlobalStats, selectGlobalStats } from "@/store/Slices/superAdminSlice";
import {
  fetchInstitutes,
  selectInstitutes,
  addInstitute,
  updateInstitute,
  optimisticStatusChange,
} from "@/store/Slices/institutesSlice";
import InstituteForm from "../Institutes/InstituteForm";
import ManageInstitute from "../Institutes/ManageInstitute";
import toast from "react-hot-toast";
import "./SuperAdminDashboard.css";

function normalizeStatus(status) {
  if (status === "Suspended") return "Suspended";
  if (status === "Pending") return "Pending";
  return "Active";
}

export default function SuperAdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const globalStats = useSelector(selectGlobalStats);
  const instituteData = useSelector(selectInstitutes) || [];
  const location = useLocation();
  const selectedInstitute = location.state?.selectedInstitute;
  const [searchTerm, setSearchTerm] = useState(
    () => localStorage.getItem("eduHubSuperSearch") || "",
  );
  const [typeFilter, setTypeFilter] = useState("all");
  const [manageDrawerInstitute, setManageDrawerInstitute] = useState(null);
  const [statusMenuFor, setStatusMenuFor] = useState(null);

  useEffect(() => {
    dispatch(fetchGlobalStats());
    dispatch(fetchInstitutes());
  }, [dispatch]);

  useEffect(() => {
    const onSearch = (event) => {
      const nextQuery = event.detail?.query || "";
      setSearchTerm(nextQuery);
    };

    window.addEventListener("eduHubSuperSearch", onSearch);
    return () => window.removeEventListener("eduHubSuperSearch", onSearch);
  }, []);

  const searchValue = searchTerm.trim().toLowerCase();

  const visibleInstitutes = instituteData.filter((institute) => {
    const matchesType =
      typeFilter === "all" ||
      institute.type?.toLowerCase() === typeFilter.toLowerCase();
    
    // Safely check strings before calling .toLowerCase() or .includes()
    const matchesSearch =
      (institute.name || "").toLowerCase().includes(searchValue) ||
      (institute.type || "").toLowerCase().includes(searchValue) ||
      (institute.board || "").toLowerCase().includes(searchValue) ||
      String(institute.campusCount || 0).includes(searchValue);

    return matchesType && matchesSearch;
  });

  const handleManage = (institute) => {
    setManageDrawerInstitute(institute);
  };

  const handleCampusClick = (institute) => {
    setManageDrawerInstitute({ ...institute, initialTab: "campuses" });
  };

  const handleStudentsClick = (institute) => {
    navigate(`/super-admin/users?institute=${encodeURIComponent(institute.name)}`);
  };

  const changeInstituteStatus = async (institute, nextStatus) => {
    const id = institute._id || institute.id;
    dispatch(optimisticStatusChange({ id, status: nextStatus }));
    setStatusMenuFor(null);
    try {
      await dispatch(updateInstitute({ id, status: nextStatus })).unwrap();
      toast.success(`${institute.name} status set to ${nextStatus}`);
      dispatch(fetchGlobalStats());
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Failed to update status");
      dispatch(fetchInstitutes());
    }
  };

  const statsArray = [
    { label: "Total Users", value: globalStats?.users?.total || 0, detail: "Across all active networks", icon: Users },
    { label: "Registered Institutes", value: globalStats?.institutes?.total || 0, detail: "Total networks in system", icon: Building2 },
    { label: "Total Campuses", value: globalStats?.campuses?.total || 0, detail: "Branches globally", icon: MapPin },
    { label: "Active Programs", value: "-", detail: "Courses across networks", icon: GraduationCap },
  ];

  return (
    <section className="super-admin-dashboard">
      {manageDrawerInstitute ? (
        <div className="super-admin-manage-fullscreen" style={{ animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
          <div className="super-admin-drawer-head" style={{ marginBottom: '12px', paddingBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', borderBottom: 'none' }}>
            <button
              className="super-admin-back-button"
              onClick={() => setManageDrawerInstitute(null)}
              aria-label="Back to dashboard"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e4e4e7', background: '#fff', cursor: 'pointer' }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span className="super-admin-drawer-kicker" style={{ fontSize: '10px' }}>
                Institute Management
              </span>
              <h3 style={{ fontSize: '20px', margin: '0' }}>
                {manageDrawerInstitute.mode === "new"
                  ? "Add Institute"
                  : manageDrawerInstitute.name}
              </h3>
            </div>
          </div>
          
          <div className="super-admin-manage-card-wrap" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e4e4e7', padding: '16px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.02)', width: '100%', boxSizing: 'border-box' }}>
            {manageDrawerInstitute.mode === "new" ? (
              <InstituteForm
                onSave={async (values) => {
                  try {
                    await dispatch(addInstitute(values)).unwrap();
                    toast.success("Institute added successfully!");
                    setManageDrawerInstitute(null);
                  } catch (error) {
                    toast.error(typeof error === 'string' ? error : "Failed to add institute");
                    throw error;
                  }
                }}
                onCancel={() => setManageDrawerInstitute(null)}
              />
            ) : (
              <ManageInstitute
                institute={manageDrawerInstitute}
                onClose={() => setManageDrawerInstitute(null)}
              />
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="super-admin-topbar">

        <button
          className="add-institute-button"
          onClick={() => setManageDrawerInstitute({ mode: "new" })}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            background: "#09090b",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            alignSelf: "flex-end",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            transition: "all 0.15s ease",
          }}
        >
          <span>+</span> Add Institute
        </button>
      </div>

      <div className="super-admin-stats-grid">
        {statsArray.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <article className="super-admin-stat-card" key={index}>
              <div className="super-admin-stat-head">
                <span className="super-admin-stat-label">{stat.label}</span>
                <span className="super-admin-stat-icon">
                  <Icon size={22} />
                </span>
              </div>
              <div className="super-admin-stat-value">{stat.value}</div>
              <div className="super-admin-stat-detail">{stat.detail}</div>
            </article>
          );
        })}
      </div>

      <section className="super-admin-institutes-panel">
        <div className="super-admin-panel-head">
          <div>
            <h2>Registered Institutes</h2>
            <p>Overview of top-performing networks</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {["all", "University", "College", "School"].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: typeFilter === type ? "1px solid #09090b" : "1px solid #e4e4e7",
                  background: typeFilter === type ? "#09090b" : "#fff",
                  color: typeFilter === type ? "#fff" : "#71717a",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {type === "all" ? "All Types" : `${type}s`}
              </button>
            ))}
          </div>
        </div>

        <div className="super-admin-institute-list">
          {visibleInstitutes.length === 0 && (
            <article className="super-admin-empty-row">
              <span>No matching university institutes found.</span>
            </article>
          )}

          {visibleInstitutes.map((institute, index) => (
            <article
              className={`super-admin-institute-row ${selectedInstitute === institute.name ? "selected" : ""}`}
              key={index}
            >
              <div className="super-admin-institute-main">
                <img
                  className="super-admin-institute-image"
                  src={institute.image || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=80&q=80"}
                  alt=""
                />
                <div className="super-admin-institute-copy">
                  <h3>{institute.name}</h3>
                  <p>{institute.type} · {institute.board}</p>
                </div>
              </div>

              <div className="super-admin-institute-meta">
                <div className="super-admin-status-wrap">
                  <button
                    className="super-admin-active-badge"
                    onClick={() =>
                      setStatusMenuFor(
                        statusMenuFor === institute.name
                          ? null
                          : institute.name,
                      )
                    }
                    aria-label={`Change status for ${institute.name}`}
                  >
                    <span className="super-admin-badge-dot" />{" "}
                    {institute.status}
                  </button>

                  {statusMenuFor === institute.name && (
                    <select
                      className="super-admin-status-select"
                      value={institute.status}
                      onChange={(event) =>
                        changeInstituteStatus(
                          institute,
                          event.target.value,
                        )
                      }
                      onBlur={() => setStatusMenuFor(null)}
                      aria-label={`Set new status for ${institute.name}`}
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  )}
                </div>

                <button
                  className="super-admin-campus-count super-admin-clickable"
                  onClick={() => handleCampusClick(institute)}
                  aria-label={`Show campuses for ${institute.name}`}
                >
                  {institute.campusCount || 0} Campuses
                </button>
                <button
                  className="super-admin-student-count super-admin-clickable"
                  onClick={() => handleStudentsClick(institute)}
                  aria-label={`Show students for ${institute.name}`}
                >
                  View Users
                </button>
                <button
                  className="super-admin-manage-button"
                  onClick={() => handleManage(institute)}
                  aria-label={`Manage ${institute.name}`}
                >
                  Manage
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      </>
      )}

    </section>
  );
}
