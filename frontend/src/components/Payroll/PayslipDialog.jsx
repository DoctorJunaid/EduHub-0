import React, { useState } from "react";
import api from "../../api/axiosInstance";
import { X, FileText, TrendingDown, TrendingUp, Printer, FileDown } from "lucide-react";

const PayslipDialog = ({ payslip, onClose }) => {
  const [exporting, setExporting] = useState(false);
  if (!payslip) return null;

  const formatPKR = (amount) =>
    `PKR ${(amount || 0).toLocaleString("en-PK")}`;

  const exportFile = async (format) => {
    try {
      setExporting(true);
      const response = await api.get(`/campus/salary/payroll/${payslip._id}/export?format=${format}`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${payslip.month}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="payroll-payslip-dialog fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl mx-4 rounded-2xl border border-gray-700/50 bg-gray-900/95 shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ animation: "slideDown 0.3s ease-out" }}
      >
        {/* Header */}
        <div className="payslip-header flex items-center justify-between px-6 py-4 border-b border-gray-700/50 sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Payslip</h2>
              <p className="text-sm text-gray-400">
                {payslip.month} • {payslip.teacherProfileId?.user?.name || payslip.teacherProfileId?.employeeId || "Teacher"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1">Base Salary</p>
              <p className="text-lg font-semibold text-white">{formatPKR(payslip.baseSalary)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1">Gross</p>
              <p className="text-lg font-semibold text-green-400">{formatPKR(payslip.grossSalary)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1">Deductions</p>
              <p className="text-lg font-semibold text-red-400">−{formatPKR(payslip.deductionsTotal)}</p>
            </div>
            <div className="bg-blue-600/20 rounded-xl p-3 border border-blue-500/30">
              <p className="text-xs text-blue-300 mb-1">Net Salary</p>
              <p className="text-lg font-bold text-blue-400">{formatPKR(payslip.netSalary)}</p>
            </div>
          </div>

          {/* Attendance Summary */}
          {payslip.attendanceSummary && (
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Attendance Summary</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                {[
                  { label: "Working Days", val: payslip.attendanceSummary.totalWorkingDays },
                  { label: "Present", val: payslip.attendanceSummary.presentDays },
                  { label: "Absent", val: payslip.attendanceSummary.absentDays },
                  { label: "Late", val: payslip.attendanceSummary.lateCount },
                  { label: "Leave", val: payslip.attendanceSummary.leaveDays },
                  { label: "Substitutes", val: payslip.attendanceSummary.substituteDuties },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-lg font-semibold text-white">{item.val}</p>
                    <p className="text-xs text-gray-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deductions */}
          {payslip.deductions?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-medium text-gray-300">Deductions</h3>
              </div>
              <div className="space-y-2">
                {payslip.deductions.map((d, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center px-4 py-2 bg-red-500/5 border border-red-500/10 rounded-lg"
                  >
                    <div>
                      <p className="text-sm text-white">{d.reason}</p>
                      <p className="text-xs text-gray-400">{d.category}{d.note ? ` — ${d.note}` : ""}</p>
                    </div>
                    <span className="text-sm font-medium text-red-400">−{formatPKR(d.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bonuses */}
          {payslip.bonuses?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-medium text-gray-300">Bonuses</h3>
              </div>
              <div className="space-y-2">
                {payslip.bonuses.map((b, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center px-4 py-2 bg-green-500/5 border border-green-500/10 rounded-lg"
                  >
                    <div>
                      <p className="text-sm text-white">{b.reason}</p>
                      <p className="text-xs text-gray-400">{b.category}{b.note ? ` — ${b.note}` : ""}</p>
                    </div>
                    <span className="text-sm font-medium text-green-400">+{formatPKR(b.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="payslip-footer flex items-center justify-between gap-3 pt-4 border-t border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  payslip.status === "Paid"
                    ? "bg-green-500/20 text-green-400"
                    : payslip.status === "Approved"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {payslip.status}
              </span>
            </div>
            <button
              type="button"
              onClick={() => exportFile("csv")}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
            >
              <Printer className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
            <button type="button" onClick={() => exportFile("pdf")} disabled={exporting} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white disabled:opacity-50">
              <FileDown className="w-4 h-4" /> Download PDF
            </button>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
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

export default PayslipDialog;
