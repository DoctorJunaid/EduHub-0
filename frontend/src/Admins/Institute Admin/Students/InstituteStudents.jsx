import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
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
import StudentForm from "../../Campus Admin/Students/StudentForm";
import StudentProfileDialog from "../../Campus Admin/Students/StudentProfileDialog";
import StudentStatusBadge from "../../Campus Admin/Students/StudentStatusBadge";
import { studentPrograms } from "../../Campus Admin/Students/studentData";
import {
  studentAdded,
  studentUpdated,
  studentDeleted,
} from "@/store/Slices/studentsSlice";
import { selectInstituteCampuses } from "@/store/Slices/campusesSlice";
import { selectInstituteStudents } from "@/store/selectors/instituteStudents";
import { demoInstitute } from "../instituteData";
import { searchInstituteStudents } from "./studentDirectoryData";
import "../../Campus Admin/Students/StudentsDirectory.css";
import "./InstituteStudents.css";

export default function InstituteStudents() {
  const dispatch = useDispatch();
  const students = useSelector(selectInstituteStudents),
    campuses = useSelector(selectInstituteCampuses);
  const [search, setSearch] = useState(""),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState("");
  const selected = students.find((student) => student.id === modal?.id);
  const visible = searchInstituteStudents(students, search);
  const campusOptions = [
    { value: "", label: "Select a campus" },
    ...campuses.map((campus) => ({ value: campus.id, label: campus.name })),
  ];
  const programs = [
    ...new Set(
      [
        ...studentPrograms,
        ...students.map((student) => student.program),
      ].filter(Boolean),
    ),
  ];
  const save = (values) => {
    const campus = campuses.find((record) => record.id === values.campus);
    if (!campus) {
      setNotice("Select an available campus before saving.");
      return;
    }
    const record = {
      ...values,
      instituteId: demoInstitute.id,
      campusId: campus.id,
      campus: campus.name,
    };
    if (modal.type === "edit") {
      if (!selected) return;
      dispatch(studentUpdated({ ...record, id: selected.id }));
    } else dispatch(studentAdded(record));
    setSearch("");
    setModal(null);
    setNotice("Student saved.");
  };
  return (
    <section
      className="institute-student-directory"
      aria-labelledby="institute-students-title"
    >
      <header className="isd-heading">
        <div>
          <h1 id="institute-students-title">
            Students Directory &amp; Records
          </h1>
          <p>
            Complete management of enrolled students, sections, subjects, and
            guardians.
          </p>
        </div>
        <Button
          disabled={!campuses.length}
          title={
            !campuses.length
              ? "Add a campus before enrolling a student"
              : undefined
          }
          onClick={() => {
            setNotice("");
            setModal({ type: "add" });
          }}
        >
          <Plus size={20} />
          Add New Student
        </Button>
      </header>
      <Card className="isd-card">
        <div className="isd-toolbar">
          <label className="isd-search">
            <Search size={20} aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search students"
              placeholder="Search by name, roll no, program..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <span>
            {students.length} {students.length === 1 ? "student" : "students"}{" "}
            enrolled
          </span>
        </div>
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
            {visible.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="isd-person">
                    <Avatar>
                      <AvatarFallback>
                        {student.initials ||
                          student.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <strong>{student.name}</strong>
                      <small className="isd-roll">{student.roll}</small>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <strong>{student.program}</strong>
                  <small>
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
                <TableCell>{student.campus}</TableCell>
                <TableCell>
                  <StudentStatusBadge status={student.status} />
                </TableCell>
                <TableCell>
                  <div className="isd-actions">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`View ${student.name}`}
                      onClick={() => setModal({ type: "view", id: student.id })}
                    >
                      <Eye size={19} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="isd-edit"
                      aria-label={`Edit ${student.name}`}
                      onClick={() => {
                        setNotice("");
                        setModal({ type: "edit", id: student.id });
                      }}
                    >
                      <Pencil size={19} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="isd-delete"
                      aria-label={`Delete ${student.name}`}
                      onClick={() =>
                        setModal({ type: "delete", id: student.id })
                      }
                    >
                      <Trash2 size={19} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!visible.length && (
              <TableRow>
                <TableCell colSpan={6} className="isd-empty">
                  {students.length
                    ? "No students match your search."
                    : "No students enrolled."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <span role="status" className="sr-only">
          {notice}
        </span>
      </Card>
      {(modal?.type === "add" || (modal?.type === "edit" && selected)) && (
        <StudentForm
          editAllFields
          student={
            selected
              ? {
                  ...selected,
                  campus: campuses.some(
                    (campus) => campus.id === selected.campusId,
                  )
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
        description={`Delete ${selected?.name || "this student"}? This action cannot be undone.`}
        confirmText="Delete Student"
        onCancel={() => setModal(null)}
        onConfirm={() => {
          if (selected) dispatch(studentDeleted(selected.id));
          setModal(null);
          setNotice("Student deleted.");
        }}
      />
    </section>
  );
}
