import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as salaryApi from '../api/salaryProfile.api';

export default function useSalaryProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    isActive: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
  });
  const [teachersWithoutProfile, setTeachersWithoutProfile] = useState([]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesResult, teachersResult] = await Promise.allSettled([
        salaryApi.listSalaryProfiles(filters),
        salaryApi.listTeachersWithoutSalaryProfile(),
      ]);

      let errorMessage = null;

      if (profilesResult.status === 'fulfilled' && profilesResult.value?.data?.success) {
        setProfiles(profilesResult.value.data.data || []);
        setPagination({
          total: profilesResult.value.data.count || 0,
          page: profilesResult.value.data.pagination?.page || filters.page,
          limit: profilesResult.value.data.pagination?.limit || filters.limit,
        });
      } else if (profilesResult.status === 'rejected') {
        errorMessage = profilesResult.reason?.response?.data?.message || 'Failed to load salary profiles';
      }

      if (teachersResult.status === 'fulfilled' && teachersResult.value?.data?.success) {
        setTeachersWithoutProfile(teachersResult.value.data.data || []);
      }

      if (errorMessage) {
        toast.error(errorMessage, { id: 'salary-profiles-load-error' });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to load salary profiles';
      toast.error(msg, { id: 'salary-profiles-load-error' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    reload();
  }, [reload]);

  const upsert = async (teacherId, payload) => {
    try {
      const response = await salaryApi.saveSalaryProfile(teacherId, payload);
      toast.success(response.data?.message || 'Salary profile saved');
      await reload();
      return response.data?.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save profile';
      toast.error(msg, { id: 'salary-profiles-save-error' });
      throw error;
    }
  };

  const deactivate = async (teacherId) => {
    try {
      const response = await salaryApi.deactivateSalaryProfile(teacherId);
      toast.success(response.data?.message || 'Profile deactivated');
      await reload();
      return response.data?.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to deactivate profile';
      toast.error(msg, { id: 'salary-profiles-deactivate-error' });
      throw error;
    }
  };

  const activate = async (teacherId) => {
    try {
      const response = await salaryApi.activateSalaryProfile(teacherId);
      toast.success(response.data?.message || 'Profile activated');
      await reload();
      return response.data?.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to activate profile';
      toast.error(msg, { id: 'salary-profiles-activate-error' });
      throw error;
    }
  };

  return {
    profiles,
    loading,
    filters,
    setFilters,
    pagination,
    teachersWithoutProfile,
    reload,
    upsert,
    deactivate,
    activate,
  };
}
