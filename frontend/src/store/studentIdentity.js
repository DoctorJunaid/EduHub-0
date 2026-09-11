const normalized = (value) => (value || "").trim().toLowerCase();
export function studentIdentityErrors(values, records, id = values.id) {
  const errors = {};
  for (const [key, label] of [
    ["email", "email address"],
    ["roll", "roll number"],
  ]) {
    const value = normalized(values[key]);
    if (
      value &&
      records.some((row) => row.id !== id && normalized(row[key]) === value)
    )
      errors[key] = `Another student already uses this ${label}.`;
  }
  return errors;
}
export const hasStudentIdentityConflicts = (records) =>
  records.some(
    (row) => Object.keys(studentIdentityErrors(row, records)).length,
  );
