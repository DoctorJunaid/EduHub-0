import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Eye,
  Pencil,
  Trash2,
  Star,
  X,
  UserPlus,
  CreditCard,
  ShieldCheck,
  Users,
} from "lucide-react";
import "./Institutes.css";

const instituteRecords = [
  {
    id: "nust",
    name: "NUST (National University of Sciences and Technology)",
    added: "2023-01-15",
    type: "University",
    board: "Federal",
    status: "Active",
    rating: 4.9,
    campuses: 2,
    campusDetails: [
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
    studentCount: "1200 Students",
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
    image:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=80&q=80",
  },
  {
    id: "nca",
    name: "National College of Arts (NCA)",
    added: "2023-02-23",
    type: "College",
    board: "Punjab Board",
    status: "Active",
    rating: 4.8,
    campuses: 3,
    campusDetails: [
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
    studentCount: "1700 Students",
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
    image:
      "https://www.nca.edu.pk/images/home_banner/6_sm.jpg?time=1788912000151",
  },
  {
    id: "lums",
    name: "LUMS (Lahore University of Management Sciences)",
    added: "2023-10-16",
    type: "University",
    board: "HEC",
    status: "Active",
    rating: 4.9,
    campuses: 4,
    campusDetails: [
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
    studentCount: "2200 Students",
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
    image:
      "https://www.lums.edu.pk/sites/default/files/styles/416x396/public/2022-10/thumb_school_SDSB.jpg",
  },
  {
    id: "aku",
    name: "Aga Khan University",
    added: "2023-08-05",
    type: "University",
    board: "Sindh Board",
    status: "Active",
    rating: 5,
    campuses: 5,
    campusDetails: [
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
    studentCount: "2700 Students",
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
    image: "https://www.aku.edu/about/PublishingImages/campuses.jpg",
  },
];

export default function Institutes() {
  const [query, setQuery] = useState("");
  const [campusesDrawer, setCampusesDrawer] = useState(null);
  const [studentsDrawer, setStudentsDrawer] = useState(null);
  const [manageDrawer, setManageDrawer] = useState(null);
  const [data, setData] = useState(instituteRecords);
  const [statusMenuFor, setStatusMenuFor] = useState(null);

  const visible = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return data;

    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(clean) ||
        item.type.toLowerCase().includes(clean) ||
        item.board.toLowerCase().includes(clean) ||
        item.status.toLowerCase().includes(clean),
    );
  }, [data, query]);

  const updateStatus = (instituteId, nextStatus) => {
    setData((items) =>
      items.map((item) =>
        item.id === instituteId ? { ...item, status: nextStatus } : item,
      ),
    );
    setStatusMenuFor(null);
  };

  return (
    <section className="super-admin-institutes-page">
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
          <button className="institutes-filter">
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>
        </div>

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
                <tr key={institute.id}>
                  <td>
                    <div className="institute-name-cell">
                      <img
                        className="institute-thumb"
                        src={institute.image}
                        alt=""
                      />
                      <div>
                        <div className="institute-name">{institute.name}</div>
                        <div className="institute-date">
                          Added{" "}
                          {new Date(institute.added).toLocaleDateString(
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
                        onClick={() => setCampusesDrawer(institute)}
                        title="View campuses"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="icon-button edit"
                        onClick={() => setManageDrawer(institute)}
                        title="Manage institute"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button students"
                        onClick={() => setStudentsDrawer(institute)}
                        title="View students"
                      >
                        <Users size={16} />
                      </button>
                      <button
                        className="icon-button delete"
                        onClick={() =>
                          setData((items) =>
                            items.filter((item) => item.id !== institute.id),
                          )
                        }
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

      {campusesDrawer && (
        <div
          className="institute-modal-backdrop"
          onClick={() => setCampusesDrawer(null)}
        >
          <aside
            className="institute-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <span className="drawer-kicker">Campus Branches</span>
                <h3>{campusesDrawer.name}</h3>
              </div>
              <button
                className="close-button"
                onClick={() => setCampusesDrawer(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="drawer-list">
              {campusesDrawer.campusDetails.map((campus, idx) => (
                <div className="drawer-row" key={`${campus.name}-${idx}`}>
                  <div>
                    <div className="drawer-row-name">{campus.name}</div>
                    <div className="drawer-row-location">{campus.location}</div>
                  </div>
                  <span
                    className={`drawer-status ${campus.status.toLowerCase()}`}
                  >
                    {campus.status}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {studentsDrawer && (
        <div
          className="institute-modal-backdrop"
          onClick={() => setStudentsDrawer(null)}
        >
          <aside
            className="institute-drawer students-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <span className="drawer-kicker">User Management</span>
                <h3>{studentsDrawer.name}</h3>
              </div>
              <button
                className="close-button"
                onClick={() => setStudentsDrawer(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="drawer-list">
              {studentsDrawer.studentRecords.map((student, idx) => (
                <div className="drawer-row" key={`${student.roll}-${idx}`}>
                  <div>
                    <div className="drawer-row-name">{student.name}</div>
                    <div className="drawer-row-location">
                      {student.program} · {student.roll}
                    </div>
                    <div className="drawer-row-location">{student.campus}</div>
                  </div>
                  <span
                    className={`drawer-status ${student.status.toLowerCase()}`}
                  >
                    {student.status}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {manageDrawer && (
        <div
          className="institute-modal-backdrop"
          onClick={() => setManageDrawer(null)}
        >
          <aside
            className="institute-drawer manage-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <span className="drawer-kicker">Institute Management</span>
                <h3>
                  {manageDrawer.mode === "new"
                    ? "Add Institute"
                    : manageDrawer.name}
                </h3>
              </div>
              <button
                className="close-button"
                onClick={() => setManageDrawer(null)}
              >
                <X size={16} />
              </button>
            </div>
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
