import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  BookOpen,
  Calendar,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import {
  getTeacherDiaryClasses,
  getTeacherDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from "@/api/diary.api";
import { Button } from "@/components/ui/button";
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
import toast from "react-hot-toast";
import { Spinner, SpinnerCustom } from "@/components/ui/spinner";
import TeacherConfirmDialog from "./TeacherConfirmDialog";
import TeacherPagination from "./TeacherPagination";
import "./TeacherDiary.css";

const getTodayKey = () => new Date().toISOString().split("T")[0];

const formatDateDisplay = (dateVal) => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? dateVal : d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateVal;
  }
};

export default function TeacherDiary() {
  const [params] = useSearchParams();

  // Live Backend Data
  const [classes, setClasses] = useState([]);
  const [entries, setEntries] = useState([]);

  // Loading & sync states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [selectedClassFilter, setSelectedClassFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Dialog states
  const [formEntry, setFormEntry] = useState(null); // null = closed, {} = new, obj = edit
  const [formClassChoice, setFormClassChoice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 1. Fetch Classes and Diary Entries from Backend
  const loadData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      setLoadError("");

      const [classesRes, entriesRes] = await Promise.all([
        getTeacherDiaryClasses(),
        getTeacherDiaryEntries(),
      ]);

      const loadedClasses = classesRes.data?.data || [];
      const loadedEntries = entriesRes.data?.data || [];

      setClasses(loadedClasses);
      setEntries(loadedEntries);

      if (showToast) toast.success("Diary entries synchronized.");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load daily diary records.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle URL requested class
  useEffect(() => {
    const requested = params.get("classId");
    if (requested) {
      setSelectedClassFilter(requested);
    }
  }, [params]);

  // Filtered & Searched Entries
  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesClass =
        selectedClassFilter === "All"
          ? true
          : String(entry.classId) === String(selectedClassFilter) ||
            `${entry.className} - ${entry.section}` === selectedClassFilter;

      const matchesSearch =
        !q ||
        `${entry.title || ""} ${entry.recap || ""} ${entry.homework || ""} ${entry.resources || ""} ${entry.subject || ""} ${entry.className || ""}`
          .toLowerCase()
          .includes(q);

      return matchesClass && matchesSearch;
    });
  }, [entries, selectedClassFilter, searchQuery]);

  // Pagination Math
  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Open Create Dialog
  const openNewEntry = () => {
    const defaultClass = classes[0];
    setFormClassChoice(defaultClass ? (defaultClass.id || defaultClass._id || defaultClass.classId) : "__custom__");
    setFormEntry({
      date: getTodayKey(),
      title: "",
      recap: "",
      homework: "",
      resources: "",
    });
  };

  // Open Edit Dialog
  const openEditEntry = (entry) => {
    setFormClassChoice(entry.classId || "__custom__");
    setFormEntry(entry);
  };

  // 2. Save / Update Entry Handler
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const classId = String(formData.get("classId") || "");
    const customClassName = String(formData.get("customClassName") || "").trim();
    const customSection = String(formData.get("customSection") || "").trim();
    const customSubject = String(formData.get("customSubject") || "").trim();
    const date = String(formData.get("date") || getTodayKey());
    const title = String(formData.get("title") || "").trim();
    const recap = String(formData.get("recap") || "").trim();
    const homework = String(formData.get("homework") || "").trim();
    const resources = String(formData.get("resources") || "").trim();

    const selectedCls = classes.find(
      (c) => String(c.id || c._id || c.classId) === classId
    );

    const finalClassName =
      selectedCls?.className ||
      customClassName ||
      formEntry?.className ||
      "Class 10";
    const finalSection =
      selectedCls?.section ||
      customSection ||
      formEntry?.section ||
      "A";
    const finalSubject =
      selectedCls?.subject ||
      customSubject ||
      formEntry?.subject ||
      "General";

    if (!title) {
      toast.error("Please enter a lecture topic / title.");
      return;
    }
    if (!recap) {
      toast.error("Please provide a lecture summary / recap.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        classId: selectedCls?._id || selectedCls?.id || formEntry?.classId || undefined,
        className: finalClassName,
        gradeOrClass: finalClassName,
        section: finalSection,
        subject: finalSubject,
        date,
        title,
        recap,
        homework,
        resources,
      };

      if (formEntry?._id || formEntry?.id) {
        const id = formEntry._id || formEntry.id;
        const res = await updateDiaryEntry(id, payload);
        if (res.data?.success) {
          toast.success("Diary entry updated successfully!");
        }
      } else {
        const res = await createDiaryEntry(payload);
        if (res.data?.success) {
          toast.success("New diary entry published!");
        }
      }

      setFormEntry(null);
      await loadData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to save diary entry."
      );
    } finally {
      setSaving(false);
    }
  };

  // 3. Delete Entry Handler
  const handleDeleteEntry = async () => {
    if (!deleteTarget) return;
    try {
      const id = deleteTarget._id || deleteTarget.id;
      const res = await deleteDiaryEntry(id);
      if (res.data?.success) {
        toast.success("Diary entry deleted successfully.");
        setDeleteTarget(null);
        await loadData();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to delete diary entry."
      );
    }
  };

  return (
    <main
      className="campus-tab-page teacher-diary"
      aria-labelledby="teacher-diary-title"
    >
      {/* Header Toolbar */}
      <header className="campus-toolbar teacher-diary-toolbar flex items-center justify-between">
        <div className="flex items-center gap-2">
          {classes.length > 0 && (
            <select
              value={selectedClassFilter}
              onChange={(e) => {
                setSelectedClassFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by assigned class"
            >
              <option value="All">All Classes ({classes.length})</option>
              {classes.map((c) => (
                <option
                  key={c.id || c._id || c.classId}
                  value={c.id || c._id || c.classId}
                >
                  {c.className} • Sec {c.section} ({c.subject})
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
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
            onClick={openNewEntry}
          >
            <Plus size={15} /> New Diary Entry
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <SpinnerCustom
            text="Loading daily lecture diary entries..."
            size="lg"
            className="flex-col gap-2"
          />
        </div>
      ) : loadError ? (
        <div className="py-16 text-center text-slate-500">
          <AlertCircle className="inline-block mb-2 text-rose-500" size={32} />
          <p className="font-semibold text-slate-700">{loadError}</p>
          <span className="text-xs text-slate-400 mt-1 block">
            Click Sync to reload records.
          </span>
        </div>
      ) : entries.length === 0 ? (
        <div className="teacher-diary-section-container">
          <section className="teacher-diary-empty" aria-live="polite">
            <span className="teacher-diary-empty-icon">
              <FileText size={24} />
            </span>
            <h2>No diary entries yet</h2>
            <p>
              Create a daily lecture summary, notes, and homework record for one of your assigned classes.
            </p>
            <Button
              className="toolbar-btn toolbar-btn-primary"
              onClick={openNewEntry}
            >
              <Plus size={14} className="mr-1.5" /> New Diary Entry
            </Button>
          </section>
        </div>
      ) : (
        <>
          {/* Search bar when entries exist */}
          <div className="flex items-center gap-2 mb-2 bg-white p-2 border border-slate-200 rounded-lg shadow-xs">
            <Search size={16} className="text-slate-400 ml-2" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search diary topic, lesson notes, homework, or subject..."
              className="w-full text-xs outline-none bg-transparent py-1 font-medium text-slate-800"
            />
          </div>

          {/* Diary Entries List */}
          <div className="teacher-diary-list">
            {visibleEntries.map((entry) => (
              <article className="teacher-diary-card" key={entry._id || entry.id}>
                <header>
                  <span className="teacher-diary-icon">
                    <FileText size={22} />
                  </span>
                  <div>
                    <div className="teacher-diary-title">
                      <h2>{entry.title}</h2>
                      <span>
                        {entry.className} • Sec {entry.section} ({entry.subject})
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                      <Calendar size={13} className="text-slate-400" />
                      {formatDateDisplay(entry.date)}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="teacher-diary-menu-trigger text-slate-400 hover:text-slate-700"
                        aria-label={`Actions for ${entry.title}`}
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditEntry(entry)}>
                        <Pencil size={14} className="mr-2 text-slate-500" /> Edit Entry
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-rose-600 focus:text-rose-700"
                        onClick={() => setDeleteTarget(entry)}
                      >
                        <Trash2 size={14} className="mr-2" /> Delete Entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </header>

                <div className="teacher-diary-panels">
                  <section>
                    <h3>Lesson Summary / Lecture Recap</h3>
                    <p>{entry.recap}</p>
                  </section>

                  {entry.homework && (
                    <section>
                      <h3>Homework &amp; Assignments Given</h3>
                      <p>{entry.homework}</p>
                    </section>
                  )}
                </div>

                {entry.resources && (
                  <p className="teacher-diary-resources">
                    <strong>References &amp; Resources:</strong> {entry.resources}
                  </p>
                )}
              </article>
            ))}

            {filteredEntries.length === 0 && (
              <div className="teacher-diary-empty py-8 text-center text-slate-400 text-sm">
                No diary entries match your search query "{searchQuery}".
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {pageCount > 1 && (
            <footer className="teacher-attendance-footer mt-4">
              <span>
                Showing{" "}
                {filteredEntries.length ? (currentPage - 1) * pageSize + 1 : 0}
                –
                {Math.min(currentPage * pageSize, filteredEntries.length)} of{" "}
                {filteredEntries.length} diary records
              </span>
              <TeacherPagination
                page={currentPage}
                pageCount={pageCount}
                onPageChange={setPage}
                label="Diary pages"
              />
            </footer>
          )}
        </>
      )}

      {/* Create / Edit Diary Entry Dialog */}
      <Dialog
        open={formEntry !== null}
        onOpenChange={(open) => !open && setFormEntry(null)}
      >
        <DialogContent className="teacher-dialog">
          <DialogHeader>
            <DialogTitle>
              {formEntry?._id || formEntry?.id
                ? "Edit Diary Entry"
                : "New Daily Diary Entry"}
            </DialogTitle>
            <DialogDescription>
              Record the lecture summary, classroom topics, homework, and references for student review.
            </DialogDescription>
          </DialogHeader>

          {formEntry !== null && (
            <form onSubmit={handleSaveEntry} className="teacher-diary-form">
              <div className="teacher-dialog-body teacher-dialog-grid">
                {classes.length > 0 && (
                  <label className="teacher-dialog-field-full">
                    Assigned Class &amp; Subject
                    <select
                      name="classId"
                      value={formClassChoice}
                      onChange={(e) => setFormClassChoice(e.target.value)}
                    >
                      {classes.map((item) => (
                        <option
                          key={item.id || item._id || item.classId}
                          value={item.id || item._id || item.classId}
                        >
                          {item.className} • Section {item.section} ({item.subject})
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
                        placeholder="e.g. Class 10"
                        defaultValue={formEntry.className || "Class 10"}
                      />
                    </label>
                    <label>
                      Section
                      <input
                        name="customSection"
                        required
                        placeholder="e.g. A"
                        defaultValue={formEntry.section || "A"}
                      />
                    </label>
                    <label className="teacher-dialog-field-full">
                      Subject
                      <input
                        name="customSubject"
                        required
                        placeholder="e.g. Mathematics, Physics"
                        defaultValue={formEntry.subject || "General"}
                      />
                    </label>
                  </>
                )}

                <label>
                  Date
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={formEntry.date || getTodayKey()}
                  />
                </label>

                <label className="teacher-dialog-field-full">
                  Lecture Topic / Title
                  <input
                    name="title"
                    required
                    placeholder="e.g. Linear Equations in Two Variables — Elimination Method"
                    defaultValue={formEntry.title || ""}
                  />
                </label>

                <label className="teacher-dialog-field-full">
                  Lesson Summary / Recap
                  <textarea
                    name="recap"
                    rows={4}
                    required
                    placeholder="Covered algebraic elimination, solved textbook examples 4.1 to 4.5, and discussed word problem framing..."
                    defaultValue={formEntry.recap || ""}
                  />
                </label>

                <label className="teacher-dialog-field-full">
                  Homework &amp; Assignments Given
                  <textarea
                    name="homework"
                    rows={2}
                    placeholder="Exercise 4.2 questions 1-8 in homework notebook. Prepare for quiz tomorrow."
                    defaultValue={formEntry.homework || ""}
                  />
                </label>

                <label className="teacher-dialog-field-full">
                  References &amp; Textbook Pages
                  <input
                    name="resources"
                    placeholder="e.g. Math Textbook Chapter 4, pp. 84-89; Khan Academy module on Elimination"
                    defaultValue={formEntry.resources || ""}
                  />
                </label>
              </div>

              <DialogFooter className="teacher-dialog-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormEntry(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="toolbar-btn toolbar-btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Diary Entry"}
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
        title="Delete Diary Entry"
        description={`Are you sure you want to permanently remove the diary entry "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete Entry"
        onConfirm={handleDeleteEntry}
      />
    </main>
  );
}
