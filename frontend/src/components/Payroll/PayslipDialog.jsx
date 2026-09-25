import React, { useState } from "react";
import api from "../../api/axiosInstance";
import { Spinner } from "@/components/ui/spinner";
import {
  X,
  FileText,
  TrendingDown,
  TrendingUp,
  Printer,
  FileDown,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";

const PayslipDialog = ({ payslip, onClose }) => {
  const [exportingFormat, setExportingFormat] = useState(null);

  if (!payslip) return null;

  const formatPKR = (amount) =>
    `PKR ${(amount || 0).toLocaleString("en-PK")}`;

  const teacher = payslip.teacherProfileId;
  const teacherName =
    teacher?.user?.name || teacher?.employeeId || "Staff Member";
  const teacherDesignation = teacher?.designation || "";
  const teacherDept = teacher?.department || "";
  const employeeId = teacher?.employeeId || "";

  const exportFile = async (format) => {
    try {
      setExportingFormat(format);
      const response = await api.get(
        `/campus/salary/payroll/${payslip._id}/export?format=${format}`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${payslip.month}-${teacherName.replace(/\s+/g, "_")}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export payslip:", err);
    } finally {
      setExportingFormat(null);
    }
  };

  const statusThemes = {
    Paid: {
      bg: "#f0fdf4",
      color: "#15803d",
      border: "#bbf7d0",
      dot: "#22c55e",
      label: "Paid",
    },
    Approved: {
      bg: "#eff6ff",
      color: "#1d4ed8",
      border: "#bfdbfe",
      dot: "#3b82f6",
      label: "Approved",
    },
    Draft: {
      bg: "#fefce8",
      color: "#a16207",
      border: "#fef08a",
      dot: "#eab308",
      label: "Draft",
    },
  };

  const statusTheme = statusThemes[payslip.status] || {
    bg: "#f8fafc",
    color: "#475569",
    border: "#e2e8f0",
    dot: "#94a3b8",
    label: payslip.status || "Draft",
  };

  return (
    <div
      className="ps-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ps-modal">
        {/* Header */}
        <div className="ps-header">
          <div className="ps-header-left">
            <div className="ps-icon-box">
              <FileText size={24} />
            </div>
            <div>
              <div className="ps-title-row">
                <h2 className="ps-title">Payslip Statement</h2>
                <span className="ps-month-badge">{payslip.month}</span>
              </div>
              <div className="ps-subtitle-row">
                <span className="ps-teacher-name">{teacherName}</span>
                {employeeId && (
                  <>
                    <span className="ps-separator">•</span>
                    <span>ID: {employeeId}</span>
                  </>
                )}
                {teacherDesignation && (
                  <>
                    <span className="ps-separator">•</span>
                    <span>{teacherDesignation}</span>
                  </>
                )}
                {teacherDept && (
                  <>
                    <span className="ps-separator">•</span>
                    <span>{teacherDept}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="ps-header-right">
            <span
              className="ps-status-pill"
              style={{
                backgroundColor: statusTheme.bg,
                color: statusTheme.color,
                borderColor: statusTheme.border,
              }}
            >
              <span
                className="ps-status-dot"
                style={{ backgroundColor: statusTheme.dot }}
              />
              {statusTheme.label}
            </span>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close"
              className="ps-close-btn"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="ps-body">
          {/* 4 Financial Stat Cards */}
          <div className="ps-cards-grid">
            {/* Base Salary */}
            <div className="ps-card ps-card-base">
              <span className="ps-card-label">Base Salary</span>
              <p className="ps-card-value ps-val-dark">
                {formatPKR(payslip.baseSalary)}
              </p>
            </div>

            {/* Gross Earnings */}
            <div className="ps-card ps-card-gross">
              <span className="ps-card-label ps-label-green">Gross</span>
              <p className="ps-card-value ps-val-green">
                {formatPKR(payslip.grossSalary)}
              </p>
            </div>

            {/* Deductions */}
            <div className="ps-card ps-card-deductions">
              <span className="ps-card-label ps-label-red">Deductions</span>
              <p className="ps-card-value ps-val-red">
                −{formatPKR(payslip.deductionsTotal)}
              </p>
            </div>

            {/* Net Salary (Hero) */}
            <div className="ps-card ps-card-net">
              <span className="ps-card-label ps-label-blue">Net Salary</span>
              <p className="ps-card-value ps-val-blue">
                {formatPKR(payslip.netSalary)}
              </p>
            </div>
          </div>

          {/* Attendance Summary */}
          {payslip.attendanceSummary && (
            <div className="ps-attendance-section">
              <div className="ps-section-header">
                <div className="ps-section-title">
                  <Calendar size={16} />
                  <span>Attendance Summary</span>
                </div>
                <span className="ps-section-sub">Month: {payslip.month}</span>
              </div>

              <div className="ps-attendance-grid">
                {[
                  {
                    label: "Working Days",
                    val: payslip.attendanceSummary.totalWorkingDays ?? 0,
                    color: "#0f172a",
                  },
                  {
                    label: "Present",
                    val: payslip.attendanceSummary.presentDays ?? 0,
                    color: "#16a34a",
                  },
                  {
                    label: "Absent",
                    val: payslip.attendanceSummary.absentDays ?? 0,
                    color:
                      payslip.attendanceSummary.absentDays > 0
                        ? "#dc2626"
                        : "#64748b",
                  },
                  {
                    label: "Late",
                    val: payslip.attendanceSummary.lateCount ?? 0,
                    color:
                      payslip.attendanceSummary.lateCount > 0
                        ? "#d97706"
                        : "#64748b",
                  },
                  {
                    label: "Leave",
                    val: payslip.attendanceSummary.leaveDays ?? 0,
                    color: "#2563eb",
                  },
                  {
                    label: "Substitutes",
                    val: payslip.attendanceSummary.substituteDuties ?? 0,
                    color: "#7c3aed",
                  },
                ].map((item) => (
                  <div key={item.label} className="ps-att-tile">
                    <span className="ps-att-val" style={{ color: item.color }}>
                      {item.val}
                    </span>
                    <span className="ps-att-lbl">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deductions Breakdown */}
          {payslip.deductions?.length > 0 && (
            <div className="ps-breakdown-section">
              <div className="ps-breakdown-header ps-text-red">
                <TrendingDown size={17} />
                <span>Deductions Breakdown ({payslip.deductions.length})</span>
              </div>
              <div className="ps-breakdown-list">
                {payslip.deductions.map((d, i) => (
                  <div key={i} className="ps-breakdown-item ps-item-red">
                    <div>
                      <div className="ps-item-title">{d.reason || "Deduction"}</div>
                      <div className="ps-item-sub">
                        {d.category || "General"}
                        {d.note ? ` — ${d.note}` : ""}
                      </div>
                    </div>
                    <span className="ps-item-amt ps-amt-red">
                      −{formatPKR(d.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bonuses Breakdown */}
          {payslip.bonuses?.length > 0 && (
            <div className="ps-breakdown-section">
              <div className="ps-breakdown-header ps-text-green">
                <TrendingUp size={17} />
                <span>Bonuses & Allowances ({payslip.bonuses.length})</span>
              </div>
              <div className="ps-breakdown-list">
                {payslip.bonuses.map((b, i) => (
                  <div key={i} className="ps-breakdown-item ps-item-green">
                    <div>
                      <div className="ps-item-title">{b.reason || "Bonus / Allowance"}</div>
                      <div className="ps-item-sub">
                        {b.category || "General"}
                        {b.note ? ` — ${b.note}` : ""}
                      </div>
                    </div>
                    <span className="ps-item-amt ps-amt-green">
                      +{formatPKR(b.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Toolbar */}
        <div className="ps-footer">
          <div className="ps-footer-id">
            <span>Payslip ID:</span>
            <code>{payslip._id ? payslip._id.slice(-8) : "N/A"}</code>
          </div>

          <div className="ps-btn-group">
            <button
              type="button"
              onClick={() => exportFile("csv")}
              disabled={exportingFormat !== null}
              className="ps-btn ps-btn-secondary"
            >
              {exportingFormat === "csv" ? (
                <Spinner className="mr-1.5 size-3.5" />
              ) : (
                <FileSpreadsheet size={15} />
              )}
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => exportFile("pdf")}
              disabled={exportingFormat !== null}
              className="ps-btn ps-btn-primary"
            >
              {exportingFormat === "pdf" ? (
                <Spinner className="mr-1.5 size-3.5 text-white" />
              ) : (
                <FileDown size={15} />
              )}
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="ps-btn ps-btn-secondary"
            >
              <Printer size={15} />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ps-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
        }

        .ps-modal {
          width: 100%;
          max-width: 820px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          animation: psModalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          color: #0f172a;
          font-family: inherit;
        }

        @keyframes psModalIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Header */
        .ps-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 28px;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
        }

        .ps-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ps-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
          flex-shrink: 0;
        }

        .ps-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ps-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
        }

        .ps-month-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }

        .ps-subtitle-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #64748b;
          margin-top: 5px;
        }

        .ps-teacher-name {
          font-weight: 600;
          color: #1e293b;
        }

        .ps-separator {
          color: #cbd5e1;
        }

        .ps-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ps-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 650;
          border: 1px solid;
          white-space: nowrap;
        }

        .ps-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .ps-close-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ps-close-btn:hover {
          background: #f1f5f9;
          color: #334155;
        }

        /* Body */
        .ps-body {
          padding: 26px 28px;
          overflow-y: auto;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        /* 4 KPI Cards */
        .ps-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .ps-card {
          padding: 16px 18px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .ps-card-base {
          background: #f8fafc;
          border-color: #e2e8f0;
        }

        .ps-card-gross {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .ps-card-deductions {
          background: #fff1f2;
          border-color: #fecdd3;
        }

        .ps-card-net {
          background: #eff6ff;
          border-color: #bfdbfe;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
        }

        .ps-card-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
        }

        .ps-label-green { color: #15803d; }
        .ps-label-red { color: #be123c; }
        .ps-label-blue { color: #1d4ed8; }

        .ps-card-value {
          font-size: 18px;
          font-weight: 700;
          margin: 10px 0 0;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .ps-val-dark { color: #0f172a; }
        .ps-val-green { color: #16a34a; }
        .ps-val-red { color: #e11d48; }
        .ps-val-blue {
          font-size: 20px;
          font-weight: 800;
          color: #1e40af;
        }

        /* Attendance Section */
        .ps-attendance-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 18px 20px;
        }

        .ps-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .ps-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 750;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ps-section-sub {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
        }

        .ps-attendance-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
        }

        .ps-att-tile {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }

        .ps-att-val {
          font-size: 18px;
          font-weight: 800;
          line-height: 1;
        }

        .ps-att-lbl {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Breakdown Sections */
        .ps-breakdown-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ps-breakdown-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ps-text-red { color: #e11d48; }
        .ps-text-green { color: #16a34a; }

        .ps-breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ps-breakdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          border-radius: 10px;
          border: 1px solid;
          gap: 16px;
        }

        .ps-item-red {
          background: #fff1f2;
          border-color: #ffe4e6;
        }

        .ps-item-green {
          background: #f0fdf4;
          border-color: #dcfce7;
        }

        .ps-item-title {
          font-size: 13px;
          font-weight: 650;
          color: #0f172a;
        }

        .ps-item-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .ps-item-amt {
          font-size: 14px;
          font-weight: 750;
          white-space: nowrap;
        }

        .ps-amt-red { color: #e11d48; }
        .ps-amt-green { color: #16a34a; }

        /* Footer */
        .ps-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 28px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          flex-shrink: 0;
          gap: 16px;
        }

        .ps-footer-id {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .ps-footer-id code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          background: #e2e8f0;
          color: #334155;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .ps-btn-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ps-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 38px;
          padding: 0 16px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .ps-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .ps-btn-secondary {
          background: #ffffff;
          color: #334155;
          border-color: #cbd5e1;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .ps-btn-secondary:hover:not(:disabled) {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #94a3b8;
        }

        .ps-btn-primary {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }

        .ps-btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        /* Responsive */
        @media (max-width: 700px) {
          .ps-header { padding: 18px 20px; }
          .ps-body { padding: 20px; gap: 16px; }
          .ps-footer { padding: 16px 20px; flex-direction: column; align-items: stretch; }
          .ps-btn-group { justify-content: flex-end; }
          .ps-cards-grid { grid-template-columns: repeat(2, 1fr); }
          .ps-attendance-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 480px) {
          .ps-overlay { padding: 12px; }
          .ps-btn-group { flex-direction: column; width: 100%; }
          .ps-btn { width: 100%; }
          .ps-attendance-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
};

export default PayslipDialog;
