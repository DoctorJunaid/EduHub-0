import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Building2, Mail, Image, Save, SlidersHorizontal } from "lucide-react";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  selectInstitutes,
  updateInstitute,
  fetchInstitutes,
} from "@/store/Slices/institutesSlice";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
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
  const dispatch = useDispatch();
  const { instituteId } = useParams();

  const institutes = useSelector(selectInstitutes) || [];
  const cachedInstitute = useMemo(
    () => institutes.find((item) => (item.id === instituteId || item._id === instituteId)),
    [institutes, instituteId]
  );

  const [institute, setInstitute] = useState(cachedInstitute || null);
  const [loading, setLoading] = useState(!cachedInstitute);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    id: instituteId,
    name: "",
    type: "University",
    board: "Federal",
    status: "Active",
    email: "",
    phone: "",
    headOfficeAddress: "",
    coverImageUrl: emptyMedia,
  });

  // Fetch or sync institute
  useEffect(() => {
    if (cachedInstitute) {
      setInstitute(cachedInstitute);
      setForm({
        id: cachedInstitute.id || cachedInstitute._id,
        name: cachedInstitute.name || "",
        type: cachedInstitute.type || "University",
        board: cachedInstitute.board || "Federal",
        status: cachedInstitute.status || "Active",
        email: cachedInstitute.email || "",
        phone: cachedInstitute.phone || "",
        headOfficeAddress: cachedInstitute.headOfficeAddress || "",
        coverImageUrl: cachedInstitute.coverImageUrl || cachedInstitute.image || emptyMedia,
      });
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    axiosInstance
      .get(`/super-admin/institutes/${instituteId}`)
      .then((res) => {
        if (active && res.data?.data) {
          const fetched = res.data.data;
          setInstitute(fetched);
          setForm({
            id: fetched.id || fetched._id,
            name: fetched.name || "",
            type: fetched.type || "University",
            board: fetched.board || "Federal",
            status: fetched.status || "Active",
            email: fetched.email || "",
            phone: fetched.phone || "",
            headOfficeAddress: fetched.headOfficeAddress || "",
            coverImageUrl: fetched.coverImageUrl || fetched.image || emptyMedia,
          });
        }
      })
      .catch((err) => {
        if (active) {
          toast.error("Failed to load institute details");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [instituteId, cachedInstitute]);

  const loc = useMemo(() => {
    return [
      { label: "Dashboard", to: "/super-admin" },
      { label: "Institutes", to: "/institutes" },
      {
        label: institute?.name ?? "Institute",
        to: `/institutes/${instituteId}`,
      },
      { label: "Edit" },
    ];
  }, [institute, instituteId]);

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

  const saveChanges = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await dispatch(
        updateInstitute({
          id: form.id || instituteId,
          name: form.name.trim(),
          type: form.type,
          board: form.board,
          status: form.status,
          email: form.email.trim(),
          phone: form.phone.trim(),
          headOfficeAddress: form.headOfficeAddress.trim(),
          image: form.coverImageUrl.trim() || emptyMedia,
          coverImageUrl: form.coverImageUrl.trim() || emptyMedia,
        })
      ).unwrap();
      toast.success("Institute updated successfully!");
      navigate("/institutes");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Failed to update institute");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="super-admin-edit-institute">
        <PageLoader text="Loading institute details..." />
      </section>
    );
  }

  if (!institute && !loading) {
    return (
      <section className="super-admin-edit-institute">
        <div style={{ padding: "40px 20px", textAlign: "center", background: "#fff", borderRadius: "16px", border: "1px solid #e4e4e7", maxWidth: "500px", margin: "40px auto" }}>
          <Building2 size={40} style={{ margin: "0 auto 12px", color: "#a1a1aa" }} />
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>Institute Not Found</h3>
          <p style={{ fontSize: "14px", color: "#71717a", margin: "0 0 20px" }}>
            The institute you requested does not exist or has been deleted.
          </p>
          <Button onClick={() => navigate("/institutes")} variant="outline">
            Return to Institutes
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="super-admin-edit-institute">
      <div className="super-admin-edit-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            className="super-admin-back-button"
            onClick={() => navigate("/institutes")}
            aria-label="Back to institutes"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Edit Institute</h1>
            <p>Update network credentials and general details.</p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/institutes/${instituteId}`)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            height: "36px",
            padding: "0 14px",
            borderRadius: "8px",
            border: "1px solid #e4e4e7",
            background: "#fff",
            color: "#09090b",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <SlidersHorizontal size={14} /> Open Management Console
        </button>
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
                value={form.name}
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
                  value={form.type}
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
                    <SelectItem value="School">School</SelectItem>
                    <SelectItem value="Institute">Institute</SelectItem>
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
                  value={form.board}
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
                    <SelectItem value="KPK Board">KPK Board</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
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
                  value={form.status}
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
                    <SelectItem value="Inactive">Inactive</SelectItem>
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
                  value={form.email}
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
                  value={form.phone}
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
                value={form.headOfficeAddress}
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
                value={form.coverImageUrl}
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
                    isValidUrl(form.coverImageUrl)
                      ? form.coverImageUrl
                      : emptyMedia
                  }
                  alt={form.name || "Institute Cover"}
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
            onClick={() => navigate("/institutes")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={saveChanges}
            disabled={saving}
            className="super-admin-save-button"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {saving ? <Spinner className="size-4 text-white" /> : <Save size={16} />}
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </section>
  );
}
