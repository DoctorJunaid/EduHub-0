import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MoreVertical, Plus, Search } from "lucide-react";
import { selectStudents } from "@/store/Slices/studentsSlice";
import { selectExams } from "@/store/Slices/examsSlice";
import { resultSaved, selectResults } from "@/store/Slices/resultsSlice";
import { selectAssignedTeacherClasses, selectTeacherIdentity, studentsForClass } from "./teacherScope";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import "./TeacherGradebook.css";
import TeacherPagination from "./TeacherPagination";

const get = (row, ...keys) => keys.map((key) => row?.[key]).find((item) => item !== undefined && item !== null && item !== "") || "";
const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "ST";
const isLocked = (row) => Boolean(row.published || row.finalized || row.isFinal || row.status === "Published" || row.status === "Finalized");

export default function TeacherGradebook() {
  const dispatch = useDispatch();
  const teacher = useSelector(selectTeacherIdentity);
  const classes = useSelector(selectAssignedTeacherClasses);
  const students = useSelector(selectStudents);
  const exams = useSelector(selectExams);
  const results = useSelector(selectResults);
  const [classId, setClassId] = useState("");
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const selectedClass = classes.find((row) => (row.id || row._id) === classId) || classes[0];
  const selectedClassId = selectedClass?.id || selectedClass?._id || "";
  useEffect(() => { if (!classId && selectedClassId) setClassId(selectedClassId); }, [classId, selectedClassId]);
  const classStudents = selectedClass ? studentsForClass(students, selectedClass) : [];
  const subjectName = selectedClass ? get(selectedClass, "subject", "title", "periodName") : "";
  const classExams = exams.filter((exam) => {
    const sectionMatch = String(exam.section || "").trim().toLowerCase() === String(get(selectedClass, "section", "className", "program")).trim().toLowerCase();
    const subjectMatch = String(exam.subject || "").trim().toLowerCase() === String(subjectName).trim().toLowerCase();
    const classMatch = exam.classId && String(exam.classId) === String(selectedClassId);
    return (classMatch || (sectionMatch && subjectMatch)) && Number.isFinite(Number(exam.totalMarks)) && Number(exam.totalMarks) > 0;
  });
  const classExamIds = new Set(classExams.map((exam) => String(exam.id || exam._id)));
  const classStudentIds = new Set(classStudents.map((student) => String(student.id || student._id)));
  const scoped = results.filter((row) => classExamIds.has(String(row.examId)) && classStudentIds.has(String(row.studentId)));
  const terms = [...new Set(scoped.map((row) => row.semester || row.term).filter(Boolean))];
  const visible = scoped.filter((row) => {
    const student = students.find((item) => String(item.id || item._id) === String(row.studentId));
    const text = `${student?.name || row.student?.name || "Student"} ${student?.roll || student?.rollNo || student?.rollNumber || ""}`.toLowerCase();
    return (!term || (row.semester || row.term) === term) && (!search || text.includes(search.toLowerCase()));
  });
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const pageRows = visible.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);
  const mayEdit = (row) => !isLocked(row) && (!row.teacherId || row.teacherId === teacher?.id || row.teacherId === teacher?.accountId);
  const save = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    // Disabled identity controls are intentionally immutable while editing and
    // therefore omitted by FormData. Resolve them from the selected result.
    const examId = data.examId || editing?.examId;
    const studentId = data.studentId || editing?.studentId;
    const exam = classExams.find((item) => String(item.id || item._id) === String(examId));
    const student = classStudents.find((item) => String(item.id || item._id) === String(studentId));
    const score = Number(data.score);
    if (!teacher) return toast.error("Teacher identity is unavailable.");
    if (!exam || !student) return toast.error("Select an authorized student and scheduled exam.");
    if (!data.academicYear?.trim() || !data.semester?.trim()) return toast.error("Enter the academic year and term.");
    if (!Number.isFinite(score) || score < 0 || score > Number(exam.totalMarks)) return toast.error("Marks must be between zero and the scheduled exam maximum.");
    const existing = editing?.id
      ? results.find((row) => row.id === editing.id)
      : results.find((row) => row.examId === String(exam.id || exam._id) && row.studentId === String(student.id || student._id) && row.academicYear === data.academicYear.trim() && row.semester === data.semester.trim());
    if (editing?.id && (!existing || !scoped.some((row) => row.id === editing.id))) return toast.error("This result is no longer available for editing.");
    const conflictingResult = results.find((row) => row.id !== existing?.id && row.examId === String(exam.id || exam._id) && row.studentId === String(student.id || student._id) && row.academicYear === data.academicYear.trim() && row.semester === data.semester.trim());
    if (conflictingResult) return toast.error("A result already exists for this student, exam, year, and term.");
    if (existing && !mayEdit(existing)) return toast.error("This result is finalized or outside your editing permission.");
    const subject = exam.subject || subjectName;
    dispatch(resultSaved({ ...(existing || {}), id: existing?.id || undefined, studentId: String(student.id || student._id), examId: String(exam.id || exam._id), academicYear: data.academicYear.trim(), semester: data.semester.trim(), subject, courseCode: subject, score, totalMarks: Number(exam.totalMarks), grade: existing?.grade || "", gpa: existing?.gpa ?? null, remarks: data.remarks || "", teacherId: teacher.id }));
    setEditing(null);
    toast.success('Marks saved.');
  };
  const openNew = () => {
    const exam = classExams[0];
    const student = classStudents[0];
    if (!exam || !student) return;
    setEditing({ studentId: String(student.id || student._id), examId: String(exam.id || exam._id), academicYear: "", semester: term || "", score: "", totalMarks: Number(exam.totalMarks), remarks: "" });
  };
  const studentFor = (row) => students.find((item) => String(item.id || item._id) === String(row.studentId)) || row.student || {};
  const examFor = (row) => exams.find((item) => String(item.id || item._id) === String(row.examId));
  const canAdd = Boolean(teacher && classExams.length && classStudents.length);

  return (
    <main className="teacher-gradebook" aria-labelledby="teacher-gradebook-title">
      <h1 id="teacher-gradebook-title" className="sr-only">Gradebook &amp; Marks</h1>
      <header className="teacher-gradebook-toolbar">
        <Button className="teacher-primary-action" onClick={openNew} disabled={!canAdd}><Plus size={17} /> Add Marks</Button>
      </header>
      <section className="teacher-gradebook-card">
        <div className="teacher-gradebook-filters">
          <label><Search size={16} /><span className="sr-only">Search students</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search students, roll number..." /></label>
          <select value={classId} onChange={(event) => { setClassId(event.target.value); setPage(1); }}><option value="">Select assigned class</option>{classes.map((row) => <option key={row.id || row._id} value={row.id || row._id}>{get(row, "subject", "title")} - {get(row, "section", "className")}</option>)}</select>
          <select value={term} onChange={(event) => { setTerm(event.target.value); setPage(1); }}><option value="">All Terms</option>{terms.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        </div>
        <div className="teacher-gradebook-table-wrap"><table><thead><tr><th>Student Name &amp; Roll No</th><th>Program &amp; Section</th><th>Assessment</th><th>Marks Obtained</th><th>Letter Grade</th><th>GPA Point</th><th>Teacher Remarks</th><th>Actions</th></tr></thead>
          <tbody>{pageRows.map((row) => { const student = studentFor(row); const exam = examFor(row); return <tr key={row.id}><td><span className="teacher-gradebook-student"><span className="teacher-avatar">{initials(student.name)}</span><strong>{student.name || "Student"}</strong></span><small>{student.roll || student.rollNo || student.rollNumber || "Roll number unavailable"}</small></td><td>{student.program || student.gradeOrClass || "-"}<small>Sec: {student.section || row.section || "-"}</small></td><td>{exam ? `${exam.subject} - ${exam.examType}` : "Scheduled exam"}<small>{row.semester}</small></td><td><strong>{row.score} / {row.totalMarks}</strong></td><td><span className="teacher-grade-badge">{row.grade || "-"}</span></td><td><strong>{row.gpa == null ? "-" : Number(row.gpa).toFixed(2)}</strong></td><td>{row.remarks || "-"}</td><td>{mayEdit(row) ? <div className="teacher-gradebook-actions"><Button size="sm" variant="outline" onClick={() => setEditing(row)}>Edit Marks</Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Result actions"><MoreVertical size={17} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setEditing(row)}>Edit Marks</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div> : <span>{isLocked(row) ? "Published" : "Read only"}</span>}</td></tr>; })}</tbody>
        </table>
        {!visible.length && <div className="teacher-gradebook-empty">{!selectedClass ? "Select an assigned class to view its results." : !classExams.length ? "No Admin-created exam is scheduled for this class yet." : scoped.length ? "No results match the selected filters." : "No marks are recorded for this class and its scheduled exams."}</div>}</div>
        <footer className="teacher-gradebook-footer"><span>Showing {pageRows.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, visible.length)} of {visible.length} matching records</span><TeacherPagination page={page} pageCount={pageCount} onPageChange={setPage} label="Gradebook pages" /></footer>
      </section>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="teacher-dialog">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Marks" : "Add Marks"}</DialogTitle>
            <DialogDescription>Only scheduled Admin-created exams are available. Letter grades and GPA remain the values already recorded in the result data.</DialogDescription>
          </DialogHeader>
          {editing && <form className="teacher-grade-form" onSubmit={save}>
            <div className="teacher-dialog-body">
              <label>Student<select name="studentId" defaultValue={editing.studentId} required disabled={Boolean(editing.id)}>{classStudents.map((student) => <option key={student.id || student._id} value={student.id || student._id}>{student.name} - {student.roll || student.rollNo || ""}</option>)}</select></label>
              <label>Scheduled exam<select name="examId" defaultValue={editing.examId} required disabled={Boolean(editing.id)}>{classExams.map((exam) => <option key={exam.id || exam._id} value={exam.id || exam._id}>{exam.subject} - {exam.examType} - {exam.date} - {exam.totalMarks} marks</option>)}</select></label>
              <label>Academic Year<input name="academicYear" defaultValue={editing.academicYear} required /></label>
              <label>Term / Semester<input name="semester" defaultValue={editing.semester} required /></label>
              <label>Marks Obtained<input name="score" type="number" min="0" max={editing.totalMarks} defaultValue={editing.score} required /></label>
              <label>Teacher Remarks<textarea name="remarks" rows="3" defaultValue={editing.remarks || ""} /></label>
            </div>
            <DialogFooter className="teacher-dialog-footer">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className="teacher-primary-action" type="submit">Save Marks</Button>
            </DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>
    </main>
  );
}
