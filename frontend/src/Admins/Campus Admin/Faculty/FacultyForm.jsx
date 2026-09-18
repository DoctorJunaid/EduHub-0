import { useState } from "react";
import { Users, School, GraduationCap, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { facultyStatuses } from "./facultyData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";

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

const DEFAULT_SCHOOL_DESIGNATIONS = [
  "Class Teacher (Incharge)",
  "Senior Subject Teacher",
  "Secondary School Teacher (SST)",
  "Primary School Teacher (PST)",
  "Physical Education Teacher (PET)",
  "Art & Craft Teacher",
  "Section Coordinator / Head",
  "Vice Principal / Headmistress",
];

const DEFAULT_SCHOOL_DEPARTMENTS = [
  "Primary Wing (Grade 1-5)",
  "Middle Wing (Grade 6-8)",
  "Secondary Wing (Grade 9-10)",
  "Sciences & Mathematics",
  "Languages (English & Urdu)",
  "Social & Islamic Studies",
  "Computer Studies & Robotics",
  "Sports & Physical Education",
];

const DEFAULT_CAMPUSES = ["Main Campus"];

export default function FacultyForm({ teacher, options = {}, onSave, onClose }) {
  const { isSchool } = useInstitution();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const designations = isSchool
    ? DEFAULT_SCHOOL_DESIGNATIONS
    : (options?.designation && options.designation.length ? options.designation : DEFAULT_DESIGNATIONS);

  const departments = isSchool
    ? DEFAULT_SCHOOL_DEPARTMENTS
    : (options?.department && options.department.length ? options.department : DEFAULT_DEPARTMENTS);

  const campuses =
    options?.campus && options.campus.length
      ? options.campus
      : DEFAULT_CAMPUSES;

  const [values, setValues] = useState(() => ({
    name: teacher?.name ?? "",
    email: teacher?.email ?? "",
    designation: teacher?.designation ?? designations[0],
    qualification: teacher?.qualification ?? (isSchool ? "B.Ed / M.Sc Mathematics" : "M.S / Ph.D"),
    department: teacher?.department ?? departments[0],
    phone: teacher?.phone ?? "",
    subjects: teacher?.subjects ?? (isSchool ? "Mathematics, General Science (Grade 9 & 10)" : ""),
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
      title={
        isSchool
          ? teacher ? "Edit School Teacher" : "Appoint / Register Teacher"
          : teacher ? "Edit Faculty Member" : "Register Faculty Member"
      }
      subtitle={
        isSchool
          ? teacher
            ? `Updating profile and subject assignments for ${teacher.name}.`
            : "Add class incharge teachers, subject specialists, and school educators."
          : teacher
            ? `Updating faculty records and course allocations for ${teacher.name}.`
            : "Add professors, lecturers, heads of department, and academic instructors."
      }
      parentName={isSchool ? "Teaching Staff" : "Faculty Directory"}
      icon={isSchool ? <School size={22} /> : <GraduationCap size={22} />}
      onBack={onClose}
    >
      <form onSubmit={submit}>
        <div className="activity-form-grid">
          <div className="activity-section-title">
            {isSchool ? "Teacher Identification & Contact" : "Personal & Professional Information"}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-name">{isSchool ? "Full Teacher Name *" : "Full Faculty Name *"}</Label>
            <input
              id="faculty-name"
              required
              placeholder={isSchool ? "e.g. Ms. Ayesha Siddiqa" : "e.g. Dr. Usman Khan"}
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-email">Email Address *</Label>
            <input
              id="faculty-email"
              type="email"
              required
              placeholder={isSchool ? "ayesha.siddiqa@school.edu.pk" : "usman.khan@nust.edu.pk"}
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-phone">Contact Phone Number</Label>
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
              placeholder={isSchool ? "e.g. M.Sc Mathematics, B.Ed" : "e.g. Ph.D. in Computer Science"}
              value={values.qualification}
              onChange={(e) => handleChange("qualification", e.target.value)}
            />
          </div>

          <div className="activity-section-title">
            {isSchool ? "Designation & Wing Assignment" : "Department & Academic Assignment"}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-designation">{isSchool ? "Teaching Role / Designation *" : "Designation / Title *"}</Label>
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
            <Label htmlFor="faculty-dept">{isSchool ? "School Wing / Department *" : "Academic Department *"}</Label>
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
            <Label htmlFor="faculty-subjects">
              {isSchool ? "Assigned Subjects & Classes *" : "Assigned Subjects / Teaching Load *"}
            </Label>
            <input
              id="faculty-subjects"
              required
              placeholder={
                isSchool
                  ? "e.g. Mathematics (Grade 9-A, 10-A), General Science (Grade 8-B)"
                  : "e.g. Advanced Web Design, Operating Systems, Artificial Intelligence"
              }
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
                ? "Updating..."
                : "Saving..."
              : teacher
              ? isSchool ? "Update Teacher Record" : "Update Faculty Member"
              : isSchool ? "Appoint Teacher" : "Register Teacher"}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
