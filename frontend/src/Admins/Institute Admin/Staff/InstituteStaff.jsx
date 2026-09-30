import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
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
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataPagination from "@/components/shared/DataPagination";
import PageLoader from "@/components/shared/PageLoader";
import FacultyForm from "../../Campus Admin/Faculty/FacultyForm";
import {
  fetchCampuses,
  selectInstituteCampuses,
} from "@/store/Slices/campusesSlice";
import axiosInstance from "@/api/axiosInstance";
import "./InstituteStaff.css";

const PAGE_SIZE = 10;

export default function InstituteStaff() {
  const dispatch = useDispatch();
  const campuses = useSelector(selectInstituteCampuses);
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const mapStaffData = (data = []) =>
    data.map((member) => ({
      ...member,
      id: member._id || member.id,
      initials: member.name
        ? member.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0])
            .join("")
            .toUpperCase()
        : "FC",
      campus: member.campusId?.name || member.campus || "Main Campus",
      campusId:
        member.campusId?._id || member.campusId?.id || member.campusId,
      designation:
        member.role === "campus_manager"
          ? "Campus Manager"
          : member.designation || "Teacher",
      qualification: member.qualification || "Faculty Member",
      department: member.department || "Academic Department",
      subjects: member.subjects || "Assigned Courses",
      status: member.isActive !== false ? "Active" : "Inactive",
    }));

  const loadStaff = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/institute-admin/staff");
      const data = res.data?.data || [];
      setStaffList(mapStaffData(data));
    } catch (err) {
      console.error("Failed to load staff directory:", err);
      toast.error("Failed to load faculty & staff directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    dispatch(fetchCampuses());
    axiosInstance
      .get("/institute-admin/staff")
      .then((res) => {
        if (!active) return;
        const data = res.data?.data || [];
        setStaffList(mapStaffData(data));
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load staff directory:", err);
        toast.error("Failed to load faculty & staff directory.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dispatch]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const selected = staffList.find((teacher) => teacher.id === modal?.id);
  const query = search.trim().toLowerCase();
  const visible = staffList.filter(
    (teacher) =>
      !query ||
      `${teacher.name} ${teacher.email} ${teacher.department} ${teacher.designation} ${teacher.campus}`
        .toLowerCase()
        .includes(query)
  );

  const totalRecords = visible.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const activePage = Math.min(Math.max(1, page), pageCount);

  const startIndex = (activePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedStaff = visible.slice(startIndex, endIndex);

  const options = {
    designation: [
      "Professor",
      "Assistant Professor",
      "Lecturer",
      "Campus Manager",
    ],
    department: [
      "Computer Science",
      "Electrical Engineering",
      "Business Administration",
      "Mathematics",
    ],
    campus: campuses.map((c) => c.name),
  };

  const save = async (values) => {
    const campus = campuses.find((record) => record.name === values.campus);
    if (!campus) {
      toast.error("Select an available campus before saving.");
      return;
    }
    try {
      await axiosInstance.post("/institute-admin/staff", {
        name: values.name,
        email: values.email,
        password: values.password || "Staff@123",
        role:
          values.designation === "Campus Manager"
            ? "campus_manager"
            : "teacher",
        campusId: campus._id || campus.id,
        phone: values.phone || "",
      });
      setLoading(true);
      await loadStaff();
      setSearch("");
      setModal(null);
      toast.success("Staff member saved successfully.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to save staff member."
      );
    }
  };

  return (
    <section
      className="institute-staff-directory"
      aria-labelledby="institute-staff-title"
    >
      <header className="ist-heading">
        <div>
          <h1 id="institute-staff-title">Faculty &amp; Staff Directory</h1>
          <p>
            Manage professors, lecturers, departments, and course assignments.
          </p>
        </div>
        <Button
          disabled={!campuses.length}
          title={
            !campuses.length
              ? "Add a campus before adding a teacher"
              : undefined
          }
          onClick={() => setModal({ type: "add" })}
        >
          <Plus size={18} aria-hidden="true" />
          Add New Teacher
        </Button>
      </header>

      <Card className="ist-card">
        <div className="ist-toolbar">
          <div className="ist-search-input-wrapper">
            <Search size={16} className="ist-search-icon" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search faculty by name, email, department, or designation"
              placeholder="Search by name, department, designation..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <span className="ist-count">
            {staffList.length} faculty{" "}
            {staffList.length === 1 ? "member" : "members"} registered
          </span>
        </div>

        <div className="ist-table-container">
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="ist-empty">
                    <PageLoader
                      message="Loading faculty & staff records..."
                      className="min-h-[140px] py-6"
                    />
                  </TableCell>
                </TableRow>
              ) : paginatedStaff.length > 0 ? (
                paginatedStaff.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="ist-person">
                        <Avatar>
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
                      <small className="ist-qualification">
                        {teacher.qualification}
                      </small>
                    </TableCell>
                    <TableCell className="ist-subjects">
                      <strong>{teacher.department}</strong>
                      <small>{teacher.subjects}</small>
                    </TableCell>
                    <TableCell className="ist-campus-cell">
                      {teacher.campus}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`ist-status ist-status-${teacher.status?.toLowerCase()}`}
                      >
                        <span aria-hidden="true" />
                        {teacher.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="ist-actions">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Edit ${teacher.name}`}
                          onClick={() =>
                            setModal({ type: "edit", id: teacher.id })
                          }
                          title="Edit faculty record"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 ist-delete"
                          aria-label={`Delete ${teacher.name}`}
                          onClick={() =>
                            setModal({ type: "delete", id: teacher.id })
                          }
                          title="Delete faculty record"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="ist-empty">
                    {staffList.length ? (
                      <div className="ist-empty-state">
                        <div className="ist-empty-icon">
                          <Search size={24} />
                        </div>
                        <h3>No faculty members match your search</h3>
                        <p>
                          Try searching for another name, department, or
                          designation.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearch("")}
                        >
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      <div className="ist-empty-state">
                        <div className="ist-empty-icon">
                          <Users size={24} />
                        </div>
                        <h3>No faculty members yet</h3>
                        <p>
                          Faculty members added to this institute will appear
                          here.
                        </p>
                        <Button
                          disabled={!campuses.length}
                          onClick={() => setModal({ type: "add" })}
                          size="sm"
                        >
                          <Plus size={14} className="mr-1.5" />
                          Add New Teacher
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && totalRecords > PAGE_SIZE && (
          <DataPagination
            page={activePage}
            pageSize={PAGE_SIZE}
            total={totalRecords}
            onPageChange={setPage}
            showPageSize={false}
            itemLabel="faculty members"
          />
        )}
      </Card>

      {(modal?.type === "add" || (modal?.type === "edit" && selected)) && (
        <FacultyForm
          teacher={
            selected
              ? {
                  ...selected,
                  campus: campuses.some((c) => c.id === selected.campusId)
                    ? selected.campus
                    : "",
                }
              : undefined
          }
          options={options}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}

      <ConfirmDialog
        open={modal?.type === "delete" && !!selected}
        title="Delete Faculty Member?"
        description={`Delete ${
          selected?.name || "this faculty member"
        }? This action cannot be undone.`}
        confirmText="Delete"
        onCancel={() => setModal(null)}
        onConfirm={async () => {
          if (selected) {
            try {
              await axiosInstance.delete(
                `/institute-admin/staff/${selected.id}`
              );
              setLoading(true);
              await loadStaff();
              toast.success("Staff member deleted successfully.");
            } catch (err) {
              toast.error(
                err.response?.data?.message || "Failed to delete staff member."
              );
            }
          }
          setModal(null);
        }}
      />
    </section>
  );
}
