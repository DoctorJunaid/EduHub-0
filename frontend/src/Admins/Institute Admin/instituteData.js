// Single-institute frontend demo metadata; no tenant registry exists yet.
export const demoInstitute = {
  id: "nust-demo",
  name: "NUST (National University of Sciences and Technology)",
  type: "University",
  board: "Federal",
  campuses: ["NUST Main Campus (H-12)"],
};
export function instituteRecords(records, institute = demoInstitute) {
  return records.filter((record) =>
    record.instituteId
      ? record.instituteId === institute.id
      : institute.campuses.includes(record.campus),
  );
}
