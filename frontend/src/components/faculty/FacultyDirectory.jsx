import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
  facultyRecords as demoRecords,
  facultyStatuses,
  filterFaculty,
} from "./facultyData";
import {
  selectFaculty,
  facultyAdded,
  facultyUpdated,
  facultyDeleted,
} from "@/store/Slices/facultySlice.js";
import FacultyForm from "./FacultyForm";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import "./FacultyDirectory.css";

export default function FacultyDirectory() {
  const dispatch = useDispatch();
  const facultyRecords = useSelector(selectFaculty);
  const [form, setForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const options = Object.fromEntries(
    ["designation", "department", "campus"].map((key) => [
      key,
      [
        ...new Set(
          [...demoRecords, ...facultyRecords].map((teacher) => teacher[key]),
        ),
      ],
    ]),
  );
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    designation: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filtered = filterFaculty(facultyRecords, filters);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const displayed = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };
  const saveTeacher = (values) => {
    if (form.teacher)
      dispatch(facultyUpdated({ ...values, id: form.teacher.id }));
    else dispatch(facultyAdded(values));
    // Reveal the saved record even if earlier filters would hide it.
    setFilters({ search: "", department: "", designation: "", status: "" });
    const index = form.teacher
      ? facultyRecords.findIndex((teacher) => teacher.id === form.teacher.id)
      : facultyRecords.length;
    setPage(Math.floor(Math.max(0, index) / pageSize) + 1);
    setForm(null);
  };

  return (
    <section className="faculty-directory" aria-labelledby="faculty-title">
      <Card className="faculty-banner">
        <nav aria-label="Faculty breadcrumb" className="faculty-breadcrumb">
          <Link to="/dashboard">
            <Home size={13} aria-hidden="true" />
            Dashboard
          </Link>
          <ChevronRight size={13} aria-hidden="true" />
          <span>Staff</span>
          <ChevronRight size={13} aria-hidden="true" />
          <span aria-current="page">Faculty &amp; Staff Directory</span>
        </nav>
        <div className="faculty-banner-content">
          <div>
            <h1 id="faculty-title">Faculty &amp; Staff Directory</h1>
            <p>
              Manage professors, lecturers, department heads, and course
              assignments.
            </p>
          </div>
          <Button
            className="faculty-add"
            onClick={() => setForm({ teacher: null })}
          >
            <Plus size={15} />
            Add New Teacher
          </Button>
        </div>
      </Card>
      <Card className="faculty-list">
        <div className="faculty-filters">
          <label className="faculty-search">
            <Search size={17} aria-hidden="true" />
            <Input
              aria-label="Search faculty by name, department, or designation"
              placeholder="Search by name, department, designation..."
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
            />
          </label>
          <div className="faculty-filter-selects">
            {[
              {
                key: "department",
                label: "All Departments",
                aria: "Filter by department",
              },
              {
                key: "designation",
                label: "All Designations",
                aria: "Filter by designation",
              },
              { key: "status", label: "Status", aria: "Filter by status" },
            ].map(({ key, label, aria }) => (
              <select
                key={key}
                aria-label={aria}
                value={filters[key]}
                onChange={(event) => updateFilter(key, event.target.value)}
              >
                <option value="">{label}</option>
                {(key === "status" ? facultyStatuses : options[key]).map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
            ))}
          </div>
        </div>
        <Table aria-label="Faculty and staff directory">
          <TableHeader>
            <TableRow>
              {[
                "Teacher / Faculty",
                "Designation & Qualification",
                "Department & Subjects",
                "Campus Branch",
                "Status",
                "Actions",
              ].map((label) => (
                <TableHead key={label} scope="col">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>
                  <div className="faculty-person">
                    <Avatar className="faculty-avatar">
                      <AvatarFallback>{teacher.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <strong>{teacher.name}</strong>
                      <small>{teacher.email}</small>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <strong>{teacher.designation}</strong>
                  <small className="faculty-qualification">
                    {teacher.qualification}
                  </small>
                </TableCell>
                <TableCell>
                  <strong>{teacher.department}</strong>
                  <small>{teacher.subjects}</small>
                </TableCell>
                <TableCell>{teacher.campus}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`faculty-status faculty-status-${teacher.status.toLowerCase()}`}
                  >
                    <span aria-hidden="true" />
                    {teacher.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="faculty-actions">
                    <Button
                      variant="ghost"
                      className="faculty-edit"
                      onClick={() => setForm({ teacher })}
                      aria-label={`Edit ${teacher.name}`}
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="faculty-delete"
                      onClick={() => setDeleteTarget(teacher)}
                      aria-label={`Delete ${teacher.name}`}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {displayed.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="faculty-empty">
                  No faculty members match your search and filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="faculty-list-footer">
          <p role="status">
            Showing {displayed.length} of {filtered.length} faculty{" "}
            {filtered.length === 1 ? "member" : "members"}
          </p>
          <nav className="faculty-pagination" aria-label="Faculty pagination">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              className="faculty-current-page"
              aria-current="page"
              aria-label={`Page ${currentPage}`}
            >
              {currentPage}
            </Button>
            <Button
              variant="outline"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </Button>
            <select aria-label="Rows per page" value="10" disabled>
              <option value="10">10 / page</option>
            </select>
          </nav>
        </div>
      </Card>
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
        onConfirm={() => {
          if (deleteTarget) dispatch(facultyDeleted(deleteTarget.id));
          setDeleteTarget(null);
        }}
      />
    </section>
  );
}
