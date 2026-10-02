import {
  Building2,
  GraduationCap,
  Users,
  MapPin,
  ArrowLeft,
  Plus,
  X,
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
import { Button } from "@/components/ui/button";
import InstituteForm from "../Institutes/InstituteForm";
import ManageInstitute from "../Institutes/ManageInstitute";
import toast from "react-hot-toast";
import "./SuperAdminDashboard.css";

const FILTER_TYPES = [
  { key: "all", label: "All Types" },
  { key: "University", label: "Universities" },
  { key: "College", label: "Colleges" },
  { key: "School", label: "Schools" },
];

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
  const [campusDrawerInstitute, setCampusDrawerInstitute] = useState(null);
  const [studentsDrawerInstitute, setStudentsDrawerInstitute] = useState(null);
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

    const matchesSearch =
      (institute.name || "").toLowerCase().includes(searchValue) ||
      (institute.type || "").toLowerCase().includes(searchValue) ||
      (institute.board || "").toLowerCase().includes(searchValue) ||
      String(institute.campusCount || 0).includes(searchValue);

    return matchesType && matchesSearch;
  });

  const handleManage = (institute) => {
    const id = institute._id || institute.id;
    navigate(`/institutes/${id}`);
  };

  const handleCampusClick = (institute) => {
    setManageDrawerInstitute({ ...institute, initialTab: "campuses" });
  };

  const handleStudentsClick = (institute) => {
    navigate(`/super-admin/users?institute=${encodeURIComponent(institute.name || "")}`);
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
    {
      label: "Total Users",
      value: globalStats?.users?.total || 0,
      detail: "Across all active networks",
      icon: Users,
    },
    {
      label: "Registered Institutes",
      value: globalStats?.institutes?.total || 0,
      detail: "Total networks in system",
      icon: Building2,
    },
    {
      label: "Total Campuses",
      value: globalStats?.campuses?.total || 0,
      detail: "Branches globally",
      icon: MapPin,
    },
    {
      label: "Active Programs",
      value: "-",
      detail: "Courses across networks",
      icon: GraduationCap,
    },
  ];

  return (
    <section className="super-admin-dashboard">
      {manageDrawerInstitute ? (
        <div className="super-admin-manage-fullscreen">
          <div className="super-admin-drawer-head">
            <button
              className="super-admin-back-button"
              onClick={() => setManageDrawerInstitute(null)}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span className="super-admin-drawer-kicker">
                Institute Management
              </span>
              <h3 className="super-admin-drawer-title">
                {manageDrawerInstitute.mode === "new"
                  ? "Add Institute"
                  : manageDrawerInstitute.name}
              </h3>
            </div>
          </div>

          <div className="super-admin-manage-card-wrap">
            {manageDrawerInstitute.mode === "new" ? (
              <InstituteForm
                onSave={async (values) => {
                  try {
                    await dispatch(addInstitute(values)).unwrap();
                    toast.success("Institute added successfully!");
                    setManageDrawerInstitute(null);
                  } catch (error) {
                    toast.error(
                      typeof error === "string" ? error : "Failed to add institute",
                    );
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
          <div className="super-admin-stats-grid">
            {statsArray.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <article className="super-admin-stat-card" key={index}>
                  <div className="super-admin-stat-head">
                    <span className="super-admin-stat-label">{stat.label}</span>
                    <div className="super-admin-stat-icon" aria-hidden="true">
                      <Icon size={16} />
                    </div>
                  </div>
                  <div className="super-admin-stat-value">{stat.value}</div>
                  <div className="super-admin-stat-detail">{stat.detail}</div>
                </article>
              );
            })}
          </div>

          <section className="super-admin-institutes-panel">
            <div className="super-admin-panel-head">
              <div className="super-admin-panel-titles">
                <h2>Registered Institutes</h2>
                <p>Overview of top-performing networks</p>
              </div>

              <Button
                className="super-admin-add-button"
                onClick={() => setManageDrawerInstitute({ mode: "new" })}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add Institute</span>
              </Button>
            </div>

            <div className="super-admin-panel-toolbar">
              <div
                className="super-admin-filters-group"
                role="group"
                aria-label="Filter institutes by type"
              >
                {FILTER_TYPES.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    className={`super-admin-filter-pill ${typeFilter === type.key ? "active" : ""}`}
                    onClick={() => setTypeFilter(type.key)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="super-admin-institute-list">
              {visibleInstitutes.length === 0 ? (
                <div className="super-admin-empty-state">
                  <div className="super-admin-empty-icon" aria-hidden="true">
                    <Building2 size={26} />
                  </div>
                  <p className="super-admin-empty-title">No institutes found</p>
                  <p className="super-admin-empty-desc">
                    {searchTerm || typeFilter !== "all"
                      ? "No institutions match your search or filter criteria. Try selecting another filter."
                      : "No institutions have been registered in the system yet."}
                  </p>
                  {(searchTerm || typeFilter !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTypeFilter("all");
                        setSearchTerm("");
                      }}
                      className="super-admin-empty-action"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                visibleInstitutes.map((institute, index) => {
                  const instId = institute._id || institute.id;
                  const isMenuOpen = statusMenuFor === instId;
                  const status = institute.status || "Active";
                  const statusClass = status.toLowerCase();

                  return (
                    <article
                      className={`super-admin-institute-row ${
                        selectedInstitute === institute.name ? "selected" : ""
                      }`}
                      key={instId || index}
                    >
                      <div className="super-admin-institute-main">
                        <img
                          className="super-admin-institute-image"
                          src={
                            institute.image ||
                            "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=80&q=80"
                          }
                          alt=""
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=80&q=80";
                          }}
                        />
                        <div className="super-admin-institute-copy">
                          <h3 className="super-admin-institute-name">
                            {institute.name}
                          </h3>
                          <p className="super-admin-institute-type">
                            {institute.type || "Institution"} ·{" "}
                            {institute.board || "General"}
                          </p>
                        </div>
                      </div>

                      <div className="super-admin-institute-meta">
                        <div className="super-admin-status-wrap">
                          <button
                            type="button"
                            className={`super-admin-active-badge super-admin-status-${statusClass}`}
                            onClick={() =>
                              setStatusMenuFor(isMenuOpen ? null : instId)
                            }
                            aria-label={`Change status for ${institute.name}`}
                            title="Click to change status"
                          >
                            <span className="super-admin-badge-dot" />
                            <span>{status}</span>
                          </button>

                          {isMenuOpen && (
                            <select
                              className="super-admin-status-select"
                              value={status}
                              autoFocus
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
                          type="button"
                          className="super-admin-campus-count super-admin-clickable"
                          onClick={() => handleCampusClick(institute)}
                          aria-label={`Show campuses for ${institute.name}`}
                        >
                          {institute.campusCount || 0} Campuses
                        </button>

                        <button
                          type="button"
                          className="super-admin-student-count super-admin-clickable"
                          onClick={() => handleStudentsClick(institute)}
                          aria-label={`Show users for ${institute.name}`}
                        >
                          View Users
                        </button>

                        <Button
                          size="sm"
                          variant="default"
                          className="super-admin-manage-btn"
                          onClick={() => handleManage(institute)}
                          aria-label={`Manage ${institute.name}`}
                        >
                          Manage
                        </Button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}

      {campusDrawerInstitute && (
        <div
          className="super-admin-drawer-backdrop"
          onClick={() => setCampusDrawerInstitute(null)}
        >
          <aside
            className="super-admin-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="super-admin-drawer-head">
              <div>
                <span className="super-admin-drawer-kicker">Campuses</span>
                <h3>{campusDrawerInstitute.name}</h3>
              </div>
              <button
                className="super-admin-drawer-close"
                onClick={() => setCampusDrawerInstitute(null)}
                aria-label="Close campuses drawer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="super-admin-drawer-body">
              {(
                campusDrawerInstitute.campusesDetails ||
                campusDrawerInstitute.campusDetails ||
                []
              ).map((campus, idx) => (
                <div
                  className="super-admin-drawer-row"
                  key={`${campus.name}-${idx}`}
                >
                  <div className="super-admin-drawer-row-main">
                    <span className="super-admin-drawer-campus-name">
                      {campus.name}
                    </span>
                    <span className="super-admin-drawer-campus-location">
                      {campus.location}
                    </span>
                  </div>
                  <span
                    className={`super-admin-drawer-campus-status ${campus.status?.toLowerCase() || "active"}`}
                  >
                    {campus.status}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {studentsDrawerInstitute && (
        <div
          className="super-admin-drawer-backdrop"
          onClick={() => setStudentsDrawerInstitute(null)}
        >
          <aside
            className="super-admin-student-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="super-admin-drawer-head">
              <div>
                <span className="super-admin-drawer-kicker">Students</span>
                <h3>{studentsDrawerInstitute.name}</h3>
              </div>
              <button
                className="super-admin-drawer-close"
                onClick={() => setStudentsDrawerInstitute(null)}
                aria-label="Close students drawer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="super-admin-drawer-body">
              {(studentsDrawerInstitute.studentRecords || []).map(
                (student, idx) => (
                  <div
                    className="super-admin-student-drawer-row"
                    key={`${student.roll}-${idx}`}
                  >
                    <div className="super-admin-student-drawer-main">
                      <span className="super-admin-student-name">
                        {student.name}
                      </span>
                      <span className="super-admin-student-meta">
                        {student.program} · {student.roll}
                      </span>
                      <span className="super-admin-student-campus">
                        {student.campus}
                      </span>
                    </div>
                    <span
                      className={`super-admin-student-status ${student.status?.toLowerCase() || "active"}`}
                    >
                      {student.status}
                    </span>
                  </div>
                ),
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
