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

const institutes = [
  {
    name: "NUST (National University of Sciences and Technology)",
    location: "University · Federal",
    type: "University",
    campuses: 2,
    campusesDetails: [
      {
        name: "NUST Main Campus (H-12)",
        location: "Islamabad, Federal",
        status: "Active",
      },
      {
        name: "Risale Campus",
        location: "Rawalpindi, Punjab",
        status: "Active",
      },
    ],
    students: "1200 Students",
    studentRecords: [
      {
        name: "Ali Raza",
        program: "BS Computer Science",
        status: "Active",
        roll: "NUST-CS-2023-042",
        campus: "NUST Main Campus (H-12)",
      },
      {
        name: "Maryam Ahmed",
        program: "BS Software Engineering",
        status: "Active",
        roll: "NUST-SE-2023-110",
        campus: "NUST Main Campus (H-12)",
      },
    ],
    status: "Active",
    active: true,
    image:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=80&q=80",
  },
  {
    name: "National College of Arts (NCA)",
    location: "College · Punjab Board",
    type: "College",
    campuses: 3,
    campusesDetails: [
      { name: "NCA Main Campus", location: "Lahore, Punjab", status: "Active" },
      {
        name: "NCA Heritage Wing",
        location: "Lahore, Punjab",
        status: "Pending",
      },
      {
        name: "NCA Multimedia Wing",
        location: "Karachi, Sindh",
        status: "Active",
      },
    ],
    students: "1700 Students",
    studentRecords: [
      {
        name: "Areeba Khan",
        program: "Fine Arts",
        status: "Active",
        roll: "NCA-FA-2023-018",
        campus: "NCA Main Campus",
      },
      {
        name: "Hafsa Tariq",
        program: "Design",
        status: "Pending",
        roll: "NCA-DES-2023-089",
        campus: "NCA Heritage Wing",
      },
    ],
    status: "Active",
    active: true,
    image:
      "https://www.nca.edu.pk/images/home_banner/6_sm.jpg?time=1788912000151",
  },
  {
    name: "LUMS (Lahore University of Management Sciences)",
    location: "University · HEC",
    type: "University",
    campuses: 4,
    campusesDetails: [
      {
        name: "LUMS Main Campus",
        location: "Lahore, Punjab",
        status: "Active",
      },
      { name: "SDSB Campus", location: "Lahore, Punjab", status: "Active" },
      {
        name: "LUMS Executive Campus",
        location: "Faisalabad, Punjab",
        status: "Suspended",
      },
      {
        name: "LUMS Digital Campus",
        location: "Islamabad, Federal",
        status: "Active",
      },
    ],
    students: "2200 Students",
    studentRecords: [
      {
        name: "Sana Javed",
        program: "MBA",
        status: "Active",
        roll: "LUMS-MBA-2023-223",
        campus: "LUMS Main Campus",
      },
      {
        name: "Bilal Iqbal",
        program: "Economics",
        status: "Active",
        roll: "LUMS-ECO-2023-101",
        campus: "SDSB Campus",
      },
    ],
    status: "Active",
    active: true,
    image:
      "https://www.lums.edu.pk/sites/default/files/styles/416x396/public/2022-10/thumb_school_SDSB.jpg",
  },
  {
    name: "Aga Khan University",
    location: "University · Sindh Board",
    type: "University",
    campuses: 5,
    campusesDetails: [
      {
        name: "Aga Khan University Medical Campus",
        location: "Karachi, Sindh",
        status: "Active",
      },
      {
        name: "AKU Campus Nairobi",
        location: "Nairobi, Kenya",
        status: "Active",
      },
      {
        name: "AKU Campus Kampala",
        location: "Kampala, Uganda",
        status: "Pending",
      },
      {
        name: "AKU Campus Dhaka",
        location: "Dhaka, Bangladesh",
        status: "Active",
      },
      {
        name: "AKU Rural Campus",
        location: "Gilgit, Gilgit-Baltistan",
        status: "Active",
      },
    ],
    students: "2700 Students",
    studentRecords: [
      {
        name: "Amina Karim",
        program: "MBBS",
        status: "Active",
        roll: "AKU-MBBS-2023-014",
        campus: "Aga Khan University Medical Campus",
      },
      {
        name: "Hamza Noor",
        program: "Nursing",
        status: "Active",
        roll: "AKU-NUR-2023-205",
        campus: "Aga Khan University Medical Campus",
      },
    ],
    status: "Active",
    active: true,
    image: "https://www.aku.edu/about/PublishingImages/campuses.jpg",
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
  const [instituteData, setInstituteData] = useState(institutes);
  const [campusDrawerInstitute, setCampusDrawerInstitute] = useState(null);
  const [studentsDrawerInstitute, setStudentsDrawerInstitute] = useState(null);
  const [manageDrawerInstitute, setManageDrawerInstitute] = useState(null);
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
    setManageDrawerInstitute(institute);
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
              {(campusDrawerInstitute.campusesDetails || campusDrawerInstitute.campusDetails || []).map((campus, idx) => (
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

      {manageDrawerInstitute && (
        <div
          className="super-admin-drawer-backdrop"
          onClick={() => setManageDrawerInstitute(null)}
        >
          <aside
            className="super-admin-manage-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="super-admin-drawer-head">
              <div>
                <span className="super-admin-drawer-kicker">
                  Institute Management
                </span>
                <h3>{manageDrawerInstitute.name}</h3>
              </div>
              <button
                className="super-admin-drawer-close"
                onClick={() => setManageDrawerInstitute(null)}
                aria-label="Close institute management drawer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="super-admin-manage-body">
              <div className="super-admin-manage-card">
                <span className="super-admin-manage-card-icon">C</span>
                <div>
                  <span className="super-admin-manage-card-label">
                    Credentials
                  </span>
                  <span className="super-admin-manage-card-value">
                    Admin portal access
                  </span>
                </div>
              </div>
              <div className="super-admin-manage-card">
                <span className="super-admin-manage-card-icon">B</span>
                <div>
                  <span className="super-admin-manage-card-label">
                    Billing Status
                  </span>
                  <span className="super-admin-manage-card-value">
                    Monthly plan · Active
                  </span>
                </div>
              </div>
              <div className="super-admin-manage-card">
                <span className="super-admin-manage-card-icon">A</span>
                <div>
                  <span className="super-admin-manage-card-label">
                    Assigned Admins
                  </span>
                  <span className="super-admin-manage-card-value">
                    Institute Admin
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
