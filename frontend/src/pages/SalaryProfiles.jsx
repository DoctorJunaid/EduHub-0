import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  PowerOff,
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import useSalaryProfiles from '../hooks/useSalaryProfiles';
import SalarySummaryCard from '../components/salary/SalarySummaryCard';
import TeachersWithoutProfileAlert from '../components/salary/TeachersWithoutProfileAlert';
import SalaryProfilesTable from '../components/salary/SalaryProfilesTable';
import SalaryProfileDialog from '../components/salary/SalaryProfileDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import './SalaryProfiles.css';

export default function SalaryProfiles() {
  const {
    profiles,
    loading,
    filters,
    setFilters,
    pagination,
    teachersWithoutProfile,
    upsert,
    deactivate,
    activate,
  } = useSalaryProfiles();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Status toggle confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetToggleProfile, setTargetToggleProfile] = useState(null);

  const handleOpenAdd = (teacher = null) => {
    if (teacher && (teacher._id || teacher.user)) {
      setSelectedProfile({ teacherProfileId: teacher, baseSalary: 0, allowances: [] });
    } else {
      setSelectedProfile(null);
    }
    setDialogOpen(true);
  };

  const handleOpenEdit = (profile) => {
    setSelectedProfile(profile);
    setDialogOpen(true);
  };

  const handleSaveProfile = async (teacherId, payload) => {
    setSaving(true);
    try {
      await upsert(teacherId, payload);
      setDialogOpen(false);
      setSelectedProfile(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getProfileTargetId = (profile) => {
    if (!profile) return null;
    let tid = profile._id || profile.id;
    if (!tid) {
      if (typeof profile.teacherProfileId === 'object' && profile.teacherProfileId !== null) {
        tid =
          profile.teacherProfileId._id ||
          profile.teacherProfileId.id ||
          profile.teacherProfileId.user?._id ||
          profile.teacherProfileId.user;
      } else if (typeof profile.teacherProfileId === 'string') {
        tid = profile.teacherProfileId;
      }
    }
    return tid ? String(tid) : null;
  };

  const handlePromptToggleStatus = (profile) => {
    const tid = getProfileTargetId(profile);
    if (!tid) return;

    if (profile.isActive) {
      setTargetToggleProfile(profile);
      setConfirmOpen(true);
    } else {
      activate(tid);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!targetToggleProfile) return;
    const tid = getProfileTargetId(targetToggleProfile);
    if (!tid) {
      setConfirmOpen(false);
      return;
    }
    await deactivate(tid);
    setConfirmOpen(false);
    setTargetToggleProfile(null);
  };

  const departments = Array.from(
    new Set(
      profiles
        .map((p) => p.teacherProfileId?.department)
        .filter(Boolean)
    )
  );

  const activeCount = profiles.filter((p) => p.isActive).length;
  const deactivatedCount = profiles.filter((p) => !p.isActive).length;

  const targetTeacher =
    targetToggleProfile?.teacherProfileId &&
    typeof targetToggleProfile.teacherProfileId === 'object'
      ? targetToggleProfile.teacherProfileId
      : {};
  const targetUser =
    targetTeacher.user && typeof targetTeacher.user === 'object'
      ? targetTeacher.user
      : {};
  const targetName =
    targetUser.name ||
    targetTeacher.name ||
    targetTeacher.fullName ||
    (targetTeacher.employeeId ? `Teacher (${targetTeacher.employeeId})` : 'Selected Teacher');
  const targetEmail = targetUser.email || targetTeacher.email || '—';
  const targetDept = targetTeacher.department || targetUser.department || 'Academic';
  const targetSalary = targetToggleProfile?.baseSalary
    ? `PKR ${Number(targetToggleProfile.baseSalary).toLocaleString('en-PK')}`
    : '—';

  // Full-page form view matching Assign Substitute dialog layout
  if (dialogOpen) {
    return (
      <SalaryProfileDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveProfile}
        profile={selectedProfile}
        teachersWithoutProfile={teachersWithoutProfile}
        saving={saving}
      />
    );
  }

  return (
    <div className="salary-profiles-page campus-tab-page">
      {/* Top Header */}
      <div className="salary-profiles-heading">
        <div>
          <span className="salary-profiles-eyebrow">Finance / compensation</span>
          <h1>Salary Profiles</h1>
          <p>Maintain base salary, allowances, and recurring deductions for teaching staff.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="toolbar-btn toolbar-btn-primary"
        >
          <Plus size={14} /> Add Profile
        </button>
      </div>

      {/* Segmented Status Filter Tabs Bar */}
      <div className="salary-status-nav">
        <div className="salary-status-tabs">
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, isActive: '', page: 1 }))}
            className={`salary-status-tab-btn ${filters.isActive === '' ? 'is-active' : ''}`}
          >
            <Users size={14} />
            <span>All Staff</span>
            <span className="salary-status-badge salary-status-badge-all">
              {pagination.total || profiles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, isActive: true, page: 1 }))}
            className={`salary-status-tab-btn ${filters.isActive === true ? 'is-active' : ''}`}
          >
            <UserCheck size={14} className={filters.isActive === true ? 'text-emerald-600' : 'text-emerald-700'} />
            <span>Active Teachers</span>
            <span className="salary-status-badge salary-status-badge-active">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, isActive: false, page: 1 }))}
            className={`salary-status-tab-btn ${filters.isActive === false ? 'is-active' : ''}`}
          >
            <UserX size={14} className={filters.isActive === false ? 'text-rose-600' : 'text-rose-700'} />
            <span>Deactivated Teachers</span>
            <span className="salary-status-badge salary-status-badge-deactivated">
              {deactivatedCount}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Track */}
      <SalarySummaryCard profiles={profiles} />

      {/* Alert for unconfigured teachers */}
      <TeachersWithoutProfileAlert
        count={teachersWithoutProfile.length}
        onAddProfile={handleOpenAdd}
      />

      {/* Banner Notice when viewing Deactivated Staff */}
      {filters.isActive === false && (
        <div className="mx-5 my-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <UserX size={16} className="text-rose-600 shrink-0" />
            <span>
              <strong>Viewing Deactivated Teachers.</strong> Deactivated profiles are excluded from monthly payroll runs. Click <strong>[Reactivate]</strong> on any row below to restore them.
            </span>
          </div>
          <button
            type="button"
            className="text-[11px] font-bold text-rose-700 underline hover:text-rose-900 shrink-0 cursor-pointer"
            onClick={() => setFilters((f) => ({ ...f, isActive: '', page: 1 }))}
          >
            Show All
          </button>
        </div>
      )}

      {/* Toolbar Filters */}
      <div className="campus-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-search">
            <Search size={13} />
            <input
              type="search"
              placeholder="Search teacher..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
              }
            />
          </div>

          <select
            className="toolbar-select"
            value={filters.department || ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, department: e.target.value, page: 1 }))
            }
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            className="toolbar-select"
            value={filters.isActive === '' ? '' : filters.isActive ? 'true' : 'false'}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                isActive: e.target.value === '' ? '' : e.target.value === 'true',
                page: 1,
              }))
            }
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive / Deactivated</option>
          </select>

          {(filters.search || filters.department || filters.isActive !== '') && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn-outline"
              onClick={() =>
                setFilters({
                  search: '',
                  department: '',
                  isActive: '',
                  page: 1,
                  limit: 20,
                })
              }
            >
              Reset
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          <span className="salary-profiles-result-count">
            {profiles.length} of {pagination.total} profiles
          </span>
        </div>
      </div>

      {/* Table */}
      <SalaryProfilesTable
        profiles={profiles}
        loading={loading}
        onEdit={handleOpenEdit}
        onToggleStatus={handlePromptToggleStatus}
      />

      {/* Pagination Footer */}
      <div className="salary-payroll-pagination border-t border-slate-200 bg-white px-5 py-3">
        <p>
          Showing{' '}
          <strong>
            {profiles.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
          </strong>{' '}
          to{' '}
          <strong>
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </strong>{' '}
          of <strong>{pagination.total}</strong> profiles
        </p>
        <div className="payroll-page-controls">
          <button
            type="button"
            className="payroll-page-btn"
            disabled={pagination.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          >
            ‹
          </button>
          <span className="text-xs font-semibold px-2">{pagination.page}</span>
          <button
            type="button"
            className="payroll-page-btn"
            disabled={pagination.page * pagination.limit >= pagination.total}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            ›
          </button>
        </div>
      </div>

      {/* Deactivate Salary Profile Modal */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Modal Header Icon */}
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert size={22} className="text-rose-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100/80 border border-rose-200 text-rose-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                <PowerOff size={9} /> Status Deactivation
              </div>
              <AlertDialogTitle className="text-lg font-bold text-slate-900 leading-tight">
                Deactivate Salary Profile?
              </AlertDialogTitle>
            </div>
          </div>

          <AlertDialogDescription asChild>
            <div className="mt-4 space-y-3">
              {/* Teacher Info Preview Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {targetName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <strong className="block text-slate-900 font-semibold text-xs truncate" title={targetName}>
                      {targetName}
                    </strong>
                    <span className="block text-slate-500 text-[11px] truncate" title={targetEmail}>
                      {targetDept} · {targetEmail}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Base Pay</span>
                  <span className="text-xs font-bold text-slate-900">{targetSalary}</span>
                </div>
              </div>

              {/* Warning Callout Box */}
              <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200/90 text-xs text-rose-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-rose-950">
                  <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                  Consequences of Deactivation:
                </p>
                <ul className="list-disc list-inside text-[11px] text-rose-800 pl-1 space-y-0.5">
                  <li>This teacher will be excluded from all upcoming monthly payroll runs.</li>
                  <li>Existing payslips and payroll archives remain fully preserved.</li>
                  <li>Profile status can be reactivated anytime with a single click.</li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>

          <AlertDialogFooter className="mt-5 flex flex-row items-center justify-end gap-2.5">
            <AlertDialogCancel
              onClick={() => setConfirmOpen(false)}
              className="m-0 h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              className="m-0 h-9 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <PowerOff size={13} /> Deactivate Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
