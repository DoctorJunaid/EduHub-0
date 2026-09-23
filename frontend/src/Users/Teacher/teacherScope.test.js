import test from "node:test";
import assert from "node:assert/strict";
import {
  classBelongsToTeacher,
  resolveTeacherIdentity,
  studentBelongsToClass,
  teacherMayContactFaculty,
} from "./teacherScope.js";

const faculty = [
  {
    id: "faculty-1",
    name: "Dr. A. Teacher",
    email: "teacher@example.test",
    userId: "account-1",
  },
  { id: "faculty-2", name: "Other Teacher", email: "other@example.test" },
];

test("Teacher identity resolves explicit account links and assigned classes fail closed", () => {
  const teacher = resolveTeacherIdentity(
    { id: "account-1", role: "teacher", email: "teacher@example.test" },
    faculty,
  );
  assert.equal(teacher.id, "faculty-1");
  assert.equal(
    classBelongsToTeacher({ id: "class-1", teacherId: "faculty-1" }, teacher),
    true,
  );
  assert.equal(
    classBelongsToTeacher({ id: "class-2", teacherId: "faculty-2" }, teacher),
    false,
  );
  assert.equal(
    classBelongsToTeacher(
      { id: "class-3", instructor: "Unrelated Person" },
      teacher,
    ),
    false,
  );
  assert.equal(
    resolveTeacherIdentity({ id: "account-1", role: "student" }, faculty),
    null,
  );
});

test("class roster and co-teacher relationships constrain students and faculty contacts", () => {
  const teacher = resolveTeacherIdentity(
    { id: "account-1", role: "teacher", email: "teacher@example.test" },
    faculty,
  );
  const course = {
    id: "class-1",
    studentIds: ["student-1"],
    teacherIds: ["faculty-1", "faculty-2"],
  };
  assert.equal(
    studentBelongsToClass({ id: "student-1", section: "CS-4A" }, course),
    true,
  );
  assert.equal(
    studentBelongsToClass({ id: "student-2", section: "CS-4A" }, course),
    false,
  );
  assert.equal(teacherMayContactFaculty(teacher, [course], "faculty-2"), true);
  assert.equal(teacherMayContactFaculty(teacher, [course], "faculty-3"), false);
});
