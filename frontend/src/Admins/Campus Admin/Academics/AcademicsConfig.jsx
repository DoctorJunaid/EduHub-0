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
  const [loadError, setLoadError] = useState("");

  // Form states
  const [newGrade, setNewGrade] = useState({ name: "", description: "" });
  const [newSection, setNewSection] = useState({ name: "", gradeId: "" });
  const [newSubject, setNewSubject] = useState({ name: "", code: "", description: "" });
  const [newGradeSubject, setNewGradeSubject] = useState({ gradeId: "", subjectId: "" });

  const fetchData = async () => {
    setLoadError("");
    const [gRes, secRes, subRes, gsRes] = await Promise.allSettled([
        axiosInstance.get("/academic/grades", { timeout: 12000 }),
        axiosInstance.get("/academic/sections", { timeout: 12000 }),
        axiosInstance.get("/academic/subjects", { timeout: 12000 }),
        axiosInstance.get("/academic/grade-subjects", { timeout: 12000 }),
    ]);
    const failures = [];
    const applyResult = (result, label, setter) => {
      if (result.status === "fulfilled") {
        setter(result.value.data);
        return;
      }
      const reason = result.reason;
      const detail = reason.code === "ECONNABORTED"
        ? "request timed out"
        : (reason.response?.data?.message || reason.message || "request failed");
      failures.push(`${label}: ${detail}`);
    };
    applyResult(gRes, "Grades", setGrades);
    applyResult(secRes, "Sections", setSections);
    applyResult(subRes, "Subjects", setSubjects);
    applyResult(gsRes, "Class subjects", setGradeSubjects);
    if (failures.length) {
      const message = `Some academic data could not be loaded. ${failures.join("; ")}`;
      setLoadError(message);
      toast.error(message);
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

  return (
    <div className="academics-config-page mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      {loadError && (
        <div className="academics-config-load-error" role="alert">
          <span>{loadError}</span>
          <Button type="button" variant="outline" onClick={fetchData}>Try again</Button>
        </div>
      )}
      <Tabs defaultValue="grades" className="academics-config-tabs w-full">
        <TabsList className="academics-config-tab-list flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm sm:w-fit">
          <TabsTrigger value="grades" className="h-9 flex-none rounded-lg px-3 text-xs text-zinc-600 data-[state=active]:bg-zinc-900 data-[state=active]:text-white sm:px-4 sm:text-sm">Grades/Classes</TabsTrigger>
          <TabsTrigger value="sections" className="h-9 flex-none rounded-lg px-3 text-xs text-zinc-600 data-[state=active]:bg-zinc-900 data-[state=active]:text-white sm:px-4 sm:text-sm">Sections</TabsTrigger>
          <TabsTrigger value="subjects" className="h-9 flex-none rounded-lg px-3 text-xs text-zinc-600 data-[state=active]:bg-zinc-900 data-[state=active]:text-white sm:px-4 sm:text-sm">Subjects Master</TabsTrigger>
          <TabsTrigger value="class_subjects" className="h-9 flex-none rounded-lg px-3 text-xs text-zinc-600 data-[state=active]:bg-zinc-900 data-[state=active]:text-white sm:px-4 sm:text-sm">Class Subjects</TabsTrigger>
        </TabsList>

        {/* GRADES TAB */}
        <TabsContent value="grades" className="space-y-4 mt-4">
            <Card className="academics-config-card gap-0 overflow-hidden rounded-xl border border-zinc-200 bg-white py-0 shadow-sm">
            <CardHeader className="academics-config-card-header gap-1 px-5 py-5 sm:px-6">
              <CardTitle>Manage Grades / Classes</CardTitle>
              <CardDescription>Define the core programs or grades offered in this campus.</CardDescription>
            </CardHeader>
            <CardContent className="academics-config-card-content px-5 pb-5 sm:px-6 sm:pb-6">
              <form onSubmit={handleCreateGrade} className="academics-config-grade-form mb-6 grid grid-cols-1 items-end gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
                <div className="grid min-w-0 items-center gap-2">
                  <Label htmlFor="gradeName">Grade Name</Label>
                  <Input 
                    id="gradeName" 
                    placeholder="e.g. Grade 1, BSCS" 
                    value={newGrade.name} 
                    onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
                    className="h-10 rounded-lg border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-200"
                    required
                  />
                </div>
                <div className="grid min-w-0 items-center gap-2">
                  <Label htmlFor="gradeDesc">Description (Optional)</Label>
                  <Input 
                    id="gradeDesc" 
                    placeholder="e.g. Primary School" 
                    value={newGrade.description} 
                    onChange={(e) => setNewGrade({ ...newGrade, description: e.target.value })}
                    className="h-10 rounded-lg border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-200"
                  />
                </div>
                <Button type="submit" className="h-10 w-full rounded-lg px-4 md:w-auto"><Plus className="w-4 h-4" /> Add Grade</Button>
              </form>

              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Grade Name</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</th>
                      <th className="w-24 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-zinc-500">No grades defined yet.</td></tr>
                    ) : grades.map((g) => (
                      <tr key={g._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70">
                        <td className="px-4 py-4 font-medium text-zinc-900">{g.name}</td>
                        <td className="px-4 py-4 text-zinc-600">{g.description || "-"}</td>
                        <td className="px-4 py-4 text-center">
                          <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${g.name}`} onClick={() => handleDeleteGrade(g._id)} className="mx-auto size-8 rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-600">
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
