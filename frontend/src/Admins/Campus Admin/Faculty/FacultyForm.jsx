import { useState } from "react";
import { useSelector } from "react-redux";
import { School, GraduationCap } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { facultyStatuses } from "./facultyData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";
import { selectCurrentUser } from "@/store/Slices/authSlice.js";

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
  const currentUser = useSelector(selectCurrentUser);
  const realUserCampus = currentUser?.campusId?.name || currentUser?.campus;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const designations = isSchool
    ? DEFAULT_SCHOOL_DESIGNATIONS
    : (options?.designation && options.designation.length ? options.designation : DEFAULT_DESIGNATIONS);

  const departments = isSchool
    ? DEFAULT_SCHOOL_DEPARTMENTS
    : (options?.department && options.department.length ? options.department : DEFAULT_DEPARTMENTS);

  const campuses = (() => {
    const rawList = [
      ...(options?.campus || []),
      realUserCampus,
    ].filter(Boolean);
    return rawList.length ? [...new Set(rawList)] : (realUserCampus ? [realUserCampus] : DEFAULT_CAMPUSES);
  })();

  const [values, setValues] = useState(() => ({
    name: teacher?.name ?? "",
    email: teacher?.email ?? "",
    designation: teacher?.designation ?? designations[0],
    qualification: teacher?.qualification ?? (isSchool ? "B.Ed / M.Sc Mathematics" : "M.S / Ph.D"),
    department: teacher?.department ?? departments[0],
    phone: teacher?.phone ?? "",
    subjects: teacher?.subjects ?? (isSchool ? "Mathematics, General Science (Grade 9 & 10)" : ""),
    campus: teacher?.campus ?? realUserCampus ?? campuses[0] ?? "Main Campus",
    status: teacher?.status ?? "Active",
  }));

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!values.name?.trim()) {
      newErrors.name = "Full teacher name is required.";
    }
    if (!values.email?.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!values.qualification?.trim()) {
      newErrors.qualification = "Highest qualification is required.";
    }
    if (!values.designation?.trim()) {
      newErrors.designation = "Teaching role / designation is required.";
    }
    if (!values.department?.trim()) {
      newErrors.department = "School wing / department is required.";
    }
    if (!values.campus?.trim()) {
      newErrors.campus = "Assigned campus branch is required.";
    }
    if (!values.status?.trim()) {
      newErrors.status = "Duty / employment status is required.";
    }
    if (!values.subjects?.trim()) {
      newErrors.subjects = "Assigned subjects & classes are required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
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
      maxWidth={1040}
      className="faculty-form-page"
    >
      <form onSubmit={submit} noValidate>
        <div className="activity-form-grid">
          {/* Section 1: Identification & Contact */}
          <div className="activity-section-title">
            {isSchool ? "Teacher Identification & Contact" : "Personal & Professional Information"}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-name">
              {isSchool ? "Full Teacher Name *" : "Full Faculty Name *"}
            </Label>
            <Input
              id="faculty-name"
              placeholder={isSchool ? "e.g. Ms. Ayesha Siddiqa" : "e.g. Dr. Usman Khan"}
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              aria-invalid={!!errors.name}
              className="h-10 text-sm bg-white"
            />
            {errors.name && (
              <p className="text-xs text-rose-500 font-medium mt-0.5" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-email">Email Address *</Label>
            <Input
              id="faculty-email"
              type="email"
              placeholder={isSchool ? "ayesha.siddiqa@school.edu.pk" : "usman.khan@campus.edu.pk"}
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              aria-invalid={!!errors.email}
              className="h-10 text-sm bg-white"
            />
            {errors.email && (
              <p className="text-xs text-rose-500 font-medium mt-0.5" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-phone">Contact Phone Number</Label>
            <Input
              id="faculty-phone"
              type="tel"
              placeholder="+92 300 1234567"
              value={values.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="h-10 text-sm bg-white"
            />
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-qualification">Highest Qualification *</Label>
            <Input
              id="faculty-qualification"
              placeholder={isSchool ? "B.Ed / M.Sc Mathematics" : "M.S / Ph.D"}
              value={values.qualification}
              onChange={(e) => handleChange("qualification", e.target.value)}
              aria-invalid={!!errors.qualification}
              className="h-10 text-sm bg-white"
            />
            {errors.qualification && (
              <p className="text-xs text-rose-500 font-medium mt-0.5" role="alert">
                {errors.qualification}
              </p>
            )}
          </div>

          {/* Section Divider */}
          <div className="faculty-section-divider" />

          {/* Section 2: Designation & Wing Assignment */}
          <div className="activity-section-title">
            {isSchool ? "Designation & Wing Assignment" : "Department & Academic Assignment"}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-designation">
              {isSchool ? "Teaching Role / Designation *" : "Designation / Title *"}
            </Label>
            <Select
              value={values.designation}
              onValueChange={(val) => handleChange("designation", val)}
            >
              <SelectTrigger id="faculty-designation" className="h-10 text-sm bg-white w-full">
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                {designations.map((desig) => (
                  <SelectItem key={desig} value={desig}>
                    {desig}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.designation && (
              <p className="text-xs text-rose-500 font-medium mt-0.5" role="alert">
                {errors.designation}
              </p>
            )}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-dept">
              {isSchool ? "School Wing / Department *" : "Academic Department *"}
            </Label>
            <Select
              value={values.department}
              onValueChange={(val) => handleChange("department", val)}
            >
              <SelectTrigger id="faculty-dept" className="h-10 text-sm bg-white w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && (
              <p className="text-xs text-rose-500 font-medium mt-0.5" role="alert">
                {errors.department}
              </p>
            )}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-campus">Assigned Campus Branch *</Label>
            <Select
              value={values.campus}
              onValueChange={(val) => handleChange("campus", val)}
            >
              <SelectTrigger id="faculty-campus" className="h-10 text-sm bg-white w-full">
                <SelectValue placeholder="Select campus branch" />
              </SelectTrigger>
              <SelectContent>
                {campuses.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.campus && (
              <p className="text-xs text-rose-500 font-medium mt-0.5" role="alert">
                {errors.campus}
              </p>
            )}
          </div>

          <div className="activity-form-field">
            <Label htmlFor="faculty-status">Duty / Employment Status *</Label>
            <Select
              value={values.status}
              onValueChange={(val) => handleChange("status", val)}
            >
              <SelectTrigger id="faculty-status" className="h-10 text-sm bg-white w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {facultyStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-xs text-rose-500 font-medium mt-0.5" role="alert">
                {errors.status}
              </p>
            )}
          </div>

          <div className="activity-form-field span-2">
            <Label htmlFor="faculty-subjects">
              {isSchool ? "Assigned Subjects & Classes *" : "Assigned Subjects / Teaching Load *"}
            </Label>
            <Input
              id="faculty-subjects"
              placeholder={
                isSchool
                  ? "e.g. Mathematics, General Science (Grade 9 & 10)"
                  : "e.g. Advanced Web Design, Operating Systems, Artificial Intelligence"
              }
              value={values.subjects}
              onChange={(e) => handleChange("subjects", e.target.value)}
              aria-invalid={!!errors.subjects}
              className="h-10 text-sm bg-white"
            />
            {errors.subjects && (
              <p className="text-xs text-rose-500 font-medium mt-0.5" role="alert">
                {errors.subjects}
              </p>
            )}
          </div>
        </div>

        <div className="activity-form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 px-6 text-sm font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-6 text-sm font-semibold shadow-xs"
          >
            {isSubmitting && <Spinner className="mr-2 size-4 text-white" />}
            {teacher
              ? isSchool ? "Update Teacher Record" : "Update Faculty Member"
              : isSchool ? "Appoint Teacher" : "Register Teacher"}
          </Button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
