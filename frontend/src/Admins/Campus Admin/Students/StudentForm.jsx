import { useId, useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectStudents } from "@/store/Slices/studentsSlice";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { studentIdentityErrors, hasStudentIdentityConflicts } from "@/store/studentIdentity";
import { Users, School, GraduationCap, Check, BookOpen } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { studentStatuses } from "./studentData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";
import axiosInstance from "@/api/axiosInstance";

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

  // Dynamic Academic State
  const [academicGrades, setAcademicGrades] = useState([]);
  const [academicSections, setAcademicSections] = useState([]);
  const [gradeSubjects, setGradeSubjects] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState(
    () => student?.gradeId?._id || student?.gradeId || ""
  );
  const [selectedSectionId, setSelectedSectionId] = useState(
    () => student?.sectionId?._id || student?.sectionId || ""
  );

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

  // Fetch academic grades from backend for real dynamic options
  useEffect(() => {
    let isMounted = true;
    const fetchGrades = async () => {
      try {
        const res = await axiosInstance.get("/academic/grades");
        if (isMounted && res.data && Array.isArray(res.data)) {
          setAcademicGrades(res.data);

          const currentGradeName = student?.gradeOrClass || student?.program;
          if (currentGradeName && !selectedGradeId) {
            const matched = res.data.find(
              (g) =>
                g.name.toLowerCase() === currentGradeName.toLowerCase() ||
                g._id === currentGradeName
            );
            if (matched) {
              setSelectedGradeId(matched._id);
            }
          } else if (!editing && res.data.length > 0 && !selectedGradeId) {
            setSelectedGradeId(res.data[0]._id);
            setValues((prev) => ({
              ...prev,
              program: res.data[0].name,
            }));
          }
        }
      } catch (err) {
        console.warn("Could not load academic grades:", err.message);
      }
    };

    fetchGrades();
    return () => {
      isMounted = false;
    };
  }, []);

  // When a grade is selected, fetch corresponding sections and grade-subjects
  useEffect(() => {
    if (!selectedGradeId) {
      setAcademicSections([]);
      setGradeSubjects([]);
      return;
    }

    let isMounted = true;
    const fetchGradeDetails = async () => {
      try {
        const [secRes, subjRes] = await Promise.all([
          axiosInstance.get("/academic/sections", {
            params: { gradeId: selectedGradeId },
          }),
          axiosInstance.get("/academic/grade-subjects", {
            params: { gradeId: selectedGradeId },
          }),
        ]);

        if (!isMounted) return;

        const secs = secRes.data && Array.isArray(secRes.data) ? secRes.data : [];
        const subjs = subjRes.data && Array.isArray(subjRes.data) ? subjRes.data : [];

        setAcademicSections(secs);
        setGradeSubjects(subjs);

        // Auto-match or select section
        if (secs.length > 0) {
          const currentSectionName = values.section;
          const matchSec = secs.find(
            (s) =>
              s._id === selectedSectionId ||
              s.name.toLowerCase() === (currentSectionName || "").toLowerCase()
          );
          if (matchSec) {
            setSelectedSectionId(matchSec._id);
            setValues((prev) => ({ ...prev, section: matchSec.name }));
          } else if (!selectedSectionId) {
            setSelectedSectionId(secs[0]._id);
            setValues((prev) => ({ ...prev, section: secs[0].name }));
          }
        }

        // Auto-populate subjects for new student if subjects field is empty or default
        if (!editing && subjs.length > 0) {
          const defaultNames = subjs
            .map((gs) => gs.subjectId?.name)
            .filter(Boolean);
          if (defaultNames.length > 0) {
            setValues((prev) => {
              if (
                !prev.subjects ||
                prev.subjects ===
                  "Mathematics, General Science, English, Urdu, Social Studies, Islamiat"
              ) {
                return { ...prev, subjects: defaultNames.join(", ") };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.warn("Could not load grade sections and subjects:", err.message);
      }
    };

    fetchGradeDetails();
    return () => {
      isMounted = false;
    };
  }, [selectedGradeId]);

  // Handle grade change
  const handleGradeChange = (e) => {
    const val = e.target.value;
    const matchedGrade = academicGrades.find(
      (g) => g._id === val || g.name === val
    );
    if (matchedGrade) {
      setSelectedGradeId(matchedGrade._id);
      setSelectedSectionId("");
      setValues((prev) => ({
        ...prev,
        program: matchedGrade.name,
      }));
    } else {
      setSelectedGradeId("");
      setSelectedSectionId("");
      setValues((prev) => ({
        ...prev,
        program: val,
      }));
    }
  };

  // Handle section change
  const handleSectionChange = (e) => {
    const val = e.target.value;
    const matchedSection = academicSections.find(
      (s) => s._id === val || s.name === val
    );
    if (matchedSection) {
      setSelectedSectionId(matchedSection._id);
      setValues((prev) => ({
        ...prev,
        section: matchedSection.name,
      }));
    } else {
      setSelectedSectionId("");
      setValues((prev) => ({
        ...prev,
        section: val,
      }));
    }
  };

  // Parsed array of subjects for chip toggles
  const currentSubjectList = useMemo(() => {
    return (values.subjects || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [values.subjects]);

  const toggleSubject = (subjectName) => {
    const trimmed = subjectName.trim();
    const exists = currentSubjectList.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    let updated;
    if (exists) {
      updated = currentSubjectList.filter(
        (s) => s.toLowerCase() !== trimmed.toLowerCase()
      );
    } else {
      updated = [...currentSubjectList, trimmed];
    }
    setValues((prev) => ({ ...prev, subjects: updated.join(", ") }));
  };

  const selectAllSubjects = () => {
    if (!gradeSubjects || gradeSubjects.length === 0) return;
    const allNames = gradeSubjects
      .map((gs) => gs.subjectId?.name)
      .filter(Boolean);
    const combined = [...new Set([...currentSubjectList, ...allNames])];
    setValues((prev) => ({ ...prev, subjects: combined.join(", ") }));
  };

  const clearSubjects = () => {
    setValues((prev) => ({ ...prev, subjects: "" }));
  };

  const field = (
    key,
    label,
    { type = "text", placeholder, options, optional = false } = {}
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
          !optional && !event.target.value.trim() ? `${label} is required.` : ""
        );
        setValues((previous) => ({ ...previous, [key]: event.target.value }));
      },
    };

    return (
      <div className="activity-form-field">
        <Label htmlFor={props.id}>
          {label}
          {!optional && " *"}
        </Label>
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
      Object.entries(values).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ])
    );

    if (editing && !editAllFields) {
      saved.campus = student.campus;
      saved.guardianPhone = student.guardianPhone;
    }

    saved.gradeOrClass = saved.program;
    if (selectedGradeId) {
      saved.gradeId = selectedGradeId;
    }
    if (selectedSectionId) {
      saved.sectionId = selectedSectionId;
    }

    const problems = studentIdentityErrors(
      saved,
      records,
      student?.id || student?._id
    );
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
          ? editing
            ? "Edit Student Record"
            : "Add New Student"
          : editing
          ? "Edit Student Record"
          : "Register New Student"
      }
      subtitle={
        isSchool
          ? editing
            ? `Updating school record and parent contacts for ${
                student?.name || "student"
              }.`
            : "Fill in student details, assigned class & section, enrolled subjects, and guardian contact."
          : editing
          ? `Updating profile and academic registration for ${
              student?.name || "student"
            }.`
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
            Some existing records share an email or roll number. Make sure each
            student has a distinct identity.
          </p>
        )}

        <div className="activity-form-grid">
          <div className="activity-section-title">
            {isSchool
              ? "Student Identification & Contact"
              : "Personal & Academic Identification"}
          </div>

          {field("name", "Full Student Name", {
            placeholder: isSchool ? "e.g. Hamza Tariq" : "e.g. Ali Raza",
          })}
          {field(
            "roll",
            isSchool ? "Roll No / Admission No" : "Roll Number / Student ID",
            {
              placeholder: isSchool
                ? "e.g. 10-A-01 or ADM-2024-52"
                : "e.g. CS-2024-001",
            }
          )}

          {field("email", isSchool ? "Student / Parent Email" : "Email Address", {
            type: "email",
            optional: isSchool,
            placeholder: isSchool
              ? "parent.contact@gmail.com"
              : "student@example.com",
          })}
          {field(
            "studentPhone",
            isSchool
              ? "Student / Home Phone (Optional)"
              : "Student Phone (Optional)",
            {
              type: "tel",
              optional: true,
              placeholder: "+92 333 1234567",
            }
          )}

          <div className="activity-section-title">
            {isSchool
              ? "Class & Academic Enrollment"
              : "Program & Enrollment Details"}
          </div>

          {/* Assigned Class / Grade Dropdown */}
          <div className="activity-form-field">
            <Label htmlFor={`${id}-program`}>
              {isSchool ? "Assigned Class / Grade *" : "Degree Program *"}
            </Label>
            {academicGrades.length > 0 ? (
              <select
                id={`${id}-program`}
                name="program"
                value={selectedGradeId || values.program}
                onChange={handleGradeChange}
                required
              >
                <option value="" disabled>
                  -- Select Class / Grade --
                </option>
                {academicGrades.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} {g.code ? `(${g.code})` : ""}
                  </option>
                ))}
                {values.program &&
                  !academicGrades.some(
                    (g) => g._id === selectedGradeId || g.name === values.program
                  ) && (
                    <option value={values.program}>
                      {values.program} (Custom)
                    </option>
                  )}
              </select>
            ) : (
              <select
                id={`${id}-program`}
                name="program"
                value={values.program}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, program: e.target.value }))
                }
                required
              >
                {safeOptionsList.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Section Dropdown or Input */}
          <div className="activity-form-field">
            <Label htmlFor={`${id}-section`}>
              {isSchool ? "Section (A, B, C, D) *" : "Class Section *"}
            </Label>
            {academicSections.length > 0 ? (
              <select
                id={`${id}-section`}
                name="section"
                value={selectedSectionId || values.section}
                onChange={handleSectionChange}
                required
              >
                <option value="" disabled>
                  -- Select Section --
                </option>
                {academicSections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.capacity ? `(Cap: ${s.capacity})` : ""}
                  </option>
                ))}
                {values.section &&
                  !academicSections.some(
                    (s) =>
                      s._id === selectedSectionId || s.name === values.section
                  ) && (
                    <option value={values.section}>
                      {values.section} (Custom)
                    </option>
                  )}
              </select>
            ) : (
              <input
                id={`${id}-section`}
                name="section"
                value={values.section}
                placeholder={isSchool ? "e.g. Section A" : "e.g. CS-4A"}
                required
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, section: e.target.value }))
                }
              />
            )}
          </div>

          {field(
            "semester",
            isSchool ? "Academic Session / Year" : "Current Semester",
            {
              placeholder: isSchool ? "e.g. 2024-2025" : "e.g. 4th Semester",
            }
          )}
          {field(
            "campus",
            isSchool ? "School Campus Branch" : "Assigned Campus Branch",
            {
              options: safeCampuses,
            }
          )}

          {/* Enrolled Subjects with Interactive Chips */}
          <div className="activity-form-field span-2">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <Label htmlFor={`${id}-subjects`} style={{ margin: 0 }}>
                {isSchool
                  ? "Enrolled School Subjects *"
                  : "Enrolled Subjects *"}
              </Label>
              {gradeSubjects.length > 0 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={selectAllSubjects}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#0284c7",
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Select All ({gradeSubjects.length})
                  </button>
                  <button
                    type="button"
                    onClick={clearSubjects}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#dc2626",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Subject Badges */}
            {gradeSubjects.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  padding: "10px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  marginBottom: "8px",
                }}
              >
                {gradeSubjects.map((gs) => {
                  const subName = gs.subjectId?.name;
                  if (!subName) return null;
                  const isSelected = currentSubjectList.some(
                    (s) => s.toLowerCase() === subName.toLowerCase()
                  );
                  return (
                    <button
                      key={gs._id}
                      type="button"
                      onClick={() => toggleSubject(subName)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        border: isSelected
                          ? "1px solid #0284c7"
                          : "1px solid #cbd5e1",
                        background: isSelected ? "#0284c7" : "#ffffff",
                        color: isSelected ? "#ffffff" : "#334155",
                        boxShadow: isSelected
                          ? "0 1px 2px rgba(2, 132, 199, 0.2)"
                          : "none",
                      }}
                    >
                      {isSelected && <Check size={13} strokeWidth={2.5} />}
                      <span>{subName}</span>
                      {gs.subjectId?.code && (
                        <span
                          style={{
                            fontSize: "10px",
                            opacity: isSelected ? 0.9 : 0.6,
                            marginLeft: "2px",
                          }}
                        >
                          ({gs.subjectId.code})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

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
              onChange={(e) =>
                setValues((prev) => ({ ...prev, subjects: e.target.value }))
              }
            />
            <small
              style={{
                fontSize: "11px",
                color: "#64748b",
                marginTop: "4px",
                display: "block",
              }}
            >
              Click badges above to quickly toggle enrolled subjects, or edit
              custom subjects directly separated by commas.
            </small>
          </div>

          {field("status", "Enrollment Status", { options: studentStatuses })}

          <div className="activity-section-title">Financial Details</div>

          <div className="activity-form-field">
            <Label htmlFor={`${id}-baseFee`}>
              Predefined Monthly Fee (PKR) *
            </Label>
            <input
              id={`${id}-baseFee`}
              name="baseFee"
              type="number"
              min="0"
              value={values.baseFee}
              required
              placeholder="e.g. 5000"
              onChange={(e) =>
                setValues((prev) => ({ ...prev, baseFee: e.target.value }))
              }
            />
          </div>
          <div className="activity-form-field"></div>

          <div className="activity-section-title">
            {isSchool ? "Parent / Guardian Record" : "Guardian Information"}
          </div>

          {field(
            "guardian",
            isSchool ? "Father / Guardian Name *" : "Father / Guardian Name",
            {
              optional: !isSchool,
              placeholder: "e.g. Muhammad Tariq",
            }
          )}
          {field(
            "guardianPhone",
            isSchool
              ? "Parent Contact / WhatsApp *"
              : "Guardian Contact Number",
            {
              optional: !isSchool,
              type: "tel",
              placeholder: "+92 300 9876543",
            }
          )}
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
            {isSubmitting && <Spinner className="mr-2 size-4" />}
            {editing
              ? "Update Student Record"
              : isSchool
              ? "Add Student"
              : "Register Student"}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
