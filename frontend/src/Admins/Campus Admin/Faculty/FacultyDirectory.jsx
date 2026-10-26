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
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  facultyStatuses,
  filterFaculty,
} from "./facultyData";
import {
  selectFaculty,
  selectFacultyStatus,
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
import TableSkeleton from "@/components/shared/TableSkeleton";
import { Spinner } from "@/components/ui/spinner";
import "./FacultyDirectory.css";

export default function FacultyDirectory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSchool } = useInstitution();
  const status = useSelector(selectFacultyStatus);
  const isLoading = status === "loading";

  useEffect(() => {
    dispatch(fetchFaculty());
  }, [dispatch]);

  const currentUser = useSelector(selectCurrentUser);
  const realUserCampus = currentUser?.campusId?.name || currentUser?.campus || "";

  const rawFaculty = useSelector(selectFaculty);
  const facultyRecords = useMemo(() => {
    return Array.isArray(rawFaculty) ? rawFaculty : [];
  }, [rawFaculty]);

  const [form, setForm] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

      {/* Main Table Card Container with Horizontal Scroll Wrapper */}
      <div
        className="w-full flex-1"
        style={{ padding: "16px 20px 24px", boxSizing: "border-box" }}
      >
        <div className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
          {/* 2. Filter Toolbar */}
          <div
            className="campus-toolbar flex items-center justify-between border-b border-neutral-200 bg-neutral-50/50"
            style={{ minHeight: "52px", padding: "10px 16px", boxSizing: "border-box" }}
          >
            <div className="toolbar-left flex items-center" style={{ gap: "8px" }}>
              <div className="toolbar-search relative flex items-center" style={{ width: "170px" }}>
                <Search size={14} className="absolute left-2.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={isSchool ? "Search teachers..." : "Search faculty..."}
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  aria-label="Search faculty by name or department"
                  className="border border-neutral-200 rounded-lg bg-white text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  style={{ height: "36px", paddingLeft: "30px", paddingRight: "10px", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <select
                className="toolbar-select border border-neutral-200 rounded-lg bg-white text-xs text-neutral-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-400"
                style={{ height: "36px", padding: "0 10px", minWidth: "110px", boxSizing: "border-box" }}
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
                className="toolbar-select border border-neutral-200 rounded-lg bg-white text-xs text-neutral-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-400"
                style={{ height: "36px", padding: "0 10px", minWidth: "110px", boxSizing: "border-box" }}
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
                className="toolbar-select border border-neutral-200 rounded-lg bg-white text-xs text-neutral-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-400"
                style={{ height: "36px", padding: "0 10px", minWidth: "100px", boxSizing: "border-box" }}
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

            <div className="toolbar-actions flex items-center">
              <button
                type="button"
                className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium inline-flex items-center justify-center whitespace-nowrap shadow-xs cursor-pointer transition-colors"
                style={{ height: "36px", padding: "0 14px", gap: "6px" }}
                onClick={() => setForm({ teacher: null })}
              >
                <Plus size={14} />
                {isSchool ? "Add New Teacher" : "Add Faculty Member"}
              </button>
            </div>
          </div>

          {/* 3. Responsive Fluid Table Container */}
          <div className="w-full overflow-hidden relative">
            {isLoading && facultyRecords.length > 0 && (
              <div className="absolute inset-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Spinner className="size-6 text-primary" />
              </div>
            )}
            <table className="w-full border-collapse text-left table-auto">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70">
                  <th
                    className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                    style={{ padding: "12px 14px", width: "26%" }}
                  >
                    {isSchool ? "Teacher & Contact" : "Faculty Member"}
                  </th>
                  <th
                    className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                    style={{ padding: "12px 14px", width: "20%" }}
                  >
                    Designation & Qualification
                  </th>
                  <th
                    className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                    style={{ padding: "12px 14px", width: "24%" }}
                  >
                    {isSchool ? "Wing & Teaching Subject(s)" : "Department & Subjects"}
                  </th>
                  <th
                    className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                    style={{ padding: "12px 14px", width: "15%" }}
                  >
                    Campus Branch
                  </th>
                  <th
                    className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                    style={{ padding: "12px 14px", width: "8%" }}
                  >
                    Duty Status
                  </th>
                  <th
                    className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 text-right"
                    style={{ padding: "12px 14px", width: "7%" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {isLoading && facultyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <TableSkeleton rows={6} columns={6} />
                    </td>
                  </tr>
                ) : displayed.length > 0 ? (
                  displayed.map((teacher) => {
                    const statusText = teacher.status || "Active";
                    const statusKey =
                      statusText.toLowerCase().includes("active") ||
                      statusText.toLowerCase().includes("full")
                        ? "active"
                        : statusText.toLowerCase().includes("leave") ||
                          statusText.toLowerCase().includes("part")
                        ? "pending"
                        : "inactive";

                    const targetTeacherId =
                      teacher._id ||
                      teacher.id ||
                      teacher.user?._id ||
                      teacher.userId ||
                      teacher.employeeId;

                    return (
                      <tr
                        key={targetTeacherId || teacher.name}
                        className="cursor-pointer hover:bg-neutral-50/50 transition-colors"
                        onClick={() => {
                          if (targetTeacherId) {
                            navigate(`/faculty/${targetTeacherId}`, {
                              state: { teacherName: teacher.name, teacher },
                            });
                          }
                        }}
                      >
                        {/* Teacher & Contact */}
                        <td className="text-xs text-neutral-900" style={{ padding: "12px 14px" }}>
                          <div
                            style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}
                            title={`View full profile for ${teacher.name}`}
                          >
                            <Avatar
                              style={{
                                width: "32px",
                                height: "32px",
                                fontSize: "11px",
                                fontWeight: "600",
                                background: "#f4f4f5",
                                color: "#09090b",
                                flexShrink: 0,
                              }}
                            >
                              <AvatarFallback>
                                {teacher.initials || teacher.name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                              <strong
                                className="campus-clickable-link"
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#09090b",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  display: "block",
                                }}
                              >
                                {teacher.name}
                              </strong>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#71717a",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  display: "block",
                                }}
                              >
                                {teacher.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Designation & Qualification */}
                        <td className="text-xs text-neutral-700" style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#09090b",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                              }}
                            >
                              {teacher.designation || "Faculty Member"}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#71717a",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                              }}
                            >
                              {teacher.qualification || "—"}
                            </span>
                          </div>
                        </td>

                        {/* Wing & Teaching Subject(s) */}
                        <td className="text-xs text-neutral-700 truncate max-w-xs" style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#09090b",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                              }}
                            >
                              {teacher.department || "General"}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#71717a",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                              }}
                              title={teacher.subjects}
                            >
                              {teacher.subjects || "—"}
                            </span>
                          </div>
                        </td>

                        {/* Campus Branch */}
                        <td className="text-xs text-neutral-700 truncate" style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#09090b",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "block",
                            }}
                          >
                            {teacher.campus || realUserCampus || "Main Campus"}
                          </span>
                        </td>

                        {/* Duty Status */}
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            className={`inline-flex items-center rounded-md border text-[11px] font-medium whitespace-nowrap ${
                              statusKey === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : statusKey === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                            style={{ padding: "2px 8px", gap: "5px" }}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                statusKey === "active"
                                  ? "bg-emerald-500"
                                  : statusKey === "pending"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            {statusText}
                          </span>
                        </td>

                        {/* Actions Cell - Right aligned with zero overflow */}
                        <td className="text-right whitespace-nowrap" style={{ padding: "12px 14px" }}>
                          <div
                            className="inline-flex items-center justify-end"
                            style={{ gap: "6px" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (targetTeacherId) {
                                  navigate(`/faculty/${targetTeacherId}`, {
                                    state: { teacherName: teacher.name, teacher },
                                  });
                                }
                              }}
                              className="p-1 rounded border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
                              title="View Full Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setForm({ teacher });
                              }}
                              className="p-1 rounded border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
                              title="Edit Faculty Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(teacher);
                              }}
                              className="p-1 rounded border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                              title="Delete Faculty"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: "center", padding: "48px 16px", color: "#71717a" }}
                    >
                      {filters.search || filters.department || filters.designation || filters.status
                        ? "No faculty members match your filter criteria."
                        : "No faculty members appointed for this campus yet. Click '+ Add New Teacher' to get started."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Standardized DataPagination Footer */}
          <DataPagination
            page={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            pageCount={pageCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="teachers"
          />
        </div>
      </div>

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
        loading={isDeleting}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (deleteTarget) {
            try {
              setIsDeleting(true);
              await dispatch(deleteFaculty(deleteTarget.id || deleteTarget._id)).unwrap();
              toast.success(`${deleteTarget.name || "Faculty member"} removed successfully!`);
              setDeleteTarget(null);
            } catch (err) {
              toast.error(typeof err === "string" ? err : "Failed to remove faculty member");
            } finally {
              setIsDeleting(false);
            }
          }
        }}
      />
    </section>
  );
}
