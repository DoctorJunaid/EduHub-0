import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
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

  const handlePromptToggleStatus = (profile) => {
    if (profile.isActive) {
      setTargetToggleProfile(profile);
      setConfirmOpen(true);
    } else {
      activate(profile.teacherProfileId?._id || profile.teacherProfileId);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!targetToggleProfile) return;
    const tid =
      targetToggleProfile.teacherProfileId?._id || targetToggleProfile.teacherProfileId;
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

      {/* KPI Track */}
      <SalarySummaryCard profiles={profiles} />

      {/* Alert for unconfigured teachers */}
      <TeachersWithoutProfileAlert
        count={teachersWithoutProfile.length}
        onAddProfile={handleOpenAdd}
      />

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
            <option value="false">Inactive</option>
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

      {/* Deactivate AlertDialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md bg-white border border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              Deactivate Salary Profile?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground mt-2">
              Deactivating this salary profile will skip{' '}
              <strong>
                {targetToggleProfile?.teacherProfileId?.user?.name || 'this teacher'}
              </strong>{' '}
              during all future monthly payroll generations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
