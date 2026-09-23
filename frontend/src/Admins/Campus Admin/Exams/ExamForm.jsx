import { useState } from "react";
import { Calendar, FileClock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { examFields, examTypes, validateExam } from "./examData.js";
import FullPageFormShell from "@/components/common/FullPageFormShell";

export default function ExamForm({ record, options, onSave, onClose }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      examFields.map(([key]) => [
        key,
        record?.[key] ?? (key === "examType" ? "Midterm" : ""),
      ]),
    ),
  );
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const cleaned = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, String(value).trim()]),
    );
    const message = validateExam(cleaned);
    if (message) return setError(message);
    onSave({
      ...cleaned,
      totalMarks: Number(cleaned.totalMarks) > 0 ? Number(cleaned.totalMarks) : 100,
      className: cleaned.department || cleaned.section || "General",
      examName: `${cleaned.examType || "Midterm"} Examination - ${cleaned.subject}`,
    });
  };

  return (
    <FullPageFormShell
      title={record ? "Edit Examination Schedule" : "Schedule New Examination"}
      subtitle={
        record
          ? `Editing exam entry for ${record.subject} (${record.examType}).`
          : "Define exam type, subject, datesheet, hall allocation, and invigilator."
      }
      parentName="Exam Schedules"
      icon={<FileClock size={22} />}
      onBack={onClose}
    >
      <form onSubmit={submit}>
        <div className="activity-form-grid">
          <div className="activity-section-title">Examination Specifications</div>

          {examFields.map(([key, label, type]) => (
            <div className="activity-form-field" key={key}>
              <Label htmlFor={`exam-${key}`}>
                {label}
                {key !== "department" && " *"}
              </Label>
              {key === "examType" ? (
                <select
                  id={`exam-${key}`}
                  value={values[key]}
                  onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                >
                  {examTypes.map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    id={`exam-${key}`}
                    type={type ?? "text"}
                    required={key !== "department"}
                    step={type === "number" ? "any" : undefined}
                    list={options[key]?.length ? `exam-${key}-options` : undefined}
                    value={values[key]}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    onChange={(e) => {
                      setValues({ ...values, [key]: e.target.value });
                      setError("");
                    }}
                  />
                  {options[key]?.length > 0 && (
                    <datalist id={`exam-${key}-options`}>
                      {options[key].map((val) => (
                        <option key={val} value={val} />
                      ))}
                    </datalist>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#dc2626",
            }}
          >
            {error}
          </p>
        )}

        <div className="activity-form-actions">
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="activity-submit-btn">
            {record ? "Save Exam Changes" : "Confirm & Schedule Exam"}
          </button>
        </div>
      </form>
    </FullPageFormShell>
  );
}
