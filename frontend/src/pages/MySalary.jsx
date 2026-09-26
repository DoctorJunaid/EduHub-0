import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CreditCard,
  FileText,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { getMySalaryProfile } from "../api/salaryProfile.api";
import PageLoader from "@/components/shared/PageLoader";
import { qk } from "@/lib/queryKeys";
import "./SalaryProfiles.css";

const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString("en-PK")}`;

export default function MySalary() {
  const navigate = useNavigate();

  const {
    data: profile,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: qk.mySalary(),
    queryFn: async () => {
      const response = await getMySalaryProfile();
      return response.data?.data || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const error =
    queryError?.response?.data?.message ||
    (queryError ? "Failed to load your salary profile." : "");

  if (loading) {
    return <PageLoader message="Loading salary profile..." />;
  }

  if (error || !profile) {
    return (
      <div className="salary-profiles-page campus-tab-page">
        <div className="salary-profiles-heading">
          <div>
            <span className="salary-profiles-eyebrow">Employment contract</span>
            <h1>My Salary Profile</h1>
            <p>View your official monthly contract breakdown.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/my-payslips")}
            className="salary-edit-btn"
          >
            <FileText size={13} /> View My Payslips
          </button>
        </div>

        <div className="salary-profiles-state text-center p-8">
          <Receipt size={32} className="text-slate-400 mb-2" />
          <strong className="block text-slate-800 text-sm">
            No Salary Profile Found
          </strong>
          <span className="text-xs text-slate-500 mt-1 max-w-sm">
            {error ||
              "Your salary profile has not been configured by campus management yet."}
          </span>
        </div>
      </div>
    );
  }

  const teacher = profile.teacherProfileId || {};
  const totalAllowances = (profile.allowances || []).reduce(
    (sum, a) => sum + Number(a.amount || 0),
    0,
  );
  const gross =
    profile.grossSalary ?? Number(profile.baseSalary || 0) + totalAllowances;
  const totalDeductions =
    Number(profile.taxDeduction || 0) + Number(profile.otherDeduction || 0);
  const estimatedNet = gross - totalDeductions;
  const dailySalary = gross / 26;

  return (
    <div className="salary-profiles-page campus-tab-page">
      {/* Heading */}
      <div className="salary-profiles-heading">
        <div>
          <span className="salary-profiles-eyebrow">Employment contract</span>
          <h1>My Salary Profile</h1>
          <p>Official monthly base contract & fixed allowance parameters.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/my-payslips")}
          className="toolbar-btn toolbar-btn-primary"
        >
          <FileText size={14} /> Go to My Payslips
        </button>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6 w-full">
        {/* Main Contract Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-base">
                {(teacher.user?.name || "T").charAt(0).toUpperCase()}
              </div>
              <div>
                <strong className="block text-slate-900 text-sm font-semibold">
                  {teacher.user?.name || "Faculty Member"}
                </strong>
                <span className="text-xs text-slate-500">
                  {teacher.designation || "Teacher"} •{" "}
                  {teacher.department || "Academic Department"}
                </span>
              </div>
            </div>
            <span
              className={`payroll-status ${
                profile.isActive
                  ? "payroll-status-paid"
                  : "payroll-status-default"
              }`}
            >
              {profile.isActive ? "Active Contract" : "Inactive Contract"}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* 3 Summary Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Banknote size={14} className="text-blue-600" /> Base Salary
                </span>
                <p className="text-lg font-bold text-slate-900 mt-2">
                  {formatPKR(profile.baseSalary)}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Fixed monthly base pay
                </span>
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet size={14} className="text-emerald-600" /> Allowances
                </span>
                <p className="text-lg font-bold text-emerald-700 mt-2">
                  +{formatPKR(totalAllowances)}
                </p>
                <span className="text-[11px] text-emerald-700 mt-0.5 block">
                  {profile.allowances?.length || 0} allowance items
                </span>
              </div>

              <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-600" /> Gross
                  Monthly Pay
                </span>
                <p className="text-lg font-bold text-blue-700 mt-2">
                  {formatPKR(gross)}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  ~{formatPKR(dailySalary)}/day rate
                </span>
              </div>
            </div>

            {/* Allowances */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                Contract Allowances Breakdown
              </span>
              {!profile.allowances || profile.allowances.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No extra allowances configured.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {profile.allowances.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                    >
                      <span className="font-semibold text-slate-700">
                        {item.name}
                      </span>
                      <strong className="text-emerald-700">
                        +{formatPKR(item.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deductions & Est Net */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                Deductions & Estimated Monthly Net
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">
                    Income Tax Deduction
                  </span>
                  <strong className="text-rose-600 font-bold">
                    -{formatPKR(profile.taxDeduction)}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">
                    Other Deductions
                  </span>
                  <strong className="text-rose-600 font-bold">
                    -{formatPKR(profile.otherDeduction)}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-100 border border-slate-300">
                  <span className="text-slate-600 block text-[11px]">
                    Est. Net Contract
                  </span>
                  <strong className="text-slate-900 font-bold text-sm">
                    {formatPKR(estimatedNet)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Bank details */}
            {profile.bankAccount &&
              (profile.bankAccount.bankName ||
                profile.bankAccount.accountNumber) && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <CreditCard size={14} className="text-blue-600" /> Recorded
                    Bank Account
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[11px]">
                        Bank Name
                      </span>
                      <strong className="text-slate-800">
                        {profile.bankAccount.bankName || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">
                        Account Number
                      </span>
                      <strong className="text-slate-800">
                        {profile.bankAccount.accountNumber || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">
                        IBAN
                      </span>
                      <strong className="text-slate-800">
                        {profile.bankAccount.iban || "—"}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
