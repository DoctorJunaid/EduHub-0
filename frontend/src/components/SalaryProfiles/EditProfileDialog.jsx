import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, User, DollarSign, Sparkles, ChevronDown, ShieldAlert } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const EditProfileDialog = ({ profile, teachers = [], onClose, onSave }) => {
  const [formData, setFormData] = useState({
    teacherProfileId: "",
    baseSalary: 0,
    allowances: [],
    taxDeduction: 0,
    otherDeduction: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        teacherProfileId: profile.teacherProfileId?._id || profile.teacherProfileId || "",
        baseSalary: profile.baseSalary || 0,
        allowances: profile.allowances || [],
        taxDeduction: profile.taxDeduction || 0,
        otherDeduction: profile.otherDeduction || 0,
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "teacherProfileId" ? value : Number(value),
    }));
  };

  const handleAllowanceChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.allowances];
      updated[index] = {
        ...updated[index],
        [field]: field === "amount" ? Number(value) : value,
      };
      return { ...prev, allowances: updated };
    });
  };

  const addAllowance = () => {
    setFormData((prev) => ({
      ...prev,
      allowances: [...prev.allowances, { name: "", amount: 0 }],
    }));
  };

  const removeAllowance = (index) => {
    setFormData((prev) => ({
      ...prev,
      allowances: prev.allowances.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="salary-profile-dialog fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="salary-profile-dialog-shell bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
          {/* Header */}
        <div className="salary-profile-dialog-header flex justify-between items-start px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 border border-blue-100/80 mb-1.5">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Finance / Compensation
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {profile ? "Edit Salary Profile" : "Add Salary Profile"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile 
                ? "Keep recurring compensation details accurate for payroll." 
                : "Create a new salary profile with base salary and allowances."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="salaryProfileForm" onSubmit={handleSubmit} className="salary-profile-dialog-form p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Teacher Selection (for new profiles) */}
          {!profile && (
            <div className="form-group">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Teacher <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="teacherProfileId"
                  value={formData.teacherProfileId}
                  onChange={handleChange}
                  required
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name || teacher.user?.name || teacher.email || 'Teacher'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Base Salary */}
          <div className="form-group">
            <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Base Salary (PKR) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="baseSalary"
              value={formData.baseSalary}
              onChange={handleChange}
              min="0"
              required
              placeholder="e.g. 50000"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Allowances */}
          <div className="form-group pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                Allowances
              </label>
              <button
                type="button"
                onClick={addAllowance}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Allowance
              </button>
            </div>
            
            {formData.allowances.length === 0 && (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                No extra allowances added.
              </p>
            )}

            <div className="space-y-2">
              {formData.allowances.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Allowance Name (e.g. Medical)"
                    value={a.name}
                    onChange={(e) => handleAllowanceChange(i, "name", e.target.value)}
                    className="flex-1 bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={a.amount}
                    onChange={(e) => handleAllowanceChange(i, "amount", e.target.value)}
                    min="0"
                    className="w-32 bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => removeAllowance(i)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shrink-0"
                    title="Remove allowance"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions */}
          <div className="form-group pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-800 mb-2">
              Deductions (PKR)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Tax Deduction</label>
                <input
                  type="number"
                  name="taxDeduction"
                  value={formData.taxDeduction}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Other Deduction</label>
                <input
                  type="number"
                  name="otherDeduction"
                  value={formData.otherDeduction}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

        </form>

        {/* Footer with Action Buttons */}
        <div className="salary-profile-dialog-footer px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 hover:border-slate-300 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer min-w-[85px]"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
            Cancel
          </button>
          <button
            type="submit"
            form="salaryProfileForm"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer min-w-[140px]"
          >
            {isSubmitting ? (
              <Spinner className="mr-2 size-4 text-white" />
            ) : profile ? (
              <Save className="w-3.5 h-3.5 text-white" />
            ) : (
              <Plus className="w-3.5 h-3.5 text-white" />
            )}
            <span>{profile ? "Save Profile" : "Add Salary Profile"}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditProfileDialog;

