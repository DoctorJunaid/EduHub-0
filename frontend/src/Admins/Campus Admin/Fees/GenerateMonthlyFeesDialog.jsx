import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Calendar, Users, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { Input } from "@/components/ui/Input";
import { generateMonthlyFees, fetchFees, selectFees, selectFeeStructures } from "@/store/Slices/feesSlice.js";
import { selectStudents } from "@/store/Slices/studentsSlice.js";
import { formatPKR } from "@/lib/currency";
import { useInstitution } from "@/context/InstitutionContext";

export default function GenerateMonthlyFeesDialog({ onClose, onGenerated }) {
  const dispatch = useDispatch();
  const { isSchool } = useInstitution();
  const students = useSelector(selectStudents) || [];
  const existingFees = useSelector(selectFees) || [];
  const structures = useSelector(selectFeeStructures) || [];

  const now = new Date();
  const defaultMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Default due date: 10th of next/current month
  const defaultDueDate = new Date(now.getFullYear(), now.getMonth(), 10) > now
    ? new Date(now.getFullYear(), now.getMonth(), 10).toISOString().split("T")[0]
    : new Date(now.getFullYear(), now.getMonth() + 1, 10).toISOString().split("T")[0];

  const [month, setMonth] = useState(defaultMonthStr);
  const [targetGrade, setTargetGrade] = useState("all");
  const [feeCategory, setFeeCategory] = useState("Monthly Tuition Fee");
  const [defaultAmount, setDefaultAmount] = useState(5000);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [description, setDescription] = useState(
    `Regular Monthly Tuition Fee and Academic Dues for ${defaultMonthStr}`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available grades/classes from students list
  const availableGrades = useMemo(() => {
    const grades = new Set();
    students.forEach((s) => {
      const g = s.gradeOrClass || s.program;
      if (g) grades.add(g.trim());
    });
    return Array.from(grades).sort();
  }, [students]);

  // Preview eligible and already billed counts
  const preview = useMemo(() => {
    const eligibleStudents = students.filter((s) => {
      if (targetGrade === "all") return true;
      const g = (s.gradeOrClass || s.program || "").trim().toLowerCase();
      return g === targetGrade.trim().toLowerCase();
    });

    const alreadyBilledSet = new Set(
      existingFees
        .filter((f) => f.month === month && (f.feeCategory || f.feeType) === feeCategory)
        .map((f) => String(f.studentId))
    );

    const toCreateCount = eligibleStudents.filter(
      (s) => !alreadyBilledSet.has(String(s.id || s._id))
    ).length;

    const alreadyBilledCount = eligibleStudents.length - toCreateCount;

    return {
      total: eligibleStudents.length,
      toCreate: toCreateCount,
      alreadyBilled: alreadyBilledCount,
    };
  }, [students, existingFees, targetGrade, month, feeCategory]);

  const handleMonthChange = (val) => {
    setMonth(val);
    setDescription(`Regular Monthly Tuition Fee and Academic Dues for ${val}`);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!month) return toast.error("Please select a valid month.");
    if (!dueDate) return toast.error("Please select a due date.");
    if (preview.toCreate === 0) {
      return toast.error("All eligible students have already been billed for this month.");
    }

    setIsSubmitting(true);
    try {
      const result = await dispatch(
        generateMonthlyFees({
          month,
          dueDate,
          feeCategory,
          description,
          gradeOrClass: targetGrade,
          defaultAmount: Number(defaultAmount) || 5000,
        })
      ).unwrap();

      toast.success(
        `Generated ${result.generatedCount} monthly fee vouchers! (${result.skippedCount} already billed)`
      );
      dispatch(fetchFees());
      if (onGenerated) onGenerated();
      onClose();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to generate monthly fees.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] w-[95vw]" aria-describedby="gen-monthly-desc">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-border">
          <div className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <Calendar className="size-5 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-foreground leading-tight">
              Generate Monthly Fee Vouchers
            </DialogTitle>
            <DialogDescription id="gen-monthly-desc" className="text-xs text-muted-foreground mt-0.5">
              Automatically generate monthly fee slips in bulk for all students or specific grades.
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col gap-4 px-6 pt-5 pb-6">
          {/* Target Month & Grade Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gen-month" className="text-xs font-semibold text-foreground">
                Billing Month *
              </Label>
              <Input
                id="gen-month"
                type="month"
                required
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gen-grade" className="text-xs font-semibold text-foreground">
                Target {isSchool ? "Class / Grade" : "Program"} *
              </Label>
              <select
                id="gen-grade"
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="all">All {isSchool ? "School Classes" : "Enrolled Programs"}</option>
                {availableGrades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fee Category & Fallback Amount */}
          <div className="grid grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gen-cat" className="text-xs font-semibold text-foreground">
                Fee Category *
              </Label>
              <Input
                id="gen-cat"
                required
                value={feeCategory}
                onChange={(e) => setFeeCategory(e.target.value)}
                placeholder="e.g. Monthly Tuition Fee"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gen-amount" className="text-xs font-semibold text-foreground">
                Base Fee (PKR) *
              </Label>
              <Input
                id="gen-amount"
                type="number"
                required
                min={0}
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(e.target.value)}
                placeholder="5000"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="gen-due" className="text-xs font-semibold text-foreground">
              Payment Due Date *
            </Label>
            <Input
              id="gen-due"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="gen-desc" className="text-xs font-semibold text-foreground">
                Description / Particulars (Prints on Challan)
              </Label>
              <span className="text-[11px] text-muted-foreground">Includes class rate card if set</span>
            </div>
            <textarea
              id="gen-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Regular Monthly Tuition Fee, Computer Lab and Library dues."
              className="w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            />
          </div>

          {/* Live Batch Preview Box */}
          <div className="bg-zinc-50 border border-border rounded-xl p-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-zinc-600" />
              <div>
                <strong className="text-sm font-semibold text-foreground block">
                  {preview.toCreate} Students to be Billed
                </strong>
                <span className="text-xs text-muted-foreground">
                  Total enrolled: {preview.total} &middot; Already billed for {month}: {preview.alreadyBilled}
                </span>
              </div>
            </div>
            {structures.length > 0 && (
              <span className="text-[10px] bg-zinc-900 text-white px-2.5 py-1 rounded-full font-semibold">
                {structures.length} Class Rates Active
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || preview.toCreate === 0}
            >
              {isSubmitting ? "Generating Vouchers..." : `Generate ${preview.toCreate} Vouchers`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
