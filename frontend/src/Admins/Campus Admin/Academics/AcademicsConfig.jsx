import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import {
  Plus,
  Trash2,
  UserCheck,
  UserPlus,
  GraduationCap,
  Edit,
  Search,
  Users,
  ClipboardList,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  X,
  Filter,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import TableSkeleton from "@/components/shared/TableSkeleton";
import DataPagination from "@/components/shared/DataPagination";
import axiosInstance from "@/api/axiosInstance";
import * as classTeacherApi from "@/api/classTeacher.api";
import AssignClassTeacherDialog from "@/components/classTeacher/AssignClassTeacherDialog";
import TeacherAssignmentTab from "./TeacherAssignmentTab";
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
  const [selectedSectionForAssign, setSelectedSectionForAssign] =
    useState(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Form states
  const [newGrade, setNewGrade] = useState({ name: "", description: "" });
  const [newSection, setNewSection] = useState({ name: "", gradeId: "" });
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [newGradeSubject, setNewGradeSubject] = useState({
    gradeId: "",
    subjectId: "",
  });
  const [newTeacherAssignment, setNewTeacherAssignment] = useState({
    teacherId: "",
    gradeId: "",
    sectionId: "",
    subjectId: "",
  });
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentTeacherFilter, setAssignmentTeacherFilter] = useState("");
  const [assignmentGradeFilter, setAssignmentGradeFilter] = useState("");
  const [classTeacherSearch, setClassTeacherSearch] = useState("");
  const [classTeacherStatusFilter, setClassTeacherStatusFilter] =
    useState("all");
  const [classTeacherGradeFilter, setClassTeacherGradeFilter] = useState("all");
  const [classTeacherPage, setClassTeacherPage] = useState(1);
  const [classTeacherPageSize, setClassTeacherPageSize] = useState(12);

  const fetchData = async () => {
    setLoadError("");
    setLoading(true);
    try {
      const [gRes, secRes, subRes, gsRes, ctRes, taRes, tRes] =
        await Promise.allSettled([
          axiosInstance.get("/academic/grades", { timeout: 12000 }),
          axiosInstance.get("/academic/sections", { timeout: 12000 }),
          axiosInstance.get("/academic/subjects", { timeout: 12000 }),
          axiosInstance.get("/academic/grade-subjects", { timeout: 12000 }),
          classTeacherApi.getAllClassTeachers(),
          axiosInstance.get("/academic/teacher-assignments", {
            timeout: 12000,
          }),
          axiosInstance.get("/campus-admin/faculty", { timeout: 12000 }),
        ]);
      const failures = [];
      const applyResult = (result, label, setter, normalizer = (d) => d) => {
        if (result.status === "fulfilled") {
          setter(
            normalizer(result.value.data?.data || result.value.data || []),
          );
          return;
        }
        const reason = result.reason;
        const detail =
          reason?.code === "ECONNABORTED"
            ? "request timed out"
            : reason?.response?.data?.message ||
              reason?.message ||
              "request failed";
        failures.push(`${label}: ${detail}`);
      };
      applyResult(gRes, "Grades", setGrades);
      applyResult(secRes, "Sections", setSections);
      applyResult(subRes, "Subjects", setSubjects);
      applyResult(gsRes, "Class subjects", setGradeSubjects);
      applyResult(taRes, "Teacher assignments", setTeacherAssignments);
      applyResult(tRes, "Teachers", setTeachers, (d) =>
        Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [],
      );
      if (ctRes.status === "fulfilled") {
        const ctData = ctRes.value.data?.data || ctRes.value.data || [];
        setClassTeachers(Array.isArray(ctData) ? ctData : []);
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
    if (
      !window.confirm(
        "Delete this grade? This will also delete related sections and assignments.",
      )
    )
      return;
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
      setGradeSubjects(gradeSubjects.filter((gs) => gs.subjectId?._id !== id));
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
      const res = await axiosInstance.post(
        "/academic/grade-subjects",
        newGradeSubject,
      );
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
    if (
      !window.confirm(
        "Apply standard BISE Peshawar Board curriculum preset (Class 6 - 12 & core subjects)? This will populate standard subjects and class mappings.",
      )
    )
      return;
    try {
      setIsApplyingPreset(true);
      const res = await axiosInstance.post("/academic/preset-peshawar/apply");
      toast.success(
        res.data?.message || "BISE Peshawar Board preset applied successfully!",
      );
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
      <div
        className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between"
        style={{
          padding: "20px 24px",
          gap: "16px",
          marginBottom: "20px",
          boxSizing: "border-box",
        }}
      >
        {/* Left: Title & Subtitle */}
        <div className="flex flex-col min-w-0" style={{ gap: "4px" }}>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
            Academic Structure &amp; Subjects Master
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500">
            Configure grades, sections, master subjects, and assign curriculum
            to classes.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="academics-config-load-error" role="alert">
          <span>{loadError}</span>
          <Button type="button" variant="outline" onClick={fetchData}>
            Try again
          </Button>
        </div>
      )}
      <Tabs defaultValue="grades" className="academics-config-tabs w-full">
        <TabsList
          className="academics-config-tab-list flex h-auto w-full flex-wrap justify-start rounded-xl border border-neutral-200 bg-white shadow-xs sm:w-fit"
          style={{ padding: "4px", gap: "4px" }}
        >
          <TabsTrigger
            value="grades"
            className="flex-none rounded-lg text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 data-[state=active]:bg-neutral-900 data-[state=active]:text-white data-[state=active]:shadow-xs transition-colors cursor-pointer"
            style={{ padding: "8px 14px" }}
          >
            Grades/Classes
          </TabsTrigger>
          <TabsTrigger
            value="sections"
            className="flex-none rounded-lg text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 data-[state=active]:bg-neutral-900 data-[state=active]:text-white data-[state=active]:shadow-xs transition-colors cursor-pointer"
            style={{ padding: "8px 14px" }}
          >
            Sections
          </TabsTrigger>
          <TabsTrigger
            value="class_teachers"
            className="flex-none rounded-lg text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 data-[state=active]:bg-neutral-900 data-[state=active]:text-white data-[state=active]:shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            style={{ padding: "8px 14px" }}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span>Class Teachers</span>
          </TabsTrigger>
          <TabsTrigger
            value="subjects"
            className="flex-none rounded-lg text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 data-[state=active]:bg-neutral-900 data-[state=active]:text-white data-[state=active]:shadow-xs transition-colors cursor-pointer"
            style={{ padding: "8px 14px" }}
          >
            Subjects Master
          </TabsTrigger>
          <TabsTrigger
            value="class_subjects"
            className="flex-none rounded-lg text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 data-[state=active]:bg-neutral-900 data-[state=active]:text-white data-[state=active]:shadow-xs transition-colors cursor-pointer"
            style={{ padding: "8px 14px" }}
          >
            Class Subjects
          </TabsTrigger>
          <TabsTrigger
            value="teacher_assignments"
            className="flex-none rounded-lg text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 data-[state=active]:bg-neutral-900 data-[state=active]:text-white data-[state=active]:shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            style={{ padding: "8px 14px" }}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Teacher Assignments ({teacherAssignments.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* GRADES TAB */}
        <TabsContent value="grades" className="space-y-4 mt-4">
          <Card className="academics-config-card gap-0 overflow-hidden rounded-xl border border-zinc-200 bg-white py-0 shadow-sm">
            <CardHeader className="academics-config-card-header gap-1 px-5 py-5 sm:px-6">
              <CardTitle>Manage Grades / Classes</CardTitle>
              <CardDescription>
                Define the core programs or grades offered in this campus.
              </CardDescription>
            </CardHeader>
            <CardContent className="academics-config-card-content px-5 pb-5 sm:px-6 sm:pb-6">
              <form
                onSubmit={handleCreateGrade}
                className="academics-config-grade-form mb-6 grid grid-cols-1 items-end gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]"
              >
                <div className="grid min-w-0 items-center gap-2">
                  <Label htmlFor="gradeName">Grade Name</Label>
                  <Input
                    id="gradeName"
                    placeholder="e.g. Grade 1, BSCS"
                    value={newGrade.name}
                    onChange={(e) =>
                      setNewGrade({ ...newGrade, name: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewGrade({ ...newGrade, description: e.target.value })
                    }
                    className="h-10 rounded-lg border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !newGrade.name}
                  className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-xs transition-colors h-10 w-full md:w-auto cursor-pointer disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed shrink-0"
                  style={{
                    height: "40px",
                    padding: "0 18px",
                    gap: "6px",
                    boxSizing: "border-box",
                  }}
                >
                  {isSubmitting ? (
                    <Spinner className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                  )}
                  <span>Add Grade</span>
                </button>
              </form>

              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Grade Name
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Description
                      </th>
                      <th className="w-24 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Actions
                      </th>
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
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-sm text-zinc-500"
                        >
                          No grades defined yet.
                        </td>
                      </tr>
                    ) : (
                      grades.map((g) => (
                        <tr
                          key={g._id}
                          className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70"
                        >
                          <td className="px-4 py-4 font-medium text-zinc-900">
                            {g.name}
                          </td>
                          <td className="px-4 py-4 text-zinc-600">
                            {g.description || "-"}
                          </td>
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
                              {isDeletingId === g._id ? (
                                <Spinner className="size-4 text-destructive" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
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
              <CardDescription>
                Assign sections to specific grades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleCreateSection}
                className="flex gap-4 items-end mb-6"
              >
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="secGrade">Grade</Label>
                  <select
                    id="secGrade"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newSection.gradeId}
                    onChange={(e) =>
                      setNewSection({ ...newSection, gradeId: e.target.value })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select Grade
                    </option>
                    {grades.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="secName">Section Name</Label>
                  <Input
                    id="secName"
                    placeholder="e.g. A, B, Blue"
                    value={newSection.name}
                    onChange={(e) =>
                      setNewSection({ ...newSection, name: e.target.value })
                    }
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !grades.length ||
                    !newSection.gradeId ||
                    !newSection.name
                  }
                  className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-xs transition-colors h-10 w-full md:w-auto cursor-pointer disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed shrink-0"
                  style={{
                    height: "40px",
                    padding: "0 18px",
                    gap: "6px",
                    boxSizing: "border-box",
                  }}
                >
                  {isSubmitting ? (
                    <Spinner className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                  )}
                  <span>Add Section</span>
                </button>
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
                      <tr>
                        <td
                          colSpan={4}
                          className="p-4 text-center text-muted-foreground"
                        >
                          No sections defined yet.
                        </td>
                      </tr>
                    ) : (
                      sections.map((s) => {
                        const ctInfo = classTeachers.find(
                          (ct) =>
                            String(ct.classId || ct._id) === String(s._id),
                        );
                        const teacher = ctInfo?.classTeacher;

                        return (
                          <tr
                            key={s._id}
                            className="border-b last:border-0 hover:bg-slate-50/50"
                          >
                            <td className="px-4 py-3 font-medium">
                              {s.gradeId?.name || "Unknown Grade"}
                            </td>
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
                                    className="h-6 px-1.5 text-xs text-neutral-600 hover:text-neutral-900"
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
                                  <UserPlus size={13} className="mr-1" /> Assign
                                  Teacher
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
                                {isDeletingId === s._id ? (
                                  <Spinner className="size-4 text-destructive" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLASS TEACHERS TAB */}
        <TabsContent value="class_teachers" className="space-y-5 mt-4">
          {(() => {
            const totalSections = classTeachers.length;
            const assignedCount = classTeachers.filter(
              (ct) => !!ct.classTeacher,
            ).length;
            const unassignedCount = totalSections - assignedCount;
            const markedTodayCount = classTeachers.filter(
              (ct) => ct.isAttendanceMarkedToday,
            ).length;
            const coveragePercent =
              totalSections > 0
                ? Math.round((assignedCount / totalSections) * 100)
                : 0;

            // Extract unique grade names for filter
            const gradeOptions = Array.from(
              new Set(
                classTeachers
                  .map(
                    (ct) =>
                      ct.gradeName ||
                      (ct.className ? ct.className.split(" - ")[0] : ""),
                  )
                  .filter(Boolean),
              ),
            ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

            // Filtering
            const q = classTeacherSearch.trim().toLowerCase();
            const filtered = classTeachers.filter((ct) => {
              const matchesSearch =
                !q ||
                ct.className?.toLowerCase().includes(q) ||
                ct.classTeacher?.name?.toLowerCase().includes(q) ||
                ct.classTeacher?.email?.toLowerCase().includes(q) ||
                ct.classTeacher?.department?.toLowerCase().includes(q);

              const matchesStatus =
                classTeacherStatusFilter === "all" ||
                (classTeacherStatusFilter === "assigned" &&
                  !!ct.classTeacher) ||
                (classTeacherStatusFilter === "unassigned" && !ct.classTeacher);

              const ctGrade =
                ct.gradeName ||
                (ct.className ? ct.className.split(" - ")[0] : "");
              const matchesGrade =
                classTeacherGradeFilter === "all" ||
                ctGrade.toLowerCase() === classTeacherGradeFilter.toLowerCase();

              return matchesSearch && matchesStatus && matchesGrade;
            });

            // Pagination
            const totalItems = filtered.length;
            const totalPages =
              Math.ceil(totalItems / classTeacherPageSize) || 1;
            const startIdx = (classTeacherPage - 1) * classTeacherPageSize;
            const paginatedItems = filtered.slice(
              startIdx,
              startIdx + classTeacherPageSize,
            );

            const hasActiveFilters =
              classTeacherSearch.trim() !== "" ||
              classTeacherStatusFilter !== "all" ||
              classTeacherGradeFilter !== "all";

            return (
              <>
                {/* 1. Flush 4-Card KPI Track */}
                <div
                  className="grid grid-cols-2 lg:grid-cols-4 w-full"
                  style={{ gap: "16px", marginBottom: "20px" }}
                >
                  {/* TOTAL SECTIONS */}
                  <div
                    className="bg-white border border-neutral-200 rounded-xl flex items-start justify-between shadow-xs"
                    style={{ padding: "18px 20px", boxSizing: "border-box" }}
                  >
                    <div
                      className="flex flex-col min-w-0"
                      style={{ gap: "4px" }}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        TOTAL SECTIONS
                      </span>
                      <span className="text-2xl font-bold text-neutral-900 tracking-tight">
                        {totalSections}
                      </span>
                      <span className="text-xs text-neutral-500">
                        Configured classes
                      </span>
                    </div>
                    <div
                      className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
                      style={{ width: "38px", height: "38px" }}
                    >
                      <GraduationCap className="w-4 h-4 text-neutral-600" />
                    </div>
                  </div>

                  {/* ASSIGNED INCHARGES */}
                  <div
                    className="bg-white border border-neutral-200 rounded-xl flex items-start justify-between shadow-xs"
                    style={{ padding: "18px 20px", boxSizing: "border-box" }}
                  >
                    <div
                      className="flex flex-col min-w-0"
                      style={{ gap: "4px" }}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        ASSIGNED INCHARGES
                      </span>
                      <span className="text-2xl font-bold text-neutral-900 tracking-tight">
                        {assignedCount}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {coveragePercent}% Staffed
                      </span>
                    </div>
                    <div
                      className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
                      style={{ width: "38px", height: "38px" }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-neutral-600" />
                    </div>
                  </div>

                  {/* VACANT SECTIONS */}
                  <div
                    className="bg-white border border-neutral-200 rounded-xl flex items-start justify-between shadow-xs"
                    style={{ padding: "18px 20px", boxSizing: "border-box" }}
                  >
                    <div
                      className="flex flex-col min-w-0"
                      style={{ gap: "4px" }}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        VACANT SECTIONS
                      </span>
                      <span className="text-2xl font-bold text-neutral-900 tracking-tight">
                        {unassignedCount}
                      </span>
                      <span className="text-xs text-neutral-500">
                        Requires Incharge
                      </span>
                    </div>
                    <div
                      className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
                      style={{ width: "38px", height: "38px" }}
                    >
                      <AlertTriangle className="w-4 h-4 text-neutral-600" />
                    </div>
                  </div>

                  {/* ATTENDANCE TODAY */}
                  <div
                    className="bg-white border border-neutral-200 rounded-xl flex items-start justify-between shadow-xs"
                    style={{ padding: "18px 20px", boxSizing: "border-box" }}
                  >
                    <div
                      className="flex flex-col min-w-0"
                      style={{ gap: "4px" }}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        ATTENDANCE TODAY
                      </span>
                      <span className="text-2xl font-bold text-neutral-900 tracking-tight">
                        {markedTodayCount}
                      </span>
                      <span className="text-xs text-neutral-500">
                        Sections rolled call
                      </span>
                    </div>
                    <div
                      className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
                      style={{ width: "38px", height: "38px" }}
                    >
                      <ClipboardList className="w-4 h-4 text-neutral-600" />
                    </div>
                  </div>
                </div>

                {/* 2. Main Executive Card Container */}
                <div
                  className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden"
                  style={{ marginBottom: "20px", boxSizing: "border-box" }}
                >
                  {/* Top Header Row (Class Teacher Roles & Section Ownership) */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200"
                    style={{
                      padding: "18px 20px",
                      gap: "16px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      className="flex items-start sm:items-center"
                      style={{ gap: "12px" }}
                    >
                      <div
                        className="rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0"
                        style={{ width: "40px", height: "40px" }}
                      >
                        <GraduationCap className="w-5 h-5 text-neutral-700" />
                      </div>
                      <div className="flex flex-col" style={{ gap: "3px" }}>
                        <div
                          className="flex items-center flex-wrap"
                          style={{ gap: "8px" }}
                        >
                          <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                            Class Teacher Roles &amp; Section Ownership
                          </h2>
                          <span
                            className="rounded-md bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-700"
                            style={{ padding: "2px 8px" }}
                          >
                            {sections.length} Sections
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500">
                          Every class section has one primary Class Teacher
                          responsible for daily roll call, student records, and
                          compiling term results.
                        </p>
                      </div>
                    </div>

                    {/* Right Coverage Indicator */}
                    <div
                      className="flex items-center shrink-0"
                      style={{ gap: "12px" }}
                    >
                      <div
                        className="flex flex-col items-end"
                        style={{ gap: "4px" }}
                      >
                        <div
                          className="flex items-center text-xs"
                          style={{ gap: "6px" }}
                        >
                          <span className="text-neutral-500 font-medium">
                            Incharge Coverage
                          </span>
                          <span className="font-bold text-neutral-900">
                            {coveragePercent}%
                          </span>
                        </div>
                        <div className="w-28 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-neutral-900 rounded-full"
                            style={{ width: `${coveragePercent}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className="rounded-lg bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800 whitespace-nowrap"
                        style={{ padding: "6px 10px" }}
                      >
                        {assignedCount}/{totalSections || sections.length}{" "}
                        Staffed
                      </span>
                    </div>
                  </div>

                  {/* Search & Filter Bar Row (Fix Search Icon Collision & Cramped Pills) */}
                  <div
                    className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-200 bg-neutral-50/40"
                    style={{
                      padding: "14px 20px",
                      gap: "12px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      className="flex flex-wrap items-center flex-1"
                      style={{ gap: "12px" }}
                    >
                      {/* Search Input with Forced Left Padding */}
                      <div className="relative w-full sm:w-80">
                        <Search
                          className="w-4 h-4 text-neutral-400 absolute top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ left: "12px" }}
                        />
                        <input
                          type="text"
                          value={classTeacherSearch}
                          onChange={(e) => {
                            setClassTeacherSearch(e.target.value);
                            setClassTeacherPage(1);
                          }}
                          placeholder="Search class, section, teacher, or department..."
                          className="w-full rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                          style={{
                            height: "36px",
                            paddingLeft: "36px",
                            paddingRight: "12px",
                            boxSizing: "border-box",
                          }}
                        />
                        {classTeacherSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setClassTeacherSearch("");
                              setClassTeacherPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            title="Clear search"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Segmented Filter Tabs */}
                      <div
                        className="bg-neutral-100 border border-neutral-200 rounded-lg inline-flex items-center"
                        style={{ padding: "3px", gap: "4px" }}
                      >
                        {[
                          { id: "all", label: "All", count: totalSections },
                          {
                            id: "assigned",
                            label: "Assigned",
                            count: assignedCount,
                          },
                          {
                            id: "unassigned",
                            label: "Vacant",
                            count: unassignedCount,
                          },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setClassTeacherStatusFilter(tab.id);
                              setClassTeacherPage(1);
                            }}
                            className={`rounded-md text-xs font-medium transition-colors whitespace-nowrap inline-flex items-center ${
                              classTeacherStatusFilter === tab.id
                                ? "bg-white text-neutral-900 shadow-xs font-semibold"
                                : "text-neutral-600 hover:text-neutral-900"
                            }`}
                            style={{
                              height: "28px",
                              padding: "0 10px",
                              gap: "5px",
                            }}
                          >
                            <span>{tab.label}</span>
                            <span className="text-[11px] text-neutral-500">
                              ({tab.count})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grade Selector & Clear Button */}
                    <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                      <select
                        value={classTeacherGradeFilter}
                        onChange={(e) => {
                          setClassTeacherGradeFilter(e.target.value);
                          setClassTeacherPage(1);
                        }}
                        className="rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:border-neutral-400 shrink-0"
                        style={{
                          height: "36px",
                          padding: "0 12px",
                          minWidth: "140px",
                          boxSizing: "border-box",
                        }}
                      >
                        <option value="all">
                          All Grades ({gradeOptions.length})
                        </option>
                        {gradeOptions.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>

                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={() => {
                            setClassTeacherSearch("");
                            setClassTeacherStatusFilter("all");
                            setClassTeacherGradeFilter("all");
                            setClassTeacherPage(1);
                          }}
                          className="h-9 text-xs text-neutral-500 hover:text-neutral-900 font-medium px-2.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cards Grid Container */}
                  <div style={{ boxSizing: "border-box" }}>
                    {loading && classTeachers.length === 0 ? (
                      <div className="py-16 flex flex-col items-center justify-center text-neutral-500">
                        <Spinner className="w-8 h-8 mb-2 text-neutral-700" />
                        <p className="text-xs text-neutral-600 font-semibold">
                          Loading class teacher roles...
                        </p>
                      </div>
                    ) : classTeachers.length === 0 ? (
                      <div className="py-16 text-center text-sm text-neutral-500 bg-white rounded-xl border border-neutral-200 p-8 shadow-xs max-w-lg mx-auto m-6">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-3 text-neutral-700">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-neutral-900 text-sm">
                          No Class Sections Configured
                        </p>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                          Add grades and sections in the Sections tab to
                          designate primary Class Teachers.
                        </p>
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="py-14 text-center text-xs text-neutral-500 bg-white rounded-xl border border-neutral-200 p-8 max-w-md mx-auto shadow-xs m-6">
                        <Search className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                        <p className="font-bold text-neutral-800 text-sm">
                          No matching class sections
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          Try adjusting your search query, status filter, or
                          selected grade.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setClassTeacherSearch("");
                            setClassTeacherStatusFilter("all");
                            setClassTeacherGradeFilter("all");
                          }}
                          className="mt-3.5 h-8 px-3 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          Clear Filters
                        </button>
                      </div>
                    ) : (
                      <div
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full"
                        style={{
                          padding: "20px",
                          gap: "16px",
                          boxSizing: "border-box",
                        }}
                      >
                        {paginatedItems.map((ct) => {
                          const hasTeacher = !!ct.classTeacher;
                          const teacherName = ct.classTeacher?.name || "";
                          const teacherInitial =
                            teacherName
                              .replace(
                                /^Dr\.\s*|^Prof\.\s*|^Sir\s*|^Madam\s*/i,
                                "",
                              )
                              .trim()[0] || "T";
                          const isAttendanceMarked = Boolean(
                            ct.isAttendanceMarkedToday,
                          );

                          return (
                            <div
                              key={ct._id || ct.classId}
                              className="bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col justify-between"
                              style={{
                                padding: "18px",
                                gap: "16px",
                                height: "auto",
                                boxSizing: "border-box",
                              }}
                            >
                              {/* Top Row: Section Name + Assigned/Vacant Badge */}
                              <div
                                className="flex items-center justify-between"
                                style={{ gap: "8px" }}
                              >
                                <h3 className="text-sm font-bold text-neutral-900 truncate">
                                  {ct.className}
                                </h3>
                                {hasTeacher ? (
                                  <span
                                    className="inline-flex items-center rounded-md bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-700 shrink-0"
                                    style={{ padding: "2px 8px", gap: "5px" }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                    Assigned
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200/80 text-[11px] font-medium text-amber-700 shrink-0"
                                    style={{ padding: "2px 8px", gap: "5px" }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Vacant
                                  </span>
                                )}
                              </div>

                              {/* Middle Row: Assigned Teacher Box */}
                              <div
                                className="rounded-lg bg-neutral-50 border border-neutral-200/80 flex items-center"
                                style={{
                                  padding: "12px",
                                  gap: "12px",
                                  boxSizing: "border-box",
                                }}
                              >
                                <div
                                  className="rounded-full bg-neutral-900 text-white font-semibold text-xs flex items-center justify-center shrink-0"
                                  style={{ width: "36px", height: "36px" }}
                                >
                                  {teacherInitial.toUpperCase()}
                                </div>
                                <div
                                  className="flex flex-col min-w-0"
                                  style={{ gap: "2px" }}
                                >
                                  <span className="text-xs font-bold text-neutral-900 truncate">
                                    {hasTeacher
                                      ? teacherName
                                      : "No Class Teacher Assigned"}
                                  </span>
                                  <span className="text-[11px] text-neutral-500 truncate">
                                    {hasTeacher
                                      ? ct.classTeacher.department ||
                                        ct.classTeacher.designation ||
                                        "Teaching Staff"
                                      : "Assign an incharge for roll call & reports"}
                                  </span>
                                  {hasTeacher && ct.classTeacher.email && (
                                    <span
                                      className="text-[11px] text-neutral-500 truncate inline-flex items-center"
                                      style={{ gap: "4px" }}
                                    >
                                      <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                                      {ct.classTeacher.email}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Bottom Footer: Student Count, Roll Call Status & Reassign Button */}
                              <div
                                className="flex flex-col"
                                style={{ gap: "10px" }}
                              >
                                <div
                                  className="flex items-center justify-between"
                                  style={{ gap: "8px" }}
                                >
                                  <span
                                    className="inline-flex items-center rounded-md bg-neutral-100 border border-neutral-200/80 text-[11px] font-medium text-neutral-700"
                                    style={{ padding: "4px 10px", gap: "5px" }}
                                  >
                                    <Users className="w-3.5 h-3.5 text-neutral-500" />
                                    {ct.studentCount || 0} Students
                                  </span>
                                  <span
                                    className={`inline-flex items-center rounded-md border text-[11px] font-medium ${
                                      isAttendanceMarked
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                                        : "bg-neutral-100 text-neutral-600 border-neutral-200/80"
                                    }`}
                                    style={{ padding: "4px 10px", gap: "5px" }}
                                  >
                                    {isAttendanceMarked ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Marked Today
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                        Roll Call Pending
                                      </>
                                    )}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSectionForAssign(ct);
                                    setIsAssignDialogOpen(true);
                                  }}
                                  className="w-full inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 transition-colors shadow-xs"
                                  style={{
                                    height: "36px",
                                    padding: "0 14px",
                                    gap: "6px",
                                    boxSizing: "border-box",
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5 text-neutral-600" />
                                  <span>
                                    {hasTeacher
                                      ? "Reassign Incharge"
                                      : "Assign Incharge"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Standardized DataPagination Footer */}
                  {totalItems > 0 && (
                    <div className="border-t border-neutral-200 bg-white">
                      <DataPagination
                        currentPage={classTeacherPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={classTeacherPageSize}
                        onPageChange={setClassTeacherPage}
                        onPageSizeChange={(newSize) => {
                          setClassTeacherPageSize(newSize);
                          setClassTeacherPage(1);
                        }}
                        pageSizeOptions={[9, 12, 18, 24, 48]}
                        itemLabel="class sections"
                      />
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </TabsContent>

        {/* SUBJECTS MASTER TAB */}
        <TabsContent value="subjects" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Master List</CardTitle>
              <CardDescription>
                Define all unique subjects taught in the campus.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleCreateSubject}
                className="flex gap-4 items-end mb-6"
              >
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="subName">Subject Name</Label>
                  <Input
                    id="subName"
                    placeholder="e.g. Mathematics"
                    value={newSubject.name}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid w-full max-w-xs items-center gap-1.5">
                  <Label htmlFor="subCode">Code (Optional)</Label>
                  <Input
                    id="subCode"
                    placeholder="e.g. MATH101"
                    value={newSubject.code}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, code: e.target.value })
                    }
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !newSubject.name}
                  className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-xs transition-colors h-10 w-full md:w-auto cursor-pointer disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed shrink-0"
                  style={{
                    height: "40px",
                    padding: "0 18px",
                    gap: "6px",
                    boxSizing: "border-box",
                  }}
                >
                  {isSubmitting ? (
                    <Spinner className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                  )}
                  <span>Add Subject</span>
                </button>
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
                      <tr>
                        <td
                          colSpan={3}
                          className="p-4 text-center text-muted-foreground"
                        >
                          No subjects defined yet.
                        </td>
                      </tr>
                    ) : (
                      subjects.map((s) => (
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
                              {isDeletingId === s._id ? (
                                <Spinner className="size-4 text-destructive" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
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
              <CardDescription>
                Select which subjects are taught in each grade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleAssignSubject}
                className="flex gap-4 items-end mb-6"
              >
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="gsGrade">Grade</Label>
                  <select
                    id="gsGrade"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newGradeSubject.gradeId}
                    onChange={(e) =>
                      setNewGradeSubject({
                        ...newGradeSubject,
                        gradeId: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select Grade
                    </option>
                    {grades.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="gsSubject">Subject</Label>
                  <select
                    id="gsSubject"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newGradeSubject.subjectId}
                    onChange={(e) =>
                      setNewGradeSubject({
                        ...newGradeSubject,
                        subjectId: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select Subject
                    </option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !grades.length ||
                    !subjects.length ||
                    !newGradeSubject.gradeId ||
                    !newGradeSubject.subjectId
                  }
                  className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-xs transition-colors h-10 w-full md:w-auto cursor-pointer disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed shrink-0"
                  style={{
                    height: "40px",
                    padding: "0 18px",
                    gap: "6px",
                    boxSizing: "border-box",
                  }}
                >
                  {isSubmitting ? (
                    <Spinner className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                  )}
                  <span>Assign Subject</span>
                </button>
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
                      <tr>
                        <td
                          colSpan={4}
                          className="p-4 text-center text-muted-foreground"
                        >
                          No subjects assigned yet.
                        </td>
                      </tr>
                    ) : (
                      gradeSubjects.map((gs) => (
                        <tr key={gs._id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">
                            {gs.gradeId?.name || "Unknown"}
                          </td>
                          <td className="px-4 py-3">
                            {gs.subjectId?.name || "Unknown"}
                          </td>
                          <td className="px-4 py-3">
                            {gs.subjectId?.code || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isDeletingId === gs._id}
                              onClick={() =>
                                handleRemoveSubjectFromGrade(gs._id)
                              }
                              className="text-destructive"
                            >
                              {isDeletingId === gs._id ? (
                                <Spinner className="size-4 text-destructive" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEACHER ASSIGNMENTS TAB */}
        <TabsContent value="teacher_assignments" className="space-y-4 mt-4">
          <TeacherAssignmentTab
            grades={grades}
            sections={sections}
            subjects={subjects}
            gradeSubjects={gradeSubjects}
            teachers={teachers}
            teacherAssignments={teacherAssignments}
            classTeachers={classTeachers}
            onRefresh={fetchData}
            loading={loading}
          />
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
