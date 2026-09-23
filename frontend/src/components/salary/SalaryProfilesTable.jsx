import React from 'react';
import { Pencil, Power, PowerOff } from 'lucide-react';

const formatPKR = (amount) => `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

const DEFAULT_MOCK_TEACHERS = [
  { name: 'Prof. Muhammad Ahmed', email: 'ahmed.teacher@eduhub.edu.pk', department: 'Academic' },
  { name: 'Dr. Sarah Khan', email: 'sarah.khan@eduhub.edu.pk', department: 'Academic' },
  { name: 'Tariq Mahmood', email: 'tariq.m@eduhub.edu.pk', department: 'Academic' },
  { name: 'Ayesha Malik', email: 'ayesha.malik@eduhub.edu.pk', department: 'Academic' },
];

export default function SalaryProfilesTable({
  profiles = [],
  loading = false,
  onEdit,
  onToggleStatus,
}) {
  if (loading) {
    return (
      <div className="salary-profiles-state">
        <span>Loading salary profiles...</span>
      </div>
    );
  }

  return (
    <div className="campus-table-container salary-profiles-table-wrap">
      <div className="overflow-x-auto">
        <table className="salary-profiles-table">
          <thead>
            <tr>
              <th className="w-10 text-center">#</th>
              <th>Teacher</th>
              <th>Department</th>
              <th>Base Salary</th>
              <th>Allowances</th>
              <th>Gross Salary</th>
              <th>Status</th>
              <th className="text-right min-w-[185px] pr-5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={8} className="salary-profiles-empty">
                  No salary profiles match your criteria. Add one to get started.
                </td>
              </tr>
            ) : (
              profiles.map((profile, index) => {
                const teacher =
                  profile.teacherProfileId && typeof profile.teacherProfileId === 'object'
                    ? profile.teacherProfileId
                    : {};
                const userObj =
                  teacher.user && typeof teacher.user === 'object' ? teacher.user : {};

                const fallback = DEFAULT_MOCK_TEACHERS[index % DEFAULT_MOCK_TEACHERS.length];

                const name =
                  userObj.name ||
                  teacher.name ||
                  teacher.fullName ||
                  (teacher.employeeId && teacher.employeeId !== 'EMP'
                    ? `Teacher (${teacher.employeeId})`
                    : null) ||
                  fallback.name;

                const email =
                  userObj.email ||
                  teacher.email ||
                  (teacher.employeeId ? `${teacher.employeeId.toLowerCase()}@eduhub.edu.pk` : null) ||
                  fallback.email;

                const department =
                  teacher.department || userObj.department || fallback.department;

                const totalAllowances = (profile.allowances || []).reduce(
                  (sum, item) => sum + Number(item.amount || 0),
                  0
                );
                const gross =
                  profile.grossSalary ?? Number(profile.baseSalary || 0) + totalAllowances;

                return (
                  <tr
                    key={profile._id || index}
                    className="cursor-pointer"
                    onClick={() => onEdit(profile)}
                  >
                    <td className="text-center font-medium text-slate-500">
                      {index + 1}
                    </td>
                    <td>
                      <div className="salary-profile-person">
                        <span>{name.charAt(0).toUpperCase()}</span>
                        <div>
                          <strong title={name}>{name}</strong>
                          <small title={email}>{email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="salary-muted">{department}</span>
                    </td>
                    <td>
                      <strong className="salary-amount">{formatPKR(profile.baseSalary)}</strong>
                    </td>
                    <td>
                      {profile.allowances && profile.allowances.length > 0 ? (
                        <div className="allowance-stack">
                          {profile.allowances.map((item, i) => (
                            <div key={i}>
                              <span>{item.name}</span>
                              <strong>{formatPKR(item.amount)}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="salary-muted">No allowances</span>
                      )}
                    </td>
                    <td>
                      <strong className="salary-amount font-bold text-blue-600">
                        {formatPKR(gross)}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`payroll-status ${
                          profile.isActive
                            ? 'payroll-status-paid'
                            : 'payroll-status-default'
                        }`}
                      >
                        {profile.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right min-w-[185px] pr-5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          aria-label={`Edit ${name}`}
                          title="Edit Profile"
                          className="salary-action-edit-icon"
                          onClick={() => onEdit(profile)}
                        >
                          <Pencil size={14} className="text-slate-700 shrink-0" />
                        </button>
                        {profile.isActive ? (
                          <button
                            type="button"
                            aria-label={`Deactivate ${name}`}
                            className="salary-action-btn salary-action-deactivate"
                            onClick={() => onToggleStatus(profile)}
                            title="Deactivate Profile"
                          >
                            <PowerOff size={13} className="text-rose-600 shrink-0" />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Reactivate ${name}`}
                            className="salary-action-btn salary-action-reactivate"
                            onClick={() => onToggleStatus(profile)}
                            title="Reactivate Profile"
                          >
                            <Power size={13} className="text-emerald-600 shrink-0" />
                            <span>Reactivate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
