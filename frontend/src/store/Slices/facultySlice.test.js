import test from "node:test";
import assert from "node:assert/strict";
import { configureStore } from "@reduxjs/toolkit";
import reducer, {
  facultyAdded,
  facultyUpdated,
  facultyDeleted,
  selectFaculty,
} from "./facultySlice.js";
import { filterFaculty } from "../../Admins/Campus Admin/Faculty/facultyData.js";

const makeStore = () => configureStore({ reducer: { faculty: reducer } });
const values = {
  name: "Test Teacher",
  email: "teacher@example.com",
  designation: "Associate Professor",
  qualification: "Ph.D. Computer Science",
  department: "Computer Science",
  phone: "",
  subjects: "Data Structures",
  campus: "NUST Main Campus (H-12)",
  status: "Pending",
};

test("add retains existing records and supports optional blank phone", () => {
  const store = makeStore();
  const original = selectFaculty(store.getState())[0];
  store.dispatch(facultyAdded(values));
  const records = selectFaculty(store.getState());
  assert.equal(records.length, 2);
  assert.deepEqual(records[0], original);
  assert.deepEqual(records[1], {
    ...values,
    id: records[1].id,
    initials: "TT",
  });
  assert.notEqual(records[1].id, original.id);
});

test("edit updates by stable ID even when email changes, without replacing others", () => {
  const store = makeStore();
  store.dispatch(facultyAdded(values));
  const [original, added] = selectFaculty(store.getState());
  store.dispatch(
    facultyUpdated({
      ...values,
      id: added.id,
      name: "New Name",
      email: "new@example.com",
      phone: "+92 300",
      status: "Inactive",
    }),
  );
  const records = selectFaculty(store.getState());
  assert.deepEqual(records[0], original);
  assert.equal(records.length, 2);
  assert.equal(records[1].id, added.id);
  assert.equal(records[1].email, "new@example.com");
  assert.equal(records[1].initials, "NN");
  assert.equal(records[1].phone, "+92 300");
  assert.equal(records[1].status, "Inactive");
});

test("delete targets only the selected ID; the collection can become empty", () => {
  const store = makeStore();
  store.dispatch(facultyAdded(values));
  const [original, added] = selectFaculty(store.getState());
  store.dispatch(facultyDeleted(original.id));
  assert.deepEqual(selectFaculty(store.getState()), [added]);
  store.dispatch(facultyDeleted(added.id));
  assert.deepEqual(selectFaculty(store.getState()), []);
});

test("unknown IDs do not alter the collection", () => {
  const store = makeStore();
  const before = selectFaculty(store.getState());
  store.dispatch(facultyUpdated({ ...values, id: "missing" }));
  store.dispatch(facultyDeleted("missing"));
  assert.deepEqual(selectFaculty(store.getState()), before);
});

test("filters see Redux additions and edits; no unrequested email uniqueness rule", () => {
  const store = makeStore();
  store.dispatch(facultyAdded(values));
  store.dispatch(facultyAdded(values));
  const records = selectFaculty(store.getState());
  const matching = filterFaculty(records, {
    search: " TEST ",
    department: "Computer Science",
    designation: "Associate Professor",
    status: "Pending",
  });
  assert.equal(matching.length, 2);
  assert.notEqual(matching[0].id, matching[1].id);
  store.dispatch(facultyUpdated({ ...matching[0], status: "Active" }));
  assert.equal(
    filterFaculty(selectFaculty(store.getState()), {
      search: "",
      department: "",
      designation: "",
      status: "Pending",
    }).length,
    1,
  );
});
