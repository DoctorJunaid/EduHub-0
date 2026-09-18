import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "../../store/Slices/authSlice";
import api from "../../api/axiosInstance";
import { toast } from "react-hot-toast";
import { Lock, Edit2, RotateCcw, Save } from "lucide-react";

const GeneralSettingsTab = () => {
  const { user } = useSelector(selectAuth);
  const [settings, setSettings] = useState(null);
  const [inheritance, setInheritance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    periodsPerDay: 6,
    periodDurationMinutes: 45,
    workingDaysPerWeek: 6,
    workingDaysPerMonth: 26,
    maxSubstitutesPerDayPerTeacher: 4,
    maxSubstitutesPerWeekPerTeacher: 15,
    substituteLoadWarningThreshold: 3,
    allowSameSubstituteForWholeDay: true,
    requireApprovalForSubstitute: false,
    lateGraceMinutes: 10,
    earlyLeaveGraceMinutes: 15,
    substituteBonusPerClass: 0,
  });

  const isCampusManager = user?.role === "campus_admin" || user?.role === "campus_manager";
  const isInstituteAdmin = user?.role === "institute_admin" || user?.role === "super_admin";

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      let response;
      if (isCampusManager) {
        response = await api.get("/settings/campus/me/effective");
        if (response.data.success) {
          setSettings(response.data.data.effectiveSettings);
          setInheritance(response.data.data.inheritance);
          setFormData(response.data.data.effectiveSettings);
        }
      } else if (isInstituteAdmin) {
        response = await api.get("/settings/institute/me");
        if (response.data.success) {
          setSettings(response.data.data);
          setFormData(response.data.data);
        }
      }
    } catch (error) {
      toast.error("Failed to load settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      let response;
      if (isCampusManager) {
        response = await api.put("/settings/campus/me", formData);
      } else if (isInstituteAdmin) {
        response = await api.put("/settings/institute/me", formData);
      }
      if (response.data.success) {
        toast.success("Settings saved successfully");
        fetchSettings();
      }
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset to institute defaults?")) return;
    try {
      setSaving(true);
      const response = await api.post("/settings/campus/me/reset");
      if (response.data.success) {
        toast.success("Settings reset to defaults");
        fetchSettings();
      }
    } catch (error) {
      toast.error("Failed to reset settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const renderInheritanceIcon = (field) => {
    if (!isCampusManager) return null;
    const source = inheritance[field];
    if (source === "campus") return <Edit2 className="text-blue-400 w-4 h-4 ml-2" title="Overridden by Campus" />;
    if (source === "institute") return <Lock className="text-gray-400 w-4 h-4 ml-2" title="Inherited from Institute" />;
    return <Lock className="text-gray-400 w-4 h-4 ml-2" title="Default Setting" />;
  };

  if (loading) return <div className="p-8 text-center text-white">Loading settings...</div>;

  return (
    <div className="space-y-8 animate-fadeIn">
      {isCampusManager && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleReset}
            className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
            disabled={saving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Defaults
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Schedule Section */}
        <div className="settings-card glass-panel p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">Schedule & Timings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                Periods Per Day
                {renderInheritanceIcon("periodsPerDay")}
              </label>
              <input
                type="number"
                name="periodsPerDay"
                value={formData.periodsPerDay}
                onChange={handleChange}
                min="1" max="12"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                Period Duration (Minutes)
                {renderInheritanceIcon("periodDurationMinutes")}
              </label>
              <input
                type="number"
                name="periodDurationMinutes"
                value={formData.periodDurationMinutes}
                onChange={handleChange}
                min="20" max="90"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                Working Days Per Week
                {renderInheritanceIcon("workingDaysPerWeek")}
              </label>
              <input
                type="number"
                name="workingDaysPerWeek"
                value={formData.workingDaysPerWeek}
                onChange={handleChange}
                min="1" max="7"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                Late Grace Time (Minutes)
                {renderInheritanceIcon("lateGraceMinutes")}
              </label>
              <input
                type="number"
                name="lateGraceMinutes"
                value={formData.lateGraceMinutes}
                onChange={handleChange}
                min="0" max="60"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Substitute Load Limits */}
        <div className="settings-card glass-panel p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">Substitute Load Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                Max Substitutes / Day / Teacher
                {renderInheritanceIcon("maxSubstitutesPerDayPerTeacher")}
              </label>
              <input
                type="number"
                name="maxSubstitutesPerDayPerTeacher"
                value={formData.maxSubstitutesPerDayPerTeacher}
                onChange={handleChange}
                min="1" max="12"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                Max Substitutes / Week / Teacher
                {renderInheritanceIcon("maxSubstitutesPerWeekPerTeacher")}
              </label>
              <input
                type="number"
                name="maxSubstitutesPerWeekPerTeacher"
                value={formData.maxSubstitutesPerWeekPerTeacher}
                onChange={handleChange}
                min="1" max="60"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="form-group">
              <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                Substitute Bonus Per Class ($)
                {renderInheritanceIcon("substituteBonusPerClass")}
              </label>
              <input
                type="number"
                name="substituteBonusPerClass"
                value={formData.substituteBonusPerClass}
                onChange={handleChange}
                min="0"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Behaviour Toggles */}
        <div className="settings-card glass-panel p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">Behaviour Toggles</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:bg-gray-800/50 transition-colors">
              <div>
                <label className="flex items-center text-sm font-medium text-white mb-1">
                  Allow Same Substitute for Whole Day
                  {renderInheritanceIcon("allowSameSubstituteForWholeDay")}
                </label>
                <p className="text-xs text-gray-400">One teacher covers all periods for an absent teacher.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="allowSameSubstituteForWholeDay" checked={formData.allowSameSubstituteForWholeDay} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:bg-gray-800/50 transition-colors">
              <div>
                <label className="flex items-center text-sm font-medium text-white mb-1">
                  Require Approval for Substitute
                  {renderInheritanceIcon("requireApprovalForSubstitute")}
                </label>
                <p className="text-xs text-gray-400">Substitutions must be approved by an admin before taking effect.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="requireApprovalForSubstitute" checked={formData.requireApprovalForSubstitute} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
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
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GeneralSettingsTab;
