import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";
import DataPagination from "@/components/shared/DataPagination";
import usePaginationParams from "@/hooks/usePaginationParams";

export default function TeacherAssignments() {
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [gradeSubjects, setGradeSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const { page, pageSize, setPage, setPageSize } = usePaginationParams({
    defaultPage: 1,
    defaultPageSize: 20,
  });
  const [loadError, setLoadError] = useState("");

  const [newAssignment, setNewAssignment] = useState({
    teacherId: "",
    gradeId: "",
    sectionId: "",
    subjectId: "",
  });

  const fetchData = async () => {
    setLoadError("");
    const [tRes, gRes, gsRes, aRes] = await Promise.allSettled([
      axiosInstance.get("/campus-admin/faculty", { timeout: 12000 }),
      axiosInstance.get("/academic/grades", { timeout: 12000 }),
      axiosInstance.get("/academic/grade-subjects", { timeout: 12000 }),
      axiosInstance.get("/academic/teacher-assignments", { timeout: 12000 }),
    ]);
    const failures = [];
    const applyResult = (result, label, setter, normalize = (data) => data) => {
      if (result.status === "fulfilled") {
        setter(normalize(result.value.data));
        return;
      }
      const reason = result.reason;
      const detail = reason.code === "ECONNABORTED"
        ? "request timed out"
        : (reason.response?.data?.message || reason.message || "request failed");
      failures.push(`${label}: ${detail}`);
    };
    applyResult(tRes, "Teachers", setTeachers, (data) => Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    applyResult(gRes, "Grades", setGrades);
    applyResult(gsRes, "Class subjects", setGradeSubjects);
    applyResult(aRes, "Assignments", setAssignments);
    if (failures.length) {
      const message = `Some assignment data could not be loaded. ${failures.join("; ")}`;
      setLoadError(message);
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGradeChange = async (e) => {
    const gradeId = e.target.value;
    setNewAssignment({ ...newAssignment, gradeId, sectionId: "", subjectId: "" });
    try {
      const secRes = await axiosInstance.get(`/academic/sections?gradeId=${gradeId}`, { timeout: 12000 });
      setSections(secRes.data);
    } catch (error) {
      toast.error("Failed to load sections");
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/academic/teacher-assignments", newAssignment);
      setAssignments([...assignments, res.data]);
      setNewAssignment({ teacherId: "", gradeId: "", sectionId: "", subjectId: "" });
      toast.success("Teacher assigned successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create assignment");
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await axiosInstance.delete(`/academic/teacher-assignments/${id}`);
      setAssignments(assignments.filter((a) => a._id !== id));
      toast.success("Assignment removed");
    } catch (err) {
      toast.error("Failed to remove assignment");
    }
  };

  // Filter subjects based on selected grade
  const availableSubjects = (gradeSubjects || [])
    .filter(gs => (gs.gradeId?._id || gs.gradeId) === newAssignment.gradeId)
    .map(gs => gs.subjectId)
    .filter(Boolean);

  const pageCount = Math.max(1, Math.ceil(assignments.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return assignments.slice(start, start + pageSize);
  }, [assignments, currentPage, pageSize]);

  return (
    <div className="teacher-academic-assignments-page mx-auto w-full space-y-4 p-2 sm:p-3">
      {loadError && (
        <div className="teacher-academic-assignments-error" role="alert">
          <span>Assignment data could not be loaded: {loadError}</span>
          <Button type="button" variant="outline" onClick={fetchData}>Try again</Button>
        </div>
      )}

      <Card className="teacher-academic-assignments-card">
        <CardHeader className="teacher-academic-assignments-card-header">
          <CardTitle>Create New Assignment</CardTitle>
          <CardDescription>Select a teacher and link them to a subject in a specific class section.</CardDescription>
        </CardHeader>
        <CardContent className="teacher-academic-assignments-card-content">
          <form onSubmit={handleCreateAssignment} className="teacher-academic-assignments-form">
            <div className="grid items-center gap-1.5">
              <Label>Teacher</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={newAssignment.teacherId} 
                onChange={(e) => setNewAssignment({ ...newAssignment, teacherId: e.target.value })}
                required
              >
                <option value="" disabled>Select Teacher</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
              </select>
            </div>
            
            <div className="grid items-center gap-1.5">
              <Label>Grade/Class</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={newAssignment.gradeId} 
                onChange={handleGradeChange}
                required
              >
                <option value="" disabled>Select Grade</option>
                {grades.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
              </select>
            </div>

            <div className="grid items-center gap-1.5">
              <Label>Section</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                value={newAssignment.sectionId} 
                onChange={(e) => setNewAssignment({ ...newAssignment, sectionId: e.target.value })}
                required
                disabled={!newAssignment.gradeId}
              >
                <option value="" disabled>Select Section</option>
                {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid items-center gap-1.5">
              <Label>Subject</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                value={newAssignment.subjectId} 
                onChange={(e) => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                required
                disabled={!newAssignment.gradeId}
              >
                <option value="" disabled>Select Subject</option>
                {availableSubjects.map(s => s ? <option key={s._id} value={s._id}>{s.name}</option> : null)}
              </select>
            </div>

            <Button type="submit" disabled={!newAssignment.gradeId || !newAssignment.sectionId || !newAssignment.subjectId || !newAssignment.teacherId}>
              <Plus className="w-4 h-4 mr-2" /> Assign
            </Button>
          </form>

          <div className="teacher-academic-assignments-table-wrap">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Teacher</th>
                  <th className="px-4 py-3 font-medium">Grade/Class</th>
                  <th className="px-4 py-3 font-medium">Section</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAssignments.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No assignments defined yet.</td></tr>
                ) : paginatedAssignments.map((a) => (
                  <tr key={a._id} className="border-b last:border-0 teacher-assignment-data-row">
                    <td className="font-medium">{a.teacherId?.name || "Unknown"}</td>
                    <td>{a.gradeId?.name || "Unknown"}</td>
                    <td>{a.sectionId?.name || "Unknown"}</td>
                    <td>{a.subjectId?.name || "Unknown"}</td>
                    <td>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAssignment(a._id)} className="text-destructive teacher-assignment-delete-button">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <DataPagination
              page={currentPage}
              pageSize={pageSize}
              total={assignments.length}
              pageCount={pageCount}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="assignments"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
