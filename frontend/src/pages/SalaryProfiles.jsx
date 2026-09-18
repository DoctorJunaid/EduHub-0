import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import EditProfileDialog from '../components/SalaryProfiles/EditProfileDialog';
import { Users, Edit2, Plus } from 'lucide-react';

const SalaryProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/campus/salary/profiles');
      if (res.data.success) {
        setProfiles(res.data.data);
      } else {
        setError('Failed to load salary profiles');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching salary profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const openEdit = (profile) => {
    setSelectedProfile(profile);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedProfile(null);
  };

  const handleSave = async (profileData) => {
    try {
      const teacherId = profileData.teacherProfileId || profileData._id;
      await api.put(`/campus/salary/profiles/${teacherId}`, profileData);
      await fetchProfiles();
    } catch (err) {
      console.error(err);
      setError('Failed to save profile');
    } finally {
      closeDialog();
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Loading salary profiles...</div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Salary Profiles</h1>
        <button
          onClick={() => openEdit(null)}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Profile
        </button>
      </div>
      <div className="overflow-x-auto glass-panel p-4 rounded-xl">
        <table className="min-w-full text-left text-white">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="px-4 py-2">Teacher</th>
              <th className="px-4 py-2">Base Salary</th>
              <th className="px-4 py-2">Allowances</th>
              <th className="px-4 py-2">Tax</th>
              <th className="px-4 py-2">Other</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p._id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-2">{p.teacherProfileId || '—'}</td>
                <td className="px-4 py-2">{p.baseSalary}</td>
                <td className="px-4 py-2">
                  {p.allowances && p.allowances.length > 0
                    ? p.allowances.map((a, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{a.name}:</span>
                          <span>{a.amount}</span>
                        </div>
                      ))
                    : '—'}
                </td>
                <td className="px-4 py-2">{p.taxDeduction}</td>
                <td className="px-4 py-2">{p.otherDeduction}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex items-center text-indigo-400 hover:text-indigo-300"
                  >
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dialogOpen && (
        <EditProfileDialog
          profile={selectedProfile}
          onClose={closeDialog}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default SalaryProfiles;
