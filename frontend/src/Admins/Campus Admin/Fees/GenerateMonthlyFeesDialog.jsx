import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Calendar, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import {
  generateMonthlyFees,
  fetchFees,
  selectFees,
  selectFeeStructures,
} from "@/store/Slices/feesSlice.js";
import { selectStudents } from "@/store/Slices/studentsSlice.js";
import { useInstitution } from "@/context/InstitutionContext";

export default function GenerateMonthlyFeesDialog({ onClose, onGenerated }) {
  const dispatch = useDispatch();
  const { isSchool } = useInstitution();
  const students = useSelector(selectStudents) || [];
  const existingFees = useSelector(selectFees) || [];
  const structures = useSelector(selectFeeStructures) || [];

  const now = new Date();
  const defaultMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const defaultDueDate =
    new Date(now.getFullYear(), now.getMonth(), 10) > now
      ? new Date(now.getFullYear(), now.getMonth(), 10)
          .toISOString()
          .split("T")[0]
      : new Date(now.getFullYear(), now.getMonth() + 1, 10)
          .toISOString()
          .split("T")[0];

  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const followingMonthDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  const followingMonthStr = `${followingMonthDate.getFullYear()}-${String(followingMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const [month, setMonth] = useState(defaultMonthStr);
  const [targetGrade, setTargetGrade] = useState("all");
  const [feeCategory, setFeeCategory] = useState("Monthly Tuition Fee");
  const [defaultAmount, setDefaultAmount] = useState(5000);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [includeArrears, setIncludeArrears] = useState(true);
  const [description, setDescription] = useState(
    `Regular Monthly Tuition Fee and Academic Dues for ${defaultMonthStr}`,
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
        .filter(
          (f) =>
            f.month === month && (f.feeCategory || f.feeType) === feeCategory,
        )
        .map((f) => String(f.studentId)),
    );

    const toCreateCount = eligibleStudents.filter(
      (s) => !alreadyBilledSet.has(String(s.id || s._id)),
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
    // Auto-update due date to 10th of chosen month
    if (val && val.includes("-")) {
      const [y, m] = val.split("-");
      setDueDate(`${y}-${m}-10`);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!month) return toast.error("Please select a valid month.");
    if (!dueDate) return toast.error("Please select a due date.");
    if (preview.toCreate === 0) {
      return toast.error(
        "All eligible students have already been billed for this month. Switch to next month.",
      );
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
          includeArrears,
        }),
      ).unwrap();

      toast.success(
        `Generated ${result.generatedCount} monthly fee vouchers! (${result.skippedCount} already billed)`,
      );
      dispatch(fetchFees());
      if (onGenerated) onGenerated();
      onClose();
    } catch (err) {
      toast.error(
        typeof err === "string" ? err : "Failed to generate monthly fees.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col rounded-2xl border border-zinc-200 shadow-2xl bg-white"
        style={{
          width: "calc(100vw - 2rem)",
          maxWidth: "720px",
          padding: 0,
          gap: 0,
        }}
        showCloseButton={false}
        aria-describedby="gen-monthly-desc"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-zinc-200 bg-white flex-shrink-0"
          style={{ padding: "24px clamp(20px, 4vw, 32px)", gap: "16px" }}
        >
          <div className="flex items-center min-w-0" style={{ gap: "14px" }}>
            <div className="size-11 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
              <Calendar className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900 leading-tight">
                Generate Monthly Fee Vouchers
              </DialogTitle>
              <DialogDescription
                id="gen-monthly-desc"
                className="text-xs text-zinc-500"
                style={{ marginTop: "4px" }}
              >
                Automatically issue bulk monthly challans with rate card
                matching.
              </DialogDescription>
            </div>
          </div>
          <Button
            type="button"
            onClick={onClose}
            aria-label="Close monthly voucher dialog"
            variant="ghost"
            size="icon-sm"
            className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            style={{ width: "32px", height: "32px", flexShrink: 0 }}
          >
            <span className="text-xl leading-none">&times;</span>
          </Button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleGenerate}
          className="flex flex-col flex-1 min-h-0 overflow-hidden m-0"
        >
          <div
            className="overflow-y-auto flex-1 min-h-0 flex flex-col"
            style={{ padding: "24px clamp(20px, 4vw, 32px)", gap: "24px" }}
          >
            {/* Quick Month Selectors */}
            <div
              className="flex flex-wrap items-center"
              style={{ gap: "8px", paddingBottom: "4px" }}
            >
              <span className="text-[11px] font-medium text-zinc-500">
                Quick Month:
              </span>
              <button
                type="button"
                onClick={() => handleMonthChange(defaultMonthStr)}
                className={`rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                  month === defaultMonthStr
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                }`}
                style={{ padding: "4px 10px" }}
              >
                Current ({defaultMonthStr})
              </button>
              <button
                type="button"
                onClick={() => handleMonthChange(nextMonthStr)}
                className={`rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                  month === nextMonthStr
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                }`}
                style={{ padding: "4px 10px" }}
              >
                Next ({nextMonthStr})
              </button>
              <button
                type="button"
                onClick={() => handleMonthChange(followingMonthStr)}
                className={`rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                  month === followingMonthStr
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                }`}
                style={{ padding: "4px 10px" }}
              >
                {followingMonthStr}
              </button>
            </div>

            {/* Target Month & Grade Selection */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2"
              style={{ columnGap: "24px", rowGap: "24px" }}
            >
              <div className="flex flex-col" style={{ gap: "8px" }}>
                <Label
                  htmlFor="gen-month"
                  className="text-xs font-semibold text-zinc-700"
                >
                  Billing Month *
                </Label>
                <Input
                  id="gen-month"
                  type="month"
                  required
                  value={month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="text-sm rounded-lg"
                  style={{ height: "42px", padding: "0 14px" }}
                />
              </div>

              <div className="flex flex-col" style={{ gap: "8px" }}>
                <Label
                  htmlFor="gen-grade"
                  className="text-xs font-semibold text-zinc-700"
                >
                  Target {isSchool ? "Class / Grade" : "Program"} *
                </Label>
                <select
                  id="gen-grade"
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 shadow-2xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                  style={{ height: "42px", padding: "0 14px" }}
                >
                  <option value="all">
                    All {isSchool ? "School Classes" : "Enrolled Programs"}
                  </option>
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fee Category & Fallback Amount */}
            <div
              className="grid grid-cols-1 sm:grid-cols-[1.2fr_0.8fr]"
              style={{ columnGap: "24px", rowGap: "24px" }}
            >
              <div className="flex flex-col" style={{ gap: "8px" }}>
                <Label
                  htmlFor="gen-cat"
                  className="text-xs font-semibold text-zinc-700"
                >
                  Fee Category / Title *
                </Label>
                <Input
                  id="gen-cat"
                  required
                  value={feeCategory}
                  onChange={(e) => setFeeCategory(e.target.value)}
                  placeholder="e.g. Monthly Tuition Fee"
                  className="text-sm rounded-lg"
                  style={{ height: "42px", padding: "0 14px" }}
                />
              </div>

              <div className="flex flex-col" style={{ gap: "8px" }}>
                <Label
                  htmlFor="gen-amount"
                  className="text-xs font-semibold text-zinc-700"
                >
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
                  className="text-sm rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ height: "42px", padding: "0 14px" }}
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <Label
                htmlFor="gen-due"
                className="text-xs font-semibold text-zinc-700"
              >
                Payment Due Date *
              </Label>
              <Input
                id="gen-due"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-sm rounded-lg"
                style={{ height: "42px", padding: "0 14px" }}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <div
                className="flex flex-wrap justify-between items-center"
                style={{ gap: "8px" }}
              >
                <Label
                  htmlFor="gen-desc"
                  className="text-xs font-semibold text-zinc-700"
                >
                  Description / Particulars (Prints on Challan)
                </Label>
                <span className="text-[10px] text-zinc-400">
                  Class rate card auto-applied
                </span>
              </div>
              <textarea
                id="gen-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Regular Monthly Tuition Fee, Computer Lab and Library dues."
                className="w-full rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 shadow-2xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-y"
                style={{ minHeight: "88px", padding: "10px 14px" }}
              />
            </div>

            {/* Carry Forward Unpaid Arrears Toggle */}
            <div
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70"
              style={{ padding: "16px", gap: "16px" }}
            >
              <div className="flex flex-col min-w-0" style={{ gap: "4px" }}>
                <span className="text-xs font-semibold text-zinc-900 block">
                  Carry Forward Unpaid Arrears
                </span>
                <p className="text-xs text-zinc-500">
                  Automatically add previously unpaid fee balances into this
                  voucher's total payable
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={includeArrears}
                onClick={() => setIncludeArrears(!includeArrears)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeArrears ? "bg-zinc-900" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-[2px] ml-[2px] ${
                    includeArrears ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Live Batch Preview Box */}
            <div
              className={`border rounded-xl flex flex-col transition-colors ${
                preview.toCreate === 0
                  ? "bg-amber-50/80 border-amber-200"
                  : "bg-zinc-100/70 border-zinc-200"
              }`}
              style={{ padding: "14px", gap: "10px" }}
            >
              <div
                className="flex flex-wrap justify-between items-center"
                style={{ gap: "12px" }}
              >
                <div className="flex items-center" style={{ gap: "12px" }}>
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center ${
                      preview.toCreate === 0
                        ? "bg-amber-200 text-amber-900"
                        : "bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    <Users className="size-4" />
                  </div>
                  <div>
                    <strong className="text-xs font-semibold text-zinc-900 block">
                      {preview.toCreate} Students to be Billed
                    </strong>
                    <span className="text-[11px] text-zinc-500">
                      Total enrolled: {preview.total} &middot; Already billed
                      for {month}: {preview.alreadyBilled}
                    </span>
                  </div>
                </div>
                {structures.length > 0 && (
                  <span
                    className="text-[10px] bg-zinc-900 text-white rounded-full font-semibold"
                    style={{ padding: "4px 10px" }}
                  >
                    {structures.length} Rates Active
                  </span>
                )}
              </div>

              {preview.toCreate === 0 && (
                <div
                  className="flex flex-wrap items-center justify-between border-t border-amber-200 text-xs"
                  style={{ paddingTop: "10px", gap: "10px" }}
                >
                  <span className="text-amber-800 text-[11px] font-medium">
                    All students are billed for <strong>{month}</strong>. Switch
                    to next month to issue upcoming vouchers.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMonthChange(nextMonthStr)}
                    className="inline-flex items-center rounded-md bg-amber-900 text-white hover:bg-amber-800 text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer flex-shrink-0"
                    style={{ padding: "5px 12px", gap: "4px" }}
                  >
                    Switch to {nextMonthStr} &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div
            className="border-t border-zinc-200 bg-white flex items-center justify-end flex-shrink-0"
            style={{ padding: "20px clamp(20px, 4vw, 32px)", gap: "12px" }}
          >
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              variant="outline"
              className="text-sm font-semibold"
              style={{ height: "44px", padding: "0 20px" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || preview.toCreate === 0}
              className="text-sm font-semibold"
              style={{ height: "44px", padding: "0 24px" }}
            >
              {isSubmitting
                ? "Generating Vouchers..."
                : `Generate ${preview.toCreate} Vouchers`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
