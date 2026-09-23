import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Plus, Trash2, Edit2, LayoutGrid, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/Input";
import {
  fetchFeeStructures,
  saveFeeStructure,
  deleteFeeStructure,
  selectFeeStructures,
} from "@/store/Slices/feesSlice.js";
import { formatPKR } from "@/lib/currency";
import { useInstitution } from "@/context/InstitutionContext";

/* ─── reusable field wrapper ─── */
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-zinc-700 tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </div>
  );
}

/* ─── number input without spin arrows ─── */
function NumInput({ id, placeholder = "0", value, onChange }) {
  return (
    <Input
      id={id}
      type="number"
      min={0}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}

export default function FeeStructureDialog({ onClose }) {
  const dispatch = useDispatch();
  const { isSchool } = useInstitution();
  const structures = useSelector(selectFeeStructures) || [];

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    gradeOrClass: "",
    tuitionFee: "",
    labFee: "",
    sportsFee: "",
    examFee: "",
    otherFee: "",
    lateFeeFine: "200",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchFeeStructures());
  }, [dispatch]);

  const handleChange = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleEdit = (s) => {
    setEditingId(s._id);
    setForm({
      gradeOrClass: s.gradeOrClass || "",
      tuitionFee: s.tuitionFee ?? "",
      labFee: s.labFee ?? "",
      sportsFee: s.sportsFee ?? "",
      examFee: s.examFee ?? "",
      otherFee: s.otherFee ?? "",
      lateFeeFine: s.lateFeeFine ?? "200",
      description: s.description || "",
    });
  };

  const handleResetForm = () => {
    setEditingId(null);
    setForm({ gradeOrClass: "", tuitionFee: "", labFee: "", sportsFee: "", examFee: "", otherFee: "", lateFeeFine: "200", description: "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.gradeOrClass.trim()) return toast.error("Please enter a class or grade name.");

    setIsSaving(true);
    try {
      await dispatch(
        saveFeeStructure({
          ...form,
          tuitionFee: Number(form.tuitionFee) || 0,
          labFee: Number(form.labFee) || 0,
          sportsFee: Number(form.sportsFee) || 0,
          examFee: Number(form.examFee) || 0,
          otherFee: Number(form.otherFee) || 0,
          lateFeeFine: Number(form.lateFeeFine) || 0,
        })
      ).unwrap();
      toast.success(`Fee structure for ${form.gradeOrClass} saved!`);
      handleResetForm();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to save fee structure.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, grade) => {
    if (window.confirm(`Delete fee structure for ${grade}?`)) {
      try {
        await dispatch(deleteFeeStructure(id)).unwrap();
        toast.success(`Fee structure for ${grade} removed.`);
        if (editingId === id) handleResetForm();
      } catch (err) {
        toast.error("Failed to delete fee structure.");
      }
    }
  };

  const calculatedTotal =
    (Number(form.tuitionFee) || 0) +
    (Number(form.labFee) || 0) +
    (Number(form.sportsFee) || 0) +
    (Number(form.examFee) || 0) +
    (Number(form.otherFee) || 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[880px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0"
        aria-describedby="fee-struct-desc"
      >

        {/* ── HEADER ── */}
        <div className="flex items-center gap-4 px-8 pt-7 pb-6 border-b border-zinc-200 flex-shrink-0">
          <div className="size-11 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <LayoutGrid className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-[17px] font-semibold text-zinc-900 leading-tight">
              School Fee Structure Setup
            </DialogTitle>
            <DialogDescription id="fee-struct-desc" className="text-sm text-zinc-500 mt-0.5">
              Configure standard monthly tuition and auxiliary rate cards per grade or class.
            </DialogDescription>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="overflow-y-auto flex-1 px-8 py-7 space-y-7">

          {/* Add / Edit form */}
          <form onSubmit={handleSave}>
            {/* Section header row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                  {editingId ? "Edit Rate Card" : "Add Rate Card"}
                </span>
                {editingId && (
                  <span className="text-xs font-semibold text-zinc-900 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-full">
                    {form.gradeOrClass}
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-500">
                Total Monthly: <strong className="text-zinc-900 font-bold">{formatPKR(calculatedTotal)}</strong>
              </span>
            </div>

            {/* Input grid — row 1 */}
            <div className="grid grid-cols-4 gap-5 mb-5">
              <Field label="Class / Grade Name" required>
                <Input
                  id="fs-grade"
                  required
                  placeholder="e.g. Grade 1"
                  value={form.gradeOrClass}
                  onChange={(e) => handleChange("gradeOrClass", e.target.value)}
                />
              </Field>
              <Field label="Tuition Fee (PKR)">
                <NumInput id="fs-tuition" value={form.tuitionFee} onChange={(e) => handleChange("tuitionFee", e.target.value)} />
              </Field>
              <Field label="Lab / Computer (PKR)">
                <NumInput id="fs-lab" value={form.labFee} onChange={(e) => handleChange("labFee", e.target.value)} />
              </Field>
              <Field label="Sports / Activities (PKR)">
                <NumInput id="fs-sports" value={form.sportsFee} onChange={(e) => handleChange("sportsFee", e.target.value)} />
              </Field>
            </div>

            {/* Input grid — row 2 */}
            <div className="grid grid-cols-4 gap-5 mb-6">
              <Field label="Exam Fee (PKR)">
                <NumInput id="fs-exam" value={form.examFee} onChange={(e) => handleChange("examFee", e.target.value)} />
              </Field>
              <Field label="Other / Utility (PKR)">
                <NumInput id="fs-other" value={form.otherFee} onChange={(e) => handleChange("otherFee", e.target.value)} />
              </Field>
              <div className="col-span-2">
                <Field label="Description / Particulars">
                  <Input
                    id="fs-desc"
                    placeholder="e.g. Regular monthly tuition & laboratory dues"
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                {editingId ? "Updating existing rate card" : "New rate card will be added to the list below"}
              </p>
              <div className="flex items-center gap-3">
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleResetForm}>
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" disabled={isSaving} className="gap-2 px-6">
                  <Check className="size-4" />
                  {isSaving ? "Saving..." : editingId ? "Update Rate Card" : "Save Class Fee"}
                </Button>
              </div>
            </div>
          </form>

          {/* Divider */}
          <div className="border-t border-zinc-100" />

          {/* ── Configured Rates Table ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                Configured Class Fee Rates ({structures.length})
              </span>
            </div>

            {structures.length === 0 ? (
              <div className="border border-dashed border-zinc-200 rounded-xl py-12 text-center">
                <p className="text-sm font-medium text-zinc-500">No fee structures configured yet.</p>
                <p className="text-xs text-zinc-400 mt-1">Add a class using the form above.</p>
              </div>
            ) : (
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-4 py-3 font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Class / Grade</th>
                      <th className="text-right px-4 py-3 font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Tuition</th>
                      <th className="text-right px-4 py-3 font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Lab</th>
                      <th className="text-right px-4 py-3 font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Sports</th>
                      <th className="text-right px-4 py-3 font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Exam+Other</th>
                      <th className="text-right px-4 py-3 font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Total / Month</th>
                      <th className="text-right px-4 py-3 font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structures.map((s) => {
                      const total = (s.tuitionFee || 0) + (s.labFee || 0) + (s.sportsFee || 0) + (s.examFee || 0) + (s.otherFee || 0);
                      return (
                        <tr
                          key={s._id}
                          className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors ${editingId === s._id ? "bg-zinc-50" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-semibold text-zinc-900 text-[13px]">{s.gradeOrClass}</span>
                            {s.description && (
                              <div className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[160px]">{s.description}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-600">{formatPKR(s.tuitionFee || 0)}</td>
                          <td className="px-4 py-3 text-right text-zinc-600">{formatPKR(s.labFee || 0)}</td>
                          <td className="px-4 py-3 text-right text-zinc-600">{formatPKR(s.sportsFee || 0)}</td>
                          <td className="px-4 py-3 text-right text-zinc-600">{formatPKR((s.examFee || 0) + (s.otherFee || 0))}</td>
                          <td className="px-4 py-3 text-right font-bold text-zinc-900 text-[13px]">{formatPKR(total)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEdit(s)}
                                className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                                aria-label={`Edit ${s.gradeOrClass}`}
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(s._id, s.gradeOrClass)}
                                className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                aria-label={`Delete ${s.gradeOrClass}`}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── STICKY FOOTER ── */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-zinc-200 bg-zinc-50/60 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="px-6">
            Close
          </Button>
          <Button type="button" onClick={onClose} className="px-6">
            Done
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
