import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Image, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadInstitutes, saveInstitutes } from "./instituteData";
import "./Institutes.css";
import { cn } from "@/lib/utils";

const emptyMedia =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

function isValidEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function EditInstitute() {
  const navigate = useNavigate();
  const { instituteId } = useParams();
  const [institutes, setInstitutes] = useState(() => loadInstitutes());
  const institute = useMemo(
    () => institutes.find((item) => item.id === instituteId),
    [institutes, instituteId],
  );

  const [form, setForm] = useState(() =>
    institute
      ? {
          id: institute.id,
          name: institute.name,
          type: institute.type,
          board: institute.board,
          status: institute.status,
          email: institute.email || "",
          phone: institute.phone || "",
          headOfficeAddress: institute.headOfficeAddress || "",
          coverImageUrl:
            institute.coverImageUrl || institute.image || emptyMedia,
        }
      : null,
  );

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!institute) return;
    setForm({
      id: institute.id,
      name: institute.name,
      type: institute.type,
      board: institute.board,
      status: institute.status,
      email: institute.email || "",
      phone: institute.phone || "",
      headOfficeAddress: institute.headOfficeAddress || "",
      coverImageUrl: institute.coverImageUrl || institute.image || emptyMedia,
    });
  }, [institute]);

  const loc = useMemo(() => {
    const parts = [
      { label: "Dashboard", to: "/super-admin" },
      { label: "Institutes", to: "/institutes" },
      {
        label: institute?.name ?? "Institute",
        to: `/institutes/${instituteId}/edit`,
      },
      { label: "Edit" },
    ];
    return parts;
  }, [institute, instituteId]);

  if (!institute) {
    return <Navigate to="/institutes" replace />;
  }

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Institute Name is required.";
    if (!isValidEmail(form.email))
      nextErrors.email = "Enter a valid email address.";
    if (form.phone && !/^\+?[0-9\s()+-]{7,20}$/.test(form.phone.trim()))
      nextErrors.phone = "Enter a valid phone number.";
    if (!isValidUrl(form.coverImageUrl))
      nextErrors.coverImageUrl = "Enter a valid cover image URL.";
    if (!form.type) nextErrors.type = "Choose a type.";
    if (!form.board) nextErrors.board = "Choose a board or affiliation.";
    if (!form.status) nextErrors.status = "Choose a status.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveChanges = () => {
    if (!validate()) return;
    const nextInstitutes = institutes.map((item) =>
      item.id === form.id
        ? {
            ...item,
            id: item.id,
            name: form.name.trim(),
            type: form.type,
            board: form.board,
            status: form.status,
            email: form.email.trim(),
            phone: form.phone.trim(),
            headOfficeAddress: form.headOfficeAddress.trim(),
            image: form.coverImageUrl.trim() || emptyMedia,
            coverImageUrl: form.coverImageUrl.trim() || emptyMedia,
          }
        : item,
    );
    setInstitutes(nextInstitutes);
    saveInstitutes(nextInstitutes);
    navigate("/institutes", { replace: true });
  };

  return (
    <section className="super-admin-edit-institute">
      <div className="super-admin-edit-top">
        <button
          className="super-admin-back-button"
          onClick={() => navigate("/institutes", { replace: true })}
          aria-label="Back to institutes"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Edit Institute</h1>
          <p>Update the details for this network.</p>
        </div>
      </div>

      <div className="super-admin-edit-breadcrumbs">
        {loc.map((item, index) => (
          <span key={index}>
            {item.to ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
            {index < loc.length - 1 && <span className="sep"> &gt; </span>}
          </span>
        ))}
      </div>

      <div className="super-admin-edit-card">
        <section className="super-admin-edit-section">
          <div className="super-admin-edit-section-title">
            <span className="super-admin-edit-icon">
              <Building2 size={18} />
            </span>
            <div>
              <h2>General Information</h2>
              <p>Basic details about this institute.</p>
            </div>
          </div>

          <div className="super-admin-edit-form-grid">
            <div className="super-admin-edit-field full-width">
              <label
                className="super-admin-edit-label"
                htmlFor="institute-name"
              >
                Institute Name *
              </label>
              <Input
                id="institute-name"
                value={form?.name ?? ""}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className={cn(errors.name && "border-destructive")}
              />
              {errors.name && (
                <small className="super-admin-edit-error">{errors.name}</small>
              )}
            </div>

            <div className="super-admin-edit-row">
              <div className="super-admin-edit-field">
                <label className="super-admin-edit-label" htmlFor="type-select">
                  Type
                </label>
                <Select
                  value={form?.type ?? "University"}
                  onValueChange={(value) => setForm({ ...form, type: value })}
                >
                  <SelectTrigger
                    id="type-select"
                    className={cn(errors.type && "border-destructive")}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="University">University</SelectItem>
                    <SelectItem value="College">College</SelectItem>
                    <SelectItem value="Board">Board</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="super-admin-edit-field">
                <label
                  className="super-admin-edit-label"
                  htmlFor="board-select"
                >
                  Board / Affiliation
                </label>
                <Select
                  value={form?.board ?? "Federal"}
                  onValueChange={(value) => setForm({ ...form, board: value })}
                >
                  <SelectTrigger
                    id="board-select"
                    className={cn(errors.board && "border-destructive")}
                  >
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Federal">Federal</SelectItem>
                    <SelectItem value="Punjab Board">Punjab Board</SelectItem>
                    <SelectItem value="HEC">HEC</SelectItem>
                    <SelectItem value="Sindh Board">Sindh Board</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="super-admin-edit-field">
                <label
                  className="super-admin-edit-label"
                  htmlFor="status-select"
                >
                  Status
                </label>
                <Select
                  value={form?.status ?? "Active"}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                >
                  <SelectTrigger
                    id="status-select"
                    className={cn(errors.status && "border-destructive")}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <section className="super-admin-edit-section">
          <div className="super-admin-edit-section-title">
            <span className="super-admin-edit-icon">
              <Mail size={18} />
            </span>
            <div>
              <h2>Contact &amp; Location</h2>
              <p>Official contact details and address.</p>
            </div>
          </div>

          <div className="super-admin-edit-form-grid">
            <div className="super-admin-edit-row contact-row">
              <div className="super-admin-edit-field">
                <label className="super-admin-edit-label" htmlFor="email-input">
                  Email Address
                </label>
                <Input
                  id="email-input"
                  value={form?.email ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  className={cn(errors.email && "border-destructive")}
                />
                {errors.email && (
                  <small className="super-admin-edit-error">
                    {errors.email}
                  </small>
                )}
              </div>

              <div className="super-admin-edit-field">
                <label className="super-admin-edit-label" htmlFor="phone-input">
                  Phone Number
                </label>
                <Input
                  id="phone-input"
                  value={form?.phone ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  className={cn(errors.phone && "border-destructive")}
                />
                {errors.phone && (
                  <small className="super-admin-edit-error">
                    {errors.phone}
                  </small>
                )}
              </div>
            </div>

            <div className="super-admin-edit-field full-width">
              <label className="super-admin-edit-label" htmlFor="address-input">
                Head Office Address
              </label>
              <Input
                id="address-input"
                value={form?.headOfficeAddress ?? ""}
                onChange={(event) =>
                  setForm({ ...form, headOfficeAddress: event.target.value })
                }
              />
            </div>
          </div>
        </section>

        <section className="super-admin-edit-section">
          <div className="super-admin-edit-section-title">
            <span className="super-admin-edit-icon">
              <Image size={18} />
            </span>
            <div>
              <h2>Media</h2>
              <p>Upload or provide a cover image for this institute.</p>
            </div>
          </div>

          <div className="super-admin-edit-form-grid">
            <div className="super-admin-edit-field full-width">
              <label className="super-admin-edit-label" htmlFor="cover-url">
                Cover Image URL
              </label>
              <Input
                id="cover-url"
                value={form?.coverImageUrl ?? ""}
                onChange={(event) =>
                  setForm({ ...form, coverImageUrl: event.target.value })
                }
                className={cn(errors.coverImageUrl && "border-destructive")}
              />
              {errors.coverImageUrl && (
                <small className="super-admin-edit-error">
                  {errors.coverImageUrl}
                </small>
              )}
              <div className="super-admin-cover-preview-wrap">
                <img
                  className="super-admin-cover-preview"
                  src={
                    isValidUrl(form?.coverImageUrl)
                      ? form.coverImageUrl
                      : emptyMedia
                  }
                  alt={institute.name}
                  onError={(event) => {
                    event.currentTarget.src = emptyMedia;
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="super-admin-edit-actions">
          <Button
            variant="outline"
            className="super-admin-edit-cancel-button"
            onClick={() => navigate("/institutes", { replace: true })}
          >
            Cancel
          </Button>
          <Button onClick={saveChanges} className="super-admin-save-button">
            <Save size={16} />
            Save Changes
          </Button>
        </div>
      </div>
    </section>
  );
}
