import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Calendar, Wand2, Users, AlertCircle, CheckCircle2 } from "lucide-react";
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
      <DialogContent
        style={{
          maxWidth: "620px",
          width: "92vw",
          padding: "24px",
          borderRadius: "12px",
          background: "#ffffff",
        }}
        aria-describedby="gen-monthly-desc"
      >
        <DialogHeader style={{ borderBottom: "1px solid #e4e4e7", paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#f4f4f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4f46e5",
              }}
            >
              <Wand2 size={20} />
            </div>
            <div>
              <DialogTitle style={{ fontSize: "16px", fontWeight: "700", color: "#09090b" }}>
                Generate Monthly Fee Vouchers
              </DialogTitle>
              <DialogDescription id="gen-monthly-desc" style={{ fontSize: "12px", color: "#71717a" }}>
                Automatically generate monthly fee slips in bulk for all students or specific grades.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "14px" }}>
          {/* Target Month & Grade Selection */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <Label htmlFor="gen-month" style={{ fontSize: "12px", fontWeight: "600" }}>
                Billing Month *
              </Label>
              <input
                id="gen-month"
                type="month"
                required
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d4d4d8",
                  fontSize: "13px",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <Label htmlFor="gen-grade" style={{ fontSize: "12px", fontWeight: "600" }}>
                Target {isSchool ? "Class / Grade" : "Program"} *
              </Label>
              <select
                id="gen-grade"
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d4d4d8",
                  fontSize: "13px",
                  background: "#ffffff",
                }}
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
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <Label htmlFor="gen-cat" style={{ fontSize: "12px", fontWeight: "600" }}>
                Fee Category *
              </Label>
              <input
                id="gen-cat"
                required
                value={feeCategory}
                onChange={(e) => setFeeCategory(e.target.value)}
                placeholder="e.g. Monthly Tuition Fee"
                style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d4d4d8",
                  fontSize: "13px",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <Label htmlFor="gen-amount" style={{ fontSize: "12px", fontWeight: "600" }}>
                Base Fee (PKR) *
              </Label>
              <input
                id="gen-amount"
                type="number"
                required
                min={0}
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(e.target.value)}
                placeholder="5000"
                style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d4d4d8",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>

          {/* Due Date & Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <Label htmlFor="gen-due" style={{ fontSize: "12px", fontWeight: "600" }}>
              Payment Due Date *
            </Label>
            <input
              id="gen-due"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #d4d4d8",
                fontSize: "13px",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Label htmlFor="gen-desc" style={{ fontSize: "12px", fontWeight: "600" }}>
                Description / Particulars (Prints on Challan)
              </Label>
              <span style={{ fontSize: "11px", color: "#71717a" }}>Includes class rate card if set</span>
            </div>
            <textarea
              id="gen-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Regular Monthly Tuition Fee, Computer Lab and Library dues."
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #d4d4d8",
                fontSize: "12px",
                resize: "vertical",
              }}
            />
          </div>

          {/* Live Batch Preview Box */}
          <div
            style={{
              background: "#fafafa",
              border: "1px solid #e4e4e7",
              borderRadius: "8px",
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={18} color="#4f46e5" />
              <div>
                <strong style={{ fontSize: "13px", color: "#09090b", display: "block" }}>
                  {preview.toCreate} Students to be Billed
                </strong>
                <span style={{ fontSize: "11px", color: "#71717a" }}>
                  Total enrolled: {preview.total} · Already billed for {month}: {preview.alreadyBilled}
                </span>
              </div>
            </div>
            {structures.length > 0 && (
              <span
                style={{
                  fontSize: "10px",
                  background: "#dbeafe",
                  color: "#1e40af",
                  padding: "3px 8px",
                  borderRadius: "999px",
                  fontWeight: "600",
                }}
              >
                {structures.length} Class Rates Active
              </span>
            )}
          </div>

          <DialogFooter style={{ borderTop: "1px solid #e4e4e7", paddingTop: "14px", marginTop: "6px" }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || preview.toCreate === 0}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Wand2 size={14} />
              {isSubmitting ? "Generating Vouchers..." : `Generate ${preview.toCreate} Vouchers`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
