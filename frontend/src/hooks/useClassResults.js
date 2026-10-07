import { useState, useEffect, useCallback } from "react";
import * as resultApi from "@/api/result.api";
import toast from "react-hot-toast";

export function useClassResults(classId = null, examName = "Midterm Examination", term = "Midterm") {
  const [loading, setLoading] = useState(true);
  const [gridData, setGridData] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resultApi.getClassResultsGrid({
        classId,
        examName,
        term,
      });
      setGridData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [classId, examName, term]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const compileResults = async () => {
    setIsCompiling(true);
    try {
      const targetClassId = classId || gridData?.classInfo?.classId;
      const res = await resultApi.compileClassResults({
        classId: targetClassId,
        examName,
        term,
      });
      toast.success(res.message || "Class results compiled successfully!");
      await fetchResults();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to compile results";
      toast.error(msg);
      throw err;
    } finally {
      setIsCompiling(false);
    }
  };

  const saveRemarks = async (studentId, remarks) => {
    try {
      const targetClassId = classId || gridData?.classInfo?.classId;
      const res = await resultApi.saveStudentRemarks(studentId, {
        classId: targetClassId,
        examName,
        term,
        remarks,
      });
      toast.success("Remarks saved!");
      await fetchResults();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save remarks";
      toast.error(msg);
      throw err;
    }
  };

  const submitForApproval = async () => {
    setIsSubmitting(true);
    try {
      const targetClassId = classId || gridData?.classInfo?.classId;
      const res = await resultApi.submitClassResultsForApproval({
        classId: targetClassId,
        examName,
        term,
      });
      toast.success(res.message || "Results submitted to Campus Admin for approval!");
      await fetchResults();
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to submit results";
      toast.error(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const remindTeacher = async (teacherId, subject) => {
    try {
      const targetClassId = classId || gridData?.classInfo?.classId;
      const res = await resultApi.remindSubjectTeacher(teacherId, {
        classId: targetClassId,
        subject,
        examName,
      });
      toast.success(res.message || `Reminder sent for ${subject}!`);
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to send reminder";
      toast.error(msg);
      throw err;
    }
  };

  return {
    loading,
    gridData,
    isCompiling,
    isSubmitting,
    error,
    refresh: fetchResults,
    compileResults,
    saveRemarks,
    submitForApproval,
    remindTeacher,
  };
}

export default useClassResults;
