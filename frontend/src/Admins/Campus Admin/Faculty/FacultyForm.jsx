import { useId, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import "./FacultyForm.css";
import { facultyStatuses } from "./facultyData.js";

const DEFAULT_DESIGNATIONS = [
  "Lecturer",
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "HOD",
  "Instructor",
];

const DEFAULT_DEPARTMENTS = [
  "Computer Science",
  "Software Engineering",
  "Electrical Engineering",
  "Information Technology",
  "Management Sciences",
  "General",
];

const DEFAULT_CAMPUSES = ["Main Campus"];

export default function FacultyForm({ teacher, options = {}, onSave, onClose }) {
  const id = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const designations =
    options?.designation && options.designation.length
      ? options.designation
      : DEFAULT_DESIGNATIONS;

  const departments =
    options?.department && options.department.length
      ? options.department
      : DEFAULT_DEPARTMENTS;

  const campuses =
    options?.campus && options.campus.length
      ? options.campus
      : DEFAULT_CAMPUSES;

  const [values, setValues] = useState(() => ({
    name: teacher?.name ?? "",
    email: teacher?.email ?? "",
    designation: teacher?.designation ?? designations[0] ?? "Lecturer",
    qualification: teacher?.qualification ?? "",
    department: teacher?.department ?? departments[0] ?? "Computer Science",
    phone: teacher?.phone ?? "",
    subjects: teacher?.subjects ?? "",
    campus: teacher?.campus ?? campuses[0] ?? "Main Campus",
    status: teacher?.status ?? "Active",
  }));

  const fields = [
    { key: "name", label: "Full Name", placeholder: "e.g. Dr. Usman Khan" },
    {
      key: "email",
      label: "Email Address",
      type: "email",
      placeholder: "usman.khan@nust.edu.pk",
    },
    { key: "designation", label: "Designation", choices: designations },
    {
      key: "qualification",
      label: "Qualification",
      placeholder: "Ph.D. in Computer Science",
    },
    { key: "department", label: "Department", choices: departments },
    {
      key: "phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "+92 300",
      optional: true,
    },
    {
      key: "subjects",
      label: "Subjects Taught",
      placeholder: "Advanced Web Design, Data Structures",
      wide: true,
    },
    { key: "campus", label: "Assigned Campus", choices: campuses },
    { key: "status", label: "Status", choices: facultyStatuses },
  ];

  const submit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(
        Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, value.trim()]),
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="faculty-form-dialog"
        overlayClassName="faculty-form-overlay"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <div className="faculty-form-heading">
          <DialogTitle>
            {teacher ? "Edit Faculty Member" : "Add New Faculty Member"}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="faculty-form-close"
              aria-label="Close faculty form"
              disabled={isSubmitting}
            >
              <X size={23} />
            </Button>
          </DialogClose>
        </div>
        <form onSubmit={submit}>
          <div className="faculty-form-grid">
            {fields.map(
              ({
                key,
                label,
                type = "text",
                placeholder,
                choices,
                optional,
                wide,
              }) => {
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
                    setValues((previous) => ({
                      ...previous,
                      [key]: event.target.value,
                    }));
                  },
                };
                return (
                  <div
                    key={key}
                    className={
                      wide
                        ? "faculty-form-field faculty-form-wide"
                        : "faculty-form-field"
                    }
                  >
                    <Label htmlFor={props.id}>{label}</Label>
                    {choices ? (
                      <select {...props}>
                        {choices.map((choice) => (
                          <option key={choice}>{choice}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        {...props}
                        type={type}
                        placeholder={placeholder}
                        onBlur={(event) => {
                          if (!optional)
                            event.target.setCustomValidity(
                              event.target.value.trim()
                                ? ""
                                : `${label} is required.`,
                            );
                        }}
                      />
                    )}
                  </div>
                );
              },
            )}
          </div>
          <div className="faculty-form-actions">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {isSubmitting && <Loader2 size={16} className="spin" />}
              {isSubmitting ? (teacher ? "Saving Changes..." : "Saving Teacher...") : (teacher ? "Save Changes" : "Save Teacher")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
