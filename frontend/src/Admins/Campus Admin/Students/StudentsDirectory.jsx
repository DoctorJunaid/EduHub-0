import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  UserCheck,
  Clock,
  Percent,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  selectStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  fetchStudents,
} from "@/store/Slices/studentsSlice.js";
import {
  studentStatuses,
  studentPrograms,
  studentSemesters,
  studentCampuses,
  filterStudents,
  paginateStudents,
} from "./studentData.js";
import { campusStudents as demoStudents } from "../Dashboard/campusOverviewData.js";
import toast from "react-hot-toast";
import StudentForm from "./StudentForm";
import StudentProfileDialog from "./StudentProfileDialog";
import { useInstitution } from "@/context/InstitutionContext";
import "./StudentsDirectory.css";

export default function StudentsDirectory() {
  const dispatch = useDispatch();
  const { isSchool } = useInstitution();

  useEffect(() => {
    dispatch(fetchStudents());
  }, [dispatch]);

  const rawStudents = useSelector(selectStudents);
  const students = useMemo(() => {
    if (isSchool) {
      return rawStudents && rawStudents.length > 0 ? rawStudents : [];
    }
    return rawStudents?.length ? rawStudents : demoStudents;
  }, [rawStudents, isSchool]);

  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    program: "",
    semester: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const programs = useMemo(() => {
    if (isSchool) {
      const cls = [
        ...new Set(students.map((student) => student.gradeOrClass || student.program).filter(Boolean)),
      ];
      return cls.length > 0 ? cls : ["Grade 10", "Grade 9", "Grade 8", "Grade 7", "Grade 6", "Grade 5"];
    }
    return [
      ...new Set([
        ...studentPrograms,
        ...students.map((student) => student.program).filter(Boolean),
      ]),
    ];
  }, [students, isSchool]);

  const semesters = useMemo(() => {
    if (isSchool) {
      const sec = [...new Set(students.map((student) => student.section).filter(Boolean))];
      return sec.length > 0 ? sec : ["Section A", "Section B", "Section C", "Section D"];
    }
    return [
      ...new Set([
        ...studentSemesters,
        ...students.map((student) => student.semester).filter(Boolean),
      ]),
    ];
  }, [students, isSchool]);

  const campuses = useMemo(() => {
    return [
      ...new Set([
        ...studentCampuses,
        ...students.map((student) => student.campus).filter(Boolean),
      ]),
    ];
  }, [students]);

  const filtered = useMemo(() => filterStudents(students, filters), [students, filters]);
  const result = useMemo(() => paginateStudents(filtered, page, pageSize), [filtered, page, pageSize]);
  const selected = students.find((student) => (student.id === modal?.id || student._id === modal?.id));

  const close = () => setModal(null);

  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  const save = async (values) => {
    try {
      if (modal.mode === "edit") {
        await dispatch(updateStudent({ ...values, id: selected.id || selected._id })).unwrap();
        toast.success("Student record updated successfully!");
      } else {
        await dispatch(addStudent(values)).unwrap();
        toast.success("Student added successfully!");
      }
      setFilters({ search: "", program: "", status: "" });
      close();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to save student record");
      throw err;
    }
  };

  // KPI stats calculations
  const totalCount = students.length;
  const activeCount = students.filter(s => s.status === 'Active').length;
  const pendingCount = students.filter(s => s.status === 'Pending').length;

  return (
    <section className="campus-tab-page students-directory" aria-label="Students Directory Management">
      {/* 1. Top Thin KPI Cards (Flush Border-to-Border, 56px) */}
      <div className="campus-kpi-track">
        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Users size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Enrolled Pupils" : "Enrolled Students"}</span>
              <strong className="kpi-value">{totalCount}</strong>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <UserCheck size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Active Pupils" : "Active Status"}</span>
              <strong className="kpi-value">{activeCount}</strong>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Clock size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Pending Verification</span>
              <strong className="kpi-value">{pendingCount}</strong>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Percent size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{isSchool ? "Pupil Attendance" : "Average Attendance"}</span>
              <strong className="kpi-value">96.4%</strong>
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
              placeholder={isSchool ? "Search pupils by name or roll..." : "Search students..."}
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              aria-label="Search records"
            />
          </div>

          <select
            className="toolbar-select"
            value={filters.program}
            onChange={(e) => updateFilter("program", e.target.value)}
            aria-label={isSchool ? "Filter by Class" : "Filter by program"}
          >
            <option value="">{isSchool ? "All Classes" : "All Programs"}</option>
            {programs.map((prog) => (
              <option key={prog} value={prog}>
                {prog}
              </option>
            ))}
          </select>

          <select
            className="toolbar-select"
            value={filters.semester}
            onChange={(e) => updateFilter("semester", e.target.value)}
            aria-label={isSchool ? "Filter by Section" : "Filter by semester"}
          >
            <option value="">{isSchool ? "All Sections" : "All Semesters"}</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
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
            {studentStatuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-btn toolbar-btn-primary"
            onClick={() => setModal({ mode: "add" })}
          >
            <Plus size={14} />
            {isSchool ? "Admit New Pupil" : "Add New Student"}
          </button>
        </div>
      </div>

      {/* 3. Fixed Table Container with Zero Overflow */}
      <div className="campus-table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: "24%" }}>{isSchool ? "Pupil Name & Roll" : "Student Member"}</TableHead>
              <TableHead style={{ width: "22%" }}>{isSchool ? "Class & Enrolled Subjects" : "Program & Specialization"}</TableHead>
              <TableHead style={{ width: "24%" }}>{isSchool ? "Section & Guardian Contact" : "Semester & Academics"}</TableHead>
              <TableHead style={{ width: "13%" }}>Campus Branch</TableHead>
              <TableHead className="text-center" style={{ width: "9%" }}>Status</TableHead>
              <TableHead className="text-center" style={{ width: "8%" }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.records.map((student) => (
              <TableRow key={student.id || student.roll}>
                <TableCell style={{ width: "24%", overflow: "hidden" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", minWidth: 0, overflow: "hidden" }}
                    onClick={() => setModal({ mode: "view", id: student.id || student._id })}
                  >
                    <Avatar style={{ width: "28px", height: "28px", fontSize: "11px", fontWeight: "600", background: "#f4f4f5", color: "#09090b", flexShrink: 0 }}>
                      <AvatarFallback>{student.initials || student.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px", overflow: "hidden" }}>
                      <strong style={{ fontSize: "13px", fontWeight: "600", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25, display: "block" }}>
                        {student.name}
                      </strong>
                      <span style={{ fontSize: "11px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2, display: "block" }}>
                        Roll No: {student.roll}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell style={{ width: "22%", overflow: "hidden" }}>
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px", overflow: "hidden" }}>
                    <strong style={{ fontSize: "12px", fontWeight: "600", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25, display: "block" }}>
                      {isSchool ? (student.gradeOrClass || student.program?.replace(/BS\s+/i, "Grade 10 - ") || "Grade 10") : student.program}
                    </strong>
                    <span
                      style={{ fontSize: "11px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2, display: "block" }}
                      title={student.subjects || student.specialization}
                    >
                      {isSchool ? (student.subjects || "General Subjects") : (student.specialization || student.subjects?.split(",")[0] || "General Studies")}
                    </span>
                  </div>
                </TableCell>
                <TableCell style={{ width: "24%", overflow: "hidden" }}>
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px", overflow: "hidden" }}>
                    <strong style={{ fontSize: "12px", fontWeight: "600", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25, display: "block" }}>
                      {isSchool
                        ? `Section ${student.section || "A"} · Session ${student.semester || student.session || "2024-2025"}`
                        : `${student.semester || "4th Semester"} · ${student.section || "CS-4A"}`}
                    </strong>
                    <span
                      style={{ fontSize: "11px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2, display: "block" }}
                      title={isSchool ? `Guardian: ${student.guardian || "Parent on file"} (${student.guardianPhone || student.phone || student.studentPhone || "—"})` : undefined}
                    >
                      {isSchool
                        ? `Guardian: ${student.guardian || "Parent on file"} (${student.guardianPhone || student.phone || student.studentPhone || "—"})`
                        : `${student.attendance || "94.2%"} Attendance · ${student.cgpa ? `${student.cgpa} CGPA` : "Good Standing"}`}
                    </span>
                  </div>
                </TableCell>
                <TableCell style={{ width: "13%", overflow: "hidden" }}>
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px", overflow: "hidden" }}>
                    <strong style={{ fontSize: "12px", fontWeight: "600", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25, display: "block" }}>
                      {student.campus || "Main Campus"}
                    </strong>
                    <span style={{ fontSize: "11px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2, display: "block" }}>
                      {isSchool ? "School Wing" : (student.guardian ? `Guardian: ${student.guardian}` : "Main Campus Branch")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center" style={{ width: "9%", overflow: "hidden" }}>
                  <span
                    className={`campus-status-pill ${
                      student.status === "Active"
                        ? "is-active"
                        : student.status === "Suspended" || student.status === "Inactive"
                        ? "is-danger"
                        : "is-pending"
                    }`}
                  >
                    <span className="dot" />
                    {student.status || "Active"}
                  </span>
                </TableCell>
                <TableCell className="text-center" style={{ width: "8%", overflow: "hidden" }}>
                  <div className="campus-action-icons">
                    <button
                      type="button"
                      className="campus-icon-btn"
                      title="Edit student"
                      onClick={() => setModal({ mode: "edit", id: student.id || student._id })}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className="campus-icon-btn is-delete"
                      title="Delete student"
                      onClick={() => setModal({ mode: "delete", id: student.id || student._id })}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {result.records.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#71717a" }}>
                  No student records match your search and filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. Frameless Footer */}
      <div className="campus-footer">
        <div className="campus-footer-info">
          Showing <strong>{filtered.length ? result.start + 1 : 0}</strong> to{" "}
          <strong>{result.start + result.records.length}</strong> of <strong>{filtered.length}</strong> students
        </div>

        <div className="campus-pagination">
          <Button
            variant="ghost"
            size="sm"
            disabled={result.currentPage <= 1}
            onClick={() => setPage(result.currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </Button>

          {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              className={`campus-page-btn ${num === result.currentPage ? "is-active" : ""}`}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            disabled={result.currentPage >= result.pageCount}
            onClick={() => setPage(result.currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      {/* Modals & Dialogs */}
      {(modal?.mode === "add" || (modal?.mode === "edit" && selected)) && (
        <StudentForm
          student={modal.mode === "edit" ? selected : null}
          programs={programs}
          campuses={campuses}
          onSave={save}
          onClose={close}
        />
      )}

      {modal?.mode === "view" && selected && (
        <StudentProfileDialog student={selected} onClose={close} />
      )}

      <ConfirmDialog
        open={modal?.mode === "delete" && Boolean(selected)}
        title="Delete Student?"
        description={`Are you sure you want to delete ${selected?.name ?? "this student"}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={close}
        onConfirm={async () => {
          if (selected) {
            try {
              await dispatch(deleteStudent(selected.id || selected._id)).unwrap();
              toast.success(`${selected.name || "Student"} removed successfully!`);
            } catch (err) {
              toast.error(typeof err === "string" ? err : "Failed to delete student");
            }
          }
          close();
        }}
      />
    </section>
  );
}
