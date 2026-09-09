import { demoInstitute } from "../instituteData.js";
export const initialCampuses = [
  {
    id: "camp_1",
    instituteId: demoInstitute.id,
    name: demoInstitute.campuses[0],
    address: "Sector H-12, Islamabad",
    status: "Active",
  },
  {
    id: "camp_2",
    instituteId: demoInstitute.id,
    name: "EME College Campus",
    address: "Peshawar Road, Rawalpindi",
    status: "Active",
  },
];
export const campusStatuses = ['Active'];
export function validateCampus(values) {
  if (!values.name?.trim()) return "Campus name is required.";
  if (!values.address?.trim()) return "Address is required.";
  if (!campusStatuses.includes(values.status)) return "Select a supported campus status.";
  return "";
}
export function filterCampuses(records, search) {
  const query = search.trim().toLowerCase();
  return records.filter((campus) =>
    `${campus.name} ${campus.address} ${campus.id}`
      .toLowerCase()
      .includes(query),
  );
}
export function validCampuses(records) {
  if (!Array.isArray(records)) return false;
  const ids = new Set();
  return records.every((record) => {
    if (
      !record ||
      !["id", "instituteId", "name", "address", "status"].every(
        (key) => typeof record[key] === "string" && record[key].trim(),
      ) ||
      ids.has(record.id) ||
      validateCampus(record)
    )
      return false;
    ids.add(record.id);
    return true;
  });
}
