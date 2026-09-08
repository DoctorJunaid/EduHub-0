export const severities = ['Info', 'Warning', 'Critical'];
export function audienceOptions(campuses, students, staff) {
  return [
    { value: 'all', label: 'All Campuses (Staff & Students)' },
    ...(staff.length ? [{ value: 'staff', label: 'All Staff' }] : []),
    ...(students.length ? [{ value: 'students', label: 'All Students' }] : []),
    ...campuses.map((campus) => ({ value: `campus:${campus.id}`, label: `${campus.name} (Staff & Students)` })),
  ];
}
export function validateBroadcast({ audience, severity, message }, options) {
  if (!options.some((option) => option.value === audience)) return 'Select a valid target audience.';
  if (!severities.includes(severity)) return 'Select an alert severity.';
  if (typeof message !== 'string' || !message.trim()) return 'Enter a message before broadcasting.';
  return '';
}
export function validBroadcasts(records) {
  const ids = new Set();
  return Array.isArray(records) && records.every((record) => {
    if (!record || !['id', 'instituteId', 'audience', 'message', 'createdBy', 'createdAt'].every((key) => typeof record[key] === 'string' && record[key].trim()) || ids.has(record.id)) return false;
    ids.add(record.id);
    return severities.includes(record.severity) && /^(all|staff|students|campus:.+)$/.test(record.audience) && Number.isFinite(Date.parse(record.createdAt));
  });
}
