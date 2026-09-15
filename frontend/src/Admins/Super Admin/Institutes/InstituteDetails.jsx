import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  GraduationCap,
  Image,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { loadInstitutes } from "./instituteData";
import "./Institutes.css";

const emptyMedia =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

export default function InstituteDetails() {
  const navigate = useNavigate();
  const { instituteId } = useParams();
  const institutes = loadInstitutes();
  const institute = useMemo(
    () => institutes.find((item) => item.id === instituteId),
    [instituteId, institutes],
  );

  if (!institute) {
    return <Navigate to="/institutes" replace />;
  }

  const stats = [
    {
      label: "Total Campuses",
      value: institute.campuses ?? institute.campusDetails?.length ?? 0,
      icon: MapPin,
    },
    {
      label: "Enrolled Students",
      value: institute.studentRecords?.length ?? institute.studentCount ?? 0,
      icon: Users,
    },
    {
      label: "Total Faculty",
      value: institute.facultyCount ?? 1,
      icon: GraduationCap,
    },
  ];

  return (
    <section className="institute-details-page">
      <div className="institute-details-breadcrumbs">
        <Link to="/super-admin">Dashboard</Link>
        <span className="sep">&gt;</span>
        <Link to="/institutes">Institutes</Link>
        <span className="sep">&gt;</span>
        <span className="current">{institute.name}</span>
      </div>

      <section className="institute-details-header">
        <div className="institute-details-title-wrap">
          <button
            className="institute-details-back"
            onClick={() => navigate("/institutes", { replace: true })}
            aria-label="Back to institutes"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{institute.name}</h1>
            <div className="institute-details-meta-strip">
              <span className="meta-row-icon">
                <Building2 size={16} /> {institute.type}
              </span>
              <span className="meta-row-sep">|</span>
              <span className="meta-row-icon">
                <Mail size={16} /> {institute.email}
              </span>
              <span className="meta-row-sep">|</span>
              <span className="meta-row-icon">
                <Phone size={16} /> {institute.phone}
              </span>
              <span className="meta-row-sep">|</span>
              <span className="meta-row-icon">
                <Calendar size={16} /> Registered: {institute.added}
              </span>
            </div>
          </div>
        </div>

        <div className="institute-details-top-actions">
          <span className="status-chip">
            <span className="status-dot" /> {institute.status}
          </span>
          <span className="board-chip">{institute.board}</span>
          <button
            className="public-page-button"
            onClick={() => navigate(`/institutes/${institute.id}`)}
          >
            Public Page
          </button>
          <button
            className="edit-details-button"
            onClick={() => navigate(`/institutes/${institute.id}/edit`)}
          >
            Edit Details
          </button>
        </div>
      </section>

      <section className="institute-details-grid">
        <div className="institute-details-main">
          <section className="institute-details-stat-grid">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <article className="institute-details-stat-card" key={idx}>
                  <div className="stat-card-title">
                    <span>{stat.label}</span>
                    <span className="stat-card-icon">
                      <Icon size={18} />
                    </span>
                  </div>
                  <div className="stat-card-value">{stat.value}</div>
                </article>
              );
            })}
          </section>

          <section className="institute-details-campus-panel">
            <div className="panel-heading">
              <h2>Campus Locations</h2>
            </div>
            <div className="campus-table">
              <div className="campus-table-head">
                <span>Campus Name</span>
                <span>Address</span>
                <span>Status</span>
              </div>
              {institute.campusDetails?.map((campus, index) => (
                <div className="campus-table-row" key={index}>
                  <span className="campus-name">{campus.name}</span>
                  <span className="campus-location">{campus.location}</span>
                  <span className="campus-status">{campus.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="institute-details-side">
          <section className="institute-details-cover-panel">
            <h2>Cover Identity</h2>
            <img
              className="institute-details-cover"
              src={institute.coverImageUrl || institute.image || emptyMedia}
              alt={institute.name}
              onError={(e) => {
                e.currentTarget.src = emptyMedia;
              }}
            />
          </section>

          <section className="institute-details-contact-panel">
            <h2>Contact Information</h2>
            <div className="contact-info">
              <span className="contact-label">Head Office</span>
              <span className="contact-value">
                {institute.headOfficeAddress || "Head office address not set"}
              </span>
              <span className="contact-label">Support Email</span>
              <span className="contact-value email-value">
                {institute.email}
              </span>
              <span className="contact-label">Primary Phone</span>
              <span className="contact-value">{institute.phone}</span>
            </div>
          </section>
        </aside>
      </section>
    </section>
  );
}
