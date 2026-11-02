import React, { useEffect, useState } from "react";
import { Award, Save, AlertCircle, Coins, ShieldCheck, Check, Sparkles, CheckCircle2 } from "lucide-react";
import { getTeachingConfig, updateTeachingConfig } from "@/api/classSession.api";
import { Button } from "@/components/ui/button";
import { Spinner, PageLoader } from "@/components/ui/spinner";
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
    return <PageLoader text="Loading configuration..." />;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
      {/* 1. Teaching Credit Weights Card */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Award size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                Teaching Credit Weights
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Define standard and substitution lecture credit multipliers for faculty workload.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-neutral-100 text-neutral-700">
            Workload Policy
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-800">
              Credit Per Completed Lecture <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={config.creditPerCompletedPeriod}
              onChange={(e) =>
                handleChange("creditPerCompletedPeriod", parseFloat(e.target.value) || 0)
              }
              className="w-full h-11 px-3.5 text-xs font-medium rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all"
              required
            />
            <p className="text-[11px] text-neutral-500">
              Default standard is 1.0 credit per fulfilled timetable period.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-800">
              Credit For Substitution Lecture <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={config.creditForSubstitution}
              onChange={(e) =>
                handleChange("creditForSubstitution", parseFloat(e.target.value) || 0)
              }
              className="w-full h-11 px-3.5 text-xs font-medium rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all"
              required
            />
            <p className="text-[11px] text-neutral-500">
              Awarded to substitute teacher upon successful session verification.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Substitution Bonus & Eligibility Card */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Coins size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                Substitution Bonus &amp; Eligibility
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Financial incentives and management approvals for teacher substitutions.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
            Payroll Extra
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-800">
              Bonus Per Substitute Lecture (PKR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 pointer-events-none">
                Rs.
              </span>
              <input
                type="number"
                min="0"
                value={config.bonusPerSubstituteClass}
                onChange={(e) =>
                  handleChange("bonusPerSubstituteClass", parseInt(e.target.value, 10) || 0)
                }
                className="w-full h-11 pl-10 pr-3.5 text-xs font-medium rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-neutral-500">
              Fixed cash bonus added to the substitute teacher's monthly payroll slip.
            </p>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3.5">
            <div
              onClick={() => handleChange("requireApprovalForSubstituteBonus", !config.requireApprovalForSubstituteBonus)}
              className="flex items-start justify-between p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="pr-3">
                <span className="text-xs font-semibold text-neutral-900 block">
                  Campus Manager Bonus Approval
                </span>
                <span className="text-[11px] text-neutral-500 block mt-0.5 leading-snug">
                  Require administrative approval before disbursing substitute payments.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.requireApprovalForSubstituteBonus}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                  config.requireApprovalForSubstituteBonus ? "bg-neutral-900" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    config.requireApprovalForSubstituteBonus ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div
              onClick={() => handleChange("requireApprovalForMissedDeduction", !config.requireApprovalForMissedDeduction)}
              className="flex items-start justify-between p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="pr-3">
                <span className="text-xs font-semibold text-neutral-900 block">
                  Campus Manager Deduction Review
                </span>
                <span className="text-[11px] text-neutral-500 block mt-0.5 leading-snug">
                  Review and confirm missed lecture salary cuts prior to monthly finalization.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.requireApprovalForMissedDeduction}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                  config.requireApprovalForMissedDeduction ? "bg-neutral-900" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    config.requireApprovalForMissedDeduction ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Missed Period Salary Deduction Formula Card */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <ShieldCheck size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                Missed Period Salary Deduction Formula
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Automated deduction calculation formula and exceptions policy.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            Deduction Formula
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-800">
              Deduction Calculation Mode <span className="text-rose-500">*</span>
            </label>
            <select
              value={config.deductionMode}
              onChange={(e) => handleChange("deductionMode", e.target.value)}
              className="w-full h-11 px-3.5 text-xs font-medium rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 cursor-pointer transition-all"
            >
              <option value="Formula">
                Formula Based (Base Salary ÷ Working Days ÷ Expected Periods)
              </option>
              <option value="FixedAmount">Fixed Amount Per Missed Class</option>
            </select>
          </div>

          {config.deductionMode === "FixedAmount" ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-800">
                Fixed Deduction Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={config.perMissedClassDeduction}
                onChange={(e) =>
                  handleChange("perMissedClassDeduction", parseInt(e.target.value, 10) || 0)
                }
                className="w-full h-11 px-3.5 text-xs font-medium rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-800">
                Formula Multiplier <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={config.missedClassFormulaMultiplier}
                onChange={(e) =>
                  handleChange("missedClassFormulaMultiplier", parseFloat(e.target.value) || 0)
                }
                className="w-full h-11 px-3.5 text-xs font-medium rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all"
              />
              <p className="text-[11px] text-neutral-500">
                1.0 = exact period wage. Values &gt; 1.0 apply an additional penalty factor.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-800">
              Expected Teaching Periods Per Day <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={config.expectedPeriodsPerDay}
              onChange={(e) =>
                handleChange("expectedPeriodsPerDay", parseInt(e.target.value, 10) || 0)
              }
              className="w-full h-11 px-3.5 text-xs font-medium rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-800">
              Working Days Per Month Basis <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="10"
              max="31"
              value={config.workingDaysPerMonth}
              onChange={(e) =>
                handleChange("workingDaysPerMonth", parseInt(e.target.value, 10) || 0)
              }
              className="w-full h-11 px-3.5 text-xs font-medium rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all"
              required
            />
          </div>
        </div>

        {/* Policy Checkboxes with Clean Styled Cards */}
        <div className="pt-4 border-t border-neutral-100 space-y-3">
          <div
            onClick={() => handleChange("approvedLeaveDeducts", !config.approvedLeaveDeducts)}
            className="flex items-start justify-between p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer transition-colors"
          >
            <div className="pr-3">
              <span className="text-xs font-semibold text-neutral-900 block">
                Deduct salary for approved faculty leaves
              </span>
              <span className="text-[11px] text-neutral-500 block mt-0.5 leading-snug">
                When disabled (default), approved official leaves incur zero wage deduction.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.approvedLeaveDeducts}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                config.approvedLeaveDeducts ? "bg-neutral-900" : "bg-neutral-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  config.approvedLeaveDeducts ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div
            onClick={() => handleChange("cancelledClassDeducts", !config.cancelledClassDeducts)}
            className="flex items-start justify-between p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer transition-colors"
          >
            <div className="pr-3">
              <span className="text-xs font-semibold text-neutral-900 block">
                Deduct salary for officially cancelled classes or campus closures
              </span>
              <span className="text-[11px] text-neutral-500 block mt-0.5 leading-snug">
                When disabled (default), teachers are not penalized for campus-wide emergency closures.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.cancelledClassDeducts}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                config.cancelledClassDeducts ? "bg-neutral-900" : "bg-neutral-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  config.cancelledClassDeducts ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={saving}
          className="h-11 px-7 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <Spinner className="w-4 h-4 text-white" />
          ) : (
            <Save size={15} />
          )}
          Save Business Rules
        </Button>
      </div>
    </form>
  );
}
