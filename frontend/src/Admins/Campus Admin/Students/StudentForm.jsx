import { useId, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { studentStatuses } from "./studentData.js";

export default function StudentForm({
  student,
  programs,
  campuses,
  editAllFields = false,
  onSave,
  onClose,
}) {
  const id = useId();
  const editing = Boolean(student);
  const [values, setValues] = useState(() => ({
    name: student?.name ?? "",
    roll: student?.roll ?? "",
    email: student?.email ?? "",
    studentPhone: student?.studentPhone ?? "",
    program: student?.program ?? programs[0] ?? "",
    section: student?.section ?? "",
    semester: student?.semester ?? "",
    subjects: student?.subjects ?? "",
    campus: student?.campus ?? (typeof campuses[0] === 'object' ? campuses[0].value : campuses[0]) ?? "",
    status: student?.status ?? "Active",
    guardian: student?.guardian ?? "",
    guardianPhone: student?.guardianPhone ?? "",
  }));
  const field = (
    key,
    label,
    { type = "text", placeholder, options, optional = false } = {},
  ) => {
    const props = {
      id: `${id}-${key}`,
      name: key,
      value: values[key],
      required: !optional,
      onChange: (event) => {
        event.target.setCustomValidity(
          !optional && !event.target.value.trim()
            ? `${label} is required.`
            : "",
        );
        setValues((previous) => ({ ...previous, [key]: event.target.value }));
      },
    };
    return (
      <div className="student-form-field">
        <Label htmlFor={props.id}>{label}</Label>
        {options ? (
          <select {...props}>
            {options.map((option) => (
              <option key={typeof option === 'object' ? option.value : option} value={typeof option === 'object' ? option.value : option}>{typeof option === 'object' ? option.label : option}</option>
            ))}
          </select>
        ) : (
          <Input {...props} type={type} placeholder={placeholder} />
        )}
      </div>
    );
  };
  const submit = (event) => {
    event.preventDefault();
    const saved = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()]),
    );
    // Preserve hidden fields byte-for-byte in Edit mode, including optional contact data.
    if (editing && !editAllFields) {
      saved.campus = student.campus;
      saved.guardianPhone = student.guardianPhone;
    }
    onSave(saved);
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="student-form-dialog"
        overlayClassName="student-modal-overlay"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <div className="student-modal-heading">
          <DialogTitle>
            {editing ? "Edit Student Record" : "Add New Student"}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="student-modal-close"
              aria-label="Close student form"
            >
              <X size={23} />
            </Button>
          </DialogClose>
        </div>
        <form onSubmit={submit}>
          <div className="student-form-row">
            {field("name", "Full Name", { placeholder: "e.g. Ali Raza" })}
            {field("roll", editing ? "Roll Number" : "Roll Number / ID", {
              placeholder: "e.g. NUST-CS-2024-001",
            })}
          </div>
          <div className="student-form-row">
            {field("email", editing ? "Email" : "Email Address", {
              type: "email",
              placeholder: "ali.raza@nust.edu.pk",
            })}
            {field("studentPhone", editing ? "Phone" : "Student Phone", {
              type: "tel",
              optional: true,
              placeholder: "+92 333",
            })}
          </div>
          <div className="student-form-row student-form-thirds">
            {field("program", editing ? "Program" : "Class / Program", {
              options: programs,
            })}
            {field("section", "Section", { placeholder: "CS-4A" })}
            {field("semester", "Semester", { placeholder: "4th Semester" })}
          </div>
          <div className="student-form-row student-form-full">
            {field("subjects", "Enrolled Subjects", {
              placeholder: "Advanced Web Design, Data Structures, AI",
            })}
          </div>
          {editing && !editAllFields ? (
            <div className="student-form-row">
              {field("status", "Status", { options: studentStatuses })}
              {field("guardian", "Guardian Name", { optional: true })}
            </div>
          ) : (
            <>
              <div className="student-form-row">
                {field("campus", "Campus Branch", { options: campuses })}
                {field("status", "Enrollment Status", {
                  options: studentStatuses,
                })}
              </div>
              <div className="student-form-row student-guardian-fields">
                {field("guardian", "Guardian Name", {
                  optional: true,
                  placeholder: "Father / Guardian Name",
                })}
                {field("guardianPhone", "Guardian Phone", {
                  optional: true,
                  type: "tel",
                  placeholder: "+92 300",
                })}
              </div>
            </>
          )}
          <div className="student-modal-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editing ? "Save Changes" : "Save Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
