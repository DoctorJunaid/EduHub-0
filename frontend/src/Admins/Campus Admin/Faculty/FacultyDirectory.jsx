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
} from "lucide-react";
import toast from "react-hot-toast";
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
              <strong className="kpi-value">{totalFaculty}</strong>
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
              <strong className="kpi-value">{activeFaculty}</strong>
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
              <strong className="kpi-value">{deptCount}</strong>
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
              <strong className="kpi-value">1:15</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contiguous Toolbar Directly Under KPI Cards */}
      <div className="campus-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-search">
            <Search size={14} />
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

      {/* 3. Fixed Table Container with Zero Overflow */}
      <div className="campus-table-container relative">
        {isLoading && facultyRecords.length > 0 && (
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
            <Spinner className="size-6 text-primary" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: "28%" }}>
                {isSchool ? "Teacher & Contact" : "Faculty Member"}
              </TableHead>
              <TableHead style={{ width: "24%" }}>
                Designation & Qualification
              </TableHead>
              <TableHead style={{ width: "26%" }}>
                {isSchool ? "Wing & Teaching Subject(s)" : "Department & Subjects"}
              </TableHead>
              <TableHead style={{ width: "12%" }}>
                Campus Branch
              </TableHead>
              <TableHead className="text-center" style={{ width: "10%" }}>
                Duty Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && facultyRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <TableSkeleton rows={6} columns={5} />
                </TableCell>
              </TableRow>
            ) : displayed.length > 0 ? (
              displayed.map((teacher) => {
                const statusText = teacher.status || "Active";
                const isTeacherActive =
                  statusText.toLowerCase().includes("active") ||
                  statusText.toLowerCase().includes("full");
                const isTeacherPending =
                  statusText.toLowerCase().includes("leave") ||
                  statusText.toLowerCase().includes("part");
                const statusClass = isTeacherActive
                  ? "is-active"
                  : isTeacherPending
                  ? "is-pending"
                  : "is-danger";

                const targetTeacherId =
                  teacher._id ||
                  teacher.id ||
                  teacher.user?._id ||
                  teacher.userId ||
                  teacher.employeeId;

                return (
                  <TableRow
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
                    <TableCell style={{ width: "28%", overflow: "hidden" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          minWidth: 0,
                          overflow: "hidden",
                        }}
                        title={`View profile: ${teacher.name}`}
                      >
                        <Avatar
                          style={{
                            width: "28px",
                            height: "28px",
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
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                            gap: "2px",
                            overflow: "hidden",
                          }}
                        >
                          <strong
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#09090b",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: 1.25,
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
                              lineHeight: 1.2,
                              display: "block",
                            }}
                          >
                            {teacher.email || "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Designation & Qualification */}
                    <TableCell style={{ width: "24%", overflow: "hidden" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 0,
                          gap: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#09090b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.25,
                            display: "block",
                          }}
                        >
                          {teacher.designation || "Faculty Member"}
                        </strong>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#71717a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.2,
                            display: "block",
                          }}
                        >
                          {teacher.qualification || "—"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Wing & Teaching Subject(s) */}
                    <TableCell style={{ width: "26%", overflow: "hidden" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 0,
                          gap: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#09090b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.25,
                            display: "block",
                          }}
                        >
                          {teacher.department || "General"}
                        </strong>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#71717a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.2,
                            display: "block",
                          }}
                          title={teacher.subjects}
                        >
                          {teacher.subjects || "—"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Campus Branch */}
                    <TableCell style={{ width: "12%", overflow: "hidden" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 0,
                          gap: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#09090b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.25,
                            display: "block",
                          }}
                        >
                          {teacher.campus || realUserCampus || "Main Campus"}
                        </strong>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#71717a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.2,
                            display: "block",
                          }}
                        >
                          {isSchool ? "Teaching Wing" : "Campus Faculty"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Duty Status */}
                    <TableCell className="text-center" style={{ width: "10%", overflow: "hidden" }}>
                      <span className={`campus-status-pill ${statusClass}`}>
                        <span className="dot" />
                        {statusText}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  style={{ textAlign: "center", padding: "48px 16px", color: "#71717a" }}
                >
                  {filters.search || filters.department || filters.designation || filters.status
                    ? "No faculty members match your filter criteria."
                    : "No faculty members appointed for this campus yet. Click '+ Add New Teacher' to get started."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
