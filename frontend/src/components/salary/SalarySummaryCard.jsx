import React from 'react';
import { BadgeDollarSign, ReceiptText, Users, WalletCards } from 'lucide-react';

const formatPKR = (amount) => `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

export default function SalarySummaryCard({ profiles = [] }) {
  const activeProfiles = profiles.filter((p) => p.isActive);

  const totalBase = activeProfiles.reduce(
    (sum, p) => sum + Number(p.baseSalary || 0),
    0
  );

  const totalAllowances = activeProfiles.reduce(
    (sum, p) =>
      sum +
      (p.allowances || []).reduce((aSum, item) => aSum + Number(item.amount || 0), 0),
    0
  );

  const totalDeductions = activeProfiles.reduce(
    (sum, p) => sum + Number(p.taxDeduction || 0) + Number(p.otherDeduction || 0),
    0
  );

  return (
    <div className="campus-kpi-track salary-profiles-kpis">
      <div className="campus-kpi-card">
        <div className="kpi-wrap">
          <div className="kpi-icon">
            <Users size={16} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Configured Staff</span>
            <span className="kpi-value">{profiles.length}</span>
          </div>
        </div>
      </div>

      <div className="campus-kpi-card">
        <div className="kpi-wrap">
          <div className="kpi-icon">
            <BadgeDollarSign size={16} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Base Payroll</span>
            <span className="kpi-value">{formatPKR(totalBase)}</span>
          </div>
        </div>
      </div>

      <div className="campus-kpi-card">
        <div className="kpi-wrap">
          <div className="kpi-icon">
            <WalletCards size={16} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Allowances</span>
            <span className="kpi-value">{formatPKR(totalAllowances)}</span>
          </div>
        </div>
      </div>

      <div className="campus-kpi-card">
        <div className="kpi-wrap">
          <div className="kpi-icon">
            <ReceiptText size={16} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Recurring Deductions</span>
            <span className="kpi-value">{formatPKR(totalDeductions)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
