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
        <div className="salary-profiles-state text-center p-8 flex flex-col items-center justify-center">
          <Receipt size={32} className="text-neutral-400 mb-2" />
          <strong className="block text-neutral-800 text-sm font-semibold">
            No Salary Profile Found
          </strong>
          <span className="text-xs text-neutral-500 mt-1 max-w-sm block mb-4">
            {error ||
              "Your salary profile has not been configured by campus management yet."}
          </span>
          <button
            type="button"
            onClick={() => navigate("/my-payslips")}
            className="toolbar-btn toolbar-btn-outline flex items-center gap-1.5"
          >
            <FileText size={14} /> View My Payslips
          </button>
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
    <div
      className="w-full flex flex-col"
      style={{ padding: "24px", gap: "24px", boxSizing: "border-box" }}
    >
      {/* Main Contract Card */}
      <div className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Top Profile Header Bar */}
        <div
          className="w-full flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 bg-neutral-50/40"
          style={{ padding: "20px 24px", gap: "16px", boxSizing: "border-box" }}
        >
          {/* Left: Avatar + Name & Role */}
          <div className="flex items-center" style={{ gap: "14px" }}>
            <div
              className="rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-neutral-800 text-base shrink-0"
              style={{ width: "44px", height: "44px" }}
            >
              {(teacher.user?.name || "T").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col" style={{ gap: "2px" }}>
              <h2 className="text-base font-bold text-neutral-900 leading-snug">
                {teacher.user?.name || "Faculty Member"}
              </h2>
              <p className="text-xs text-neutral-500">
                {teacher.designation || "Teacher"} •{" "}
                {teacher.department || "Academic Department"}
              </p>
            </div>
          </div>

          {/* Right: Active Contract Badge + Payslips Button */}
          <div className="flex items-center shrink-0" style={{ gap: "10px" }}>
            <span
              className="inline-flex items-center rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-medium whitespace-nowrap"
              style={{ padding: "5px 12px" }}
            >
              {profile.isActive ? "Active Contract" : "Inactive Contract"}
            </span>
            <button
              type="button"
              onClick={() => navigate("/my-payslips")}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-800 transition-colors shadow-xs whitespace-nowrap cursor-pointer"
              style={{ height: "34px", padding: "0 14px", gap: "6px" }}
            >
              <FileText className="w-3.5 h-3.5 text-neutral-600" />
              <span>Go to My Payslips</span>
            </button>
          </div>
        </div>

        {/* Main Card Body Container */}
        <div
          className="w-full flex flex-col"
          style={{ padding: "24px", gap: "24px", boxSizing: "border-box" }}
        >
          {/* 3-Column Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 border border-neutral-200 rounded-xl bg-neutral-50/30 w-full overflow-hidden">
            {/* Column 1: Base Salary */}
            <div
              className="flex items-center justify-between"
              style={{ padding: "16px 20px" }}
            >
              <div className="flex flex-col" style={{ gap: "4px" }}>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Base Salary
                </span>
                <strong className="text-xl font-bold text-neutral-900 tracking-tight">
                  {formatPKR(profile.baseSalary)}
                </strong>
                <span className="text-[11px] text-neutral-500">
                  Fixed monthly base pay
                </span>
              </div>
              <div
                className="rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                <Banknote className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
              </div>
            </div>

            {/* Column 2: Allowances */}
            <div
              className="flex items-center justify-between"
              style={{ padding: "16px 20px" }}
            >
              <div className="flex flex-col" style={{ gap: "4px" }}>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Allowances
                </span>
                <strong className="text-xl font-bold text-neutral-900 tracking-tight">
                  +{formatPKR(totalAllowances)}
                </strong>
                <span className="text-[11px] text-neutral-500">
                  {profile.allowances?.length || 0} allowance items
                </span>
              </div>
              <div
                className="rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                <Wallet className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
              </div>
            </div>

            {/* Column 3: Gross Monthly Pay */}
            <div
              className="flex items-center justify-between"
              style={{ padding: "16px 20px" }}
            >
              <div className="flex flex-col" style={{ gap: "4px" }}>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Gross Monthly Pay
                </span>
                <strong className="text-xl font-bold text-neutral-900 tracking-tight">
                  {formatPKR(gross)}
                </strong>
                <span className="text-[11px] text-neutral-500">
                  ~{formatPKR(dailySalary)}/day rate
                </span>
              </div>
              <div
                className="rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                <ShieldCheck className="w-4 h-4 text-neutral-600 stroke-[1.75]" />
              </div>
            </div>
          </div>

          {/* Contract Allowances Breakdown */}
          <div className="flex flex-col" style={{ gap: "12px" }}>
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
              Contract Allowances Breakdown
            </span>
            {!profile.allowances || profile.allowances.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">
                No extra allowances configured.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.allowances.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center rounded-lg border border-neutral-200 bg-neutral-50/60 text-xs"
                    style={{ padding: "12px 16px" }}
                  >
                    <span className="font-semibold text-neutral-700">
                      {item.name}
                    </span>
                    <strong className="text-neutral-900 font-semibold">
                      +{formatPKR(item.amount)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deductions & Estimated Monthly Net */}
          <div className="flex flex-col" style={{ gap: "12px" }}>
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
              Deductions &amp; Estimated Monthly Net
            </span>
            <div
              className="grid grid-cols-1 md:grid-cols-3 w-full"
              style={{ gap: "16px" }}
            >
              <div
                className="rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-center"
                style={{ padding: "16px 20px", gap: "6px" }}
              >
                <span className="text-xs font-medium text-neutral-500">
                  Income Tax Deduction
                </span>
                <span className="text-lg font-bold text-neutral-900">
                  -{formatPKR(profile.taxDeduction)}
                </span>
              </div>
              <div
                className="rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-center"
                style={{ padding: "16px 20px", gap: "6px" }}
              >
                <span className="text-xs font-medium text-neutral-500">
                  Other Deductions
                </span>
                <span className="text-lg font-bold text-neutral-900">
                  -{formatPKR(profile.otherDeduction)}
                </span>
              </div>
              <div
                className="rounded-xl border border-neutral-300 bg-neutral-100/70 flex flex-col justify-center"
                style={{ padding: "16px 20px", gap: "6px" }}
              >
                <span className="text-xs font-medium text-neutral-600">
                  Est. Net Contract
                </span>
                <span className="text-lg font-bold text-neutral-900">
                  {formatPKR(estimatedNet)}
                </span>
              </div>
            </div>
          </div>

          {/* Recorded Bank Account */}
          {profile.bankAccount &&
            (profile.bankAccount.bankName ||
              profile.bankAccount.accountNumber) && (
              <div className="flex flex-col" style={{ gap: "12px" }}>
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={14} className="text-neutral-600" /> Recorded
                  Bank Account
                </span>
                <div
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-neutral-50/60 rounded-xl border border-neutral-200"
                  style={{ padding: "16px 20px" }}
                >
                  <div>
                    <span className="text-neutral-500 block text-[11px]">
                      Bank Name
                    </span>
                    <strong className="text-neutral-800">
                      {profile.bankAccount.bankName || "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">
                      Account Number
                    </span>
                    <strong className="text-neutral-800">
                      {profile.bankAccount.accountNumber || "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">
                      IBAN
                    </span>
                    <strong className="text-neutral-800">
                      {profile.bankAccount.iban || "—"}
                    </strong>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
