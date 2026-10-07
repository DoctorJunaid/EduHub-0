import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Award, Trophy, User, Calendar, Check, Save } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";

export default function StudentResultDetailModal({
  isOpen,
  onClose,
  student,
  examName,
  term,
  className,
  onSaveRemarks,
}) {
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setRemarks(student.classTeacherRemarks || "");
    }
  }, [student]);

  if (!student) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSaveRemarks) {
        await onSaveRemarks(remarks);
      }
      toast.success("Class teacher remarks updated");
      onClose();
    } catch (err) {
      toast.error("Failed to save remarks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-lg">
              {(student.name || "S").charAt(0).toUpperCase()}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                {student.name}
                <span className="text-xs text-indigo-300 font-mono font-normal">
                  (Roll: {student.rollNo})
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {className} • {examName} ({term})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Summary KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Total Marks</span>
              <span className="text-base font-bold text-white font-mono">
                {student.obtainedMarks || 0} / {student.totalMarks || 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Percentage</span>
              <span className="text-base font-bold text-indigo-300 font-mono">
                {student.percentage || 0}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Grade & GPA</span>
              <span className="text-base font-bold text-emerald-400">
                {student.overallGrade || "—"} ({student.gpa || 0})
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Class Rank</span>
              <span className="text-base font-bold text-amber-400 flex items-center justify-center gap-1">
                <Trophy size={14} /> #{student.classRank || "—"}
              </span>
            </div>
          </div>

          {/* Subject Breakdown List */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Subject</th>
                  <th className="px-4 py-2.5 text-center">Marks</th>
                  <th className="px-4 py-2.5 text-center">Grade</th>
                  <th className="px-4 py-2.5">Evaluator Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {student.subjects?.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-medium text-white">
                      {sub.subject}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono">
                      {sub.status === "Pending" ? (
                        <span className="text-rose-400 font-bold">Pending</span>
                      ) : sub.status === "Absent" ? (
                        <span className="text-slate-400">Absent</span>
                      ) : (
                        `${sub.marks} / ${sub.totalMarks}`
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-indigo-300">
                      {sub.grade || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {sub.teacher?.teacherName || "Subject Faculty"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Class Teacher Remarks Input */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Award size={14} className="text-indigo-400" />
              Class Teacher Remarks (Will print on Report Card):
            </Label>
            <Textarea
              rows={3}
              placeholder="e.g. Excellent performance in Science and Mathematics. Consistent attendance and active participation in class activities."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-800">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <Spinner size="sm" /> Saving Remarks...
              </>
            ) : (
              <>
                <Save size={14} /> Save Remarks
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
