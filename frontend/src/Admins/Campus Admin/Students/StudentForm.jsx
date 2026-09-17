import { useId, useState } from "react";
import { useSelector } from "react-redux";
import { selectStudents } from "@/store/Slices/studentsSlice";
import { studentIdentityErrors, hasStudentIdentityConflicts } from "@/store/studentIdentity";
import { Users, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { studentStatuses } from "./studentData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";

const DEFAULT_PROGRAMS = [
  "BS Computer Science",
  "BS Software Engineering",
  "BS Artificial Intelligence",
  "BS Data Science",
  "FSc Pre-Engineering",
  "FSc Pre-Medical",
];

export default function StudentForm({
  student,
  programs = DEFAULT_PROGRAMS,
  campuses = ["Main Campus"],
  editAllFields = true,
  onSave,
  onClose,
}) {
  const id = useId();
  const editing = Boolean(student);
  const records = useSelector(selectStudents);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const safePrograms = programs && programs.length ? programs : DEFAULT_PROGRAMS;
  const safeCampuses = campuses && campuses.length ? campuses : ["Main Campus"];

  const [values, setValues] = useState(() => ({
    name: student?.name ?? "",
    roll: student?.roll ?? "",
    email: student?.email ?? "",
    studentPhone: student?.studentPhone ?? student?.phone ?? "",
    program: student?.program ?? safePrograms[0] ?? "",
    section: student?.section ?? "",
    semester: student?.semester ?? "",
    subjects: student?.subjects ?? "",
    campus: student?.campus ?? (typeof safeCampuses[0] === "object" ? safeCampuses[0].value : safeCampuses[0]) ?? "",
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
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? `${id}-${key}-error` : undefined,
      onChange: (event) => {
        setErrors((previous) => ({ ...previous, [key]: undefined }));
        event.target.setCustomValidity(
          !optional && !event.target.value.trim() ? `${label} is required.` : "",
        );
        setValues((previous) => ({ ...previous, [key]: event.target.value }));
      },
    };

    return (
      <div className="activity-form-field">
        <Label htmlFor={props.id}>{label}{!optional && " *"}</Label>
        {options ? (
          <select {...props}>
            {options.map((option) => {
              const val = typeof option === "object" ? option.value : option;
              const lbl = typeof option === "object" ? option.label : option;
              return (
                <option key={val} value={val}>
                  {lbl}
                </option>
              );
            })}
          </select>
        ) : (
          <input {...props} type={type} placeholder={placeholder} />
        )}
        {errors[key] && (
          <p id={`${id}-${key}-error`} role="alert" className="activity-field-error">
            {errors[key]}
          </p>
        )}
      </div>
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    const saved = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]),
    );

    if (editing && !editAllFields) {
      saved.campus = student.campus;
      saved.guardianPhone = student.guardianPhone;
    }

    const problems = studentIdentityErrors(saved, records, student?.id || student?._id);
    setErrors(problems);
    if (Object.keys(problems).length) {
      document.getElementById(`${id}-${Object.keys(problems)[0]}`)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(saved);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FullPageFormShell
      title={editing ? "Edit Student Record" : "Register New Student"}
      subtitle={
        editing
          ? `Updating profile and academic registration for ${student?.name || "student"}.`
          : "Fill in student profile, academic program, section, and guardian contact details."
      }
      parentName="Students Directory"
      icon={<Users size={22} />}
      onBack={onClose}
    >
      <form onSubmit={submit}>
        {hasStudentIdentityConflicts(records) && (
          <p
            role="status"
            style={{
              padding: "10px 14px",
              background: "#fffbeb",
              border: "1px solid #fef3c7",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#b45309",
              marginBottom: "18px",
            }}
          >
            Some existing student records share an email or roll number. Make sure each student has a distinct identity.
          </p>
        )}

        <div className="activity-form-grid">
          <div className="activity-section-title">Personal & Academic Identification</div>

          {field("name", "Full Student Name", { placeholder: "e.g. Ali Raza" })}
          {field("roll", "Roll Number / Student ID", { placeholder: "e.g. NUST-CS-2024-001" })}

          {field("email", "Email Address", {
            type: "email",
            placeholder: "ali.raza@nust.edu.pk",
          })}
          {field("studentPhone", "Student Phone (Optional)", {
            type: "tel",
            optional: true,
            placeholder: "+92 333 1234567",
          })}

          <div className="activity-section-title">Program & Enrollment Details</div>

          {field("program", "Degree Program", { options: safePrograms })}
          {field("section", "Class Section", { placeholder: "e.g. CS-4A" })}
          {field("semester", "Current Semester", { placeholder: "e.g. 4th Semester" })}
          {field("campus", "Assigned Campus Branch", { options: safeCampuses })}

          <div className="activity-form-field span-2">
            <Label htmlFor={`${id}-subjects`}>Enrolled Subjects *</Label>
            <input
              id={`${id}-subjects`}
              name="subjects"
              value={values.subjects}
              required
              placeholder="e.g. Advanced Web Design, Data Structures, Machine Learning"
              onChange={(e) => setValues((prev) => ({ ...prev, subjects: e.target.value }))}
            />
          </div>

          {field("status", "Enrollment Status", { options: studentStatuses })}

          <div className="activity-section-title">Guardian Information</div>

          {field("guardian", "Father / Guardian Name", {
            optional: true,
            placeholder: "e.g. Muhammad Raza",
          })}
          {field("guardianPhone", "Guardian Contact Number", {
            optional: true,
            type: "tel",
            placeholder: "+92 300 9876543",
          })}
        </div>

        <div className="activity-form-actions">
          <button
            type="button"
            className="activity-cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="activity-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 size={15} className="spin" />}
            {isSubmitting
              ? editing
                ? "Updating Record..."
                : "Saving Student..."
              : editing
              ? "Update Student Record"
              : "Register Student"}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
