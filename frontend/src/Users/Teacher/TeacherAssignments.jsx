
import React, { useState, useId, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  MoreVertical,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock3,
  Users,
  Award,
  BookOpen,
  Filter,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  getTeacherClasses,
  getTeacherAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
} from "@/api/assignment.api";
import { selectTeacherIdentity } from "./teacherScope";
import { qk } from "@/lib/queryKeys";
import { useDebounce } from "@/hooks/useDebounce";
import TeacherConfirmDialog from "./TeacherConfirmDialog";
import TeacherPagination from "./TeacherPagination";
import { dateKey, validDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Spinner, SpinnerCustom } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "./TeacherAssignments.css";

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ST";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-CA") : "—";

export default function TeacherAssignments() {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const teacher = useSelector(selectTeacherIdentity);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  // Filters & Search
  const [selectedClassFilter, setSelectedClassFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [submissionQuery, setSubmissionQuery] = useState("");
  const debouncedSubmissionQuery = useDebounce(submissionQuery, 300);
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState("All");

  // Pagination
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [submissionPage, setSubmissionPage] = useState(1);
  const pageSize = 8;

  // Dialog States
  const [editingAssignment, setEditingAssignment] = useState(null); // null = closed, {} = create, obj = edit
  const [formClassChoice, setFormClassChoice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [gradingTarget, setGradingTarget] = useState(null); // { submission, assignment }

  const feedbackTextareaId = useId();

  // 1. Classes Query
  const classesQuery = useQuery({
    queryKey: qk.teacherClasses(),
    queryFn: async () => {
      const res = await getTeacherClasses();
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // 2. Assignments Query
  const assignmentsQuery = useQuery({
    queryKey: qk.teacherAssignments(),
    queryFn: async () => {
      const res = await getTeacherAssignments();
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const classes = classesQuery.data || [];
  const assignments = assignmentsQuery.data || [];

  // Sync selected assignment
  useEffect(() => {
    if (assignments.length > 0) {
      if (!selectedAssignmentId || !assignments.some((a) => (a._id || a.id) === selectedAssignmentId)) {
        const requestedSubId = params.get("submissionId");
        const found = requestedSubId
          ? assignments.find((a) => (a.submissions || []).some((s) => (s._id || s.id) === requestedSubId))
          : null;
        setSelectedAssignmentId(found ? (found._id || found.id) : (assignments[0]._id || assignments[0].id));
      }
    } else {
      setSelectedAssignmentId(null);
    }
  }, [assignments, selectedAssignmentId, params]);

  const selectedAssignment = useMemo(() => {
    return assignments.find((a) => (a._id || a.id) === selectedAssignmentId) || assignments[0] || null;
  }, [assignments, selectedAssignmentId]);

  // 3. Submissions Query for Selected Assignment
  const activeAssignmentId = selectedAssignment?._id || selectedAssignment?.id;
  const submissionsQuery = useQuery({
    queryKey: qk.teacherAssignmentSubmissions(activeAssignmentId),
    queryFn: async () => {
      if (!activeAssignmentId) return [];
      const res = await getAssignmentSubmissions(activeAssignmentId);
      return res.data?.data?.submissions || [];
    },
    enabled: Boolean(activeAssignmentId),
    staleTime: 5 * 60 * 1000,
  });

  const submissions = submissionsQuery.data || [];
  const loading = assignmentsQuery.isLoading || classesQuery.isLoading;
  const loadingSubmissions = submissionsQuery.isLoading;
  const isRefreshing = assignmentsQuery.isFetching || submissionsQuery.isFetching;
  const loadError =
    assignmentsQuery.error?.response?.data?.message ||
    classesQuery.error?.response?.data?.message ||
    "";

  // 4. Create / Update Assignment Mutation
  const saveAssignmentMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      if (id) {
        return updateAssignment(id, payload);
      }
      return createAssignment(payload);
    },
    onSuccess: (res, vars) => {
      toast.success(vars.id ? "Assignment updated successfully!" : "New assignment created successfully!");
      setEditingAssignment(null);
      queryClient.invalidateQueries({ queryKey: qk.teacherAssignments() });
      queryClient.invalidateQueries({ queryKey: qk.teacherTodayClasses() });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to save assignment record.");
    },
  });

  const handleSaveAssignment = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const classId = String(form.get("classId") || "");
    const customClassName = String(form.get("customClassName") || "").trim();
    const customSection = String(form.get("customSection") || "").trim();
    const customSubject = String(form.get("customSubject") || "").trim();
    const title = String(form.get("title") || "").trim();
    const dueDate = String(form.get("dueDate") || "");
    const totalMarks = Number(form.get("totalMarks"));
    const description = String(form.get("description") || "").trim();

    const selectedCls = classes.find(
      (c) => String(c.id || c._id || c.classId) === classId
    );

    const finalClassName =
      selectedCls?.className ||
      customClassName ||
      editingAssignment?.className ||
      "Class 10";
    const finalSection =
      selectedCls?.section ||
      customSection ||
      editingAssignment?.section ||
      "A";
    const finalSubject =
      selectedCls?.subject ||
      customSubject ||
      editingAssignment?.subject ||
      "General";

    if (!title) {
      toast.error("Please enter an assignment title.");
      return;
    }
    if (!dueDate || !validDate(dueDate)) {
      toast.error("Please enter a valid due date.");
      return;
    }
    if (isNaN(totalMarks) || totalMarks <= 0) {
      toast.error("Total marks must be a positive number.");
      return;
    }

    const payload = {
      classId: selectedCls?._id || editingAssignment?.classId || undefined,
      className: finalClassName,
      gradeOrClass: finalClassName,
      section: finalSection,
      subject: finalSubject,
      title,
      description,
      dueDate,
      totalMarks,
    };

    saveAssignmentMutation.mutate({
      id: editingAssignment?._id || editingAssignment?.id || undefined,
      payload,
    });
  };

  const savingAssignment = saveAssignmentMutation.isPending;

  // 5. Delete Assignment Mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: (aId) => deleteAssignment(aId),
    onSuccess: () => {
      toast.success("Assignment deleted successfully.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: qk.teacherAssignments() });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete assignment.");
    },
  });

  const handleDeleteAssignment = () => {
    if (!deleteTarget) return;
    deleteAssignmentMutation.mutate(deleteTarget._id || deleteTarget.id);
  };

  // 6. Grade Submission Mutation
  const gradeMutation = useMutation({
    mutationFn: ({ assignmentId, payload }) => gradeSubmission(assignmentId, payload),
    onSuccess: (res, vars) => {
      toast.success("Grade and feedback saved successfully!");
      setGradingTarget(null);
      queryClient.invalidateQueries({ queryKey: qk.teacherAssignmentSubmissions(vars.assignmentId) });
      queryClient.invalidateQueries({ queryKey: qk.teacherAssignments() });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit student grade.");
    },
  });

  const handleSaveGrade = (e) => {
    e.preventDefault();
    if (!gradingTarget) return;
    const form = new FormData(e.currentTarget);
    const score = Number(form.get("score"));
    const feedback = String(form.get("feedback") || "").trim();

    const maxMarks = gradingTarget.assignment?.totalMarks || 100;
    if (isNaN(score) || score < 0 || score > maxMarks) {
      toast.error(`Score must be between 0 and ${maxMarks}.`);
      return;
    }

    const aId = gradingTarget.assignment._id || gradingTarget.assignment.id;
    gradeMutation.mutate({
      assignmentId: aId,
      payload: {
        submissionId: gradingTarget.submission?.submissionId || gradingTarget.submission?._id,
        studentId: gradingTarget.submission?.studentId,
        score,
        feedback,
      },
    });
  };

  const submittingGrade = gradeMutation.isPending;

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesClass =
        selectedClassFilter === "All"
          ? true
          : a.classId === selectedClassFilter ||
            `${a.className} - ${a.section}` === selectedClassFilter;
      const matchesSearch =
        `${a.title || ""} ${a.subject || ""} ${a.className || ""} ${a.section || ""}`
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [assignments, selectedClassFilter, debouncedSearchQuery]);

  // Filtered Submissions for Selected Assignment
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesStatus =
        submissionStatusFilter === "All"
          ? true
          : s.status === submissionStatusFilter;
      const text =
        `${s.studentName || ""} ${s.rollNumber || ""} ${s.notes || ""} ${s.email || ""}`.toLowerCase();
      const matchesSearch = text.includes(debouncedSubmissionQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [submissions, submissionStatusFilter, debouncedSubmissionQuery]);

  // Pagination Math
  const assignmentPageCount = Math.max(
    1,
    Math.ceil(filteredAssignments.length / pageSize)
  );
  const currentAssignmentPage = Math.min(assignmentPage, assignmentPageCount);
  const visibleAssignments = filteredAssignments.slice(
    (currentAssignmentPage - 1) * pageSize,
    currentAssignmentPage * pageSize
  );

  const submissionPageCount = Math.max(
    1,
    Math.ceil(filteredSubmissions.length / pageSize)
  );
  const currentSubmissionPage = Math.min(submissionPage, submissionPageCount);
  const visibleSubmissions = filteredSubmissions.slice(
    (currentSubmissionPage - 1) * pageSize,
    currentSubmissionPage * pageSize
  );

  // Overall KPI Metrics
  const totalSubmissionsAll = assignments.reduce(
    (sum, a) => sum + (a.submissionsCount || 0),
    0
  );
  const totalGradedAll = assignments.reduce(
    (sum, a) => sum + (a.gradedCount || 0),
    0
  );
  const totalPendingAll = assignments.reduce(
    (sum, a) => sum + (a.pendingCount || 0),
    0
  );

  return (
    <main
      className="campus-tab-page teacher-assignments"
      aria-labelledby="teacher-assignments-title"
    >
      <h1 id="teacher-assignments-title" className="sr-only">
        Assignments &amp; Grading
      </h1>

      {/* 1. Header Toolbar */}
      <div className="teacher-assignments-toolbar">
        <div className="teacher-assignments-toolbar-filters">
          {classes.length > 0 && (
            <select
              value={selectedClassFilter}
              onChange={(e) => {
                setSelectedClassFilter(e.target.value);
                setAssignmentPage(1);
              }}
              className="teacher-assignments-class-filter"
              aria-label="Filter by assigned class"
            >
              <option value="All">All Assigned Classes ({classes.length})</option>
              {classes.map((c) => (
                <option
                  key={c.id || c._id}
                  value={c.id || c._id}
                >
                  {c.className} • Sec {c.section} ({c.subject})
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              classesQuery.refetch();
              assignmentsQuery.refetch();
              submissionsQuery.refetch();
              toast.success("Assignments synchronized.");
            }}
            disabled={isRefreshing}
            className="teacher-assignments-sync flex items-center gap-1.5"
          >
            {isRefreshing ? (
              <Spinner className="size-3.5" />
            ) : (
              <RefreshCw size={14} />
            )}
            Sync
          </Button>
        </div>

        <div className="teacher-assignments-toolbar-actions">
          <Button
            className="toolbar-btn toolbar-btn-primary teacher-assignments-create flex items-center gap-1.5"
            onClick={() => {
              setFormClassChoice(classes[0]?.id || classes[0]?._id || "__custom__");
              setEditingAssignment({});
            }}
          >
            <Plus size={15} /> Create Assignment
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics Strip */}
      <div className="campus-kpi-track teacher-assignments-kpis">
        <div className="campus-kpi-card teacher-assignments-kpi">
          <div className="kpi-wrap">
            <div className="teacher-assignments-kpi-icon">
              <FileText size={18} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">TOTAL ASSIGNMENTS</span>
              <div className="kpi-value teacher-assignments-kpi-value">{assignments.length}</div>
              <span className="kpi-subtext">Across {classes.length} classes</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card teacher-assignments-kpi">
          <div className="kpi-wrap">
            <div className="teacher-assignments-kpi-icon">
              <CheckCircle2 size={18} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">GRADED SUBMISSIONS</span>
              <div className="kpi-value teacher-assignments-kpi-value">{totalGradedAll}</div>
              <span className="kpi-subtext">Completed evaluations</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card teacher-assignments-kpi">
          <div className="kpi-wrap">
            <div className="teacher-assignments-kpi-icon">
              <Clock3 size={18} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">PENDING REVIEWS</span>
              <div className="kpi-value teacher-assignments-kpi-value">{totalPendingAll}</div>
              <span className="kpi-subtext">Submissions awaiting grading</span>
            </div>
          </div>
        </div>

        <div className="campus-kpi-card teacher-assignments-kpi">
          <div className="kpi-wrap">
            <div className="teacher-assignments-kpi-icon">
              <Users size={18} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">TOTAL SUBMISSIONS</span>
              <div className="kpi-value teacher-assignments-kpi-value">{totalSubmissionsAll}</div>
              <span className="kpi-subtext">Delivered student work</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Assignment Cards & List Section */}
      {loading ? (
        <div className="teacher-credits-state text-center text-slate-500 text-sm py-12">
          <SpinnerCustom
            text="Loading assigned classes &amp; coursework..."
            size="lg"
            className="flex-col gap-2"
          />
        </div>
      ) : loadError ? (
        <div className="teacher-credits-state text-center text-slate-500 text-sm py-12">
          <AlertCircle className="inline-block mb-2 text-rose-500" size={32} />
          <p className="font-semibold text-slate-700">{loadError}</p>
          <span className="text-xs text-slate-400 mt-1 block">
            Use Sync to try again.
          </span>
        </div>
      ) : classes.length === 0 ? (
        <div className="teacher-assignments-section-container">
          <section className="teacher-assignment-empty-state" aria-live="polite">
            <span className="teacher-assignment-empty-icon">
              <FileText size={24} />
            </span>
            <h2>No assigned classes found</h2>
            <p>
              You can sync with campus timetables or create an assignment directly for your class section.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button
                variant="outline"
                className="toolbar-btn"
                onClick={() => loadData(true)}
              >
                <RefreshCw size={14} className="mr-1.5" /> Check for Classes
              </Button>
              <Button
                className="toolbar-btn toolbar-btn-primary"
                onClick={() => {
                  setFormClassChoice("__custom__");
                  setEditingAssignment({});
                }}
              >
                <Plus size={14} className="mr-1.5" /> Create Assignment
              </Button>
            </div>
          </section>
        </div>
      ) : assignments.length === 0 ? (
        <div className="teacher-assignments-section-container">
          <section className="teacher-assignment-empty-state" aria-live="polite">
            <span className="teacher-assignment-empty-icon">
              <FileText size={24} />
            </span>
            <h2>No assignments created yet</h2>
            <p>
              Create your first homework or lab assignment for your assigned
              classes to start collecting and grading student submissions.
            </p>
            <Button
              className="toolbar-btn toolbar-btn-primary"
              onClick={() => {
                setFormClassChoice(classes[0]?.id || classes[0]?._id || "__custom__");
                setEditingAssignment({});
              }}
            >
              <Plus size={14} className="mr-1.5" /> Create Assignment
            </Button>
          </section>
        </div>
      ) : (
        <>
          {/* Assignment Cards Strip */}
          <section className="teacher-assignment-cards" aria-label="Assignments">
            {visibleAssignments.map((assignment) => {
              const isSelected =
                (selectedAssignment?._id || selectedAssignment?.id) ===
                (assignment._id || assignment.id);

              return (
                <article
                  className={`teacher-assignment-card ${
                    isSelected ? "selected" : ""
                  }`}
                  key={assignment._id || assignment.id}
                >
                  <button
                    type="button"
                    className="teacher-assignment-card-select"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setSubmissionQuery("");
                      setSubmissionStatusFilter("All");
                      setSubmissionPage(1);
                    }}
                  >
                    <span className="teacher-assignment-icon">
                      <FileText size={20} />
                    </span>
                    <span className="teacher-assignment-context">
                      {assignment.className} • Sec {assignment.section} (
                      {assignment.subject})
                    </span>
                    <strong>{assignment.title}</strong>
                    <span className="teacher-assignment-description">
                      {assignment.description ||
                        "Review student submissions and evaluate performance for this assignment."}
                    </span>
                  </button>

                  <footer>
                    <span>
                      Due: <b>{formatDate(assignment.dueDate)}</b>
                    </span>
                    <em>
                      {assignment.submissionsCount || 0} Submissions (
                      {assignment.gradedCount || 0} Graded)
                    </em>
                  </footer>

                  <span className="teacher-assignment-card-actions">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${assignment.title}`}
                      onClick={() => {
                        setFormClassChoice(assignment.classId || "__custom__");
                        setEditingAssignment(assignment);
                      }}
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${assignment.title}`}
                      onClick={() => setDeleteTarget(assignment)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </span>
                </article>
              );
            })}
          </section>

          {assignmentPageCount > 1 && (
            <TeacherPagination
              page={currentAssignmentPage}
              pageCount={assignmentPageCount}
              onPageChange={setAssignmentPage}
              label="Assignment pages"
            />
          )}

          {/* 4. Submissions & Grading Table for Selected Assignment */}
          {selectedAssignment && (
            <section className="campus-table-container teacher-submissions-card">
              <header className="campus-toolbar">
                <div className="toolbar-left">
                  <strong style={{ fontSize: "14px" }}>
                    Submissions for “{selectedAssignment.title}”
                  </strong>
                  <span
                    className="text-muted"
                    style={{ fontSize: "12px", marginLeft: "8px" }}
                  >
                    Max Marks: {selectedAssignment.totalMarks ?? 100} • Due Date:{" "}
                    {formatDate(selectedAssignment.dueDate)} • {selectedAssignment.className} - {selectedAssignment.section}
                  </span>
                </div>

                <div className="toolbar-right teacher-submission-tools">
                  <label className="toolbar-search">
                    <Search size={14} />
                    <span className="sr-only">Search student or submission</span>
                    <input
                      value={submissionQuery}
                      onChange={(e) => {
                        setSubmissionQuery(e.target.value);
                        setSubmissionPage(1);
                      }}
                      placeholder="Search student or roll number..."
                    />
                  </label>

                  <select
                    className="toolbar-select"
                    value={submissionStatusFilter}
                    onChange={(e) => {
                      setSubmissionStatusFilter(e.target.value);
                      setSubmissionPage(1);
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Graded">Graded</option>
                    <option value="Late">Late</option>
                    <option value="Missing">Missing</option>
                  </select>
                </div>
              </header>

              <div
                className="teacher-submissions-wrap"
                style={{ flex: 1, overflowY: "auto" }}
              >
                {loadingSubmissions ? (
                  <div className="py-8 text-center text-slate-400">
                    <Spinner className="size-5 mx-auto mb-2" />
                    <span>Loading student submissions...</span>
                  </div>
                ) : (
                  <table
                    className="campus-data-table teacher-table"
                    style={{ width: "100%", tableLayout: "fixed" }}
                  >
                    <thead>
                      <tr>
                        <th style={{ width: "24%" }}>Student &amp; Roll No</th>
                        <th style={{ width: "32%" }}>Submission Deliverable / Notes</th>
                        <th style={{ width: "16%" }}>Submitted At</th>
                        <th style={{ width: "12%" }}>Score / Total</th>
                        <th style={{ width: "10%" }}>Status</th>
                        <th style={{ width: "16%" }} className="text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleSubmissions.map((row) => (
                        <tr key={row._id || row.studentId}>
                          <td>
                            <span className="teacher-submission-student">
                              <span className="teacher-avatar">
                                {initials(row.studentName)}
                              </span>
                              <strong>{row.studentName || "Student"}</strong>
                            </span>
                            <small className="text-slate-400 block mt-0.5">
                              Roll: {row.rollNumber || "—"}
                            </small>
                          </td>
                          <td>
                            <span className="teacher-submission-notes block text-xs text-slate-700 line-clamp-2">
                              {row.notes || "No submission text provided."}
                            </span>
                            {row.attachmentUrl && (
                              <a
                                href={row.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline text-[11px] font-medium inline-flex items-center gap-1 mt-1"
                              >
                                <ExternalLink size={11} /> View Deliverable
                              </a>
                            )}
                          </td>
                          <td className="text-xs text-slate-600">
                            {row.submittedAt ? formatDate(row.submittedAt) : "—"}
                          </td>
                          <td className="font-semibold text-slate-800 text-xs">
                            {row.status === "Graded" && row.score !== null
                              ? `${row.score} / ${selectedAssignment.totalMarks}`
                              : "—"}
                          </td>
                          <td>
                            <span
                              className={`campus-status-pill ${
                                row.status === "Graded"
                                  ? "is-active"
                                  : row.status === "Submitted"
                                  ? "is-pending"
                                  : row.status === "Late"
                                  ? "is-pending"
                                  : "is-danger"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant={
                                  row.status === "Graded" ? "outline" : "default"
                                }
                                className={
                                  row.status === "Graded"
                                    ? "h-7 px-2.5 text-xs font-medium"
                                    : "bg-blue-600 hover:bg-blue-700 text-white h-7 px-2.5 text-xs font-semibold"
                                }
                                onClick={() =>
                                  setGradingTarget({
                                    submission: row,
                                    assignment: selectedAssignment,
                                  })
                                }
                              >
                                {row.status === "Graded" ? (
                                  <>
                                    <Pencil size={12} className="mr-1" /> Edit Grade
                                  </>
                                ) : (
                                  <>
                                    <Award size={12} className="mr-1" /> Grade Now
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {!loadingSubmissions && !visibleSubmissions.length && (
                  <div className="teacher-assignments-empty py-8 text-center text-slate-400 text-sm">
                    {submissions.length
                      ? "No submissions match your search filters."
                      : "No student records found in this class section."}
                  </div>
                )}
              </div>

              {submissionPageCount > 1 && (
                <footer className="teacher-assignments-footer">
                  Showing{" "}
                  {visibleSubmissions.length
                    ? (currentSubmissionPage - 1) * pageSize + 1
                    : 0}
                  –
                  {Math.min(
                    currentSubmissionPage * pageSize,
                    filteredSubmissions.length
                  )}{" "}
                  of {filteredSubmissions.length} records
                  <TeacherPagination
                    page={currentSubmissionPage}
                    pageCount={submissionPageCount}
                    onPageChange={setSubmissionPage}
                    label="Submission pages"
                  />
                </footer>
              )}
            </section>
          )}
        </>
      )}

      {/* 5. Create / Edit Assignment Dialog */}
      <Dialog
        open={editingAssignment !== null}
        onOpenChange={(open) => !open && setEditingAssignment(null)}
      >
        <DialogContent className="teacher-dialog teacher-assignment-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment?._id || editingAssignment?.id
                ? "Edit Assignment"
                : "Create New Assignment"}
            </DialogTitle>
            <DialogDescription>
              Assignments are instantly published to enrolled students in the
              selected class section.
            </DialogDescription>
          </DialogHeader>

          {editingAssignment !== null && (
            <form onSubmit={handleSaveAssignment}>
              <div className="teacher-dialog-body teacher-dialog-grid">
                {classes.length > 0 && (
                  <label className="teacher-dialog-field-full">
                    Assigned Class &amp; Subject
                    <select
                      name="classId"
                      value={formClassChoice}
                      onChange={(e) => setFormClassChoice(e.target.value)}
                      disabled={
                        Boolean(editingAssignment?._id || editingAssignment?.id)
                      }
                    >
                      {classes.map((item) => (
                        <option
                          key={item.id || item._id}
                          value={item.id || item._id}
                        >
                          {item.className} • Section {item.section} (
                          {item.subject}) — {item.enrolledStudentsCount || 0} Students
                        </option>
                      ))}
                      <option value="__custom__">+ Other / Custom Class...</option>
                    </select>
                  </label>
                )}

                {(classes.length === 0 || formClassChoice === "__custom__") && (
                  <>
                    <label>
                      Class / Grade
                      <input
                        name="customClassName"
                        required
                        placeholder="e.g. Class 10, Grade 9"
                        defaultValue={editingAssignment.className || "Class 10"}
                      />
                    </label>

                    <label>
                      Section
                      <input
                        name="customSection"
                        required
                        placeholder="e.g. A, B, Green"
                        defaultValue={editingAssignment.section || "A"}
                      />
                    </label>

                    <label className="teacher-dialog-field-full">
                      Subject
                      <input
                        name="customSubject"
                        required
                        placeholder="e.g. Mathematics, Physics, Computer Science"
                        defaultValue={editingAssignment.subject || "General"}
                      />
                    </label>
                  </>
                )}

                <label className="teacher-dialog-field-full">
                  Assignment Title
                  <input
                    name="title"
                    required
                    placeholder="e.g. Chapter 4 Practice Exercises, Lab Report 2..."
                    defaultValue={editingAssignment.title || ""}
                  />
                </label>

                <label>
                  Due Date
                  <input
                    name="dueDate"
                    type="date"
                    required
                    min={dateKey(new Date())}
                    defaultValue={
                      editingAssignment.dueDate
                        ? formatDate(editingAssignment.dueDate)
                        : dateKey(
                            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                          )
                    }
                  />
                </label>

                <label>
                  Total Maximum Marks
                  <input
                    name="totalMarks"
                    type="number"
                    min="1"
                    max="1000"
                    required
                    defaultValue={editingAssignment.totalMarks || 100}
                  />
                </label>

                <label className="teacher-dialog-field-full">
                  Instructions &amp; Description
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Provide detailed submission instructions, required format, problem numbers, or rubric..."
                    defaultValue={editingAssignment.description || ""}
                  />
                </label>
              </div>

              <DialogFooter className="teacher-dialog-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingAssignment(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="toolbar-btn toolbar-btn-primary flex items-center gap-1.5"
                  type="submit"
                  disabled={savingAssignment}
                >
                  {savingAssignment && <Spinner className="size-4 mr-1 text-white" />}
                  {savingAssignment ? "Saving..." : "Save Assignment"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Grading Dialog */}
      <Dialog
        open={Boolean(gradingTarget)}
        onOpenChange={(open) => !open && setGradingTarget(null)}
      >
        <DialogContent className="teacher-dialog teacher-dialog-compact">
          <DialogHeader>
            <DialogTitle>Grade Student Submission</DialogTitle>
            <DialogDescription>
              {gradingTarget?.submission?.studentName} •{" "}
              {gradingTarget?.assignment?.title} • Maximum Marks:{" "}
              {gradingTarget?.assignment?.totalMarks ?? 100}
            </DialogDescription>
          </DialogHeader>

          {gradingTarget && (
            <form onSubmit={handleSaveGrade}>
              <div className="teacher-dialog-body">
                <div className="teacher-submission-review">
                  <strong>Student Submission Deliverable</strong>
                  <p className="mt-1 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                    {gradingTarget.submission.notes ||
                      "No written deliverable text was provided."}
                  </p>
                  {gradingTarget.submission.attachmentUrl && (
                    <a
                      href={gradingTarget.submission.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-xs font-semibold inline-flex items-center gap-1 mt-2"
                    >
                      <ExternalLink size={12} /> Open Attached Deliverable
                    </a>
                  )}
                </div>

                <label className="block mt-3">
                  Score Awarded (out of {gradingTarget.assignment?.totalMarks || 100})
                  <input
                    name="score"
                    type="number"
                    min="0"
                    max={gradingTarget.assignment?.totalMarks || 100}
                    required
                    step="0.5"
                    className="w-full mt-1 border border-slate-200 rounded-md px-3 py-1.5 text-sm font-bold text-slate-800"
                    defaultValue={gradingTarget.submission.score ?? ""}
                    placeholder={`0 - ${gradingTarget.assignment?.totalMarks || 100}`}
                  />
                </label>

                <label className="block mt-3" htmlFor={feedbackTextareaId}>
                  Evaluation Feedback / Remarks
                  <textarea
                    id={feedbackTextareaId}
                    name="feedback"
                    rows={4}
                    className="w-full mt-1 border border-slate-200 rounded-md p-2.5 text-xs text-slate-700"
                    placeholder="Write constructive remarks, corrections, or praise for the student..."
                    defaultValue={gradingTarget.submission.feedback || ""}
                  />
                </label>
              </div>

              <DialogFooter className="teacher-dialog-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGradingTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="toolbar-btn toolbar-btn-primary flex items-center gap-1.5"
                  type="submit"
                  disabled={submittingGrade}
                >
                  {submittingGrade && <Spinner className="size-4 mr-1 text-white" />}
                  {submittingGrade ? "Saving Grade..." : "Record Grade"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. Delete Confirm Dialog */}
      <TeacherConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Assignment?"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.title}"? This will permanently remove the assignment and all associated student submissions.`
            : ""
        }
        confirmText="Delete Assignment"
        onConfirm={handleDeleteAssignment}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
