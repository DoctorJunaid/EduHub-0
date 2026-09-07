const fields = {
  faculty: ['name', 'email', 'designation', 'qualification', 'department', 'phone', 'subjects', 'campus', 'status', 'initials'],
  students: ['name', 'roll', 'email', 'studentPhone', 'program', 'section', 'semester', 'subjects', 'campus', 'status', 'guardian', 'guardianPhone', 'initials'],
  timetable: ['subject', 'program', 'section', 'instructor', 'room', 'startTime', 'endTime', 'status'],
};
export const storageKeys = { faculty: 'eduhub_faculty', students: 'eduhub_students', timetable: 'eduhub_timetable' };
const statuses = { faculty: ['Active', 'Pending', 'Inactive'], students: ['Active', 'Pending', 'Graduated', 'Suspended'], timetable: ['Active', 'Pending'] };

function validRecords(collection, records) {
  if (!Array.isArray(records)) return false;
  const ids = new Set();
  return records.every((record) => {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id || ids.has(record.id)) return false;
    ids.add(record.id);
    if (!fields[collection].every((field) => typeof record[field] === 'string') || !statuses[collection].includes(record.status)) return false;
    if (collection === 'timetable') {
      const time = /^([01]\d|2[0-3]):[0-5]\d$/;
      return Array.isArray(record.days) && record.days.length > 0 && record.days.every((day) => Number.isInteger(day) && day >= 1 && day <= 5) && time.test(record.startTime) && time.test(record.endTime) && record.endTime > record.startTime;
    }
    return true;
  });
}

function browserStorage() {
  try { return typeof window !== 'undefined' ? window.localStorage : undefined; } catch { return undefined; }
}

export function loadDemoState(storage = browserStorage()) {
  const state = {};
  for (const [collection, key] of Object.entries(storageKeys)) {
    try {
      const stored = JSON.parse(storage?.getItem(key) ?? 'null');
      if (stored?.version === 1 && validRecords(collection, stored.records)) state[collection] = { records: stored.records };
    } catch { /* Invalid or inaccessible storage falls back to the reducer's seed state. */ }
  }
  return state;
}

export function persistDemoState(store, storage = browserStorage()) {
  const previous = {};
  const sync = () => {
    const state = store.getState();
    for (const [collection, key] of Object.entries(storageKeys)) {
      const records = state[collection]?.records;
      if (!records || records === previous[collection]) continue;
      try { storage?.setItem(key, JSON.stringify({ version: 1, records })); previous[collection] = records; }
      catch { /* Keep Redux usable when storage is full or unavailable; retry on a later change. */ }
    }
  };
  sync();
  return store.subscribe(sync);
}
