import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Settings2, Plus, Trash2, Edit2, Sparkles, Building, CheckCircle2 } from "lucide-react";
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
import {
  fetchFeeStructures,
  saveFeeStructure,
  deleteFeeStructure,
  selectFeeStructures,
} from "@/store/Slices/feesSlice.js";
import { formatPKR } from "@/lib/currency";
import { useInstitution } from "@/context/InstitutionContext";

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

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

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
    setForm({
      gradeOrClass: "",
      tuitionFee: "",
      labFee: "",
      sportsFee: "",
      examFee: "",
      otherFee: "",
      lateFeeFine: "200",
      description: "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.gradeOrClass.trim()) {
      return toast.error("Please enter a class or grade name.");
    }

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

  const handlePopulateStandardSchool = async () => {
    const defaultSchoolGrades = [
      { gradeOrClass: "Playgroup", tuitionFee: 3500, labFee: 0, sportsFee: 300, examFee: 200, otherFee: 500, description: "Early childhood learning & activity dues" },
      { gradeOrClass: "Nursery", tuitionFee: 4000, labFee: 0, sportsFee: 300, examFee: 200, otherFee: 500, description: "Nursery tuition & development charges" },
      { gradeOrClass: "Prep", tuitionFee: 4500, labFee: 200, sportsFee: 300, examFee: 300, otherFee: 500, description: "Prep basic schooling & activity dues" },
      { gradeOrClass: "Grade 1", tuitionFee: 5000, labFee: 300, sportsFee: 300, examFee: 400, otherFee: 500, description: "Primary class regular monthly charges" },
      { gradeOrClass: "Grade 2", tuitionFee: 5200, labFee: 300, sportsFee: 300, examFee: 400, otherFee: 500, description: "Primary class regular monthly charges" },
      { gradeOrClass: "Grade 3", tuitionFee: 5500, labFee: 400, sportsFee: 400, examFee: 500, otherFee: 600, description: "Primary class regular monthly charges" },
      { gradeOrClass: "Grade 4", tuitionFee: 5800, labFee: 400, sportsFee: 400, examFee: 500, otherFee: 600, description: "Primary class regular monthly charges" },
      { gradeOrClass: "Grade 5", tuitionFee: 6200, labFee: 500, sportsFee: 500, examFee: 600, otherFee: 700, description: "Primary completion board preparation dues" },
      { gradeOrClass: "Grade 6", tuitionFee: 6800, labFee: 600, sportsFee: 500, examFee: 700, otherFee: 800, description: "Middle school science & academic charges" },
      { gradeOrClass: "Grade 7", tuitionFee: 7200, labFee: 600, sportsFee: 500, examFee: 700, otherFee: 800, description: "Middle school science & academic charges" },
      { gradeOrClass: "Grade 8", tuitionFee: 7800, labFee: 700, sportsFee: 500, examFee: 800, otherFee: 900, description: "Middle school board preparation charges" },
      { gradeOrClass: "Grade 9", tuitionFee: 8800, labFee: 1000, sportsFee: 600, examFee: 1000, otherFee: 1000, description: "Matric part-1 science lab & tuition dues" },
      { gradeOrClass: "Grade 10", tuitionFee: 9500, labFee: 1200, sportsFee: 600, examFee: 1200, otherFee: 1000, description: "Matriculation board exams & science lab dues" },
    ];

    try {
      for (const item of defaultSchoolGrades) {
        await dispatch(saveFeeStructure(item)).unwrap();
      }
      toast.success("Standard school fee structures populated!");
    } catch (err) {
      toast.error("Failed to populate standard rates.");
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
        style={{
          maxWidth: "850px",
          width: "95vw",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "24px",
          borderRadius: "12px",
          background: "#ffffff",
        }}
        aria-describedby="fee-struct-desc"
      >
        <DialogHeader style={{ borderBottom: "1px solid #e4e4e7", paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                  color: "#09090b",
                }}
              >
                <Settings2 size={20} />
              </div>
              <div>
                <DialogTitle style={{ fontSize: "16px", fontWeight: "700", color: "#09090b" }}>
                  School Fee Structure Setup
                </DialogTitle>
                <DialogDescription id="fee-struct-desc" style={{ fontSize: "12px", color: "#71717a" }}>
                  Configure standard monthly tuition and auxiliary rate cards per grade or class.
                </DialogDescription>
              </div>
            </div>

            {structures.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePopulateStandardSchool}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Sparkles size={14} color="#4f46e5" />
                Populate Standard School Rates
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* 1. Add / Edit Rate Form */}
        <form
          onSubmit={handleSave}
          style={{
            background: "#fafafa",
            border: "1px solid #e4e4e7",
            borderRadius: "8px",
            padding: "16px",
            marginTop: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "13px", color: "#09090b" }}>
              {editingId ? `Edit Fee Rate: ${form.gradeOrClass}` : "Add / Configure Class Fee Rate"}
            </strong>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#09090b" }}>
              Total Monthly Fee: <span style={{ color: "#4f46e5" }}>{formatPKR(calculatedTotal)}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Label htmlFor="fs-grade" style={{ fontSize: "11px", fontWeight: "600" }}>
                Class / Grade Name *
              </Label>
              <input
                id="fs-grade"
                required
                placeholder="e.g. Grade 1, Grade 10"
                value={form.gradeOrClass}
                onChange={(e) => handleChange("gradeOrClass", e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", border: "1px solid #d4d4d8", borderRadius: "5px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Label htmlFor="fs-tuition" style={{ fontSize: "11px", fontWeight: "600" }}>
                Tuition Fee (PKR)
              </Label>
              <input
                id="fs-tuition"
                type="number"
                min={0}
                placeholder="0"
                value={form.tuitionFee}
                onChange={(e) => handleChange("tuitionFee", e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", border: "1px solid #d4d4d8", borderRadius: "5px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Label htmlFor="fs-lab" style={{ fontSize: "11px", fontWeight: "600" }}>
                Lab / Computer (PKR)
              </Label>
              <input
                id="fs-lab"
                type="number"
                min={0}
                placeholder="0"
                value={form.labFee}
                onChange={(e) => handleChange("labFee", e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", border: "1px solid #d4d4d8", borderRadius: "5px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Label htmlFor="fs-sports" style={{ fontSize: "11px", fontWeight: "600" }}>
                Sports / Activities (PKR)
              </Label>
              <input
                id="fs-sports"
                type="number"
                min={0}
                placeholder="0"
                value={form.sportsFee}
                onChange={(e) => handleChange("sportsFee", e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", border: "1px solid #d4d4d8", borderRadius: "5px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Label htmlFor="fs-exam" style={{ fontSize: "11px", fontWeight: "600" }}>
                Exam Fee (PKR)
              </Label>
              <input
                id="fs-exam"
                type="number"
                min={0}
                placeholder="0"
                value={form.examFee}
                onChange={(e) => handleChange("examFee", e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", border: "1px solid #d4d4d8", borderRadius: "5px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Label htmlFor="fs-other" style={{ fontSize: "11px", fontWeight: "600" }}>
                Other / Utility (PKR)
              </Label>
              <input
                id="fs-other"
                type="number"
                min={0}
                placeholder="0"
                value={form.otherFee}
                onChange={(e) => handleChange("otherFee", e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", border: "1px solid #d4d4d8", borderRadius: "5px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Label htmlFor="fs-desc" style={{ fontSize: "11px", fontWeight: "600" }}>
                Description / Particulars Note
              </Label>
              <input
                id="fs-desc"
                placeholder="e.g. Regular monthly tuition & laboratory dues"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", border: "1px solid #d4d4d8", borderRadius: "5px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
            {editingId && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetForm}>
                Cancel Edit
              </Button>
            )}
            <Button type="submit" size="sm" disabled={isSaving}>
              {editingId ? "Update Rate Card" : "Save Class Fee"}
            </Button>
          </div>
        </form>

        {/* 2. Existing Rate Cards Table */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <strong style={{ fontSize: "13px", color: "#09090b" }}>
              Configured Class Fee Rates ({structures.length})
            </strong>
          </div>

          {structures.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", background: "#fafafa", borderRadius: "8px", border: "1px solid #e4e4e7", color: "#71717a", fontSize: "12px" }}>
              No fee structures configured yet. Click "Populate Standard School Rates" above or add a class manually.
            </div>
          ) : (
            <div style={{ border: "1px solid #e4e4e7", borderRadius: "8px", overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f4f4f5", borderBottom: "1px solid #e4e4e7", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px" }}>Class / Grade</th>
                    <th style={{ padding: "8px 12px" }}>Tuition</th>
                    <th style={{ padding: "8px 12px" }}>Lab</th>
                    <th style={{ padding: "8px 12px" }}>Sports</th>
                    <th style={{ padding: "8px 12px" }}>Exam/Other</th>
                    <th style={{ padding: "8px 12px" }}>Total Monthly</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {structures.map((s) => {
                    const total =
                      (s.tuitionFee || 0) +
                      (s.labFee || 0) +
                      (s.sportsFee || 0) +
                      (s.examFee || 0) +
                      (s.otherFee || 0);

                    return (
                      <tr key={s._id} style={{ borderBottom: "1px solid #f4f4f5" }}>
                        <td style={{ padding: "8px 12px", fontWeight: "600", color: "#09090b" }}>
                          {s.gradeOrClass}
                          {s.description && (
                            <div style={{ fontSize: "10px", color: "#71717a", fontWeight: "normal" }}>
                              {s.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "8px 12px" }}>{formatPKR(s.tuitionFee || 0)}</td>
                        <td style={{ padding: "8px 12px" }}>{formatPKR(s.labFee || 0)}</td>
                        <td style={{ padding: "8px 12px" }}>{formatPKR(s.sportsFee || 0)}</td>
                        <td style={{ padding: "8px 12px" }}>{formatPKR((s.examFee || 0) + (s.otherFee || 0))}</td>
                        <td style={{ padding: "8px 12px", fontWeight: "700", color: "#4f46e5" }}>
                          {formatPKR(total)}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(s)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#4f46e5",
                                padding: "4px",
                              }}
                              aria-label={`Edit ${s.gradeOrClass}`}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s._id, s.gradeOrClass)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#dc2626",
                                padding: "4px",
                              }}
                              aria-label={`Delete ${s.gradeOrClass}`}
                            >
                              <Trash2 size={14} />
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

        <DialogFooter style={{ borderTop: "1px solid #e4e4e7", paddingTop: "14px", marginTop: "16px" }}>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
