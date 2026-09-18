import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";

const EditProfileDialog = ({ profile, teachers = [], onClose, onSave }) => {
  const [formData, setFormData] = useState({
    teacherProfileId: "",
    baseSalary: 0,
    allowances: [],
    taxDeduction: 0,
    otherDeduction: 0,
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="salary-profile-dialog fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="salary-profile-dialog-shell w-full max-w-lg mx-4 rounded-2xl border border-gray-700/50 bg-gray-900/95 shadow-2xl"
        style={{
          animation: "slideDown 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div className="salary-profile-dialog-header flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
          <div><span>Finance / compensation</span><h2 className="text-xl font-semibold text-white">
            {profile ? "Edit Salary Profile" : "Add Salary Profile"}
          </h2><p>Keep recurring compensation details accurate for payroll.</p></div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="salary-profile-dialog-form p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Teacher ID (only for new profiles) */}
          {!profile && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Teacher</label>
              <select
                name="teacherProfileId"
                value={formData.teacherProfileId}
                onChange={handleChange}
                required
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              ><option value="">Select teacher</option>{teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name || teacher.user?.name || teacher.email || 'Teacher'}</option>)}</select>
            </div>
          )}

          {/* Base Salary */}
          <div className="salary-dialog-section">
            <label className="block text-sm font-medium text-gray-300 mb-1">Base Salary (PKR)</label>
            <input
              type="number"
              name="baseSalary"
              value={formData.baseSalary}
              onChange={handleChange}
              min="0"
              required
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Allowances */}
          <div className="salary-dialog-section">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Allowances</label>
              <button
                type="button"
                onClick={addAllowance}
                className="flex items-center text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </div>
            {formData.allowances.length === 0 && (
              <p className="text-sm text-gray-500 italic">No allowances added.</p>
            )}
            {formData.allowances.map((a, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={a.name}
                  onChange={(e) => handleAllowanceChange(i, "name", e.target.value)}
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={a.amount}
                  onChange={(e) => handleAllowanceChange(i, "amount", e.target.value)}
                  min="0"
                  className="w-32 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => removeAllowance(i)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Deductions */}
          <div className="salary-dialog-section grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tax Deduction (PKR)</label>
              <input
                type="number"
                name="taxDeduction"
                value={formData.taxDeduction}
                onChange={handleChange}
                min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Other Deduction (PKR)</label>
              <input
                type="number"
                name="otherDeduction"
                value={formData.otherDeduction}
                onChange={handleChange}
                min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="salary-profile-dialog-footer flex justify-end gap-3 pt-4 border-t border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default EditProfileDialog;
