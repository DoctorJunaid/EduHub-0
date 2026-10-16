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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Award, Trophy, Save } from "lucide-react";
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
      <DialogContent className="max-w-2xl bg-white border border-neutral-200 text-neutral-900 rounded-xl p-6 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-sm shrink-0">
              {(student.name || "S").charAt(0).toUpperCase()}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2 m-0">
                {student.name}
                <span className="text-xs text-neutral-500 font-mono font-normal">
                  (Roll: {student.rollNo})
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 m-0 mt-0.5">
                {className} • {examName} ({term})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Summary KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[11px] text-neutral-500 font-medium block">Total Marks</span>
              <span className="text-sm font-bold text-neutral-900 font-mono mt-0.5 block">
                {student.obtainedMarks || 0} / {student.totalMarks || 0}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[11px] text-neutral-500 font-medium block">Percentage</span>
              <span className="text-sm font-bold text-neutral-900 font-mono mt-0.5 block">
                {student.percentage || 0}%
              </span>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[11px] text-neutral-500 font-medium block">Grade & GPA</span>
              <span className="text-sm font-bold text-neutral-900 mt-0.5 block">
                {student.overallGrade || "—"} ({student.gpa || 0})
              </span>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[11px] text-neutral-500 font-medium block">Class Rank</span>
              <span className="text-sm font-bold text-neutral-900 flex items-center justify-center gap-1 mt-0.5">
                <Trophy size={13} className="text-neutral-500" /> #{student.classRank || "—"}
              </span>
            </div>
          </div>

          {/* Subject Breakdown List */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-50/50 text-neutral-500 font-bold uppercase tracking-wider text-[10.5px] border-b border-neutral-200">
                <tr>
                  <th style={{ padding: "10px 14px" }}>Subject</th>
                  <th style={{ padding: "10px 14px" }} className="text-center">Marks</th>
                  <th style={{ padding: "10px 14px" }} className="text-center">Grade</th>
                  <th style={{ padding: "10px 14px" }}>Evaluator Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {student.subjects?.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/70 transition-colors">
                    <td style={{ padding: "10px 14px" }} className="font-semibold text-neutral-900">
                      {sub.subject}
                    </td>
                    <td style={{ padding: "10px 14px" }} className="text-center font-mono font-medium">
                      {sub.status === "Pending" ? (
                        <span className="text-neutral-400 font-medium">Pending</span>
                      ) : sub.status === "Absent" ? (
                        <span className="text-neutral-400">Absent</span>
                      ) : (
                        `${sub.marks} / ${sub.totalMarks}`
                      )}
                    </td>
                    <td style={{ padding: "10px 14px" }} className="text-center font-bold text-neutral-900">
                      {sub.grade || "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }} className="text-neutral-600">
                      {sub.teacher?.teacherName || "Subject Faculty"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Class Teacher Remarks Input */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-100">
            <Label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Award size={14} className="text-neutral-500" />
              Class Teacher Remarks (Will print on Report Card):
            </Label>
            <Textarea
              rows={3}
              placeholder="e.g. Excellent performance in Science and Mathematics. Consistent attendance and active participation in class activities."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 rounded-lg text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-neutral-100">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg text-xs shadow-xs flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <Spinner size="sm" /> Saving Remarks...
              </>
            ) : (
              <>
                <Save size={13} /> Save Remarks
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
