import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import { Plus, Trash2, UserCheck, UserPlus, GraduationCap, Edit, Search, Users, ClipboardList } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import TableSkeleton from "@/components/shared/TableSkeleton";
import axiosInstance from "@/api/axiosInstance";
import * as classTeacherApi from "@/api/classTeacher.api";
import AssignClassTeacherDialog from "@/components/classTeacher/AssignClassTeacherDialog";
import toast from "react-hot-toast";

export default function AcademicsConfig() {
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradeSubjects, setGradeSubjects] = useState([]);
  const [classTeachers, setClassTeachers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [selectedSectionForAssign, setSelectedSectionForAssign] = useState(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Form states
  const [newGrade, setNewGrade] = useState({ name: "", description: "" });
  const [newSection, setNewSection] = useState({ name: "", gradeId: "" });
  const [newSubject, setNewSubject] = useState({ name: "", code: "", description: "" });
  const [newGradeSubject, setNewGradeSubject] = useState({ gradeId: "", subjectId: "" });
  const [newTeacherAssignment, setNewTeacherAssignment] = useState({
    teacherId: "",
    gradeId: "",
    sectionId: "",
    subjectId: "",
  });
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentTeacherFilter, setAssignmentTeacherFilter] = useState("");
  const [assignmentGradeFilter, setAssignmentGradeFilter] = useState("");

  const fetchData = async () => {
    setLoadError("");
    setLoading(true);
    try {
      const [gRes, secRes, subRes, gsRes, ctRes, taRes, tRes] = await Promise.allSettled([
          axiosInstance.get("/academic/grades", { timeout: 12000 }),
          axiosInstance.get("/academic/sections", { timeout: 12000 }),
          axiosInstance.get("/academic/subjects", { timeout: 12000 }),
          axiosInstance.get("/academic/grade-subjects", { timeout: 12000 }),
          classTeacherApi.getAllClassTeachers(),
          axiosInstance.get("/academic/teacher-assignments", { timeout: 12000 }),
          axiosInstance.get("/campus-admin/faculty", { timeout: 12000 }),
      ]);
      const failures = [];
      const applyResult = (result, label, setter, normalizer = (d) => d) => {
        if (result.status === "fulfilled") {
          setter(normalizer(result.value.data?.data || result.value.data || []));
          return;
        }
        const reason = result.reason;
        const detail = reason?.code === "ECONNABORTED"
          ? "request timed out"
          : (reason?.response?.data?.message || reason?.message || "request failed");
        failures.push(`${label}: ${detail}`);
      };
      applyResult(gRes, "Grades", setGrades);
      applyResult(secRes, "Sections", setSections);
      applyResult(subRes, "Subjects", setSubjects);
      applyResult(gsRes, "Class subjects", setGradeSubjects);
      applyResult(taRes, "Teacher assignments", setTeacherAssignments);
      applyResult(tRes, "Teachers", setTeachers, (d) => Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []));
      if (ctRes.status === "fulfilled") {
        setClassTeachers(ctRes.value.data || []);
      }
      if (failures.length) {
        const message = `Some academic data could not be loaded. ${failures.join("; ")}`;
        setLoadError(message);
        toast.error(message);
      }
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
      setIsSubmitting(true);
      const res = await axiosInstance.post("/academic/grades", newGrade);
      setGrades([...grades, res.data]);
      setNewGrade({ name: "", description: "" });
      toast.success("Grade created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create grade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGrade = async (id) => {
    if (!window.confirm("Delete this grade? This will also delete related sections and assignments.")) return;
    try {
      setIsDeletingId(id);
      await axiosInstance.delete(`/academic/grades/${id}`);
      setGrades(grades.filter((g) => g._id !== id));
      setSections(sections.filter((s) => s.gradeId?._id !== id));
      toast.success("Grade deleted");
    } catch (err) {
      toast.error("Failed to delete grade");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await axiosInstance.post("/academic/sections", newSection);
      setSections([...sections, res.data]);
      setNewSection({ name: "", gradeId: "" });
      toast.success("Section created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create section");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm("Delete this section?")) return;
    try {
      setIsDeletingId(id);
      await axiosInstance.delete(`/academic/sections/${id}`);
      setSections(sections.filter((s) => s._id !== id));
      toast.success("Section deleted");
    } catch (err) {
      toast.error("Failed to delete section");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await axiosInstance.post("/academic/subjects", newSubject);
      setSubjects([...subjects, res.data]);
      setNewSubject({ name: "", code: "", description: "" });
      toast.success("Subject created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      setIsDeletingId(id);
      await axiosInstance.delete(`/academic/subjects/${id}`);
      setSubjects(subjects.filter((s) => s._id !== id));
      setGradeSubjects(gradeSubjects.filter(gs => gs.subjectId?._id !== id));
      toast.success("Subject deleted");
    } catch (err) {
      toast.error("Failed to delete subject");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleAssignSubject = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await axiosInstance.post("/academic/grade-subjects", newGradeSubject);
      setGradeSubjects([...gradeSubjects, res.data]);
      setNewGradeSubject({ ...newGradeSubject, subjectId: "" });
      toast.success("Subject assigned to grade");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSubjectFromGrade = async (id) => {
    if (!window.confirm("Remove this subject from the grade?")) return;
    try {
      setIsDeletingId(id);
      await axiosInstance.delete(`/academic/grade-subjects/${id}`);
      setGradeSubjects(gradeSubjects.filter((gs) => gs._id !== id));
      toast.success("Subject removed");
    } catch (err) {
      toast.error("Failed to remove subject");
    } finally {
      setIsDeletingId(null);
    }
  };

  const [isApplyingPreset, setIsApplyingPreset] = useState(false);
  const handleApplyPeshawarPreset = async () => {
    if (!window.confirm("Apply standard BISE Peshawar Board curriculum preset (Class 6 - 12 & core subjects)? This will populate standard subjects and class mappings.")) return;
    try {
      setIsApplyingPreset(true);
      const res = await axiosInstance.post("/academic/preset-peshawar/apply");
      toast.success(res.data?.message || "BISE Peshawar Board preset applied successfully!");
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply preset");
    } finally {
      setIsApplyingPreset(false);
    }
  };

  return (
    <div className="academics-config-page mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Top Header Row with Preset Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 to-zinc-800 p-5 rounded-2xl text-white shadow-md">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Academic Structure & Subjects Master</h2>
          <p className="text-xs text-zinc-300 mt-0.5">
            Configure grades, sections, master subjects, and assign curriculum to classes.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleApplyPeshawarPreset}
          disabled={isApplyingPreset || loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-sm shrink-0"
        >
          {isApplyingPreset ? (
            <Spinner className="w-4 h-4 mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {isApplyingPreset ? "Applying Preset..." : "Apply Peshawar Board Preset"}
        </Button>
      </div>

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
          <TabsTrigger value="class_teachers" className="h-9 flex-none rounded-lg px-3 text-xs text-zinc-600 data-[state=active]:bg-indigo-600 data-[state=active]:text-white sm:px-4 sm:text-sm font-semibold flex items-center gap-1.5">🎓 Class Teachers</TabsTrigger>
          <TabsTrigger value="subjects" className="h-9 flex-none rounded-lg px-3 text-xs text-zinc-600 data-[state=active]:bg-zinc-900 data-[state=active]:text-white sm:px-4 sm:text-sm">Subjects Master</TabsTrigger>
          <TabsTrigger value="class_subjects" className="h-9 flex-none rounded-lg px-3 text-xs text-zinc-600 data-[state=active]:bg-zinc-900 data-[state=active]:text-white sm:px-4 sm:text-sm">Class Subjects</TabsTrigger>
          <TabsTrigger value="teacher_assignments" className="h-9 flex-none rounded-lg px-3 text-xs text-zinc-600 data-[state=active]:bg-zinc-900 data-[state=active]:text-white sm:px-4 sm:text-sm font-semibold flex items-center gap-1.5">👨‍🏫 Teacher Assignments ({teacherAssignments.length})</TabsTrigger>
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
                <Button type="submit" disabled={isSubmitting || !newGrade.name} className="h-10 w-full rounded-lg px-4 md:w-auto">
                  {isSubmitting ? <Spinner className="mr-2 size-4" /> : <Plus className="w-4 h-4 mr-2" />} Add Grade
                </Button>
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
                    {loading && grades.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-0">
                          <TableSkeleton rows={4} columns={3} />
                        </td>
                      </tr>
                    ) : grades.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-zinc-500">No grades defined yet.</td></tr>
                    ) : grades.map((g) => (
                      <tr key={g._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70">
                        <td className="px-4 py-4 font-medium text-zinc-900">{g.name}</td>
                        <td className="px-4 py-4 text-zinc-600">{g.description || "-"}</td>
                        <td className="px-4 py-4 text-center">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            disabled={isDeletingId === g._id}
                            aria-label={`Delete ${g.name}`} 
                            onClick={() => handleDeleteGrade(g._id)} 
                            className="mx-auto size-8 rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-600"
                          >
                            {isDeletingId === g._id ? <Spinner className="size-4 text-destructive" /> : <Trash2 className="w-4 h-4" />}
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
                <Button type="submit" disabled={isSubmitting || !grades.length || !newSection.gradeId || !newSection.name}>
                  {isSubmitting ? <Spinner className="mr-2 size-4" /> : <Plus className="w-4 h-4 mr-2" />} Add Section
                </Button>
              </form>

              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Grade</th>
                      <th className="px-4 py-3 font-medium">Section</th>
                      <th className="px-4 py-3 font-medium">Class Teacher</th>
                      <th className="px-4 py-3 font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && sections.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-0">
                          <TableSkeleton rows={4} columns={4} />
                        </td>
                      </tr>
                    ) : sections.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No sections defined yet.</td></tr>
                    ) : sections.map((s) => {
                      const ctInfo = classTeachers.find((ct) => String(ct.classId || ct._id) === String(s._id));
                      const teacher = ctInfo?.classTeacher;

                      return (
                        <tr key={s._id} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium">{s.gradeId?.name || "Unknown Grade"}</td>
                          <td className="px-4 py-3 font-bold">{s.name}</td>
                          <td className="px-4 py-3">
                            {teacher ? (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs px-2 py-0.5">
                                  {teacher.name}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedSectionForAssign(ctInfo || s);
                                    setIsAssignDialogOpen(true);
                                  }}
                                  className="h-6 px-1.5 text-xs text-indigo-600 hover:text-indigo-800"
                                >
                                  <Edit size={12} className="mr-1" /> Change
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSectionForAssign(ctInfo || s);
                                  setIsAssignDialogOpen(true);
                                }}
                                className="h-7 px-2.5 text-xs border-dashed border-amber-400 text-amber-700 hover:bg-amber-50"
                              >
                                <UserPlus size={13} className="mr-1" /> Assign Teacher
                              </Button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              disabled={isDeletingId === s._id}
                              onClick={() => handleDeleteSection(s._id)} 
                              className="text-destructive"
                            >
                              {isDeletingId === s._id ? <Spinner className="size-4 text-destructive" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLASS TEACHERS TAB */}
        <TabsContent value="class_teachers" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="text-indigo-600" />
                  Class Teacher Roles & Section Ownership
                </CardTitle>
                <CardDescription>
                  Every class section has one primary Class Teacher responsible for daily attendance, student records, and compiling term results.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classTeachers.map((ct) => {
                  const hasTeacher = !!ct.classTeacher;
                  return (
                    <div
                      key={ct._id || ct.classId}
                      className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-base text-zinc-900">
                            {ct.className}
                          </h4>
                          {hasTeacher ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                              Assigned
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                              Unassigned
                            </Badge>
                          )}
                        </div>

                        {hasTeacher ? (
                          <div className="space-y-2 text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                                {ct.classTeacher.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-zinc-900 block text-sm">
                                  {ct.classTeacher.name}
                                </span>
                                <span className="text-zinc-500">
                                  {ct.classTeacher.department || "Faculty"}
                                </span>
                              </div>
                            </div>
                            {ct.classTeacher.email && (
                              <div className="text-zinc-500 truncate">
                                📧 {ct.classTeacher.email}
                              </div>
                            )}
                            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-200">
                              <span>Students: <strong>{ct.studentCount || 0}</strong></span>
                              <span>Attendance Today: <strong>{ct.isAttendanceMarkedToday ? "✅ Marked" : "⏳ Pending"}</strong></span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 text-center text-xs text-zinc-400 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
                            No teacher assigned yet.
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant={hasTeacher ? "outline" : "default"}
                          onClick={() => {
                            setSelectedSectionForAssign(ct);
                            setIsAssignDialogOpen(true);
                          }}
                          className={`text-xs rounded-xl ${
                            hasTeacher
                              ? "border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          {hasTeacher ? (
                            <>
                              <Edit size={13} className="mr-1" /> Reassign
                            </>
                          ) : (
                            <>
                              <UserPlus size={13} className="mr-1" /> Assign Teacher
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
                <Button type="submit" disabled={isSubmitting || !newSubject.name}>
                  {isSubmitting ? <Spinner className="mr-2 size-4" /> : <Plus className="w-4 h-4 mr-2" />} Add Subject
                </Button>
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
                    {loading && subjects.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-0">
                          <TableSkeleton rows={4} columns={3} />
                        </td>
                      </tr>
                    ) : subjects.length === 0 ? (
                      <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No subjects defined yet.</td></tr>
                    ) : subjects.map((s) => (
                      <tr key={s._id} className="border-b last:border-0">
                        <td className="px-4 py-3">{s.name}</td>
                        <td className="px-4 py-3">{s.code || "-"}</td>
                        <td className="px-4 py-3">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={isDeletingId === s._id}
                            onClick={() => handleDeleteSubject(s._id)} 
                            className="text-destructive"
                          >
                            {isDeletingId === s._id ? <Spinner className="size-4 text-destructive" /> : <Trash2 className="w-4 h-4" />}
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
                <Button type="submit" disabled={isSubmitting || !grades.length || !subjects.length || !newGradeSubject.gradeId || !newGradeSubject.subjectId}>
                  {isSubmitting ? <Spinner className="mr-2 size-4" /> : <Plus className="w-4 h-4 mr-2" />} Assign Subject
                </Button>
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
                    {loading && gradeSubjects.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-0">
                          <TableSkeleton rows={4} columns={4} />
                        </td>
                      </tr>
                    ) : gradeSubjects.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No subjects assigned yet.</td></tr>
                    ) : gradeSubjects.map((gs) => (
                      <tr key={gs._id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{gs.gradeId?.name || "Unknown"}</td>
                        <td className="px-4 py-3">{gs.subjectId?.name || "Unknown"}</td>
                        <td className="px-4 py-3">{gs.subjectId?.code || "-"}</td>
                        <td className="px-4 py-3">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={isDeletingId === gs._id}
                            onClick={() => handleRemoveSubjectFromGrade(gs._id)} 
                            className="text-destructive"
                          >
                            {isDeletingId === gs._id ? <Spinner className="size-4 text-destructive" /> : <Trash2 className="w-4 h-4" />}
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

        {/* TEACHER ASSIGNMENTS TAB */}
        <TabsContent value="teacher_assignments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign Teachers to Class Subjects</CardTitle>
              <CardDescription>
                Assign faculty members to teach subjects in specific grade sections. All assignments flow instantly to teacher rosters, timetables, and student portals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Assignment Creation Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newTeacherAssignment.teacherId || !newTeacherAssignment.gradeId || !newTeacherAssignment.sectionId) {
                    toast.error("Please select a Teacher, Grade, and Section");
                    return;
                  }
                  try {
                    setIsSubmitting(true);
                    const res = await axiosInstance.post("/academic/teacher-assignments", newTeacherAssignment);
                    setTeacherAssignments([...teacherAssignments, res.data]);
                    setNewTeacherAssignment({ teacherId: "", gradeId: "", sectionId: "", subjectId: "" });
                    toast.success("Teacher assigned to class & subject successfully!");
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Failed to create teacher assignment");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end mb-6 p-4 rounded-xl border border-zinc-200 bg-zinc-50/70"
              >
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="taTeacher">Teacher *</Label>
                  <select
                    id="taTeacher"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newTeacherAssignment.teacherId}
                    onChange={(e) => setNewTeacherAssignment({ ...newTeacherAssignment, teacherId: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid items-center gap-1.5">
                  <Label htmlFor="taGrade">Grade / Class *</Label>
                  <select
                    id="taGrade"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newTeacherAssignment.gradeId}
                    onChange={(e) => {
                      const gId = e.target.value;
                      setNewTeacherAssignment({
                        ...newTeacherAssignment,
                        gradeId: gId,
                        sectionId: "",
                        subjectId: "",
                      });
                    }}
                    required
                  >
                    <option value="" disabled>Select Grade</option>
                    {grades.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid items-center gap-1.5">
                  <Label htmlFor="taSection">Section *</Label>
                  <select
                    id="taSection"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                    value={newTeacherAssignment.sectionId}
                    onChange={(e) => setNewTeacherAssignment({ ...newTeacherAssignment, sectionId: e.target.value })}
                    required
                    disabled={!newTeacherAssignment.gradeId}
                  >
                    <option value="" disabled>Select Section</option>
                    {sections
                      .filter((s) => (s.gradeId?._id || s.gradeId) === newTeacherAssignment.gradeId)
                      .map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid items-center gap-1.5">
                  <Label htmlFor="taSubject">Subject (Optional)</Label>
                  <select
                    id="taSubject"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                    value={newTeacherAssignment.subjectId}
                    onChange={(e) => setNewTeacherAssignment({ ...newTeacherAssignment, subjectId: e.target.value })}
                    disabled={!newTeacherAssignment.gradeId}
                  >
                    <option value="">All Subjects (Class Teacher / General)</option>
                    {(() => {
                      const gradeSubs = gradeSubjects
                        .filter((gs) => (gs.gradeId?._id || gs.gradeId) === newTeacherAssignment.gradeId)
                        .map((gs) => gs.subjectId)
                        .filter(Boolean);
                      const listToUse = gradeSubs.length > 0 ? gradeSubs : subjects;
                      return listToUse.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} {s.code ? `(${s.code})` : ""}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !newTeacherAssignment.teacherId ||
                    !newTeacherAssignment.gradeId ||
                    !newTeacherAssignment.sectionId
                  }
                  className="h-10 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {isSubmitting ? <Spinner className="mr-2 size-4" /> : <Plus className="w-4 h-4 mr-2" />} Assign Teacher
                </Button>
              </form>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                  <Input
                    placeholder="Search by teacher, class, subject..."
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2.5 text-xs ring-offset-background"
                    value={assignmentTeacherFilter}
                    onChange={(e) => setAssignmentTeacherFilter(e.target.value)}
                  >
                    <option value="">All Teachers</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2.5 text-xs ring-offset-background"
                    value={assignmentGradeFilter}
                    onChange={(e) => setAssignmentGradeFilter(e.target.value)}
                  >
                    <option value="">All Classes</option>
                    {grades.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignments Table */}
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-xs font-semibold text-zinc-700">
                    <tr>
                      <th className="px-4 py-3">Teacher</th>
                      <th className="px-4 py-3">Grade / Class</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Assigned Subject</th>
                      <th className="px-4 py-3 w-24 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && teacherAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <TableSkeleton rows={4} columns={5} />
                        </td>
                      </tr>
                    ) : (() => {
                      const filtered = teacherAssignments.filter((a) => {
                        const tName = a.teacherId?.name || "";
                        const tEmail = a.teacherId?.email || "";
                        const gName = a.gradeId?.name || "";
                        const sName = a.sectionId?.name || "";
                        const subName = a.subjectId?.name || "All Subjects";
                        const matchesSearch =
                          !assignmentSearch ||
                          `${tName} ${tEmail} ${gName} ${sName} ${subName}`
                            .toLowerCase()
                            .includes(assignmentSearch.toLowerCase());
                        const matchesTeacher =
                          !assignmentTeacherFilter ||
                          String(a.teacherId?._id || a.teacherId) === String(assignmentTeacherFilter);
                        const matchesGrade =
                          !assignmentGradeFilter ||
                          String(a.gradeId?._id || a.gradeId) === String(assignmentGradeFilter);
                        return matchesSearch && matchesTeacher && matchesGrade;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-zinc-500 text-sm">
                              No teacher assignments found. Use the form above to assign teachers to class subjects.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((a) => (
                        <tr key={a._id} className="border-b last:border-0 hover:bg-zinc-50/70 transition-colors">
                          <td className="px-4 py-3 font-medium text-zinc-900">
                            <div>{a.teacherId?.name || "Teacher"}</div>
                            <div className="text-xs text-zinc-500">{a.teacherId?.email || ""}</div>
                          </td>
                          <td className="px-4 py-3 text-zinc-800 font-medium">{a.gradeId?.name || "Class"}</td>
                          <td className="px-4 py-3 text-zinc-700">Section {a.sectionId?.name || "A"}</td>
                          <td className="px-4 py-3 text-zinc-900 font-semibold">
                            {a.subjectId?.name ? (
                              <>
                                {a.subjectId.name}
                                {a.subjectId?.code && (
                                  <span className="ml-1.5 text-xs text-zinc-500 font-normal">
                                    ({a.subjectId.code})
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                All Subjects (Class Teacher)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isDeletingId === a._id}
                              onClick={async () => {
                                if (!window.confirm("Remove this teacher assignment?")) return;
                                try {
                                  setIsDeletingId(a._id);
                                  await axiosInstance.delete(`/academic/teacher-assignments/${a._id}`);
                                  setTeacherAssignments(teacherAssignments.filter((item) => item._id !== a._id));
                                  toast.success("Assignment removed");
                                } catch (err) {
                                  toast.error("Failed to remove assignment");
                                } finally {
                                  setIsDeletingId(null);
                                }
                              }}
                              className="size-8 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50"
                              title="Remove Assignment"
                            >
                              {isDeletingId === a._id ? (
                                <Spinner className="size-4 text-destructive" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AssignClassTeacherDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        classSection={selectedSectionForAssign}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
