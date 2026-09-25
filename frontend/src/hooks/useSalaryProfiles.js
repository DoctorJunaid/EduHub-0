import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as salaryApi from '../api/salaryProfile.api';
import { qk } from '@/lib/queryKeys';

export default function useSalaryProfiles() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    isActive: '',
    page: 1,
    limit: 20,
  });

  // Query for Salary Profiles with automatic caching and deduplication
  const {
    data: profilesData,
    isLoading: loadingProfiles,
    refetch: refetchProfiles,
  } = useQuery({
    queryKey: qk.salaryProfiles(filters),
    queryFn: async () => {
      const res = await salaryApi.listSalaryProfiles(filters);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Query for Teachers without Salary Profile
  const {
    data: teachersWithoutProfileData,
    isLoading: loadingTeachers,
    refetch: refetchTeachers,
  } = useQuery({
    queryKey: ['teachers-without-salary-profile'],
    queryFn: async () => {
      const res = await salaryApi.listTeachersWithoutSalaryProfile();
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const profiles = profilesData?.data || [];
  const summary = profilesData?.summary || { total: 0, active: 0, deactivated: 0 };
  const pagination = {
    total: profilesData?.count ?? profilesData?.total ?? profiles.length,
    page: profilesData?.pagination?.page || filters.page,
    limit: profilesData?.pagination?.limit || filters.limit,
  };
  const teachersWithoutProfile = teachersWithoutProfileData || [];
  const loading = loadingProfiles || loadingTeachers;

  const reload = async () => {
    await Promise.all([refetchProfiles(), refetchTeachers()]);
  };

  // Upsert Mutation
  const upsertMutation = useMutation({
    mutationFn: async ({ teacherId, payload }) => {
      const response = await salaryApi.saveSalaryProfile(teacherId, payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Salary profile saved');
      queryClient.invalidateQueries({ queryKey: ['salary-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['teachers-without-salary-profile'] });
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to save profile';
      toast.error(msg, { id: 'salary-profiles-save-error' });
    },
  });

  // Deactivate Mutation
  const deactivateMutation = useMutation({
    mutationFn: async (teacherId) => {
      let response;
      try {
        response = await salaryApi.deactivateSalaryProfile(teacherId);
      } catch {
        const targetProfile = profiles.find(
          (p) =>
            String(p._id) === String(teacherId) ||
            String(p.teacherProfileId?._id || p.teacherProfileId) === String(teacherId)
        );
        const baseSalary = targetProfile?.baseSalary || 0;
        const allowances = targetProfile?.allowances || [];
        response = await salaryApi.saveSalaryProfile(teacherId, {
          baseSalary,
          allowances,
          isActive: false,
        });
      }
      return response?.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Profile deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['salary-profiles'] });
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to deactivate profile';
      toast.error(msg, { id: 'salary-profiles-deactivate-error' });
    },
  });

  // Activate Mutation
  const activateMutation = useMutation({
    mutationFn: async (teacherId) => {
      let response;
      try {
        response = await salaryApi.activateSalaryProfile(teacherId);
      } catch {
        const targetProfile = profiles.find(
          (p) =>
            String(p._id) === String(teacherId) ||
            String(p.teacherProfileId?._id || p.teacherProfileId) === String(teacherId)
        );
        const baseSalary = targetProfile?.baseSalary || 0;
        const allowances = targetProfile?.allowances || [];
        response = await salaryApi.saveSalaryProfile(teacherId, {
          baseSalary,
          allowances,
          isActive: true,
        });
      }
      return response?.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Profile activated successfully');
      queryClient.invalidateQueries({ queryKey: ['salary-profiles'] });
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to activate profile';
      toast.error(msg, { id: 'salary-profiles-activate-error' });
    },
  });

  return {
    profiles,
    loading,
    filters,
    setFilters,
    pagination,
    summary,
    teachersWithoutProfile,
    reload,
    upsert: (teacherId, payload) => upsertMutation.mutateAsync({ teacherId, payload }),
    deactivate: (teacherId) => deactivateMutation.mutateAsync(teacherId),
    activate: (teacherId) => activateMutation.mutateAsync(teacherId),
  };
}
