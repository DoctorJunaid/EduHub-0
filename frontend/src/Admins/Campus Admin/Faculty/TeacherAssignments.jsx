import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";

export default function TeacherAssignments() {
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [gradeSubjects, setGradeSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newAssignment, setNewAssignment] = useState({
    teacherId: "",
    gradeId: "",
    sectionId: "",
    subjectId: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, gRes, gsRes, aRes] = await Promise.all([
        axiosInstance.get("/campus-admin/faculty"),
        axiosInstance.get("/academic/grades"),
        axiosInstance.get("/academic/grade-subjects"),
        axiosInstance.get("/academic/teacher-assignments"),
      ]);
      setTeachers(tRes.data.data || tRes.data || []);
      setGrades(gRes.data || []);
      setGradeSubjects(gsRes.data || []);
      setAssignments(aRes.data || []);
    } catch (err) {
      console.error("Failed to fetch assignments data:", err);
      toast.error(err.response?.data?.message || "Failed to fetch assignments data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGradeChange = async (e) => {
    const gradeId = e.target.value;
    setNewAssignment({ ...newAssignment, gradeId, sectionId: "", subjectId: "" });
    try {
      const secRes = await axiosInstance.get(`/academic/sections?gradeId=${gradeId}`);
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

  if (loading) return <div className="p-8">Loading teacher assignments...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teacher Academic Assignments</h1>
        <p className="text-muted-foreground mt-2">
          Assign teachers to specific classes, sections, and subjects. The Timetable uses these assignments to dynamically populate available teachers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Assignment</CardTitle>
          <CardDescription>Select a teacher and link them to a subject in a specific class section.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-6">
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

          <div className="rounded-md border mt-8">
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
                {assignments.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No assignments defined yet.</td></tr>
                ) : assignments.map((a) => (
                  <tr key={a._id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{a.teacherId?.name || "Unknown"}</td>
                    <td className="px-4 py-3">{a.gradeId?.name || "Unknown"}</td>
                    <td className="px-4 py-3">{a.sectionId?.name || "Unknown"}</td>
                    <td className="px-4 py-3">{a.subjectId?.name || "Unknown"}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAssignment(a._id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
