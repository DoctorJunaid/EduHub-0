import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, GraduationCap, X, CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/api/axiosInstance";
import toast from "react-hot-toast";

export default function AssignTeacherClassesDialog({
  open,
  onClose,
  teacher,
  onAssignmentsUpdated,
}) {
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [gradeSubjects, setGradeSubjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    gradeId: "",
    sectionId: "",
    subjectId: "",
  });

  const teacherId = teacher?._id || teacher?.id || teacher?.userId;
  const teacherName = teacher?.name || "Teacher";

  const fetchAssignmentsAndOptions = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const [gRes, secRes, gsRes, subRes, asgRes] = await Promise.allSettled([
        axiosInstance.get("/academic/grades"),
        axiosInstance.get("/academic/sections"),
        axiosInstance.get("/academic/grade-subjects"),
        axiosInstance.get("/academic/subjects"),
        axiosInstance.get(`/academic/teacher-assignments?teacherId=${teacherId}`),
      ]);

      if (gRes.status === "fulfilled") setGrades(gRes.value.data?.data || gRes.value.data || []);
      if (secRes.status === "fulfilled") setSections(secRes.value.data?.data || secRes.value.data || []);
      if (gsRes.status === "fulfilled") setGradeSubjects(gsRes.value.data?.data || gsRes.value.data || []);
      if (subRes.status === "fulfilled") setSubjects(subRes.value.data?.data || subRes.value.data || []);
      if (asgRes.status === "fulfilled") setAssignments(asgRes.value.data?.data || asgRes.value.data || []);
    } catch (err) {
      toast.error("Failed to load academic records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && teacherId) {
      fetchAssignmentsAndOptions();
      setForm({ gradeId: "", sectionId: "", subjectId: "" });
    }
  }, [open, teacherId]);

  const handleGradeChange = (e) => {
    const gId = e.target.value;
    setForm({ gradeId: gId, sectionId: "", subjectId: "" });
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.gradeId || !form.sectionId || !form.subjectId) {
      toast.error("Please select a Grade, Section, and Subject");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axiosInstance.post("/academic/teacher-assignments", {
        teacherId,
        gradeId: form.gradeId,
        sectionId: form.sectionId,
        subjectId: form.subjectId,
      });

      toast.success("Teacher assigned to class & subject successfully!");
      setAssignments((prev) => [...prev, res.data]);
      setForm({ gradeId: "", sectionId: "", subjectId: "" });
      if (onAssignmentsUpdated) onAssignmentsUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign teacher");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (assignmentId) => {
    if (!window.confirm("Remove this class & subject assignment?")) return;
    try {
      setDeletingId(assignmentId);
      await axiosInstance.delete(`/academic/teacher-assignments/${assignmentId}`);
      toast.success("Assignment removed successfully");
      setAssignments((prev) => prev.filter((a) => a._id !== assignmentId));
      if (onAssignmentsUpdated) onAssignmentsUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove assignment");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter sections by selected grade
  const availableSections = sections.filter(
    (s) => String(s.gradeId?._id || s.gradeId) === String(form.gradeId)
  );

  // Filter subjects by selected grade
  const gradeSubs = gradeSubjects
    .filter((gs) => String(gs.gradeId?._id || gs.gradeId) === String(form.gradeId))
    .map((gs) => gs.subjectId)
    .filter(Boolean);
  const availableSubjects = gradeSubs.length > 0 ? gradeSubs : subjects;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] bg-white text-zinc-900 p-0 overflow-hidden rounded-2xl shadow-2xl border border-zinc-200">
        <DialogHeader className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <BookOpen className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Assign Classes &amp; Subjects
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-300 mt-0.5">
                Manage teaching curriculum, grades, and sections assigned to <strong className="text-white">{teacherName}</strong>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Add New Assignment Form */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
              <Plus className="size-3.5 text-indigo-600" /> Add New Teaching Assignment
            </h4>
            <form onSubmit={handleAssign} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-zinc-700">Grade / Class *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-xs ring-offset-background"
                    value={form.gradeId}
                    onChange={handleGradeChange}
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

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-zinc-700">Section *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-xs ring-offset-background disabled:opacity-50"
                    value={form.sectionId}
                    onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                    required
                    disabled={!form.gradeId}
                  >
                    <option value="" disabled>Select Section</option>
                    {availableSections.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-zinc-700">Subject *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-xs ring-offset-background disabled:opacity-50"
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    required
                    disabled={!form.gradeId}
                  >
                    <option value="" disabled>Select Subject</option>
                    {availableSubjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} {s.code ? `(${s.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !form.gradeId || !form.sectionId || !form.subjectId}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 rounded-lg shadow-xs"
                >
                  {submitting ? <Spinner className="size-3.5 mr-1.5" /> : <Plus className="size-3.5 mr-1.5" />}
                  Assign Subject
                </Button>
              </div>
            </form>
          </div>

          {/* 2. Current Teaching Assignments Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Current Assigned Classes ({assignments.length})
              </h4>
              {loading && <Spinner className="size-4 text-zinc-400" />}
            </div>

            <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5">Class / Grade</th>
                    <th className="px-3.5 py-2.5">Section</th>
                    <th className="px-3.5 py-2.5">Assigned Subject</th>
                    <th className="px-3.5 py-2.5 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading && assignments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-zinc-400">
                        <Spinner className="size-5 mx-auto mb-1.5 text-zinc-400" />
                        Loading teacher assignments...
                      </td>
                    </tr>
                  ) : assignments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-zinc-500">
                        No classes or subjects assigned yet to {teacherName}. Use the form above to assign teaching duties.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((a) => (
                      <tr key={a._id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="px-3.5 py-3 font-semibold text-zinc-900">
                          {a.gradeId?.name || "Class"}
                        </td>
                        <td className="px-3.5 py-3 text-zinc-700">
                          Section {a.sectionId?.name || "A"}
                        </td>
                        <td className="px-3.5 py-3 font-medium text-indigo-700">
                          {a.subjectId?.name || "Subject"}
                          {a.subjectId?.code && (
                            <span className="ml-1 text-[11px] text-zinc-500 font-normal">
                              ({a.subjectId.code})
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === a._id}
                            onClick={() => handleRemove(a._id)}
                            className="size-7 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50"
                            title="Remove assignment"
                          >
                            {deletingId === a._id ? (
                              <Spinner className="size-3 text-destructive" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 px-4 rounded-lg font-medium"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
