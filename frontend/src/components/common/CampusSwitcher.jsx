import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Building2, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  fetchCampuses,
  selectInstituteCampuses,
  selectActiveCampusId,
  activeCampusChanged,
} from "@/store/Slices/campusesSlice";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import "./CampusSwitcher.css";

export default function CampusSwitcher() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const campuses = useSelector(selectInstituteCampuses) || [];
  const activeCampusId = useSelector(selectActiveCampusId);

  const role = currentUser?.role;

  // Super Admin manages the entire platform globally — no campus switcher needed
  if (role === "super_admin") {
    return null;
  }

  // Only institute_admin can switch between multiple campus branches of an institute
  const isMultiCampusAdmin = role === "institute_admin";

  useEffect(() => {
    if (isMultiCampusAdmin && campuses.length === 0) {
      dispatch(fetchCampuses());
    }
  }, [dispatch, isMultiCampusAdmin, campuses.length]);

  // If user is a campus-level user (campus_admin, teacher, student, etc.)
  if (!isMultiCampusAdmin) {
    const assignedCampusName =
      currentUser?.campusId?.name ||
      currentUser?.campus ||
      "Main Campus";

    return (
      <div className="campus-badge-fixed" title={`Assigned Branch: ${assignedCampusName}`}>
        <Building2 size={14} className="campus-badge-icon" />
        <span className="campus-badge-text">{assignedCampusName}</span>
      </div>
    );
  }

  // Multi-campus administrator (Institute Admin / Super Admin)
  const currentSelected = campuses.find((c) => (c._id || c.id) === activeCampusId);
  const activeLabel = currentSelected ? currentSelected.name : campuses.length > 0 ? "Select Campus" : "No Campuses";

  const handleSelect = (campusId) => {
    dispatch(activeCampusChanged(campusId));
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("campusContextChange", { detail: { campusId } })
      );
    }
  };

  return (
    <div className="campus-switcher-wrapper">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="campus-switcher-trigger"
            aria-label="Switch active campus"
            title="Switch active campus branch for operational data"
          >
            <div className="campus-switcher-icon-wrap">
              <Building2 size={14} />
            </div>
            <div className="campus-switcher-info">
              <span className="campus-switcher-sub">Active Branch</span>
              <span className="campus-switcher-name">{activeLabel}</span>
            </div>
            <ChevronDown size={14} className="campus-switcher-chevron" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="campus-switcher-menu">
          <DropdownMenuLabel className="campus-switcher-menu-label">
            Switch Campus Branch
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {campuses.length === 0 ? (
            <div className="campus-switcher-empty">
              No campus branches found
            </div>
          ) : (
            campuses.map((campus) => {
              const id = campus._id || campus.id;
              const isSelected = id === activeCampusId;

              return (
                <DropdownMenuItem
                  key={id}
                  className={`campus-switcher-menu-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(id)}
                >
                  <div className="campus-menu-item-content">
                    <span className="campus-menu-item-name">{campus.name}</span>
                    {campus.instituteName && role === "super_admin" && (
                      <span className="campus-menu-item-inst" title={`Institute: ${campus.instituteName}`}>
                        {campus.instituteName}
                      </span>
                    )}
                    {campus.status && (
                      <span className={`campus-menu-status ${campus.status.toLowerCase()}`}>
                        {campus.status}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={14} className="campus-menu-check" />}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
