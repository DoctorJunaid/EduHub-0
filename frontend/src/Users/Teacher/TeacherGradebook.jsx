import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Award,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Trash2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import {
  getTeacherGradebookClasses,
  getGradebookStudents,
  getGradebookExams,
  getGradebookResults,
  saveGradebookResult,
  deleteGradebookResult,
} from "@/api/gradebook.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { Spinner, SpinnerCustom } from "@/components/ui/spinner";
import TeacherConfirmDialog from "./TeacherConfirmDialog";
import TeacherPagination from "./TeacherPagination";
import "./TeacherGradebook.css";

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ST";

const calculateGradeAndGpa = (percentage) => {
  const p = Math.round(Number(percentage) * 10) / 10;
  if (p >= 90) return { grade: "A+", gpa: 4.0 };
  if (p >= 85) return { grade: "A", gpa: 3.7 };
  if (p >= 80) return { grade: "A-", gpa: 3.5 };
  if (p >= 75) return { grade: "B+", gpa: 3.3 };
  if (p >= 70) return { grade: "B", gpa: 3.0 };
  if (p >= 65) return { grade: "B-", gpa: 2.7 };
  if (p >= 60) return { grade: "C+", gpa: 2.3 };
  if (p >= 50) return { grade: "C", gpa: 2.0 };
  if (p >= 40) return { grade: "D", gpa: 1.0 };
  return { grade: "F", gpa: 0.0 };
};

export default function TeacherGradebook() {
  const [params] = useSearchParams();

  // Backend Data State
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [selectedTerm, setSelectedTerm] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Dialog & Action States
  const [editingResult, setEditingResult] = useState(null); // null = closed, {} = add, obj = edit
  const [modalClassId, setModalClassId] = useState("");
  const [modalStudents, setModalStudents] = useState([]);
  const [loadingModalStudents, setLoadingModalStudents] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form interactive calculation state
  const [formMarksObtained, setFormMarksObtained] = useState(85);
  const [formTotalMarks, setFormTotalMarks] = useState(100);

  // 1. Fetch Classes on mount
  const loadClasses = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      setLoadError("");

      const res = await getTeacherGradebookClasses();
      const loadedClasses = res.data?.data || [];
      setClasses(loadedClasses);

      if (loadedClasses.length > 0) {
        const requestedClassId = params.get("classId");
        const found = loadedClasses.find(
          (c) => String(c.id || c._id || c.classId) === requestedClassId
        );
        setSelectedClassId(
          found
            ? String(found.id || found._id || found.classId)
            : String(loadedClasses[0].id || loadedClasses[0]._id || loadedClasses[0].classId)
        );
      } else {
        setSelectedClassId("");
      }

      if (showToast) toast.success("Classes synchronized.");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load assigned classes.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const selectedClass = useMemo(() => {
    return (
      classes.find(
        (c) => String(c.id || c._id || c.classId) === String(selectedClassId)
      ) || classes[0]
    );
  }, [classes, selectedClassId]);

  // 2. Fetch Students, Exams & Results when Class or Term changes
  const loadClassData = useCallback(async (cls, termVal) => {
    if (!cls && !selectedClassId) {
      setStudents([]);
      setExams([]);
      setResults([]);
      return;
    }
    try {
      setLoadingResults(true);
      const cId = cls?.id || cls?._id || cls?.classId || selectedClassId;
      const cName = cls?.className || cls?.gradeOrClass || "";
      const cSec = cls?.section || "";
      const cSub = cls?.subject || "";

      const [studentsRes, examsRes, resultsRes] = await Promise.all([
        getGradebookStudents({ classId: cId, className: cName, section: cSec }),
        getGradebookExams({ className: cName, section: cSec, subject: cSub }),
        getGradebookResults({
          className: cName,
          section: cSec,
          subject: cSub,
          term: termVal !== "All" ? termVal : undefined,
        }),
      ]);

      const loadedStudents = studentsRes.data?.data || [];
      setStudents(loadedStudents);
      setExams(examsRes.data?.data || []);
      setResults(resultsRes.data?.data?.results || []);
      setStats(resultsRes.data?.data?.stats || null);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load gradebook records."
      );
    } finally {
      setLoadingResults(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClass) {
      void loadClassData(selectedClass, selectedTerm);
    }
  }, [selectedClass, selectedTerm, loadClassData]);

  // Load Registered Students for Modal Class Selector
  useEffect(() => {
    const targetId = modalClassId || selectedClassId;
    if (!targetId && !classes.length) return;
    const targetCls = classes.find(
      (c) => String(c.id || c._id || c.classId) === String(targetId)
    ) || selectedClass;

    if (targetCls) {
      setLoadingModalStudents(true);
      getGradebookStudents({
        classId: targetCls.id || targetCls._id || targetCls.classId,
        className: targetCls.className || targetCls.gradeOrClass,
        section: targetCls.section,
      })
        .then((res) => {
          setModalStudents(res.data?.data || []);
        })
        .catch(() => {
          setModalStudents([]);
        })
        .finally(() => {
          setLoadingModalStudents(false);
        });
    }
  }, [modalClassId, selectedClassId, classes, selectedClass]);

  // Extract available distinct terms
  const termsList = useMemo(() => {
    const set = new Set(["Midterm", "Final Term", "Term 1", "Term 2", "Monthly"]);
    results.forEach((r) => {
      if (r.term) set.add(r.term);
    });
    return Array.from(set);
  }, [results]);

  // Filtered Results with Search
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return results.filter((row) => {
      const studentName = (row.student?.name || "").toLowerCase();
      const rollNo = (row.student?.rollNumber || "").toLowerCase();
      const examName = (row.examName || "").toLowerCase();
      const subject = (row.subject || "").toLowerCase();
      const remarks = (row.remarks || "").toLowerCase();

      return (
        !q ||
        studentName.includes(q) ||
        rollNo.includes(q) ||
        examName.includes(q) ||
        subject.includes(q) ||
        remarks.includes(q)
      );
    });
  }, [results, searchQuery]);

  // Pagination Math
  const pageCount = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filteredResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Open Add Marks Dialog
  const openAddMarks = () => {
    const defaultCls = selectedClass || classes[0];
    const defaultClsId = defaultCls
      ? String(defaultCls.id || defaultCls._id || defaultCls.classId)
      : "";
    setModalClassId(defaultClsId);
    setFormMarksObtained(85);
    setFormTotalMarks(100);
    setEditingResult({
      classId: defaultClsId,
      studentId: students[0]?.id || students[0]?._id || "",
      examName: exams[0]?.examName || "Midterm Examination",
      term: "Midterm",
      totalMarks: 100,
      marksObtained: 85,
      remarks: "",
    });
  };

  // Open Edit Marks Dialog
  const openEditMarks = (row) => {
    const matchedClass = classes.find(
      (c) => c.className === row.className && c.section === row.section
    ) || selectedClass;
    const defaultClsId = matchedClass
      ? String(matchedClass.id || matchedClass._id || matchedClass.classId)
      : selectedClassId;
    setModalClassId(defaultClsId);
    setFormMarksObtained(row.marksObtained || 0);
    setFormTotalMarks(row.totalMarks || 100);
    setEditingResult(row);
  };

  // Live calculation for the modal
  const formPercentage = useMemo(() => {
    const tot = Number(formTotalMarks) || 100;
    const obt = Number(formMarksObtained) || 0;
    if (tot <= 0) return 0;
    return Math.min(100, Math.round((obt / tot) * 1000) / 10);
  }, [formMarksObtained, formTotalMarks]);

  const formGradeInfo = useMemo(() => {
    return calculateGradeAndGpa(formPercentage);
  }, [formPercentage]);

  // 3. Save Marks Handler
  const handleSaveMarks = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const chosenClassId = String(form.get("modalClassId") || modalClassId || selectedClassId);
    const studentId = String(form.get("studentId") || "");
    const examName = String(form.get("examName") || "").trim();
    const term = String(form.get("term") || "Midterm").trim();
    const marksObtained = Number(form.get("marksObtained"));
    const totalMarks = Number(form.get("totalMarks") || 100);
    const remarks = String(form.get("remarks") || "").trim();

    const activeCls = classes.find(
      (c) => String(c.id || c._id || c.classId) === chosenClassId
    ) || selectedClass;

    if (!studentId) {
      toast.error("Please select a registered student.");
      return;
    }
    if (!examName) {
      toast.error("Please specify the assessment / exam name.");
      return;
    }
    if (isNaN(marksObtained) || marksObtained < 0) {
      toast.error("Marks obtained must be a positive number.");
      return;
    }
    if (isNaN(totalMarks) || totalMarks <= 0) {
      toast.error("Total maximum marks must be greater than 0.");
      return;
    }
    if (marksObtained > totalMarks) {
      toast.error(`Marks obtained (${marksObtained}) cannot exceed total marks (${totalMarks}).`);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        _id: editingResult?._id || editingResult?.id || undefined,
        studentId,
        examName,
        subject: activeCls?.subject || "General",
        className: activeCls?.className || "Class 10",
        section: activeCls?.section || "A",
        term,
        marksObtained,
        totalMarks,
        remarks,
      };

      const res = await saveGradebookResult(payload);
      if (res.data?.success) {
        toast.success(
          editingResult?._id || editingResult?.id
            ? "Marks updated successfully!"
            : "Student marks recorded successfully!"
        );
        setEditingResult(null);
        await loadClassData(selectedClass, selectedTerm);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to record student marks."
      );
    } finally {
      setSaving(false);
    }
  };

  // 4. Delete Marks Handler
  const handleDeleteMarks = async () => {
    if (!deleteTarget) return;
    try {
      const id = deleteTarget._id || deleteTarget.id;
      const res = await deleteGradebookResult(id);
      if (res.data?.success) {
        toast.success("Marks record deleted successfully.");
        setDeleteTarget(null);
        await loadClassData(selectedClass, selectedTerm);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to delete record."
      );
    }
  };

  return (
    <main
      className="campus-tab-page teacher-gradebook"
      aria-labelledby="teacher-gradebook-title"
    >
      {/* Header Toolbar */}
      <header className="campus-toolbar flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadClasses(true)}
            disabled={refreshing}
            className="toolbar-btn-outline flex items-center gap-1.5"
          >
            {refreshing ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Sync
          </Button>
        </div>

        <div className="toolbar-right">
          <Button
            className="toolbar-btn toolbar-btn-primary flex items-center gap-1.5"
            onClick={openAddMarks}
          >
            <Plus size={15} /> Add Marks
          </Button>
        </div>
      </header>

      {/* Main Workspace Card */}
      <section className="teacher-gradebook-card">
        {/* Filters Toolbar */}
        <div className="teacher-gradebook-filters">
          <label className="teacher-gradebook-search">
            <Search size={16} />
            <span className="sr-only">Search students</span>
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search students, roll number..."
            />
          </label>

          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setPage(1);
            }}
            disabled={loading || classes.length === 0}
            aria-label="Select assigned class"
            className="min-w-[220px]"
          >
            {classes.length === 0 ? (
              <option value="">No assigned classes</option>
            ) : (
              classes.map((row) => (
                <option
                  key={row.id || row._id || row.classId}
                  value={row.id || row._id || row.classId}
                >
                  {row.className} • Section {row.section} ({row.subject})
                </option>
              ))
            )}
          </select>

          <select
            value={selectedTerm}
            onChange={(e) => {
              setSelectedTerm(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by academic term"
          >
            <option value="All">All Terms</option>
            {termsList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Gradebook Table Area */}
        <div className="teacher-gradebook-table-wrap">
          {loading || loadingResults ? (
            <div className="py-16 text-center text-slate-500">
              <SpinnerCustom
                text="Loading student evaluations &amp; marks..."
                size="lg"
                className="flex-col gap-2"
              />
            </div>
          ) : loadError ? (
            <div className="py-16 text-center text-slate-500">
              <AlertCircle className="inline-block mb-2 text-rose-500" size={32} />
              <p className="font-semibold text-slate-700">{loadError}</p>
              <span className="text-xs text-slate-400 mt-1 block">
                Click Sync to reload classes.
              </span>
            </div>
          ) : classes.length === 0 ? (
            <div className="teacher-gradebook-empty">
              <span className="teacher-gradebook-empty-icon">
                <GraduationCap size={24} />
              </span>
              <strong>No assigned class found</strong>
              <p>Timetable sessions or academic classes will appear here automatically.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => loadClasses(true)}
              >
                <RefreshCw size={14} className="mr-1.5" /> Check for Classes
              </Button>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="teacher-gradebook-empty">
              <span className="teacher-gradebook-empty-icon">
                <Award size={24} />
              </span>
              <strong>No evaluation records found</strong>
              <p>
                {searchQuery
                  ? `No evaluations match your search query "${searchQuery}".`
                  : `Record exam marks, quizzes, or lab scores for ${selectedClass?.className} • Sec ${selectedClass?.section}.`}
              </p>
              <Button
                className="toolbar-btn toolbar-btn-primary mt-2"
                onClick={openAddMarks}
              >
                <Plus size={14} className="mr-1.5" /> Add Marks
              </Button>
            </div>
          ) : (
            <table
              className="campus-data-table teacher-gradebook-table"
              style={{ width: "100%", tableLayout: "fixed" }}
            >
              <thead>
                <tr>
                  <th style={{ width: "22%" }}>STUDENT NAME &amp; ROLL NO</th>
                  <th style={{ width: "14%" }}>PROGRAM &amp; SECTION</th>
                  <th style={{ width: "18%" }}>ASSESSMENT</th>
                  <th style={{ width: "14%" }}>MARKS OBTAINED</th>
                  <th style={{ width: "10%" }}>LETTER GRADE</th>
                  <th style={{ width: "8%" }}>GPA POINT</th>
                  <th style={{ width: "18%" }}>TEACHER REMARKS</th>
                  <th style={{ width: "6%", textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const student = row.student || {};
                  return (
                    <tr key={row._id || row.id}>
                      <td>
                        <span className="teacher-gradebook-student">
                          <span className="teacher-avatar">
                            {initials(student.name)}
                          </span>
                          <div>
                            <strong>{student.name || "Student"}</strong>
                            <small>{student.rollNumber || "Roll N/A"}</small>
                          </div>
                        </span>
                      </td>
                      <td>
                        <span className="font-medium text-slate-800 text-xs">
                          {student.program || row.className || "Class 10"}
                        </span>
                        <small className="block text-slate-500 text-[11px]">
                          Sec: {student.section || row.section || "A"}
                        </small>
                      </td>
                      <td>
                        <strong className="text-slate-800 text-xs block">
                          {row.examName}
                        </strong>
                        <small className="text-slate-500 text-[11px]">
                          {row.subject} • {row.term}
                        </small>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-900 text-xs">
                          {row.marksObtained} / {row.totalMarks}
                        </span>
                        <small className="block text-slate-500 text-[11px]">
                          ({row.percentage}%)
                        </small>
                      </td>
                      <td>
                        <span
                          className={`teacher-grade-badge ${
                            row.grade.startsWith("A")
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : row.grade.startsWith("B")
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : row.grade.startsWith("C")
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {row.grade}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-800 text-xs">
                          {row.gpa?.toFixed(1) || "0.0"}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-600 line-clamp-2">
                          {row.remarks || "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-slate-500 hover:text-slate-800"
                            aria-label={`Edit marks for ${student.name}`}
                            onClick={() => openEditMarks(row)}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-slate-400 hover:text-rose-600"
                            aria-label={`Delete record for ${student.name}`}
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer with Pagination */}
        <footer className="teacher-gradebook-footer">
          <span>
            Showing{" "}
            {filteredResults.length ? (currentPage - 1) * pageSize + 1 : 0}
            –
            {Math.min(currentPage * pageSize, filteredResults.length)} of{" "}
            {filteredResults.length} matching records
          </span>
          <TeacherPagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            label="Gradebook pages"
          />
        </footer>
      </section>

      {/* Add / Edit Marks Dialog */}
      <Dialog
        open={editingResult !== null}
        onOpenChange={(open) => !open && setEditingResult(null)}
      >
        <DialogContent className="teacher-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingResult?._id || editingResult?.id
                ? "Edit Student Marks"
                : "Record Assessment Marks"}
            </DialogTitle>
            <DialogDescription>
              Select an enrolled student in the class to record their score for quizzes, midterms, finals, or practical evaluations.
            </DialogDescription>
          </DialogHeader>

          {editingResult !== null && (
            <form onSubmit={handleSaveMarks}>
              <div className="teacher-dialog-body teacher-dialog-grid">
                {/* 1. Assigned Class & Subject Selection */}
                {classes.length > 0 && (
                  <label className="teacher-dialog-field-full">
                    Assigned Class &amp; Section
                    <select
                      name="modalClassId"
                      value={modalClassId}
                      onChange={(e) => setModalClassId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden min-h-[42px]"
                    >
                      {classes.map((c) => (
                        <option
                          key={c.id || c._id || c.classId}
                          value={c.id || c._id || c.classId}
                        >
                          {c.className} • Section {c.section} ({c.subject})
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {/* 2. Registered Student Dropdown */}
                <label className="teacher-dialog-field-full">
                  Student Name &amp; Roll Number (Registered in this Class)
                  <select
                    name="studentId"
                    defaultValue={
                      editingResult.studentId ||
                      editingResult.student?._id ||
                      modalStudents[0]?.id ||
                      modalStudents[0]?._id ||
                      ""
                    }
                    required
                    disabled={loadingModalStudents || modalStudents.length === 0}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden min-h-[42px]"
                  >
                    {loadingModalStudents ? (
                      <option disabled value="">
                        Loading registered students...
                      </option>
                    ) : modalStudents.length === 0 ? (
                      <option disabled value="">
                        No registered students found in this class section
                      </option>
                    ) : (
                      modalStudents.map((s) => (
                        <option key={s.id || s._id} value={s.id || s._id}>
                          {s.name} ({s.rollNumber || "Roll N/A"}) • {s.gradeOrClass || "Class 10"} - Sec {s.section || "A"}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="teacher-dialog-field-full">
                  Assessment / Exam Title
                  <input
                    name="examName"
                    required
                    placeholder="e.g. Midterm Examination, Chapter 3 Quiz, Final Lab Assessment"
                    defaultValue={editingResult.examName || ""}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden min-h-[42px]"
                  />
                </label>

                <label>
                  Academic Term
                  <select
                    name="term"
                    defaultValue={editingResult.term || "Midterm"}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden min-h-[42px]"
                  >
                    <option value="Midterm">Midterm</option>
                    <option value="Final Term">Final Term</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Monthly">Monthly Test</option>
                    <option value="Practical">Practical / Lab</option>
                  </select>
                </label>

                <label>
                  Total Maximum Marks
                  <input
                    name="totalMarks"
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={formTotalMarks}
                    onChange={(e) => setFormTotalMarks(Number(e.target.value) || 100)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden min-h-[42px]"
                  />
                </label>

                <label className="teacher-dialog-field-full">
                  Marks Obtained
                  <input
                    name="marksObtained"
                    type="number"
                    min="0"
                    max={formTotalMarks || 100}
                    step="0.5"
                    required
                    value={formMarksObtained}
                    onChange={(e) => setFormMarksObtained(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden min-h-[42px]"
                  />
                </label>

                {/* Live Preview Strip */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between col-span-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-amber-500 size-4" />
                    <span className="text-xs font-semibold text-slate-700">Calculated Evaluation:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-800">
                      Score: {formPercentage}%
                    </span>
                    <span className="teacher-grade-badge bg-emerald-50 text-emerald-700 border-emerald-200">
                      Grade: {formGradeInfo.grade}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      GPA: {formGradeInfo.gpa.toFixed(1)}
                    </span>
                  </div>
                </div>

                <label className="teacher-dialog-field-full">
                  Teacher Feedback &amp; Remarks
                  <textarea
                    name="remarks"
                    rows={2}
                    placeholder="e.g. Excellent conceptual clarity. Needs improvement in long derivation questions."
                    defaultValue={editingResult.remarks || ""}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </label>
              </div>

              <DialogFooter className="teacher-dialog-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingResult(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="toolbar-btn toolbar-btn-primary"
                  type="submit"
                  disabled={saving || modalStudents.length === 0}
                >
                  {saving ? "Saving..." : "Save Marks"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <TeacherConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Gradebook Record"
        description={`Are you sure you want to permanently delete the marks record for "${deleteTarget?.student?.name || 'this student'}" in "${deleteTarget?.examName}"?`}
        confirmText="Delete Record"
        onConfirm={handleDeleteMarks}
      />
    </main>
  );
}
