import test from "node:test";
import assert from "node:assert/strict";
import { demoInstitute, instituteRecords } from "./instituteData.js";
test("institute IDs take priority and legacy demo records require a known campus", () => {
  const campus = demoInstitute.campuses[0];
  const records = [
    { id: "demo", campus },
    { id: "foreign", campus, instituteId: "other" },
    { id: "owned", campus: "Another branch", instituteId: demoInstitute.id },
    { id: "unknown", campus: "Unrelated campus" },
  ];
  assert.deepEqual(
    instituteRecords(records).map((record) => record.id),
    ["demo", "owned"],
  );
  assert.deepEqual(instituteRecords([]), []);
});
