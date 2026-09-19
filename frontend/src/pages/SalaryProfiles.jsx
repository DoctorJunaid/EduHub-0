import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import EditProfileDialog from '../components/SalaryProfiles/EditProfileDialog';
import { Users, Edit2, Plus, Search, WalletCards, ReceiptText, BadgeDollarSign } from 'lucide-react';
import './SalaryProfiles.css';

const SalaryProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const profilesResponse = await api.get('/campus/salary/profiles');
      if (profilesResponse.data.success) {
        setProfiles(profilesResponse.data.data || []);
      } else {
        setError(profilesResponse.data.message || 'Failed to load salary profiles');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load salary profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const openEdit = async (profile) => {
    if (!profile && teachers.length === 0) {
      try {
        const response = await api.get('/campus/salary/profiles/teachers');
        if (!response.data.success) throw new Error(response.data.message);
        setTeachers(response.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load teachers for the salary profile.');
        return;
      }
    }
    setSelectedProfile(profile);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedProfile(null);
  };

  const handleSave = async (profileData) => {
    try {
      const teacherId = profileData.teacherProfileId?._id || profileData.teacherProfileId || profileData._id;
      await api.put(`/campus/salary/profiles/${teacherId}`, profileData);
      await fetchProfiles();
    } catch (err) {
      console.error(err);
      setError('Failed to save profile');
    } finally {
      closeDialog();
    }
  };

  const visibleProfiles = profiles.filter((profile) => {
    const teacher = profile.teacherProfileId;
    const name = teacher?.user?.name || teacher?.employeeId || teacher || '';
    return String(name).toLowerCase().includes(search.trim().toLowerCase());
  });
  const formatPKR = (value) => `PKR ${Number(value || 0).toLocaleString('en-PK')}`;
  const totalBase = profiles.reduce((sum, profile) => sum + Number(profile.baseSalary || 0), 0);
  const totalAllowances = profiles.reduce((sum, profile) => sum + (profile.allowances || []).reduce((amount, item) => amount + Number(item.amount || 0), 0), 0);
  const totalDeductions = profiles.reduce((sum, profile) => sum + Number(profile.taxDeduction || 0) + Number(profile.otherDeduction || 0), 0);

  if (loading) return <div className="salary-profiles-page campus-tab-page salary-profiles-state">Loading salary profiles...</div>;
  if (error) return <div className="salary-profiles-page campus-tab-page salary-profiles-state salary-profiles-error">{error}</div>;

  return (
    <div className="salary-profiles-page campus-tab-page">
      <div className="salary-profiles-heading">
        <div><span className="salary-profiles-eyebrow">Finance / compensation</span><h1>Salary Profiles</h1><p>Maintain base salary, allowances, and recurring deductions for teaching staff.</p></div>
        <button type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer border-0" onClick={() => openEdit(null)}><Plus size={14} /> Add Profile</button>
      </div>

      <div className="campus-kpi-track salary-profiles-kpis">
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><Users size={16} /></div><div className="kpi-info"><span className="kpi-label">Configured Staff</span><span className="kpi-value">{profiles.length}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><BadgeDollarSign size={16} /></div><div className="kpi-info"><span className="kpi-label">Base Payroll</span><span className="kpi-value">{formatPKR(totalBase)}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><WalletCards size={16} /></div><div className="kpi-info"><span className="kpi-label">Allowances</span><span className="kpi-value">{formatPKR(totalAllowances)}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><ReceiptText size={16} /></div><div className="kpi-info"><span className="kpi-label">Recurring Deductions</span><span className="kpi-value">{formatPKR(totalDeductions)}</span></div></div></div>
      </div>

      <div className="campus-toolbar">
        <div className="toolbar-left"><div className="toolbar-search"><Search size={13} /><input type="search" placeholder="Search teacher..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>{search && <button type="button" className="toolbar-btn toolbar-btn-outline" onClick={() => setSearch('')}>Reset</button>}</div>
        <div className="toolbar-actions"><span className="salary-profiles-result-count">{visibleProfiles.length} of {profiles.length} profiles</span></div>
      </div>

      <div className="campus-table-container salary-profiles-table-wrap">
        <div className="overflow-x-auto"><table className="salary-profiles-table">
          <thead>
            <tr>
              <th>Teacher</th><th>Base salary</th><th>Allowances</th><th>Tax</th><th>Other</th><th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleProfiles.length === 0 ? <tr><td colSpan="6" className="salary-profiles-empty">No salary profiles match this search.</td></tr> : visibleProfiles.map((p) => (
              <tr key={p._id}>
                <td><div className="salary-profile-person"><span>{(p.teacherProfileId?.user?.name || 'T').slice(0, 1)}</span><div><strong>{p.teacherProfileId?.user?.name || p.teacherProfileId?.employeeId || p.teacherProfileId || 'Unknown teacher'}</strong><small>{p.teacherProfileId?.designation || p.teacherProfileId?.department || 'Teaching staff'}</small></div></div>
                </td>
                <td><strong className="salary-amount">{formatPKR(p.baseSalary)}</strong></td>
                <td>
                  {p.allowances && p.allowances.length > 0
                    ? <div className="allowance-stack">{p.allowances.map((a, i) => (
                      <div key={i}><span>{a.name}</span><strong>{formatPKR(a.amount)}</strong></div>
                    ))}</div>
                    : <span className="salary-muted">No allowances</span>}
                </td>
                <td><span className="salary-deduction">{formatPKR(p.taxDeduction)}</span></td>
                <td><span className="salary-deduction">{formatPKR(p.otherDeduction)}</span></td>
                <td className="text-right"><button type="button" onClick={() => openEdit(p)} className="salary-edit-btn"><Edit2 size={13} /> Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {dialogOpen && (
        <EditProfileDialog
          profile={selectedProfile}
          teachers={teachers}
          onClose={closeDialog}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default SalaryProfiles;
