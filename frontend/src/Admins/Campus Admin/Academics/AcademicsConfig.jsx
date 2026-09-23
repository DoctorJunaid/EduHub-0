import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";

export default function AcademicsConfig() {
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradeSubjects, setGradeSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newGrade, setNewGrade] = useState({ name: "", description: "" });
  const [newSection, setNewSection] = useState({ name: "", gradeId: "" });
  const [newSubject, setNewSubject] = useState({ name: "", code: "", description: "" });
  const [newGradeSubject, setNewGradeSubject] = useState({ gradeId: "", subjectId: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gRes, secRes, subRes, gsRes] = await Promise.all([
        axiosInstance.get("/academic/grades"),
        axiosInstance.get("/academic/sections"),
        axiosInstance.get("/academic/subjects"),
        axiosInstance.get("/academic/grade-subjects"),
      ]);
      setGrades(gRes.data);
      setSections(secRes.data);
      setSubjects(subRes.data);
      setGradeSubjects(gsRes.data);
    } catch (err) {
      toast.error("Failed to fetch academic data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGrade = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/academic/grades", newGrade);
      setGrades([...grades, res.data]);
      setNewGrade({ name: "", description: "" });
      toast.success("Grade created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create grade");
    }
  };

  const handleDeleteGrade = async (id) => {
    if (!window.confirm("Delete this grade? This will also delete related sections and assignments.")) return;
    try {
      await axiosInstance.delete(`/academic/grades/${id}`);
      setGrades(grades.filter((g) => g._id !== id));
      setSections(sections.filter((s) => s.gradeId?._id !== id));
      toast.success("Grade deleted");
    } catch (err) {
      toast.error("Failed to delete grade");
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/academic/sections", newSection);
      setSections([...sections, res.data]);
      setNewSection({ name: "", gradeId: "" });
      toast.success("Section created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create section");
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm("Delete this section?")) return;
    try {
      await axiosInstance.delete(`/academic/sections/${id}`);
      setSections(sections.filter((s) => s._id !== id));
      toast.success("Section deleted");
    } catch (err) {
      toast.error("Failed to delete section");
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/academic/subjects", newSubject);
      setSubjects([...subjects, res.data]);
      setNewSubject({ name: "", code: "", description: "" });
      toast.success("Subject created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create subject");
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      await axiosInstance.delete(`/academic/subjects/${id}`);
      setSubjects(subjects.filter((s) => s._id !== id));
      setGradeSubjects(gradeSubjects.filter(gs => gs.subjectId?._id !== id));
      toast.success("Subject deleted");
    } catch (err) {
      toast.error("Failed to delete subject");
    }
  };

  const handleAssignSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/academic/grade-subjects", newGradeSubject);
      setGradeSubjects([...gradeSubjects, res.data]);
      setNewGradeSubject({ ...newGradeSubject, subjectId: "" });
      toast.success("Subject assigned to grade");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign subject");
    }
  };

  const handleRemoveSubjectFromGrade = async (id) => {
    if (!window.confirm("Remove this subject from the grade?")) return;
    try {
      await axiosInstance.delete(`/academic/grade-subjects/${id}`);
      setGradeSubjects(gradeSubjects.filter((gs) => gs._id !== id));
      toast.success("Subject removed");
    } catch (err) {
      toast.error("Failed to remove subject");
    }
  };

  if (loading) return <div className="p-8">Loading academic configuration...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academics Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Pre-define the academic structure (Grades, Sections, Subjects) to be used across the application.
        </p>
      </div>

      <Tabs defaultValue="grades" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="grades">Grades/Classes</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="subjects">Subjects Master</TabsTrigger>
          <TabsTrigger value="class_subjects">Class Subjects</TabsTrigger>
        </TabsList>

        {/* GRADES TAB */}
        <TabsContent value="grades" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Grades / Classes</CardTitle>
              <CardDescription>Define the core programs or grades offered in this campus.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGrade} className="flex gap-4 items-end mb-6">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="gradeName">Grade Name</Label>
                  <Input 
                    id="gradeName" 
                    placeholder="e.g. Grade 1, BSCS" 
                    value={newGrade.name} 
                    onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="gradeDesc">Description (Optional)</Label>
                  <Input 
                    id="gradeDesc" 
                    placeholder="e.g. Primary School" 
                    value={newGrade.description} 
                    onChange={(e) => setNewGrade({ ...newGrade, description: e.target.value })}
                  />
                </div>
                <Button type="submit"><Plus className="w-4 h-4 mr-2" /> Add Grade</Button>
              </form>

              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Grade Name</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.length === 0 ? (
                      <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No grades defined yet.</td></tr>
                    ) : grades.map((g) => (
                      <tr key={g._id} className="border-b last:border-0">
                        <td className="px-4 py-3">{g.name}</td>
                        <td className="px-4 py-3">{g.description || "-"}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteGrade(g._id)} className="text-destructive">
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
        </TabsContent>

        {/* SECTIONS TAB */}
        <TabsContent value="sections" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Sections</CardTitle>
              <CardDescription>Assign sections to specific grades.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSection} className="flex gap-4 items-end mb-6">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="secGrade">Grade</Label>
                  <select 
                    id="secGrade" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newSection.gradeId} 
                    onChange={(e) => setNewSection({ ...newSection, gradeId: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select Grade</option>
                    {grades.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="secName">Section Name</Label>
                  <Input 
                    id="secName" 
                    placeholder="e.g. A, B, Blue" 
                    value={newSection.name} 
                    onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" disabled={!grades.length}><Plus className="w-4 h-4 mr-2" /> Add Section</Button>
              </form>

              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Grade</th>
                      <th className="px-4 py-3 font-medium">Section</th>
                      <th className="px-4 py-3 font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.length === 0 ? (
                      <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No sections defined yet.</td></tr>
                    ) : sections.map((s) => (
                      <tr key={s._id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{s.gradeId?.name || "Unknown Grade"}</td>
                        <td className="px-4 py-3">{s.name}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSection(s._id)} className="text-destructive">
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
        </TabsContent>

        {/* SUBJECTS MASTER TAB */}
        <TabsContent value="subjects" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Master List</CardTitle>
              <CardDescription>Define all unique subjects taught in the campus.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSubject} className="flex gap-4 items-end mb-6">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="subName">Subject Name</Label>
                  <Input 
                    id="subName" 
                    placeholder="e.g. Mathematics" 
                    value={newSubject.name} 
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid w-full max-w-xs items-center gap-1.5">
                  <Label htmlFor="subCode">Code (Optional)</Label>
                  <Input 
                    id="subCode" 
                    placeholder="e.g. MATH101" 
                    value={newSubject.code} 
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  />
                </div>
                <Button type="submit"><Plus className="w-4 h-4 mr-2" /> Add Subject</Button>
              </form>

              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Subject Name</th>
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.length === 0 ? (
                      <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No subjects defined yet.</td></tr>
                    ) : subjects.map((s) => (
                      <tr key={s._id} className="border-b last:border-0">
                        <td className="px-4 py-3">{s.name}</td>
                        <td className="px-4 py-3">{s.code || "-"}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(s._id)} className="text-destructive">
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
        </TabsContent>

        {/* CLASS SUBJECTS TAB */}
        <TabsContent value="class_subjects" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign Subjects to Grades</CardTitle>
              <CardDescription>Select which subjects are taught in each grade.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignSubject} className="flex gap-4 items-end mb-6">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="gsGrade">Grade</Label>
                  <select 
                    id="gsGrade" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newGradeSubject.gradeId} 
                    onChange={(e) => setNewGradeSubject({ ...newGradeSubject, gradeId: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select Grade</option>
                    {grades.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="gsSubject">Subject</Label>
                  <select 
                    id="gsSubject" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newGradeSubject.subjectId} 
                    onChange={(e) => setNewGradeSubject({ ...newGradeSubject, subjectId: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select Subject</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <Button type="submit" disabled={!grades.length || !subjects.length}><Plus className="w-4 h-4 mr-2" /> Assign Subject</Button>
              </form>

              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Grade</th>
                      <th className="px-4 py-3 font-medium">Subject</th>
                      <th className="px-4 py-3 font-medium">Subject Code</th>
                      <th className="px-4 py-3 font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeSubjects.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No subjects assigned yet.</td></tr>
                    ) : gradeSubjects.map((gs) => (
                      <tr key={gs._id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{gs.gradeId?.name || "Unknown"}</td>
                        <td className="px-4 py-3">{gs.subjectId?.name || "Unknown"}</td>
                        <td className="px-4 py-3">{gs.subjectId?.code || "-"}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveSubjectFromGrade(gs._id)} className="text-destructive">
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
        </TabsContent>

      </Tabs>
    </div>
  );
}
