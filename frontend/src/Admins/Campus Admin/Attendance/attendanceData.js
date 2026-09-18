import { dateKey, parseDate, validDate } from "../../../lib/dates.js";
import { mondayOf, shiftDays } from "../../../lib/schedule.js";

import { attendanceStatuses } from "../../../lib/attendance.js";
export { attendanceStatuses } from "../../../lib/attendance.js";
export function validateAttendance(record) {
  if (!record.facultyId?.trim()) return "Select a faculty or staff member.";
  if (!validDate(record.date)) return "Enter a valid date.";
  if (!attendanceStatuses.includes(record.status))
    return "Select an attendance status.";
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (
    ![record.checkInTime, record.checkOutTime].every(
      (value) => typeof value === "string" && (!value || time.test(value)),
    )
  )
    return "Enter valid check-in and check-out times.";
  if (record.checkOutTime && !record.checkInTime)
    return "Enter a check-in time before adding check-out.";
  if (
    record.checkInTime &&
    record.checkOutTime &&
    record.checkOutTime <= record.checkInTime
  )
    return "Check-out must be after check-in for this date.";
  return "";
}
export function filterPeople(
  faculty,
  { search = "", department = "", facultyId = "" },
) {
  const query = search.trim().toLowerCase();
  return faculty.filter(
    (person) =>
      (!query ||
        [person.name, person.email, person.department].some((value) =>
          value.toLowerCase().includes(query),
        )) &&
      (!department || person.department === department) &&
      (!facultyId || person.id === facultyId),
  );
}
export function attendanceRows(records, faculty, date, view, filters) {
  const people = filterPeople(faculty, filters);
  const byId = new Map(people.map((person) => [person.id, person]));
  if (view === "daily") {
    const byPerson = new Map(
      records
        .filter((record) => record.date === date)
        .map((record) => [record.facultyId, record]),
    );
    return people
      .map((person) => ({ person, record: byPerson.get(person.id), date }))
      .filter(
        ({ record }) => !filters.status || record?.status === filters.status,
      );
  }
  const week = mondayOf(parseDate(date));
  return records
    .filter(
      (record) =>
        byId.has(record.facultyId) &&
        (!filters.status || record.status === filters.status) &&
        (view === "weekly"
          ? record.date >= dateKey(week) &&
            record.date <= dateKey(shiftDays(week, 6))
          : (!filters.from || record.date >= filters.from) &&
            (!filters.to || record.date <= filters.to)),
    )
    .map((record) => ({
      person: byId.get(record.facultyId),
      record,
      date: record.date,
    }))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        a.person.name.localeCompare(b.person.name),
    );
}
export function weeklySummary(rows, people, status) {
  const groups = new Map(
    (status ? [] : people).map((person) => [
      person.id,
      {
        person,
        counts: Object.fromEntries(
          attendanceStatuses.map((value) => [value, 0]),
        ),
      },
    ]),
  );
  for (const { person, record } of rows) {
    if (!groups.has(person.id))
      groups.set(person.id, {
        person,
        counts: Object.fromEntries(
          attendanceStatuses.map((value) => [value, 0]),
        ),
      });
    groups.get(person.id).counts[record.status]++;
  }
  return [...groups.values()];
}
export function attendanceSummary(records, faculty, date) {
  const ids = new Set(faculty.map((person) => person.id));
  const counts = Object.fromEntries(
    attendanceStatuses.map((status) => [status, 0]),
  );
  for (const record of records)
    if (record.date === date && ids.has(record.facultyId))
      counts[record.status]++;
  return { total: faculty.length, ...counts };
}
export function attendanceExport(rows, weekly = false, period = []) {
  return weekly
    ? {
        headers: [
          "Teacher / Staff",
          "Email",
          "Department",
          ...(period.length ? ["Week Start", "Week End"] : []),
          ...attendanceStatuses,
        ],
        rows: rows.map(({ person, counts }) => [
          person.name,
          person.email,
          person.department,
          ...period,
          ...attendanceStatuses.map((status) => counts[status]),
        ]),
      }
    : {
        headers: [
          "Teacher / Staff",
          "Email",
          "Department",
          "Date",
          "Check-in",
          "Check-out",
          "Status",
        ],
        rows: rows.map(({ person, record, date }) => [
          person.name,
          person.email,
          person.department,
          date,
          record?.checkInTime ?? "",
          record?.checkOutTime ?? "",
          record?.status ?? "",
        ]),
      };
}
