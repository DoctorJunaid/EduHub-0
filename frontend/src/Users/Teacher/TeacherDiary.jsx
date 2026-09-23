import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FileText, MoreVertical, Plus } from "lucide-react";
import { dateKey, validDate } from "@/lib/dates";
import { useSearchParams } from "react-router-dom";
import { selectAssignedTeacherClasses, selectTeacherIdentity } from "./teacherScope";
import {
  diaryDeleted,
  diarySaved,
  selectDiary,
} from "@/store/Slices/diarySlice";
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
import TeacherConfirmDialog from "./TeacherConfirmDialog";
import "./TeacherDiary.css";

const get = (row, ...keys) =>
  keys
    .map((key) => row?.[key])
    .find((item) => item !== undefined && item !== null && item !== "") || "";
const today = () => dateKey(new Date());

export default function TeacherDiary() {
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const teacher = useSelector(selectTeacherIdentity);
  const classes = useSelector(selectAssignedTeacherClasses);
  const diary = useSelector(selectDiary);
  const [form, setForm] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const classIds = new Set(classes.map((row) => row.id || row._id));
  const entries = diary
    .filter((entry) => classIds.has(entry.classId))
    .sort((a, b) => b.date.localeCompare(a.date));
  const openNew = () =>
    setForm({
      classId: params.get("classId") || classes[0]?.id || classes[0]?._id || "",
      date: today(),
      title: "",
      recap: "",
      homework: "",
      resources: "",
    });
  const save = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const selected = classes.find(
      (row) => (row.id || row._id) === data.classId,
    );
    if (!selected || !validDate(data.date) || !data.title.trim() || !data.recap.trim())
      return toast.error(
        "Select a class and complete the topic and lecture summary.",
      );
    if (form.id && !entries.some((entry) => entry.id === form.id && entry.teacherId === teacher?.id)) return toast.error("This diary entry is no longer available for editing.");
    dispatch(
      diarySaved({
        ...data,
        id: form.id,
        teacherId: teacher?.id || "",
        sectionId: selected.sectionId || selected.section || "",
        title: data.title.trim(),
        recap: data.recap.trim(),
        homework: data.homework.trim(),
        resources: data.resources.trim(),
      }),
    );
    setForm(null);
    toast.success("Diary entry saved.");
  };
  const edit = (entry) => {
    if (entry.teacherId !== teacher?.id) return;
    setForm(entry);
  };
  const remove = () => {
    const entry = entries.find((item) => item.id === deleteId);
    if (entry?.teacherId !== teacher?.id) return setDeleteId(null);
    dispatch(diaryDeleted(deleteId));
    setDeleteId(null);
    toast.success("Diary entry deleted.");
  };

  return (
    <main className="teacher-diary" aria-labelledby="teacher-diary-title">
      <header className="teacher-diary-toolbar">
        <h1 id="teacher-diary-title" className="sr-only">Daily Lecture Diary</h1>
        <Button className="teacher-primary-action" onClick={openNew} disabled={!classes.length}>
          <Plus size={17} /> New Diary Entry
        </Button>
      </header>
      <div className="teacher-diary-list">
        {entries.map((entry) => {
          const cls = classes.find(
            (row) => (row.id || row._id) === entry.classId,
          );
          return (
            <article className="teacher-diary-card" key={entry.id}>
              <header>
                <span className="teacher-diary-icon">
                  <FileText size={22} />
                </span>
                <div>
                  <div className="teacher-diary-title">
                    <h2>{entry.title}</h2>
                    <span>
                      Sec{" "}
                      {entry.sectionId ||
                        get(cls, "section", "className") ||
                        "—"}
                    </span>
                  </div>
                  <p>
                    {get(cls, "subject", "title", "periodName") ||
                      "Assigned class"}{" "}
                    · Date: <time dateTime={entry.date}>{entry.date}</time>
                  </p>
                </div>
                {entry.teacherId === teacher?.id && <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${entry.title}`}
                    >
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => edit(entry)}>
                      Edit Entry
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleteId(entry.id)}
                    >
                      Delete Entry
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>}
              </header>
              <div className="teacher-diary-panels">
                <section>
                  <h3>Class Lecture Summary</h3>
                  <p>{entry.recap}</p>
                </section>
                <section>
                  <h3>Homework / Practice Task</h3>
                  <p>{entry.homework || "No homework provided."}</p>
                </section>
              </div>
              <p className="teacher-diary-resources">
                <strong>Recommended Study Material:</strong>{" "}
                {entry.resources || "No study material provided."}
              </p>
            </article>
          );
        })}
        {!entries.length && (
          <div className="teacher-diary-empty">
            <FileText size={28} />
            <strong>No diary entries yet.</strong>
            <span>Create an entry for one of your assigned classes.</span>
          </div>
        )}
      </div>
      <Dialog
        open={Boolean(form)}
        onOpenChange={(open) => !open && setForm(null)}
      >
        <DialogContent className="teacher-dialog">
          <DialogHeader>
            <DialogTitle>
              {form?.id ? "Edit Diary Entry" : "New Diary Entry"}
            </DialogTitle>
            <DialogDescription>
              Only assigned Teacher classes are available.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <form className="teacher-diary-form" onSubmit={save}>
              <div className="teacher-dialog-body">
                <label>Class / Section<select name="classId" defaultValue={form.classId} required>{classes.map((row) => <option key={row.id || row._id} value={row.id || row._id}>{get(row, "subject", "title", "periodName")} · {get(row, "section", "className")}</option>)}</select></label>
                <label>Date<input type="date" name="date" defaultValue={form.date} required /></label>
                <label>Lecture / Topic Title<input name="title" defaultValue={form.title} required /></label>
                <label>Class Lecture Summary<textarea name="recap" defaultValue={form.recap} rows="3" required /></label>
                <label>Homework / Practice Task<textarea name="homework" defaultValue={form.homework} rows="3" /></label>
                <label>Recommended Study Material<textarea name="resources" defaultValue={form.resources} rows="2" /></label>
              </div>
              <DialogFooter className="teacher-dialog-footer">
                <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button>
                <Button className="teacher-primary-action" type="submit">Save Diary Entry</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <TeacherConfirmDialog
        open={Boolean(deleteId)}
        title="Delete diary entry?"
        description="This removes your diary entry from the shared frontend record."
        confirmText="Delete Entry"
        onConfirm={remove}
        onCancel={() => setDeleteId(null)}
      />
    </main>
  );
}
