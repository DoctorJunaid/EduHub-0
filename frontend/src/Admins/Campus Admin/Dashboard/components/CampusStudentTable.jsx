import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  Search,
  Users,
} from "lucide-react";
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
import OverviewPanel from "../../../../components/campus-overview/components/OverviewPanel";
import OverviewStatusBadge from "../../../../components/campus-overview/components/OverviewStatusBadge";
import {
  campusStudents,
  filterCampusStudents,
} from "../campusOverviewData.js";

export default function CampusStudentTable() {
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const students = filterCampusStudents(campusStudents, {
    query,
    program,
    status,
  });
  const pageCount = Math.max(1, Math.ceil(students.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const displayedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <OverviewPanel
      title="Campus Enrolled Students"
      description="Recent enrollments and guardian contact records"
      icon={Users}
      action="View All Students"
      className="overview-students"
    >
      <div className="overview-filters">
        <label className="overview-search">
          <Search size={14} aria-hidden="true" />
          <Input
            aria-label="Search students by name or roll number"
            placeholder="Search students..."
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
          />
        </label>
        <select
          aria-label="Filter by program"
          value={program}
          onChange={(event) => { setProgram(event.target.value); setPage(1); }}
        >
          <option value="">Program</option>
          {[...new Set(campusStudents.map((student) => student.program))].map(
            (value) => (
              <option key={value}>{value}</option>
            ),
          )}
        </select>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
        >
          <option value="">Status</option>
          <option>Active</option>
          <option>Pending</option>
        </select>
        <Button
          variant="outline"
          className="overview-filter-button"
          disabled
          title="Program and status filters apply automatically"
        >
          <Filter size={13} />
          Filter
        </Button>
      </div>
      <span className="sr-only" role="status">
        {displayedStudents.length} of {students.length} students shown
      </span>
      <Table aria-label="Campus enrolled students">
        <TableHeader>
          <TableRow>
            {[
              "Student Name & Roll No",
              "Program & Section",
              "Status",
              "Guardian Contact",
              "Action",
            ].map((label) => (
              <TableHead key={label} scope="col">
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedStudents.map((student) => (
            <TableRow key={student.roll}>
              <TableCell>
                <div className="overview-person">
                  <Avatar className={`overview-avatar ${student.tone}`}>
                    <AvatarFallback>{student.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <strong>{student.name}</strong>
                    <small>{student.roll}</small>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <strong>{student.program}</strong>
                <small>Sec: {student.section}</small>
              </TableCell>
              <TableCell>
                <OverviewStatusBadge status={student.status} />
              </TableCell>
              <TableCell>
                <strong>{student.guardian}</strong>
                <small>{student.phone}</small>
              </TableCell>
              <TableCell>
                <div className="overview-row-actions">
                  <Button
                    variant="outline"
                    className="overview-profile-button"
                    disabled
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="overview-icon-button"
                    disabled
                    aria-label={`${student.name} options`}
                  >
                    <MoreVertical size={13} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {students.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="overview-empty">
                No students match your search and filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="overview-pagination" aria-label="Student pagination">
        <div>
          <Button variant="ghost" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
            <ChevronLeft size={14} />
          </Button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <Button
              key={pageNumber}
              variant="ghost"
              onClick={() => setPage(pageNumber)}
              aria-label={`Page ${pageNumber}`}
              aria-current={pageNumber === currentPage ? "page" : undefined}
            >
              {pageNumber}
            </Button>
          ))}
          <Button variant="ghost" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
            <ChevronRight size={14} />
          </Button>
        </div>
        <select aria-label="Rows per page" disabled defaultValue="10">
          <option value="10">10 / page</option>
        </select>
      </div>
    </OverviewPanel>
  );
}
