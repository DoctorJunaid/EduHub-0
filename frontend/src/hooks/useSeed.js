import { useState, useEffect, useCallback } from "react";
import seedApi from "../api/seed.api";

export function useSeed(campusId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);

  const steps = [
    { id: "grades", label: "Grades & Classes" },
    { id: "sections", label: "Sections (A-D)" },
    { id: "subjects", label: "Curriculum Subjects" },
    { id: "teachers", label: "60 Teachers & Salaries" },
    { id: "students", label: "1,440 Students" },
    { id: "timetable", label: "Weekly Timetables" },
    { id: "attendance", label: "30-Day Attendance" },
    { id: "payroll", label: "Monthly Payroll" },
  ];

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await seedApi.getStats(campusId);
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch seed stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [campusId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const addLog = (action, result, status = "success", duration = null) => {
    const newLog = {
      id: Date.now() + Math.random(),
      action,
      result,
      status,
      duration,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 10));
  };

  const seedFullStructure = async ({ teachers = 60, studentsPerClass = 30 } = {}) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentStep("grades");

      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          const idx = steps.findIndex((s) => s.id === prev);
          if (idx >= 0 && idx < steps.length - 1) {
            return steps[idx + 1].id;
          }
          return prev;
        });
      }, 8000);

      const res = await seedApi.seedFullStructure({ campusId, teachers, studentsPerClass });
      clearInterval(interval);
      setCurrentStep(steps[steps.length - 1].id);

      if (res && res.data) {
        setCredentials(res.data.credentials);
        setSummary(res.data.summary);
        addLog(
          "Seed Full School Structure",
          `Created ${res.data.grades} grades, ${res.data.sections} sections, ${res.data.teachers} teachers, ${res.data.students} students, and ${res.data.timetableSlots} timetable slots.`,
          "success",
          res.data.duration
        );
      }
      await fetchStats();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to seed full structure";
      setError(msg);
      addLog("Seed Full School Structure", `Failed: ${msg}`, "error");
      throw err;
    } finally {
      setLoading(false);
      setTimeout(() => setCurrentStep(null), 3000);
    }
  };

  const seedTeachers = async ({ count = 60, clearFirst = false }) => {
    try {
      setLoading(true);
      setError(null);
      const res = await seedApi.seedTeachers({ campusId, count, clearFirst });
      addLog(
        "Seed Teachers",
        `Created ${res.created} teachers with salary profiles and subject assignments.`
      );
      await fetchStats();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to seed teachers";
      setError(msg);
      addLog("Seed Teachers", `Failed: ${msg}`, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const seedStudents = async ({ studentsPerClass = 30, clearFirst = false }) => {
    try {
      setLoading(true);
      setError(null);
      const res = await seedApi.seedStudents({ campusId, studentsPerClass, clearFirst });
      addLog(
        "Seed Students",
        `Created ${res.totalStudents} students across ${res.classesCount} class sections.`
      );
      await fetchStats();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to seed students";
      setError(msg);
      addLog("Seed Students", `Failed: ${msg}`, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const seedAttendance = async ({ days = 30 }) => {
    try {
      setLoading(true);
      setError(null);
      const res = await seedApi.seedAttendance({ campusId, days });
      addLog(
        "Seed Attendance",
        `Created ${res.teacherRecordsCreated} teacher logs & ${res.studentRecordsCreated} student logs.`
      );
      await fetchStats();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to seed attendance";
      setError(msg);
      addLog("Seed Attendance", `Failed: ${msg}`, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const seedSubstitutes = async ({ days = 7 }) => {
    try {
      setLoading(true);
      setError(null);
      const res = await seedApi.seedSubstitutes({ campusId, days });
      addLog("Seed Substitutes", `Generated ${res.created} substitute duty assignments.`);
      await fetchStats();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to seed substitutes";
      setError(msg);
      addLog("Seed Substitutes", `Failed: ${msg}`, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await seedApi.clearTeachers(campusId);
      addLog("Clear Teachers", `Deleted ${res.deleted?.teacherUsers || 0} teachers and linked records.`);
      await fetchStats();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to clear teachers";
      setError(msg);
      addLog("Clear Teachers", `Failed: ${msg}`, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await seedApi.clearStudents(campusId);
      addLog("Clear Students", `Deleted ${res.deleted?.studentUsers || 0} students and linked records.`);
      await fetchStats();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to clear students";
      setError(msg);
      addLog("Clear Students", `Failed: ${msg}`, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await seedApi.clearAll(campusId);
      addLog("Clear All", `Cleared all teacher and student test data without touching admins.`);
      await fetchStats();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to clear all";
      setError(msg);
      addLog("Clear All", `Failed: ${msg}`, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetAll = async ({ teachers = 60, studentsPerClass = 30 } = {}) => {
    return seedFullStructure({ teachers, studentsPerClass });
  };

  return {
    stats,
    loading,
    statsLoading,
    error,
    credentials,
    summary,
    logs,
    currentStep,
    steps,
    fetchStats,
    seedFullStructure,
    seedTeachers,
    seedStudents,
    seedAttendance,
    seedSubstitutes,
    clearTeachers,
    clearStudents,
    clearAll,
    resetAll,
  };
}

export default useSeed;
