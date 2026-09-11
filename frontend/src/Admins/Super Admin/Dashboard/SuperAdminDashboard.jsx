import {
  Building2,
  GraduationCap,
  Users,
  MapPin,
  BarChart3,
  Grid2X2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SuperAdminDashboard.css";
import { loadInstitutes } from "../Institutes/instituteData";

const stats = [
  {
    label: "Registered Institutes",
    value: "24",
    detail: "Total networks in system",
    icon: Building2,
  },
  {
    label: "Total Users",
    value: "12,450",
    detail: "Across all institutes",
    icon: Users,
  },
  {
    label: "Total Campuses",
    value: "142",
    detail: "Branches globally",
    icon: MapPin,
  },
  {
    label: "Active Programs",
    value: "850+",
    detail: "Courses across networks",
    icon: GraduationCap,
  },
];

function normalizeStatus(status) {
  if (status === "Suspended") return "Suspended";
  if (status === "Pending") return "Pending";
  return "Active";
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedInstitute = location.state?.selectedInstitute;
  const [searchTerm, setSearchTerm] = useState(
    () => localStorage.getItem("eduHubSuperSearch") || "",
  );
  const [showUniversityOnly, setShowUniversityOnly] = useState(false);
  const [instituteData, setInstituteData] = useState(() => loadInstitutes());
  const [campusDrawerInstitute, setCampusDrawerInstitute] = useState(null);
  const [studentsDrawerInstitute, setStudentsDrawerInstitute] = useState(null);
  const [statusMenuFor, setStatusMenuFor] = useState(null);

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
    const matchesType = showUniversityOnly
      ? institute.type === "University"
      : true;
    const matchesSearch =
      institute.name.toLowerCase().includes(searchValue) ||
      institute.location.toLowerCase().includes(searchValue) ||
      institute.students.toLowerCase().includes(searchValue) ||
      String(institute.campuses).includes(searchValue);

    return matchesType && matchesSearch;
  });

  const handleManage = (institute) => {
    navigate(`/institutes/${institute.id}`);
  };

  const handleCampusClick = (institute) => {
    setCampusDrawerInstitute(institute);
  };

  const handleStudentsClick = (institute) => {
    setStudentsDrawerInstitute(institute);
  };

  const changeInstituteStatus = (instituteName, nextStatus) => {
    const normalizedStatus = normalizeStatus(nextStatus);
    setInstituteData((current) =>
      current.map((institute) =>
        institute.name === instituteName
          ? { ...institute, status: normalizedStatus }
          : institute,
      ),
    );
    setStatusMenuFor(null);
  };

  return (
    <section className="super-admin-dashboard">
      <div className="super-admin-topbar">
        <span className="breadcrumb">
          <span className="breadcrumb-icon">
            <Grid2X2 size={16} />
          </span>
          <span>Home / Dashboard</span>
        </span>
        <span className="super-admin-title">Global System</span>
      </div>

      <div className="super-admin-stats-grid">
        {stats.map((stat, index) => {
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
          <button
            className={`super-admin-filter ${showUniversityOnly ? "active" : ""}`}
            aria-label="Filter institutes by university"
            aria-pressed={showUniversityOnly}
            onClick={() => setShowUniversityOnly(!showUniversityOnly)}
          >
            <BarChart3 size={16} />
          </button>
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
                  src={institute.image}
                  alt=""
                />
                <div className="super-admin-institute-copy">
                  <h3>{institute.name}</h3>
                  <p>{institute.location}</p>
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
                          institute.name,
                          event.target.value,
                        )
                      }
                      onBlur={() => setStatusMenuFor(null)}
                      aria-label={`Set new status for ${institute.name}`}
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Pending">Pending</option>
                    </select>
                  )}
                </div>

                <button
                  className="super-admin-campus-count super-admin-clickable"
                  onClick={() => handleCampusClick(institute)}
                  aria-label={`Show campuses for ${institute.name}`}
                >
                  {institute.campuses} Campuses
                </button>
                <button
                  className="super-admin-student-count super-admin-clickable"
                  onClick={() => handleStudentsClick(institute)}
                  aria-label={`Show students for ${institute.name}`}
                >
                  {institute.students}
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
                    className={`super-admin-drawer-campus-status ${campus.status.toLowerCase()}`}
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
              {studentsDrawerInstitute.studentRecords.map((student, idx) => (
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
                    className={`super-admin-student-status ${student.status.toLowerCase()}`}
                  >
                    {student.status}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
