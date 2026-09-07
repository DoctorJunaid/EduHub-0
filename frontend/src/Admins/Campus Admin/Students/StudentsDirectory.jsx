import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Home,
  ChevronRight,
  ChevronLeft,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  studentAdded,
  studentUpdated,
  studentDeleted,
} from "@/store/Slices/studentsSlice.js";
import {
  studentStatuses,
  studentPrograms,
  studentCampuses,
  filterStudents,
  paginateStudents,
} from "./studentData.js";
import StudentForm from "./StudentForm";
import StudentProfileDialog from "./StudentProfileDialog";
import StudentStatusBadge from "./StudentStatusBadge";
import "./StudentsDirectory.css";

export default function StudentsDirectory() {
  const dispatch = useDispatch();
  const students = useSelector(selectStudents);
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    program: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const programs = [
    ...new Set([
      ...studentPrograms,
      ...students.map((student) => student.program),
    ]),
  ];
  const campuses = [
    ...new Set([
      ...studentCampuses,
      ...students.map((student) => student.campus),
    ]),
  ];
  const filtered = filterStudents(students, filters);
  const result = paginateStudents(filtered, page, pageSize);
  const selected = students.find((student) => student.id === modal?.id);
  const close = () => setModal(null);
  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };
  const save = (values) => {
    const index =
      modal.mode === "edit"
        ? students.findIndex((student) => student.id === selected.id)
        : students.length;
    if (modal.mode === "edit")
      dispatch(studentUpdated({ ...values, id: selected.id }));
    else dispatch(studentAdded(values));
    setFilters({ search: "", program: "", status: "" });
    setPage(Math.floor(index / pageSize) + 1);
    close();
  };
  return (
    <section className="students-directory" aria-labelledby="students-title">
      <nav className="students-breadcrumb" aria-label="Students breadcrumb">
        <Link to="/dashboard">
          <Home size={15} aria-hidden="true" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span>Students</span>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page">Students Directory</span>
      </nav>
      <div className="students-heading">
        <div>
          <h1 id="students-title">Students Directory &amp; Records</h1>
          <p>
            Complete management of enrolled students, sections, subjects, and
            guardians.
          </p>
        </div>
        <Button
          className="students-add"
          onClick={() => setModal({ mode: "add" })}
        >
          <Plus size={18} />
          Add New Student
        </Button>
      </div>
      <Card className="students-list">
        <div className="students-filters">
          <label className="students-search">
            <Search size={19} aria-hidden="true" />
            <Input
              placeholder="Search by name, roll no, program..."
              aria-label="Search students by name, roll number, or program"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
            />
          </label>
          <div className="students-filter-selects">
            <select
              aria-label="Filter by program"
              value={filters.program}
              onChange={(event) => updateFilter("program", event.target.value)}
            >
              <option value="">All Programs</option>
              {programs.map((program) => (
                <option key={program}>{program}</option>
              ))}
            </select>
            <select
              aria-label="Department filter unavailable: student records have no department"
              disabled
              title="Student records do not include a department"
            >
              <option>All Departments</option>
            </select>
            <select
              aria-label="Filter by status"
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              <option value="">All statuses</option>
              {studentStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
        <Table aria-label="Students directory">
          <TableHeader>
            <TableRow>
              {[
                "Student & Roll No",
                "Class / Program & Section",
                "Enrolled Subjects",
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
            {result.records.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="students-person">
                    <Avatar className="students-avatar">
                      <AvatarFallback>{student.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <strong>{student.name}</strong>
                      <small className="students-roll">{student.roll}</small>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <strong>{student.program}</strong>
                  <small>
                    Sec: {student.section} • {student.semester}
                  </small>
                </TableCell>
                <TableCell className="students-subjects-cell">
                  {student.subjects}
                </TableCell>
                <TableCell>{student.campus}</TableCell>
                <TableCell>
                  <StudentStatusBadge status={student.status} />
                </TableCell>
                <TableCell>
                  <div className="students-row-actions">
                    <Button
                      variant="ghost"
                      aria-label={`View ${student.name}`}
                      onClick={() => setModal({ mode: "view", id: student.id })}
                    >
                      <Eye size={17} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="students-edit"
                      aria-label={`Edit ${student.name}`}
                      onClick={() => setModal({ mode: "edit", id: student.id })}
                    >
                      <Pencil size={17} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="students-delete"
                      aria-label={`Delete ${student.name}`}
                      onClick={() =>
                        setModal({ mode: "delete", id: student.id })
                      }
                    >
                      <Trash2 size={17} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {result.records.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="students-empty">
                  No students match your search and filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="students-footer">
          <p role="status">
            Showing {filtered.length ? result.start + 1 : 0} to{" "}
            {result.start + result.records.length} of {filtered.length} students
          </p>
          <nav className="students-pagination" aria-label="Students pagination">
            <Button
              variant="outline"
              disabled={result.currentPage === 1}
              onClick={() => setPage(result.currentPage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              className="students-current-page"
              aria-current="page"
              aria-label={`Page ${result.currentPage}`}
            >
              {result.currentPage}
            </Button>
            <Button
              variant="outline"
              disabled={result.currentPage === result.pageCount}
              onClick={() => setPage(result.currentPage + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </Button>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </nav>
        </div>
      </Card>
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
        onConfirm={() => {
          if (selected) dispatch(studentDeleted(selected.id));
          close();
        }}
      />
    </section>
  );
}
