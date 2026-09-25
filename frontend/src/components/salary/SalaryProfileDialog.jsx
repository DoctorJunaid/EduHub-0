import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import FullPageFormShell from '../common/FullPageFormShell';
import { listTeachersWithoutSalaryProfile } from '../../api/salaryProfile.api';
import api from '../../api/axiosInstance';

const formatPKR = (num) => `PKR ${Number(num || 0).toLocaleString('en-PK')}`;

export default function SalaryProfileDialog({
  open = false,
  onClose,
  onSave,
  profile = null,
  teachersWithoutProfile: initialTeachersWithoutProfile = [],
  saving = false,
}) {
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);
  const [allowances, setAllowances] = useState([]);
  const [taxDeduction, setTaxDeduction] = useState(0);
  const [otherDeduction, setOtherDeduction] = useState(0);
  const [bankAccount, setBankAccount] = useState({
    bankName: '',
    accountNumber: '',
    iban: '',
  });
  const [validationError, setValidationError] = useState('');
  const [teacherOptions, setTeacherOptions] = useState(initialTeachersWithoutProfile);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const isEditing = Boolean(profile && profile._id);

  const getTeacherLabel = (t) => {
    if (!t) return 'Teacher';
    let teacherObj = t;
    if (typeof t === 'string' || typeof t === 'number') {
      const found = (Array.isArray(teacherOptions) ? teacherOptions : []).find(
        (opt) => String(opt._id || opt.id) === String(t)
      );
      if (found) teacherObj = found;
      else return `Teacher #${String(t).slice(-6)}`;
    }
    const name = teacherObj.user?.name || teacherObj.name || teacherObj.employeeId || 'Teacher';
    const dept = teacherObj.department || 'Teaching Staff';
    const email = teacherObj.user?.email || teacherObj.email || '';
    return `${name} (${dept}) ${email ? `· ${email}` : ''}`;
  };

  // Load real teacher options
  useEffect(() => {
    if (!open) return;

    const fetchTeachers = async () => {
      if (Array.isArray(initialTeachersWithoutProfile) && initialTeachersWithoutProfile.length > 0) {
        setTeacherOptions(initialTeachersWithoutProfile);
        return;
      }

      setLoadingTeachers(true);
      try {
        const res = await listTeachersWithoutSalaryProfile();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setTeacherOptions(res.data.data);
          return;
        }
      } catch (err) {
        console.error('Failed to load unconfigured teachers:', err);
      }

      try {
        const fallbackRes = await api.get('/campus-admin/faculty');
        if (fallbackRes.data?.success && Array.isArray(fallbackRes.data.data)) {
          setTeacherOptions(fallbackRes.data.data);
        }
      } catch (e) {
        console.error('Failed to load faculty fallback:', e);
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, [open, initialTeachersWithoutProfile]);

  useEffect(() => {
    if (open && !profile && teacherOptions.length > 0 && !selectedTeacherId) {
      const firstId = String(teacherOptions[0]._id || teacherOptions[0].id || '');
      if (firstId) setSelectedTeacherId(firstId);
    }
  }, [open, profile, teacherOptions, selectedTeacherId]);

  // Populate form fields on edit or reset on create
  useEffect(() => {
    if (!open) return;

    if (profile) {
      const teacherObj = profile.teacherProfileId;
      let tid = '';
      if (teacherObj && typeof teacherObj === 'object') {
        tid = teacherObj._id || teacherObj.id || '';
      } else if (teacherObj) {
        tid = String(teacherObj);
      }

      setSelectedTeacherId(tid);
      setBaseSalary(profile.baseSalary !== undefined && profile.baseSalary !== null ? Number(profile.baseSalary) : 0);
      setAllowances(
        Array.isArray(profile.allowances)
          ? profile.allowances.map((a) => ({
              name: a?.name || '',
              amount: Number(a?.amount || 0),
            }))
          : []
      );
      setTaxDeduction(Number(profile.taxDeduction || 0));
      setOtherDeduction(Number(profile.otherDeduction || 0));
      setBankAccount({
        bankName: profile.bankAccount?.bankName || '',
        accountNumber: profile.bankAccount?.accountNumber || '',
        iban: profile.bankAccount?.iban || '',
      });
    } else {
      const firstTeacher = Array.isArray(teacherOptions) && teacherOptions.length > 0 ? teacherOptions[0] : null;
      const firstId = firstTeacher ? String(firstTeacher._id || firstTeacher.id || '') : '';
      setSelectedTeacherId(firstId);
      setBaseSalary(0);
      setAllowances([]);
      setTaxDeduction(0);
      setOtherDeduction(0);
      setBankAccount({ bankName: '', accountNumber: '', iban: '' });
    }
    setValidationError('');
  }, [profile, open, teacherOptions]);

  if (!open) return null;

  // Live computed calculations
  const totalAllowances = allowances.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const grossSalary = (Number(baseSalary) || 0) + totalAllowances;
  const totalDeductions = (Number(taxDeduction) || 0) + (Number(otherDeduction) || 0);
  const netEstimate = grossSalary - totalDeductions;
  const dailySalary = grossSalary / 26;

  const DEFAULT_ALLOWANCE_NAMES = [
    'Housing Allowance',
    'Medical Allowance',
    'Transport Allowance',
    'Utilities Allowance',
    'Special Allowance',
  ];

  const handleAddAllowance = () => {
    setAllowances((prev) => {
      const count = prev.length;
      const defaultName = DEFAULT_ALLOWANCE_NAMES[count] || `Allowance #${count + 1}`;
      return [...prev, { name: defaultName, amount: 0 }];
    });
  };

  const handleRemoveAllowance = (index) => {
    setAllowances((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAllowanceChange = (index, field, value) => {
    setAllowances((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === 'amount' ? (value === '' ? '' : Number(value)) : value,
            }
          : item
      )
    );
  };

  const ready = Boolean(selectedTeacherId || (profile && profile.teacherProfileId)) && baseSalary !== '' && Number(baseSalary) >= 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    let targetTeacherId = selectedTeacherId;
    if (!targetTeacherId && profile) {
      const teacherObj = profile.teacherProfileId;
      targetTeacherId = teacherObj && typeof teacherObj === 'object' ? teacherObj._id || teacherObj.id : teacherObj;
    }

    if (typeof targetTeacherId === 'object' && targetTeacherId !== null) {
      targetTeacherId = targetTeacherId._id || targetTeacherId.id || targetTeacherId.user?._id || targetTeacherId.user;
    }

    if (!targetTeacherId || String(targetTeacherId).trim() === '' || String(targetTeacherId).trim() === 'undefined') {
      setValidationError('Please select a valid teacher from the dropdown');
      return;
    }

    if (baseSalary === '' || baseSalary === null || baseSalary === undefined || Number(baseSalary) < 0) {
      setValidationError('Base salary is required and must be ≥ 0');
      return;
    }

    const processedAllowances = allowances.map((a, index) => {
      const trimmedName = typeof a.name === 'string' ? a.name.trim() : '';
      return {
        name: trimmedName !== '' ? trimmedName : `Allowance #${index + 1}`,
        amount: Number(a.amount || 0),
      };
    });

    for (const [index, allowance] of processedAllowances.entries()) {
      if (allowance.amount < 0) {
        setValidationError(`Allowance #${index + 1} amount must be ≥ 0`);
        return;
      }
    }

    if (taxDeduction !== '' && Number(taxDeduction) < 0) {
      setValidationError('Tax deduction cannot be negative');
      return;
    }

    if (otherDeduction !== '' && Number(otherDeduction) < 0) {
      setValidationError('Other deduction cannot be negative');
      return;
    }

    const payload = {
      baseSalary: Number(baseSalary || 0),
      allowances: processedAllowances,
      taxDeduction: Number(taxDeduction || 0),
      otherDeduction: Number(otherDeduction || 0),
      bankAccount,
    };

    onSave(String(targetTeacherId), payload);
  };

  const safeTeacherOptions = Array.isArray(teacherOptions) ? teacherOptions : [];

  return (
    <div className="substitute-assignment-form relative min-h-screen">
      <FullPageFormShell
        title={isEditing ? 'Edit Teacher Salary Profile' : 'Configure Teacher Salary Profile'}
        subtitle="Establish fixed monthly base pay, allowances, and recurring deductions for payroll generation."
        parentName="Salary Profiles"
        icon={<WalletCards size={22} />}
        onBack={onClose}
        maxWidth={900}
      >
        <form onSubmit={handleSubmit}>
          <div className="activity-form-grid">
            {validationError && (
              <div className="activity-form-field span-2">
                <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              </div>
            )}

            {/* Section 1: Staff Selection */}
            <div className="activity-section-title">Teacher &amp; Staff Details</div>

            <div className="activity-form-field span-2">
              <label htmlFor="salary-teacher-select">
                Select Teacher <span className="text-rose-500">*</span>
              </label>
              {isEditing ? (
                <input
                  id="salary-teacher-select"
                  disabled
                  value={getTeacherLabel(profile?.teacherProfileId)}
                  className="bg-slate-100 font-semibold text-slate-700 cursor-not-allowed"
                />
              ) : (
                <select
                  id="salary-teacher-select"
                  name="teacherId"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  disabled={loadingTeachers}
                  required
                >
                  <option value="">-- Select Teacher --</option>
                  {loadingTeachers && <option value="">Loading teachers list...</option>}
                  {safeTeacherOptions.map((t) => (
                    <option key={t._id || t.id} value={String(t._id || t.id)}>
                      {getTeacherLabel(t)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Section 2: Earnings & Base Salary */}
            <div className="activity-section-title">
              Earnings (Base Monthly Pay &amp; Allowances)
            </div>

            <div className="activity-form-field span-2">
              <label htmlFor="salary-base">
                Base Monthly Salary (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                id="salary-base"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 75000"
                value={baseSalary}
                onChange={(e) =>
                  setBaseSalary(e.target.value === '' ? '' : Number(e.target.value))
                }
                required
              />
              {baseSalary === 0 && (
                <p className="activity-field-error flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Base salary is 0 — this will cause negative net pay if deductions exist!
                </p>
              )}
            </div>

            {/* Dynamic Allowances */}
            <div className="activity-form-field span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="m-0">Allowances (Housing, Medical, Transport, etc.)</label>
                <button
                  type="button"
                  onClick={handleAddAllowance}
                  className="toolbar-btn toolbar-btn-outline h-7 text-xs px-2 gap-1"
                >
                  <Plus size={13} /> Add Allowance
                </button>
              </div>

              {allowances.length === 0 ? (
                <p className="substitute-form-notice">
                  <Banknote size={15} /> No allowances configured. Click [+ Add Allowance] to add items.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {allowances.map((item, index) => (
                    <div key={index} className="grid grid-cols-[1fr_200px_42px] gap-2.5 items-center">
                      <input
                        placeholder={`Allowance #${index + 1} Name (e.g. House Rent)`}
                        value={item.name ?? ''}
                        onChange={(e) => handleAllowanceChange(index, 'name', e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Amount (PKR)"
                        value={item.amount === '' ? '' : item.amount ?? 0}
                        onChange={(e) => handleAllowanceChange(index, 'amount', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAllowance(index)}
                        className="h-[42px] w-[42px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                        title="Remove allowance"
                        aria-label="Remove allowance"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Fixed Recurring Deductions */}
            <div className="activity-section-title">Fixed Recurring Deductions</div>

            <div className="activity-form-field">
              <label htmlFor="salary-tax">Income Tax Deduction (PKR)</label>
              <input
                id="salary-tax"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={taxDeduction}
                onChange={(e) =>
                  setTaxDeduction(e.target.value === '' ? '' : Number(e.target.value))
                }
              />
            </div>

            <div className="activity-form-field">
              <label htmlFor="salary-other">Other Deductions (Fund/Loan) (PKR)</label>
              <input
                id="salary-other"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={otherDeduction}
                onChange={(e) =>
                  setOtherDeduction(e.target.value === '' ? '' : Number(e.target.value))
                }
              />
            </div>

            {/* Section 4: Bank Account Details */}
            <div className="activity-section-title">
              Bank Account Details <span>(Record keeping only)</span>
            </div>

            <div className="activity-form-field">
              <label htmlFor="salary-bank">Bank Name</label>
              <input
                id="salary-bank"
                placeholder="e.g. Meezan Bank / HBL"
                value={bankAccount.bankName}
                onChange={(e) => setBankAccount((b) => ({ ...b, bankName: e.target.value }))}
              />
            </div>

            <div className="activity-form-field">
              <label htmlFor="salary-account">Account Number</label>
              <input
                id="salary-account"
                placeholder="01020304050607"
                value={bankAccount.accountNumber}
                onChange={(e) =>
                  setBankAccount((b) => ({ ...b, accountNumber: e.target.value }))
                }
              />
            </div>

            <div className="activity-form-field span-2">
              <label htmlFor="salary-iban">IBAN</label>
              <input
                id="salary-iban"
                placeholder="PK36MEZN0001020304050607"
                value={bankAccount.iban}
                onChange={(e) => setBankAccount((b) => ({ ...b, iban: e.target.value }))}
              />
            </div>

            {/* Section 5: Live Summary Preview */}
            <div className="activity-section-title">Live Computation Summary</div>

            <div className="activity-form-field span-2">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-blue-950">
                  <span>CONTRACT COMPUTATION SUMMARY</span>
                  <span className="font-normal text-blue-800 text-[11px]">
                    (Based on 26 standard working days)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Base Pay</span>
                    <strong className="text-slate-900 font-bold">{formatPKR(baseSalary)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Allowances</span>
                    <strong className="text-emerald-700 font-bold">
                      +{formatPKR(totalAllowances)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Gross Salary</span>
                    <strong className="text-blue-700 font-bold">{formatPKR(grossSalary)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Daily Rate</span>
                    <strong className="text-slate-800 font-bold">
                      {formatPKR(dailySalary)}/day
                    </strong>
                  </div>
                </div>

                {allowances.length > 0 && (
                  <div className="pt-2 border-t border-blue-200/60 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500 font-medium">Configured Allowances:</span>
                    {allowances.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-white border border-emerald-200 px-2 py-0.5 rounded text-emerald-950 font-semibold"
                      >
                        <span>{item.name || `Allowance #${idx + 1}`}:</span>
                        <span className="text-emerald-700">{formatPKR(item.amount)}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-blue-200/80 flex justify-between text-slate-700">
                  <span>
                    Fixed Deductions: <strong className="text-rose-600">-{formatPKR(totalDeductions)}</strong>
                  </span>
                  <span>
                    Est. Net Contract: <strong className="text-slate-900 font-bold">{formatPKR(netEstimate)}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="activity-form-actions">
            <span className={ready ? 'substitute-ready is-ready' : 'substitute-ready'}>
              {ready ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {ready
                ? 'Ready to save salary profile'
                : 'Select a teacher and specify a valid base salary'}
            </span>

            <div className="activity-form-action-buttons">
              <button
                type="button"
                className="activity-cancel-btn"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="activity-submit-btn"
                disabled={saving}
              >
                {saving ? (
                  <Spinner className="mr-2 size-4" />
                ) : (
                  <Save size={15} />
                )}
                Save Salary Profile
              </button>
            </div>
          </div>
        </form>
      </FullPageFormShell>
    </div>
  );
}
