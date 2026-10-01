import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import {
  selectInstituteCampuses,
  fetchCampuses,
  createCampus,
  updateCampus,
} from "@/store/Slices/campusesSlice";
import CampusForm from "./CampusForm";
import toast from "react-hot-toast";
import "./ManageCampusPage.css";

export default function ManageCampusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const isNew = !id || id === "new";
  const campuses = useSelector(selectInstituteCampuses) || [];
  const existingCampus = campuses.find((campus) => String(campus.id) === String(id));
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    // If not new and we don't have the campus loaded, fetch them
    if (!isNew && !existingCampus && campuses.length === 0) {
      dispatch(fetchCampuses());
    }
  }, [dispatch, isNew, existingCampus, campuses.length]);

  const handleSave = async (values, options = {}) => {
    setLoading(true);
    try {
      if (isNew) {
        await dispatch(createCampus(values)).unwrap();
        if (options.addAnother) {
          toast.success("Campus branch created! Form cleared to add another.");
          setFormKey((k) => k + 1);
          dispatch(fetchCampuses());
          return;
        } else {
          toast.success("Campus created successfully!");
        }
      } else {
        await dispatch(updateCampus({ id, ...values })).unwrap();
        toast.success("Campus updated successfully!");
      }
      navigate("/institute-admin/campuses");
    } catch (err) {
      const msg = typeof err === "string" ? err : "Failed to save campus.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/institute-admin/campuses");
  };

  const newCampusBackAction = (
    <Button
      className="manage-page-back-btn"
      onClick={handleCancel}
      type="button"
      variant="ghost"
      size="sm"
      title="Back to Campuses"
    >
      <ArrowLeft aria-hidden="true" />
      <span>Back to Campuses</span>
    </Button>
  );

  const pageContent = (
    <div className="manage-page-main">
      {!isNew && !existingCampus && campuses.length > 0 ? (
        <div className="campus-not-found">
          <p>Campus not found.</p>
          <button
            type="button"
            className="manage-page-back-btn"
            onClick={handleCancel}
          >
            Return to Campuses
          </button>
        </div>
      ) : (
        <CampusForm
          key={isNew ? `new-${formKey}` : id}
          campus={existingCampus}
          onSave={handleSave}
          onCancel={handleCancel}
          loading={loading}
          headerAction={isNew ? newCampusBackAction : null}
        />
      )}
    </div>
  );

  return (
    <div className="manage-campus-page">
      {!isNew && (
        <div className="manage-page-topbar">
          <button
            className="manage-page-back-btn"
            onClick={handleCancel}
            type="button"
            title="Back to Campuses"
          >
            <ArrowLeft size={16} />
            <span>Back to Campuses</span>
          </button>
        </div>
      )}

      {isNew ? (
        <Card className="manage-page-content manage-page-content--new">{pageContent}</Card>
      ) : (
        <div className="manage-page-content">{pageContent}</div>
      )}
    </div>
  );
}
