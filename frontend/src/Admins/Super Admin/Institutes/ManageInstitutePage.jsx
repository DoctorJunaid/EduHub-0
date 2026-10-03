import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, Building2 } from "lucide-react";
import {
  selectInstitutes,
  addInstitute,
} from "@/store/Slices/institutesSlice";
import axiosInstance from "@/api/axiosInstance";
import InstituteForm from "./InstituteForm";
import ManageInstitute from "./ManageInstitute";
import toast from "react-hot-toast";
import "./ManageInstitutePage.css";

function ManageInstituteSkeleton() {
  return (
    <div className="manage-page-skeleton-wrap" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "12px 0" }}>
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e4e4e7", paddingBottom: "12px" }}>
        <div className="inst-skel-line" style={{ width: "120px", height: "34px", borderRadius: "8px" }} />
        <div className="inst-skel-line" style={{ width: "100px", height: "34px", borderRadius: "8px" }} />
        <div className="inst-skel-line" style={{ width: "130px", height: "34px", borderRadius: "8px" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="inst-skel-line" style={{ width: "100%", height: "48px", borderRadius: "8px" }} />
        <div className="inst-skel-line" style={{ width: "100%", height: "48px", borderRadius: "8px" }} />
        <div className="inst-skel-line" style={{ width: "100%", height: "48px", borderRadius: "8px" }} />
        <div className="inst-skel-line" style={{ width: "100%", height: "48px", borderRadius: "8px" }} />
      </div>
    </div>
  );
}

export default function ManageInstitutePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isNew = !id || id === "new";
  const initialTab = searchParams.get("tab") || "details";

  const institutes = useSelector(selectInstitutes) || [];
  const existingInstitute = institutes.find(
    (inst) => String(inst._id || inst.id) === String(id)
  );

  const [institute, setInstitute] = useState(existingInstitute || null);
  const [loading, setLoading] = useState(!isNew && !existingInstitute);

  useEffect(() => {
    if (isNew) return;

    if (existingInstitute) {
      setInstitute({ ...existingInstitute, initialTab });
      return;
    }

    // If not in Redux store cache, fetch by ID directly
    let active = true;
    setLoading(true);
    axiosInstance
      .get(`/super-admin/institutes/${id}`)
      .then((res) => {
        if (active && res.data?.data) {
          setInstitute({ ...res.data.data, initialTab });
        }
      })
      .catch((err) => {
        if (active) {
          toast.error("Institute not found or failed to load");
          navigate("/institutes");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isNew, existingInstitute, initialTab, navigate]);

  const handleSaveNew = async (formData) => {
    try {
      await dispatch(addInstitute(formData)).unwrap();
      toast.success("Institute created successfully!");
      navigate("/institutes");
    } catch (error) {
      const msg = typeof error === "string" ? error : "Failed to create institute";
      toast.error(msg);
      throw error;
    }
  };

  return (
    <div className="manage-institute-page">
      {/* Main Content Card Container */}
      <div className="manage-page-content-card">
        {/* Card Header: Back button + Institute Identity */}
        <div className="manage-card-header">
          <button
            type="button"
            className="manage-page-back-btn"
            onClick={() => navigate("/institutes")}
            title="Back to Institutes"
          >
            <ArrowLeft size={16} />
            <span>Back to Institutes</span>
          </button>

          <div className="manage-page-title-row">
            <div className="manage-page-icon-box">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="manage-page-title">
                {isNew
                  ? "Register New Institute"
                  : institute?.name || "Institute Management"}
              </h1>
              <p className="manage-page-desc">
                {isNew
                  ? "Fill in network credentials and initial administrator setup to launch a new institute."
                  : `${institute?.type || "Institute"} · ${institute?.board || "Educational Network"} · Manage campuses, administrators, and settings.`}
              </p>
            </div>
          </div>
        </div>

        {/* Tab & Form Content Area */}
        {loading ? (
          <ManageInstituteSkeleton />
        ) : isNew ? (
          <div className="manage-page-form-wrapper">
            <InstituteForm
              onSave={handleSaveNew}
              onCancel={() => navigate("/institutes")}
            />
          </div>
        ) : institute ? (
          <ManageInstitute
            key={institute._id || institute.id}
            institute={{ ...institute, initialTab }}
            onClose={() => navigate("/institutes")}
          />
        ) : (
          <div className="manage-page-not-found">
            <p>Institute records could not be found.</p>
            <button
              className="manage-page-return-btn"
              onClick={() => navigate("/institutes")}
            >
              Return to Institutes List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
