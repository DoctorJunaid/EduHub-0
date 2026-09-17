import { useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { facultyStatuses } from "./facultyData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";

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

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(
        Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]),
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FullPageFormShell
      title={teacher ? "Edit Faculty Member" : "Register Faculty Member"}
      subtitle={
        teacher
          ? `Updating faculty records and course allocations for ${teacher.name}.`
          : "Add professors, lecturers, heads of department, and academic instructors."
      }
      parentName="Faculty Directory"
      icon={<Users size={22} />}
      onBack={onClose}
    >
      <form onSubmit={submit}>
        <div className="activity-form-grid">
          <div className="activity-section-title">Personal & Professional Information</div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-name">Full Faculty Name *</Label>
            <input
              id="faculty-name"
              required
              placeholder="e.g. Dr. Usman Khan"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-email">Institutional Email Address *</Label>
            <input
              id="faculty-email"
              type="email"
              required
              placeholder="usman.khan@nust.edu.pk"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-phone">Contact Phone Number (Optional)</Label>
            <input
              id="faculty-phone"
              type="tel"
              placeholder="+92 300 1234567"
              value={values.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-qualification">Highest Qualification *</Label>
            <input
              id="faculty-qualification"
              required
              placeholder="e.g. Ph.D. in Computer Science"
              value={values.qualification}
              onChange={(e) => handleChange("qualification", e.target.value)}
            />
          </div>

          <div className="activity-section-title">Department & Academic Assignment</div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-designation">Designation / Title *</Label>
            <select
              id="faculty-designation"
              value={values.designation}
              onChange={(e) => handleChange("designation", e.target.value)}
            >
              {designations.map((desig) => (
                <option key={desig} value={desig}>
                  {desig}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-dept">Academic Department *</Label>
            <select
              id="faculty-dept"
              value={values.department}
              onChange={(e) => handleChange("department", e.target.value)}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-campus">Assigned Campus Branch *</Label>
            <select
              id="faculty-campus"
              value={values.campus}
              onChange={(e) => handleChange("campus", e.target.value)}
            >
              {campuses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-status">Duty / Employment Status *</Label>
            <select
              id="faculty-status"
              value={values.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              {facultyStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="activity-form-field span-2">
            <Label htmlFor="faculty-subjects">Assigned Subjects / Teaching Load *</Label>
            <input
              id="faculty-subjects"
              required
              placeholder="e.g. Advanced Web Design, Operating Systems, Artificial Intelligence"
              value={values.subjects}
              onChange={(e) => handleChange("subjects", e.target.value)}
            />
          </div>
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
              ? teacher
                ? "Updating Faculty..."
                : "Saving Faculty..."
              : teacher
              ? "Update Faculty Member"
              : "Register Teacher"}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
