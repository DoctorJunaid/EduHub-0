import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  Building,
  GraduationCap,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import {
  facultyStatuses,
  filterFaculty,
  facultyRecords as defaultFacultyRecords,
} from "./facultyData";
import {
  selectFaculty,
  addFaculty,
  updateFaculty,
  deleteFaculty,
  fetchFaculty,
} from "@/store/Slices/facultySlice";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import FacultyForm from "./FacultyForm";
import FacultyProfileDialog from "./FacultyProfileDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useInstitution } from "@/context/InstitutionContext";
import DataPagination from "@/components/shared/DataPagination";
import { usePaginationParams } from "@/hooks/usePaginationParams";
import "./FacultyDirectory.css";

export default function FacultyDirectory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSchool } = useInstitution();

  useEffect(() => {
    dispatch(fetchFaculty());
  }, [dispatch]);

  const currentUser = useSelector(selectCurrentUser);
  const realUserCampus = currentUser?.campusId?.name || currentUser?.campus || "";

  const rawFaculty = useSelector(selectFaculty);
  const facultyRecords = useMemo(() => {
    if (rawFaculty && rawFaculty.length > 0) return rawFaculty;
    return defaultFacultyRecords || [];
  }, [rawFaculty]);

  const [form, setForm] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const options = useMemo(() => {
    const campusList = [
      realUserCampus,
      ...facultyRecords.map((teacher) => teacher.campus).filter(Boolean),
    ].filter(Boolean);

    return {
      designation: [...new Set(facultyRecords.map((t) => t.designation).filter(Boolean))],
      department: [...new Set(facultyRecords.map((t) => t.department).filter(Boolean))],
      campus: campusList.length ? [...new Set(campusList)] : (realUserCampus ? [realUserCampus] : ["Main Campus"]),
    };
  }, [facultyRecords, realUserCampus]);

  const [filters, setFilters] = useState({
    search: "",
    department: "",
    designation: "",
    status: "",
  });

  const { page, pageSize, setPage, setPageSize } = usePaginationParams({
    defaultPage: 1,
    defaultPageSize: 20,
  });

  const filtered = useMemo(() => filterFaculty(facultyRecords, filters), [facultyRecords, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const displayed = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage, pageSize]);

  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  const saveTeacher = async (values) => {
    try {
      if (form.teacher) {
        await dispatch(updateFaculty({ ...values, id: form.teacher.id || form.teacher._id })).unwrap();
        toast.success("Faculty member updated successfully!");
      } else {
        await dispatch(addFaculty(values)).unwrap();
        toast.success("Teacher added successfully!");
      }
      setFilters({ search: "", department: "", designation: "", status: "" });
      setForm(null);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to save teacher");
      throw err;
    }
  };

  // KPI Calculations
  const totalFaculty = facultyRecords.length;
  const activeFaculty = facultyRecords.filter(f => f.status === 'Active' || f.status === 'Full Time').length;
  const deptCount = options.department?.length || 0;

  return (
    <section className="campus-tab-page faculty-directory" aria-label="Faculty Directory Management">
      {/* 1. Top Thin KPI Cards (Flush Border-to-Border, 56px) */}
      <div className="campus-kpi-track">
        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Users size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Teaching Staff" : "Appointed Faculty"}</span>
              <span className="kpi-value">{totalFaculty}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <UserCheck size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Active Teachers" : "Active / On-Duty"}</span>
              <span className="kpi-value">{activeFaculty}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Building size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Academic Wings" : "Academic Depts"}</span>
              <span className="kpi-value">{deptCount}</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <GraduationCap size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Student-Teacher Ratio" : "Student-Staff Ratio"}</span>
              <span className="kpi-value">1:15</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contiguous 56px Toolbar */}
      <div className="campus-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-search" style={{ width: "140px", maxWidth: "160px" }}>
            <Search size={13} />
            <input
              type="text"
              placeholder={isSchool ? "Search teachers..." : "Search faculty..."}
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              aria-label="Search faculty by name or department"
            />
          </div>

          <select
            className="toolbar-select"
            style={{ maxWidth: "115px" }}
            value={filters.department}
            onChange={(e) => updateFilter("department", e.target.value)}
            aria-label={isSchool ? "Filter by wing" : "Filter by department"}
          >
            <option value="">{isSchool ? "All Wings" : "All Depts"}</option>
            {options.department?.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            className="toolbar-select"
            style={{ maxWidth: "115px" }}
            value={filters.designation}
            onChange={(e) => updateFilter("designation", e.target.value)}
            aria-label={isSchool ? "Filter by role" : "Filter by designation"}
          >
            <option value="">{isSchool ? "All Roles" : "All Designations"}</option>
            {options.designation?.map((desig) => (
              <option key={desig} value={desig}>
                {desig}
              </option>
            ))}
          </select>

          <select
            className="toolbar-select"
            style={{ maxWidth: "95px" }}
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {facultyStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-btn toolbar-btn-primary"
            onClick={() => setForm({ teacher: null })}
          >
            <Plus size={14} />
            {isSchool ? "Add New Teacher" : "Add Faculty Member"}
          </button>
        </div>
      </div>

      {/* 3. Frameless Border-to-Border Fixed Table */}
      <div className="campus-table-container">
        <Table className="campus-table">
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: "24%" }}>{isSchool ? "Teacher & Contact" : "Faculty Member"}</TableHead>
              <TableHead style={{ width: "21%" }}>Designation & Qualification</TableHead>
              <TableHead style={{ width: "26%" }}>{isSchool ? "Wing & Teaching Subject(s)" : "Department & Subjects"}</TableHead>
              <TableHead style={{ width: "12%" }}>Campus Branch</TableHead>
              <TableHead style={{ width: "9%", textAlign: "center" }}>Duty Status</TableHead>
              <TableHead style={{ width: "8%", textAlign: "center" }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length > 0 ? (
              displayed.map((teacher) => {
                const statusText = teacher.status || "Active";
                const statusKey = statusText.toLowerCase().includes("active") || statusText.toLowerCase().includes("full")
                  ? "active"
                  : statusText.toLowerCase().includes("leave") || statusText.toLowerCase().includes("part")
                  ? "pending"
                  : "inactive";

                const targetTeacherId = teacher._id || teacher.id || teacher.user?._id || teacher.userId || teacher.employeeId;

                return (
                  <TableRow
                    key={targetTeacherId || teacher.name}
                    className="cursor-pointer hover:bg-zinc-50 transition-colors"
                    onClick={() => {
                      if (targetTeacherId) {
                        navigate(`/faculty/${targetTeacherId}`);
                      }
                    }}
                  >
                    <TableCell style={{ width: "24%", overflow: "hidden" }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, overflow: "hidden" }}
                        title={`View full profile for ${teacher.name}`}
                      >
                        <Avatar style={{ width: "28px", height: "28px", fontSize: "11px", fontWeight: "600", background: "#f4f4f5", color: "#09090b", flexShrink: 0 }}>
                          <AvatarFallback>{teacher.initials || teacher.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                          <strong
                            className="campus-clickable-link"
                            style={{ fontSize: "13px", fontWeight: "600", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
                          >
                            {teacher.name}
                          </strong>
                          <span style={{ fontSize: "11px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                            {teacher.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell style={{ width: "21%", overflow: "hidden" }}>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {teacher.designation}
                        </span>
                        <span style={{ fontSize: "11px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {teacher.qualification}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell style={{ width: "26%", overflow: "hidden" }}>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {teacher.department}
                        </span>
                        <span
                          style={{ fontSize: "11px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
                          title={teacher.subjects}
                        >
                          {teacher.subjects}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell style={{ width: "12%", overflow: "hidden" }}>
                      <span style={{ fontSize: "12px", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {teacher.campus || "Main Campus"}
                      </span>
                    </TableCell>

                    <TableCell style={{ width: "9%", textAlign: "center", overflow: "hidden" }}>
                      <span className={`campus-status-pill status-${statusKey}`}>
                        <span className="status-dot" />
                        {statusText}
                      </span>
                    </TableCell>

                    <TableCell style={{ width: "8%", textAlign: "center", overflow: "hidden" }}>
                      <div className="campus-action-icons" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="table-icon-btn"
                          title="View Full Profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (targetTeacherId) {
                              navigate(`/faculty/${targetTeacherId}`);
                            }
                          }}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          className="table-icon-btn"
                          title="Edit Faculty Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm({ teacher });
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="table-icon-btn delete"
                          title="Delete Faculty"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(teacher);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "#71717a" }}>
                  No faculty members match your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Standardized DataPagination */}
      <DataPagination
        page={currentPage}
        pageSize={pageSize}
        total={filtered.length}
        pageCount={pageCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        itemLabel="teachers"
      />

      {/* Dialogs */}
      {viewingTeacher && (
        <FacultyProfileDialog
          teacher={viewingTeacher}
          onClose={() => setViewingTeacher(null)}
        />
      )}

      {form && (
        <FacultyForm
          teacher={form.teacher}
          options={options}
          onSave={saveTeacher}
          onClose={() => setForm(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Faculty Member?"
        description={`Are you sure you want to delete ${deleteTarget?.name ?? "this faculty member"}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            try {
              await dispatch(deleteFaculty(deleteTarget.id || deleteTarget._id)).unwrap();
              toast.success(`${deleteTarget.name || "Faculty member"} removed successfully!`);
            } catch (err) {
              toast.error(typeof err === "string" ? err : "Failed to remove faculty member");
            }
          }
          setDeleteTarget(null);
        }}
      />
    </section>
  );
}
