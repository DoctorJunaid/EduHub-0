import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Search, Eye, Pencil, Trash2, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
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
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataPagination from "@/components/shared/DataPagination";
import PageLoader from "@/components/shared/PageLoader";
import StudentForm from "../../Campus Admin/Students/StudentForm";
import StudentProfileDialog from "../../Campus Admin/Students/StudentProfileDialog";
import StudentStatusBadge from "../../Campus Admin/Students/StudentStatusBadge";
import { studentPrograms } from "../../Campus Admin/Students/studentData";
import {
  fetchCampuses,
  selectInstituteCampuses,
} from "@/store/Slices/campusesSlice";
import axiosInstance from "@/api/axiosInstance";
import { searchInstituteStudents } from "./studentDirectoryData";
import "../../Campus Admin/Students/StudentsDirectory.css";
import "./InstituteStudents.css";

const PAGE_SIZE = 10;

export default function InstituteStudents() {
  const dispatch = useDispatch();
  const campuses = useSelector(selectInstituteCampuses);
  const [studentsList, setStudentsList] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const mapStudentData = (raw = []) =>
    raw.map((s) => ({
      ...s,
      id: s._id || s.id,
      campus: s.campusId?.name || s.campus || "Main Campus",
      campusId: s.campusId?._id || s.campusId?.id || s.campusId,
      status: s.status || "Active",
      program: s.program || "General",
      roll: s.roll || s.rollNo || "—",
      section: s.section || "A",
      subjects: s.subjects || "Core Curriculum",
      initials: s.name
        ? s.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0])
            .join("")
            .toUpperCase()
        : "ST",
    }));

  const loadStudents = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/institute-admin/students");
      const raw = res.data?.data || [];
      setStudentsList(mapStudentData(raw));
    } catch (err) {
      console.error("Failed to load students directory:", err);
      toast.error("Failed to load student directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    dispatch(fetchCampuses());
    axiosInstance
      .get("/institute-admin/students")
      .then((res) => {
        if (!active) return;
        const raw = res.data?.data || [];
        setStudentsList(mapStudentData(raw));
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load students directory:", err);
        toast.error("Failed to load student directory.");
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

  const selected = studentsList.find((student) => student.id === modal?.id);
  const visible = searchInstituteStudents(studentsList, search);

  const totalRecords = visible.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const activePage = Math.min(Math.max(1, page), pageCount);

  const startIndex = (activePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedStudents = visible.slice(startIndex, endIndex);

  const campusOptions = [
    { value: "", label: "Select a campus" },
    ...campuses.map((campus) => ({ value: campus.id, label: campus.name })),
  ];

  const programs = [
    ...new Set(
      [
        ...studentPrograms,
        ...studentsList.map((student) => student.program),
      ].filter(Boolean),
    ),
  ];

  const save = async (values) => {
    const campus = campuses.find(
      (record) => record.id === values.campus || record.name === values.campus,
    );
    if (!campus) {
      toast.error("Select an available campus before saving.");
      return;
    }
    try {
      if (modal.type === "edit") {
        if (!selected) return;
        await axiosInstance.put(`/institute-admin/students/${selected.id}`, {
          ...values,
          campusId: campus.id,
        });
        toast.success("Student updated successfully.");
      } else {
        await axiosInstance.post("/institute-admin/students", {
          ...values,
          name: values.name,
          email: values.email,
          password: values.password || "Student@123",
          campus: undefined,
          campusId: campus.id,
          phone: values.studentPhone || values.phone || "",
        });
        toast.success("Student enrolled successfully.");
      }
      setLoading(true);
      await loadStudents();
      setSearch("");
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save student.");
    }
  };

  return (
    <section
      className="institute-student-directory"
      aria-label="Students Directory & Records"
    >
      <Card className="isd-card">
        <div className="isd-toolbar">
          <div className="isd-toolbar-left">
            <div className="isd-search-input-wrapper">
              <Search
                size={16}
                className="isd-search-icon"
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label="Search students"
                placeholder="Search by name, roll no, program..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <span className="isd-count">
              {studentsList.length}{" "}
              {studentsList.length === 1 ? "student" : "students"} enrolled
            </span>
          </div>
          <Button
            disabled={!campuses.length}
            title={
              !campuses.length
                ? "Add a campus before enrolling a student"
                : undefined
            }
            onClick={() => {
              setModal({ type: "add" });
            }}
            className="isd-add-btn"
          >
            <Plus size={18} />
            Add New Student
          </Button>
        </div>

        <div className="isd-table-container">
          <Table aria-label="Institute students directory">
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
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="isd-empty">
                    <PageLoader
                      message="Loading student records..."
                      className="min-h-[140px] py-6"
                    />
                  </TableCell>
                </TableRow>
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="isd-person">
                        <Avatar>
                          <AvatarFallback>{student.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <strong>{student.name}</strong>
                          <small className="isd-roll">
                            Roll: {student.roll}
                          </small>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <strong>{student.program}</strong>
                      <small className="isd-subtext">
                        {[
                          student.section && `Sec: ${student.section}`,
                          student.semester,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </small>
                    </TableCell>
                    <TableCell className="isd-subjects">
                      {student.subjects || "—"}
                    </TableCell>
                    <TableCell className="isd-campus-cell">
                      {student.campus}
                    </TableCell>
                    <TableCell>
                      <StudentStatusBadge status={student.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="isd-actions">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`View ${student.name}`}
                          onClick={() =>
                            setModal({ type: "view", id: student.id })
                          }
                          title="View student profile"
                        >
                          <Eye size={15} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 isd-edit"
                          aria-label={`Edit ${student.name}`}
                          onClick={() => {
                            setModal({ type: "edit", id: student.id });
                          }}
                          title="Edit student record"
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 isd-delete"
                          aria-label={`Delete ${student.name}`}
                          onClick={() =>
                            setModal({ type: "delete", id: student.id })
                          }
                          title="Delete student record"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="isd-empty">
                    {studentsList.length ? (
                      <div className="isd-empty-state">
                        <div className="isd-empty-icon">
                          <Search size={24} />
                        </div>
                        <h3>No students match your search</h3>
                        <p>
                          Try searching for another name, roll number, program,
                          or section.
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
                      <div className="isd-empty-state">
                        <div className="isd-empty-icon">
                          <GraduationCap size={24} />
                        </div>
                        <h3>No students enrolled yet</h3>
                        <p>
                          Students added to this institute will appear here.
                        </p>
                        <Button
                          disabled={!campuses.length}
                          onClick={() => setModal({ type: "add" })}
                          size="sm"
                        >
                          <Plus size={14} className="mr-1.5" />
                          Add New Student
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
            itemLabel="students"
          />
        )}
      </Card>

      {(modal?.type === "add" || (modal?.type === "edit" && selected)) && (
        <StudentForm
          editAllFields
          student={
            selected
              ? {
                  ...selected,
                  campus: campuses.some((c) => c.id === selected.campusId)
                    ? selected.campusId
                    : "",
                }
              : undefined
          }
          programs={programs}
          campuses={campusOptions}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "view" && selected && (
        <StudentProfileDialog
          student={selected}
          onClose={() => setModal(null)}
        />
      )}

      <ConfirmDialog
        open={modal?.type === "delete" && !!selected}
        title="Delete Student?"
        description={`Delete ${
          selected?.name || "this student"
        }? This action cannot be undone.`}
        confirmText="Delete Student"
        onCancel={() => setModal(null)}
        onConfirm={async () => {
          if (selected) {
            try {
              await axiosInstance.delete(
                `/institute-admin/students/${selected.id}`,
              );
              setLoading(true);
              await loadStudents();
              toast.success("Student deleted successfully.");
            } catch (err) {
              toast.error(
                err.response?.data?.message || "Failed to delete student.",
              );
            }
          }
          setModal(null);
        }}
      />
    </section>
  );
}
