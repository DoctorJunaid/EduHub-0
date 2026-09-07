import { useId, useState } from "react";
import { X } from "lucide-react";
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

export default function FacultyForm({ teacher, options, onSave, onClose }) {
  const id = useId();
  const [values, setValues] = useState(() => ({
    name: teacher?.name ?? "",
    email: teacher?.email ?? "",
    designation: teacher?.designation ?? options.designation[0] ?? "",
    qualification: teacher?.qualification ?? "",
    department: teacher?.department ?? options.department[0] ?? "",
    phone: teacher?.phone ?? "",
    subjects: teacher?.subjects ?? "",
    campus: teacher?.campus ?? options.campus[0] ?? "",
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
    { key: "designation", label: "Designation", choices: options.designation },
    {
      key: "qualification",
      label: "Qualification",
      placeholder: "Ph.D. in Computer Science",
    },
    { key: "department", label: "Department", choices: options.department },
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
    { key: "campus", label: "Assigned Campus", choices: options.campus },
    { key: "status", label: "Status", choices: facultyStatuses },
  ];

  const submit = (event) => {
    event.preventDefault();
    onSave(
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, value.trim()]),
      ),
    );
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Teacher</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
