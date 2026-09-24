import { useId, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectStudents } from "@/store/Slices/studentsSlice";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { studentIdentityErrors, hasStudentIdentityConflicts } from "@/store/studentIdentity";
import { Users, School, GraduationCap, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { studentStatuses } from "./studentData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";

const DEFAULT_PROGRAMS = [
  "BS Computer Science",
  "BS Software Engineering",
  "BS Artificial Intelligence",
  "BS Data Science",
  "BBA",
  "FSc Pre-Engineering",
  "FSc Pre-Medical",
];

const DEFAULT_SCHOOL_CLASSES = [
  "Grade 10",
  "Grade 9",
  "Grade 8",
  "Grade 7",
  "Grade 6",
  "Grade 5",
  "Grade 4",
  "Grade 3",
  "Grade 2",
  "Grade 1",
  "Kindergarten (KG)",
  "Nursery",
];

export default function StudentForm({
  student,
  programs = [],
  campuses = [],
  editAllFields = true,
  onSave,
  onClose,
}) {
  const { isSchool } = useInstitution();
  const id = useId();
  const editing = Boolean(student);
  const records = useSelector(selectStudents);
  const user = useSelector(selectCurrentUser);
  const realUserCampus =
    user?.campusId?.name ||
    user?.campusName ||
    user?.campus ||
    "";

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeCampuses = useMemo(() => {
    const rawList = (campuses || []).map((c) =>
      typeof c === "object" ? c.label || c.value || c.name : c
    );
    const combined = [
      realUserCampus,
      student?.campus,
      student?.campusId?.name,
      ...rawList,
    ].filter(Boolean);
    const unique = [...new Set(combined)];
    return unique.length > 0 ? unique : [realUserCampus || "Main Campus"];
  }, [campuses, realUserCampus, student]);

  const safeOptionsList = useMemo(() => {
    if (programs && programs.length > 0) return programs;
    return isSchool ? DEFAULT_SCHOOL_CLASSES : DEFAULT_PROGRAMS;
  }, [programs, isSchool]);

  const defaultCampus =
    student?.campus ||
    student?.campusId?.name ||
    realUserCampus ||
    safeCampuses[0] ||
    "Main Campus";

  const [values, setValues] = useState(() => ({
    name: student?.name ?? "",
    roll: student?.roll ?? "",
    email: student?.email ?? "",
    studentPhone: student?.studentPhone ?? student?.phone ?? "",
    program: student?.gradeOrClass ?? student?.program ?? safeOptionsList[0] ?? "",
    section: student?.section ?? (isSchool ? "A" : ""),
    semester: student?.semester ?? (isSchool ? "2024-2025" : "1st Semester"),
    subjects:
      student?.subjects ??
      (isSchool
        ? "Mathematics, General Science, English, Urdu, Social Studies, Islamiat"
        : ""),
    campus: defaultCampus,
    status: student?.status ?? "Active",
    guardian: student?.guardian ?? "",
    guardianPhone: student?.guardianPhone ?? "",
    baseFee: student?.baseFee ?? 0,
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

    if (isSchool) {
      saved.gradeOrClass = saved.program;
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
      title={
        isSchool
          ? editing ? "Edit Student Record" : "Add New Student"
          : editing ? "Edit Student Record" : "Register New Student"
      }
      subtitle={
        isSchool
          ? editing
            ? `Updating school record and parent contacts for ${student?.name || "student"}.`
            : "Fill in student details, assigned class & section, enrolled subjects, and guardian contact."
          : editing
            ? `Updating profile and academic registration for ${student?.name || "student"}.`
            : "Fill in student profile, academic program, section, and guardian contact details."
      }
      parentName="Students Directory"
      icon={isSchool ? <School size={22} /> : <GraduationCap size={22} />}
      onBack={onClose}
      maxWidth={1600}
      className="student-form-page"
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
            Some existing records share an email or roll number. Make sure each student has a distinct identity.
          </p>
        )}

        <div className="activity-form-grid">
          <div className="activity-section-title">
            {isSchool ? "Student Identification & Contact" : "Personal & Academic Identification"}
          </div>

          {field("name", "Full Student Name", {
            placeholder: isSchool ? "e.g. Hamza Tariq" : "e.g. Ali Raza"
          })}
          {field("roll", isSchool ? "Roll No / Admission No" : "Roll Number / Student ID", {
            placeholder: isSchool ? "e.g. 10-A-01 or ADM-2024-52" : "e.g. CS-2024-001"
          })}

          {field("email", isSchool ? "Student / Parent Email" : "Email Address", {
            type: "email",
            optional: isSchool,
            placeholder: isSchool ? "parent.contact@gmail.com" : "student@example.com",
          })}
          {field("studentPhone", isSchool ? "Student / Home Phone (Optional)" : "Student Phone (Optional)", {
            type: "tel",
            optional: true,
            placeholder: "+92 333 1234567",
          })}

          <div className="activity-section-title">
            {isSchool ? "Class & Academic Enrollment" : "Program & Enrollment Details"}
          </div>

          {field("program", isSchool ? "Assigned Class / Grade" : "Degree Program", {
            options: safeOptionsList
          })}
          {field("section", isSchool ? "Section (A, B, C, D)" : "Class Section", {
            placeholder: isSchool ? "e.g. Section A" : "e.g. CS-4A"
          })}
          {field("semester", isSchool ? "Academic Session / Year" : "Current Semester", {
            placeholder: isSchool ? "e.g. 2024-2025" : "e.g. 4th Semester"
          })}
          {field("campus", isSchool ? "School Campus Branch" : "Assigned Campus Branch", {
            options: safeCampuses
          })}

          <div className="activity-form-field span-2">
            <Label htmlFor={`${id}-subjects`}>
              {isSchool ? "Enrolled School Subjects *" : "Enrolled Subjects *"}
            </Label>
            <input
              id={`${id}-subjects`}
              name="subjects"
              value={values.subjects}
              required
              placeholder={
                isSchool
                  ? "e.g. Mathematics, English Language, Urdu, General Science, Islamiat, Computer"
                  : "e.g. Advanced Web Design, Data Structures, Machine Learning"
              }
              onChange={(e) => setValues((prev) => ({ ...prev, subjects: e.target.value }))}
            />
          </div>

          {field("status", "Enrollment Status", { options: studentStatuses })}

          <div className="activity-section-title">
            Financial Details
          </div>

          <div className="activity-form-field">
            <Label htmlFor={`${id}-baseFee`}>Predefined Monthly Fee (PKR) *</Label>
            <input
              id={`${id}-baseFee`}
              name="baseFee"
              type="number"
              min="0"
              value={values.baseFee}
              required
              placeholder="e.g. 5000"
              onChange={(e) => setValues((prev) => ({ ...prev, baseFee: e.target.value }))}
            />
          </div>
          <div className="activity-form-field"></div>

          <div className="activity-section-title">
            {isSchool ? "Parent / Guardian Record" : "Guardian Information"}
          </div>

          {field("guardian", isSchool ? "Father / Guardian Name *" : "Father / Guardian Name", {
            optional: !isSchool,
            placeholder: "e.g. Muhammad Tariq",
          })}
          {field("guardianPhone", isSchool ? "Parent Contact / WhatsApp *" : "Guardian Contact Number", {
            optional: !isSchool,
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
              : isSchool ? "Add Student" : "Register Student"}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
