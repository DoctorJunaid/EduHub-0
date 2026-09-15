import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { selectInstituteCampuses } from '@/store/Slices/campusesSlice';
import { useSelector } from "react-redux";
import {
  Users,
  GraduationCap,
  Building2,
  Layers,
  Plus,
  Megaphone,
  SlidersHorizontal,
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
import StudentProfileDialog from "../Campus Admin/Students/StudentProfileDialog";
import StudentStatusBadge from "../Campus Admin/Students/StudentStatusBadge";
import { filterStudents } from "../Campus Admin/Students/studentData";
import { selectInstituteStudents } from '@/store/selectors/instituteStudents';
import { selectInstituteFaculty } from './Staff/staffData';
import { demoInstitute } from "./instituteData";
import "../Campus Admin/Students/StudentsDirectory.css";
import "./InstituteDashboard.css";

export default function InstituteDashboard() {
  const navigate = useNavigate();
  const campuses = useSelector(selectInstituteCampuses);
  const students = useSelector(selectInstituteStudents);
  const faculty = useSelector(selectInstituteFaculty);
  const [profileId, setProfileId] = useState(null),
    [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("");
  const visible = filterStudents(students, { search, status, program: "" });
  const profile = students.find((student) => student.id === profileId);
  const stats = [
    {
      icon: Users,
      label: "Total Students",
      value: students.length,
    },
    {
      icon: GraduationCap,
      label: "Active Teachers",
      value: faculty.filter((record) => record.status === "Active").length,
    },
    {
      icon: Building2,
      label: "Campus Branches",
      value: campuses.length,
    },
    {
      icon: Layers,
      label: "Institute Type",
      value: demoInstitute.type,
    },
  ];

  return (
    <section className="institute-dashboard" aria-labelledby="institute-title">
      <header className="institute-heading">
        <h1 id="institute-title">{demoInstitute.name}</h1>
      </header>

      <div className="edu-stats-grid institute-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="edu-stat-card institute-stat" key={stat.label}>
              <div className="edu-stat-head">
                <span className="edu-stat-label">{stat.label}</span>
                <span className="edu-stat-icon">
                  <Icon size={16} />
                </span>
              </div>
              <div className="edu-stat-value">{stat.value}</div>
            </article>
          );
        })}
      </div>
      <div className="institute-actions">
        {[
          [Plus, "Add New Campus", '/institute-admin/campuses?add=1'],
          [Users, "View Staff Directory", '/institute-admin/staff'],
          [Megaphone, "Broadcast Message", '/institute-admin/alerts'],
        ].map(([Icon, label, destination]) => (
          <Button
            key={label}
            variant="outline"
            onClick={() => navigate(destination)}
          >
            <Icon size={20} />
            {label}
          </Button>
        ))}
      </div>
      <Card className="institute-students">
        <div className="institute-table-heading">
          <h2>
            <span>
              <Users size={25} />
            </span>
            Registered Students
          </h2>
          <Button
            size="icon"
            variant="outline"
            aria-label="Filter registered students"
            aria-expanded={filtersOpen}
            aria-controls="institute-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={20} />
          </Button>
        </div>
        {filtersOpen && (
          <div id="institute-filters" className="institute-filters">
            <Input
              aria-label="Search registered students"
              placeholder="Search students..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              aria-label="Enrollment status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {[...new Set(students.map((student) => student.status))].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setStatus("");
              }}
            >
              Clear
            </Button>
          </div>
        )}
        <Table aria-label="Registered Students">
          <TableHeader>
            <TableRow>
              {[
                "Student Name",
                "Email",
                "Enrollment Status",
                "Campus Branch",
                "Actions",
              ].map((heading) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="institute-student-name">
                    <Avatar>
                      <AvatarFallback>{student.initials}</AvatarFallback>
                    </Avatar>
                    <strong>{student.name}</strong>
                  </div>
                </TableCell>
                <TableCell>{student.email || "—"}</TableCell>
                <TableCell>
                  <StudentStatusBadge status={student.status} />
                </TableCell>
                <TableCell>{student.campus || "—"}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => setProfileId(student.id)}
                  >
                    View Profile
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!visible.length && (
              <TableRow>
                <TableCell colSpan={5} className="institute-empty">
                  No registered students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      {profile && (
        <StudentProfileDialog
          student={profile}
          onClose={() => setProfileId(null)}
        />
      )}
    </section>
  );
}
