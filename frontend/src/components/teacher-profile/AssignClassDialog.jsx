import React, { useState, useEffect } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getAcademicOptionsApi } from "@/api/teacherProfile.api";
import toast from "react-hot-toast";

export default function AssignClassDialog({
  open,
  onClose,
  onAssign,
  teacherName = "Teacher",
}) {
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    gradeId: "",
    sectionId: "",
    subjectId: "",
  });

  useEffect(() => {
    if (open) {
      setLoadingOptions(true);
      getAcademicOptionsApi()
        .then((data) => {
          setGrades(data.grades || []);
          setSections(data.sections || []);
          setSubjects(data.subjects || []);
        })
        .catch(() => {
          toast.error("Failed to load academic options");
        })
        .finally(() => setLoadingOptions(false));
    } else {
      setForm({ gradeId: "", sectionId: "", subjectId: "" });
    }
  }, [open]);

  const filteredSections = sections.filter(
    (s) => !form.gradeId || String(s.gradeId?._id || s.gradeId) === String(form.gradeId)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.gradeId || !form.sectionId || !form.subjectId) {
      toast.error("Please select a Grade, Section, and Subject");
      return;
    }

    setSubmitting(true);
    const success = await onAssign(form);
    setSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] bg-white text-zinc-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="w-5 h-5 text-zinc-700" />
            Assign Class & Subject
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Assign {teacherName} to teach a subject in a specific class section.
          </DialogDescription>
        </DialogHeader>

        {loadingOptions ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-zinc-500">
            <Spinner className="w-6 h-6 text-zinc-600" />
            <span>Loading academic configuration...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Grade/Class Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Grade / Class *</Label>
              <select
                className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                value={form.gradeId}
                onChange={(e) => setForm({ ...form, gradeId: e.target.value, sectionId: "" })}
                required
              >
                <option value="">Select Grade / Class</option>
                {grades.map((g) => (
                  <option key={g._id || g.id} value={g._id || g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Section *</Label>
              <select
                className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:opacity-50"
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                required
                disabled={!form.gradeId}
              >
                <option value="">{form.gradeId ? "Select Section" : "Select Grade first"}</option>
                {filteredSections.map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Subject *</Label>
              <select
                className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name} ({s.code || "Code"})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={submitting}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-black text-white hover:bg-neutral-800 text-xs h-9"
              >
                {submitting ? (
                  <Spinner className="mr-2 size-4" />
                ) : (
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                )}
                Assign Class
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
