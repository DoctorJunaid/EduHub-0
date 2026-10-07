import { useState, useEffect, useCallback } from "react";
import * as classTeacherApi from "@/api/classTeacher.api";
import toast from "react-hot-toast";

export function useMyClass() {
  const [loading, setLoading] = useState(true);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchClassData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const assignmentRes = await classTeacherApi.getMyClassAssignment();
      if (assignmentRes?.data?.isClassTeacher) {
        setIsClassTeacher(true);
        setClassInfo(assignmentRes.data.classInfo);

        // Fetch students & today's attendance in parallel
        const [studentsRes, attendanceRes, statsRes] = await Promise.allSettled([
          classTeacherApi.getMyClassStudents(),
          classTeacherApi.getMyClassAttendance(),
          classTeacherApi.getMyClassStats(),
        ]);

        if (studentsRes.status === "fulfilled") {
          setStudents(studentsRes.value.data?.students || []);
        }
        if (attendanceRes.status === "fulfilled") {
          setAttendance(attendanceRes.value.data);
        }
        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value.data);
        }
      } else {
        setIsClassTeacher(false);
        setClassInfo(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const saveAttendance = async (records, date = null) => {
    try {
      const res = await classTeacherApi.markClassAttendance({
        date,
        records,
        classId: classInfo?.classId || classInfo?._id,
      });
      toast.success(res.message || "Attendance saved successfully!");
      // Refresh attendance
      const updatedAtt = await classTeacherApi.getMyClassAttendance(date);
      setAttendance(updatedAtt.data);
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save attendance";
      toast.error(msg);
      throw err;
    }
  };

  return {
    loading,
    isClassTeacher,
    classInfo,
    students,
    attendance,
    stats,
    error,
    refresh: fetchClassData,
    saveAttendance,
  };
}

export default useMyClass;
