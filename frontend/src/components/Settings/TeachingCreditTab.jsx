import React, { useEffect, useState } from "react";
import { Award, Save, RefreshCw, AlertCircle, Coins, ShieldCheck } from "lucide-react";
import { getTeachingConfig, updateTeachingConfig } from "@/api/classSession.api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function TeachingCreditTab() {
  const [config, setConfig] = useState({
    creditPerCompletedPeriod: 1.0,
    creditForSubstitution: 1.0,
    bonusPerSubstituteClass: 500,
    requireApprovalForSubstituteBonus: true,
    requireApprovalForMissedDeduction: true,
    deductionMode: "Formula",
    perMissedClassDeduction: 0,
    missedClassFormulaMultiplier: 1.0,
    expectedPeriodsPerDay: 5,
    workingDaysPerMonth: 26,
    graceLateMinutes: 15,
    approvedLeaveDeducts: false,
    cancelledClassDeducts: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        const res = await getTeachingConfig();
        if (res.data?.success && res.data.data) {
          setConfig((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        toast.error("Failed to load teaching credit configuration.");
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await updateTeachingConfig(config);
      if (res.data?.success) {
        toast.success("Teaching credit & substitution rules updated!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        <RefreshCw className="animate-spin inline-block mr-2" size={16} />
        Loading configuration...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Credits Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Award size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Teaching Credit Weights
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Credit Per Completed Lecture
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={config.creditPerCompletedPeriod}
              onChange={(e) =>
                handleChange("creditPerCompletedPeriod", parseFloat(e.target.value))
              }
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              required
            />
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Default: 1.0 credit per fulfilled timetable period.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Credit For Substitution Lecture
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={config.creditForSubstitution}
              onChange={(e) =>
                handleChange("creditForSubstitution", parseFloat(e.target.value))
              }
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              required
            />
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Awarded to substitute teacher when class is completed.
            </span>
          </div>
        </div>
      </div>

      {/* Substitution Bonuses Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Coins size={18} className="text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Substitution Bonus &amp; Eligibility
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Bonus Per Substitute Lecture (PKR)
            </label>
            <input
              type="number"
              min="0"
              value={config.bonusPerSubstituteClass}
              onChange={(e) =>
                handleChange("bonusPerSubstituteClass", parseInt(e.target.value, 10))
              }
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              required
            />
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Cash bonus added to substitute teacher's monthly payroll.
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.requireApprovalForSubstituteBonus}
                onChange={(e) =>
                  handleChange("requireApprovalForSubstituteBonus", e.target.checked)
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              Require Campus Manager approval for substitute bonus
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.requireApprovalForMissedDeduction}
                onChange={(e) =>
                  handleChange("requireApprovalForMissedDeduction", e.target.checked)
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              Require Campus Manager review before applying missed class deduction
            </label>
          </div>
        </div>
      </div>

      {/* Missed Class & Deduction Rules */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck size={18} className="text-rose-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Missed Period Salary Deduction Formula
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Deduction Calculation Mode
            </label>
            <select
              value={config.deductionMode}
              onChange={(e) => handleChange("deductionMode", e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="Formula">
                Formula Based (Base Salary ÷ Working Days ÷ Expected Periods)
              </option>
              <option value="FixedAmount">Fixed Amount Per Missed Class</option>
            </select>
          </div>

          {config.deductionMode === "FixedAmount" ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fixed Deduction Amount (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={config.perMissedClassDeduction}
                onChange={(e) =>
                  handleChange("perMissedClassDeduction", parseInt(e.target.value, 10))
                }
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Formula Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={config.missedClassFormulaMultiplier}
                onChange={(e) =>
                  handleChange("missedClassFormulaMultiplier", parseFloat(e.target.value))
                }
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              />
              <span className="text-[11px] text-slate-400 block mt-0.5">
                1.0 = exact period wage. &gt;1.0 = includes penalty.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Expected Teaching Periods Per Day
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={config.expectedPeriodsPerDay}
              onChange={(e) =>
                handleChange("expectedPeriodsPerDay", parseInt(e.target.value, 10))
              }
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Working Days Per Month Basis
            </label>
            <input
              type="number"
              min="10"
              max="31"
              value={config.workingDaysPerMonth}
              onChange={(e) =>
                handleChange("workingDaysPerMonth", parseInt(e.target.value, 10))
              }
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={config.approvedLeaveDeducts}
              onChange={(e) => handleChange("approvedLeaveDeducts", e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            Deduct salary for approved faculty leave (Unchecked = 0 deduction for approved leave)
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={config.cancelledClassDeducts}
              onChange={(e) =>
                handleChange("cancelledClassDeducts", e.target.checked)
              }
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            Deduct salary for officially cancelled classes / campus closures
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-6 py-2.5 flex items-center gap-1.5"
        >
          <Save size={14} />
          {saving ? "Saving Configuration..." : "Save Business Rules"}
        </Button>
      </div>
    </form>
  );
}
