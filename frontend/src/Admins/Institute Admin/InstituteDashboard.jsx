import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCampuses,
  selectInstituteCampuses,
} from "@/store/Slices/campusesSlice";
import axiosInstance from "@/api/axiosInstance";
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
import { Button } from "@/components/ui/button";
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
import DataPagination from "@/components/shared/DataPagination";
import PageLoader from "@/components/shared/PageLoader";
import StudentProfileDialog from "../Campus Admin/Students/StudentProfileDialog";
import StudentStatusBadge from "../Campus Admin/Students/StudentStatusBadge";
import "../Campus Admin/Students/StudentsDirectory.css";
import "./InstituteDashboard.css";

const PAGE_SIZE = 10;

export default function InstituteDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const campuses = useSelector(selectInstituteCampuses);

  const [institute, setInstitute] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchCampuses());
    let active = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const [profileRes, statsRes, studentsRes] = await Promise.allSettled([
          axiosInstance.get("/institute-admin/profile"),
          axiosInstance.get("/institute-admin/stats"),
          axiosInstance.get("/institute-admin/students"),
        ]);

        if (!active) return;

        if (profileRes.status === "fulfilled") {
          setInstitute(profileRes.value.data?.data || null);
        }
        if (statsRes.status === "fulfilled") {
          setStatsData(statsRes.value.data?.data || null);
        }
        if (studentsRes.status === "fulfilled") {
          const raw = studentsRes.value.data?.data || [];
          setStudentsList(
            raw.map((s) => ({
              ...s,
              id: s._id || s.id,
              campus: s.campusId?.name || s.campus || "Main Campus",
              status: s.status || "Active",
              program: s.program || "General",
              roll: s.roll || s.rollNo || "—",
              initials: s.name
                ? s.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()
                : "ST",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load institute dashboard data", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [dispatch]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  const visible = studentsList.filter((student) => {
    const matchesSearch =
      !search.trim() ||
      `${student.name} ${student.email} ${student.campus}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
    const matchesStatus = !status || student.status === status;
    return matchesSearch && matchesStatus;
  });

  const totalRecords = visible.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const activePage = Math.min(Math.max(1, page), pageCount);

  const startIndex = (activePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedStudents = visible.slice(startIndex, endIndex);

  const profile = studentsList.find((student) => student.id === profileId);

  const stats = [
    {
      icon: Users,
      label: "Total Students",
      value: statsData?.students?.total ?? studentsList.length,
    },
    {
      icon: GraduationCap,
      label: "Active Teachers",
      value: statsData?.staff?.teachers ?? 0,
    },
    {
      icon: Building2,
      label: "Campus Branches",
      value: campuses.length || statsData?.campuses?.total || 0,
    },
    {
      icon: Layers,
      label: "Institute Type",
      value: institute?.type || "Institute",
    },
  ];

  return (
    <section className="institute-dashboard" aria-labelledby="institute-title">
      <header className="institute-heading">
        <h1 id="institute-title">
          {institute?.name || "Institute Dashboard"}
        </h1>
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
          [Plus, "Add New Campus", "/institute-admin/campuses?add=1"],
          [Users, "View Staff Directory", "/institute-admin/staff"],
          [Megaphone, "Broadcast Message", "/institute-admin/alerts"],
        ].map(([Icon, label, destination]) => (
          <Button
            key={label}
            variant="outline"
            onClick={() => navigate(destination)}
          >
            <Icon size={18} />
            {label}
          </Button>
        ))}
      </div>

      <Card className="institute-students">
        <div className="institute-table-heading">
          <h2>
            <span>
              <Users size={20} />
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
            <SlidersHorizontal size={18} />
          </Button>
        </div>

        {filtersOpen && (
          <div id="institute-filters" className="institute-filters">
            <Input
              aria-label="Search registered students"
              placeholder="Search students by name, email, or campus..."
              value={search}
              onChange={handleSearchChange}
            />
            <select
              aria-label="Enrollment status"
              value={status}
              onChange={handleStatusChange}
            >
              <option value="">All statuses</option>
              {[...new Set(studentsList.map((student) => student.status))].map(
                (value) => (
                  <option key={value}>{value}</option>
                )
              )}
            </select>
            <Button variant="ghost" onClick={handleClearFilters}>
              Clear
            </Button>
          </div>
        )}

        <div className="institute-table-container">
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="institute-empty">
                    <PageLoader message="Loading registered students..." className="min-h-[140px] py-6" />
                  </TableCell>
                </TableRow>
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="institute-student-name">
                        <Avatar>
                          <AvatarFallback>{student.initials}</AvatarFallback>
                        </Avatar>
                        <span>{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="institute-student-email">
                      {student.email || "—"}
                    </TableCell>
                    <TableCell>
                      <StudentStatusBadge status={student.status} />
                    </TableCell>
                    <TableCell className="institute-student-campus">
                      {student.campus || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProfileId(student.id)}
                      >
                        View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="institute-empty">
                    No registered students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && totalRecords > 0 && (
          <DataPagination
            page={activePage}
            pageSize={PAGE_SIZE}
            total={totalRecords}
            onPageChange={setPage}
            showPageSize={false}
            itemLabel="students"
          />
        )}
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
