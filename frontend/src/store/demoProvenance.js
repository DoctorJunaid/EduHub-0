// A demo flag describes origin, not permission to delete. Unknown legacy origin is preserved.
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const fingerprint = ({ seedFingerprint: _fingerprint, ...record }) =>
  JSON.stringify(canonical(record));
export const seedRecord = (record) => ({
  ...record,
  seedFingerprint: fingerprint(record),
});
export const isUntouchedSeed = (record) =>
  Boolean(
    record?.demo &&
    record.seedFingerprint &&
    !record.userModified &&
    record.seedFingerprint === fingerprint(record),
  );
export const isDemoRecord = (record) =>
  Boolean(
    record?.demo ||
    (record?.courseCode?.startsWith("DEMO-") &&
      record.remarks ===
        "Demo result for previewing academic reports. Replace with actual awarded marks."),
  );

// Preserve provenance across existing RTK reducers, including edits to old, unversioned demos.
export function preserveDemoEdits(previous, next) {
  if (!previous || previous === next) return next;
  let result = next;
  for (const [key, slice] of Object.entries(next)) {
    if (!slice?.records || slice === previous[key]) continue;
    const old = new Map(
      (previous[key]?.records || []).map((row) => [row.id, row]),
    );
    const records = slice.records.map((row) => {
      const before = old.get(row.id);
      return before &&
        isDemoRecord(before) &&
        before !== row &&
        !row.userModified
        ? { ...row, demo: true, userModified: true }
        : row;
    });
    if (records.some((row, index) => row !== slice.records[index]))
      result = { ...result, [key]: { ...slice, records } };
  }
  return result;
}
