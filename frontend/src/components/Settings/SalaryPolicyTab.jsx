import React, { useState, useEffect } from "react";
import api from "../../api/axiosInstance";
import { toast } from "react-hot-toast";
import { Save } from "lucide-react";

const SalaryPolicyTab = () => {
  const [formData, setFormData] = useState({
    workingDaysPerMonth: 26,
    unpaidAbsentMultiplier: 1.0,
    unpaidLeaveMultiplier: 1.0,
    halfDayMultiplier: 0.5,
    lateCountForHalfDay: 3,
    lateHalfDayPenalty: 0.5,
    earlyLeaveMultiplier: 0.5,
    substituteBonusPerClass: 500,
    perfectAttendanceBonus: 2000,
    extraClassBonus: 400,
    examDutyBonus: 300,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await api.get("/campus/salary/policy");
      if (response.data.success) {
        setFormData(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load salary policy");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.put("/campus/salary/policy", formData);
      if (response.data.success) {
        toast.success("Salary policy saved successfully");
      }
    } catch (error) {
      toast.error("Failed to save salary policy");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Loading salary policy...</div>;

  return (
    <div className="space-y-8 animate-fadeIn">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Deduction Rules Section */}
        <div className="settings-card glass-panel p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">Deduction Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Working Days Per Month (Divisor)</label>
              <input
                type="number"
                name="workingDaysPerMonth"
                value={formData.workingDaysPerMonth}
                onChange={handleChange}
                min="1" max="31"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Unpaid Absent Multiplier</label>
              <input
                type="number"
                name="unpaidAbsentMultiplier"
                value={formData.unpaidAbsentMultiplier}
                onChange={handleChange}
                step="0.1" min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Unpaid Leave Multiplier</label>
              <input
                type="number"
                name="unpaidLeaveMultiplier"
                value={formData.unpaidLeaveMultiplier}
                onChange={handleChange}
                step="0.1" min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Half Day Multiplier</label>
              <input
                type="number"
                name="halfDayMultiplier"
                value={formData.halfDayMultiplier}
                onChange={handleChange}
                step="0.1" min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Late Count for Half Day</label>
              <input
                type="number"
                name="lateCountForHalfDay"
                value={formData.lateCountForHalfDay}
                onChange={handleChange}
                min="1"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Late Half Day Penalty</label>
              <input
                type="number"
                name="lateHalfDayPenalty"
                value={formData.lateHalfDayPenalty}
                onChange={handleChange}
                step="0.1" min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Early Leave Multiplier</label>
              <input
                type="number"
                name="earlyLeaveMultiplier"
                value={formData.earlyLeaveMultiplier}
                onChange={handleChange}
                step="0.1" min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Bonus Rates Section */}
        <div className="settings-card glass-panel p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">Bonus Rates (PKR)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Substitute Bonus Per Class</label>
              <input
                type="number"
                name="substituteBonusPerClass"
                value={formData.substituteBonusPerClass}
                onChange={handleChange}
                min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Perfect Attendance Bonus</label>
              <input
                type="number"
                name="perfectAttendanceBonus"
                value={formData.perfectAttendanceBonus}
                onChange={handleChange}
                min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Extra Class Bonus</label>
              <input
                type="number"
                name="extraClassBonus"
                value={formData.extraClassBonus}
                onChange={handleChange}
                min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Exam Duty Bonus</label>
              <input
                type="number"
                name="examDutyBonus"
                value={formData.examDutyBonus}
                onChange={handleChange}
                min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Saving..." : "Save Salary Policy"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalaryPolicyTab;
