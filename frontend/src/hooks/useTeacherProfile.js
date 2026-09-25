import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import * as api from "../api/teacherProfile.api";

export function useTeacherProfile(teacherId) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lazy tab data caches
  const [classesData, setClassesData] = useState(null);
  const [timetableData, setTimetableData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [substitutesData, setSubstitutesData] = useState(null);
  const [activityData, setActivityData] = useState(null);

  // Tab-specific loading states
  const [loadingTab, setLoadingTab] = useState({
    classes: false,
    timetable: false,
    attendance: false,
    payroll: false,
    substitutes: false,
    activity: false,
  });

  const fetchProfile = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTeacherProfileApi(teacherId);
      setProfileData(res.data);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || "Failed to load teacher profile";
      setError({
        status: status || 500,
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const loadClasses = useCallback(async (force = false) => {
    if (!force && classesData) return;
    setLoadingTab((prev) => ({ ...prev, classes: true }));
    try {
      const res = await api.getTeacherClassesApi(teacherId);
      setClassesData(res.data || []);
    } catch {
      toast.error("Failed to load assigned classes");
    } finally {
      setLoadingTab((prev) => ({ ...prev, classes: false }));
    }
  }, [teacherId, classesData]);

  const loadTimetable = useCallback(async (force = false) => {
    if (!force && timetableData) return;
    setLoadingTab((prev) => ({ ...prev, timetable: true }));
    try {
      const res = await api.getTeacherTimetableApi(teacherId);
      setTimetableData(res.data);
    } catch {
      toast.error("Failed to load weekly schedule");
    } finally {
      setLoadingTab((prev) => ({ ...prev, timetable: false }));
    }
  }, [teacherId, timetableData]);

  const loadAttendance = useCallback(async (days = 30, force = false) => {
    if (!force && attendanceData) return;
    setLoadingTab((prev) => ({ ...prev, attendance: true }));
    try {
      const res = await api.getTeacherAttendanceApi(teacherId, days);
      setAttendanceData(res.data);
    } catch {
      toast.error("Failed to load attendance records");
    } finally {
      setLoadingTab((prev) => ({ ...prev, attendance: false }));
    }
  }, [teacherId, attendanceData]);

  const loadPayroll = useCallback(async (force = false) => {
    if (!force && payrollData) return;
    setLoadingTab((prev) => ({ ...prev, payroll: true }));
    try {
      const res = await api.getTeacherPayrollApi(teacherId);
      setPayrollData(res.data);
    } catch {
      toast.error("Failed to load payroll history");
    } finally {
      setLoadingTab((prev) => ({ ...prev, payroll: false }));
    }
  }, [teacherId, payrollData]);

  const loadSubstitutes = useCallback(async (force = false) => {
    if (!force && substitutesData) return;
    setLoadingTab((prev) => ({ ...prev, substitutes: true }));
    try {
      const res = await api.getTeacherSubstitutesApi(teacherId);
      setSubstitutesData(res.data);
    } catch {
      toast.error("Failed to load substitute duties");
    } finally {
      setLoadingTab((prev) => ({ ...prev, substitutes: false }));
    }
  }, [teacherId, substitutesData]);

  const loadActivity = useCallback(async (force = false) => {
    if (!force && activityData) return;
    setLoadingTab((prev) => ({ ...prev, activity: true }));
    try {
      const res = await api.getTeacherActivityApi(teacherId);
      setActivityData(res.data);
    } catch {
      toast.error("Failed to load activity logs");
    } finally {
      setLoadingTab((prev) => ({ ...prev, activity: false }));
    }
  }, [teacherId, activityData]);

  const assignClass = async (data) => {
    try {
      await api.assignTeacherClassApi(teacherId, data);
      toast.success("Class assigned successfully");
      await loadClasses(true);
      fetchProfile();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to assign class";
      toast.error(msg);
      return false;
    }
  };

  const unassignClass = async (assignmentId) => {
    try {
      await api.unassignTeacherClassApi(teacherId, assignmentId);
      toast.success("Class unassigned successfully");
      await loadClasses(true);
      fetchProfile();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to unassign class";
      toast.error(msg);
      return false;
    }
  };

  return {
    profileData,
    teacher: profileData?.teacher,
    stats: profileData?.stats,
    loading,
    error,
    refetchProfile: fetchProfile,

    // Tab data & Loaders
    classesData,
    timetableData,
    attendanceData,
    payrollData,
    substitutesData,
    activityData,
    loadingTab,

    loadClasses,
    loadTimetable,
    loadAttendance,
    loadPayroll,
    loadSubstitutes,
    loadActivity,

    // Mutations
    assignClass,
    unassignClass,
  };
}
