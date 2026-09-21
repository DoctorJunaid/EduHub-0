import React from 'react';
import { Pencil, Power, PowerOff } from 'lucide-react';

const formatPKR = (amount) => `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

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
              <th className="text-right">Actions</th>
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
                const name =
                  teacher.user?.name ||
                  teacher.employeeId ||
                  (typeof profile.teacherProfileId === 'string'
                    ? `Teacher #${profile.teacherProfileId.slice(-6)}`
                    : 'Unlinked Teacher');
                const email = teacher.user?.email || teacher.employeeId || '—';
                const department = teacher.department || 'Academic';
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
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Edit ${name}`}
                          className="salary-edit-btn"
                          onClick={() => onEdit(profile)}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          aria-label={`${profile.isActive ? 'Deactivate' : 'Activate'} ${name}`}
                          className={`salary-edit-btn ${
                            profile.isActive ? 'hover:text-red-600' : 'hover:text-green-600'
                          }`}
                          onClick={() => onToggleStatus(profile)}
                          title={profile.isActive ? 'Deactivate Profile' : 'Activate Profile'}
                        >
                          {profile.isActive ? <PowerOff size={12} /> : <Power size={12} />}
                        </button>
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
