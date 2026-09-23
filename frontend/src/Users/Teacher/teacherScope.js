import { createSelector } from "@reduxjs/toolkit";
import { selectCurrentUser } from "../../store/Slices/authSlice.js";
import { selectFaculty } from "../../store/Slices/facultySlice.js";
import { selectStudents } from "../../store/Slices/studentsSlice.js";
import { selectTimetable } from "../../store/Slices/timetableSlice.js";

const text = (value) => String(value ?? "").trim();
const normalized = (value) => text(value).toLocaleLowerCase();
const idOf = (value) =>
  typeof value === "object" && value !== null
    ? text(value.id || value._id)
    : text(value);
const firstId = (...values) => values.map(idOf).find(Boolean) || "";

export function resolveTeacherIdentity(user, faculty = []) {
  if (!user || !["teacher", "faculty"].includes(user.role)) return null;

  const accountId = firstId(user.id, user._id);
  const explicitId = firstId(
    user.teacherId,
    user.facultyId,
    user.faculty?.id,
    user.faculty?._id,
    user.profile?.facultyId,
    user.profile?.teacherId,
  );
  const email = normalized(user.email);
  const suppliedName = normalized(user.name || user.fullName);
  const byExplicitId = faculty.find((person) => {
    const facultyId = firstId(person.id, person._id);
    const linkedAccount = firstId(
      person.userId,
      person.accountId,
      person.authUserId,
      person.user?.id,
      person.user?._id,
    );
    return (
      [explicitId, accountId].filter(Boolean).includes(facultyId) ||
      [explicitId, accountId].filter(Boolean).includes(linkedAccount)
    );
  });
  const emailMatches = email
    ? faculty.filter((person) => normalized(person.email) === email)
    : [];
  const nameMatches = suppliedName
    ? faculty.filter((person) => normalized(person.name) === suppliedName)
    : [];
  const matched =
    byExplicitId ||
    (emailMatches.length === 1 ? emailMatches[0] : null) ||
    (nameMatches.length === 1 ? nameMatches[0] : null);

  if (matched) {
    return {
      id: firstId(matched.id, matched._id, explicitId, accountId),
      accountId,
      name: text(matched.name || user.name || user.fullName),
      email: text(matched.email || user.email),
      record: matched,
    };
  }
  const identityId = explicitId || accountId;
  if (identityId) {
    return {
      id: identityId,
      accountId,
      name: text(user.name || user.fullName),
      email: text(user.email),
      record: null,
    };
  }
  return null;
}

export function classBelongsToTeacher(record, teacher) {
  if (!record || !teacher?.id) return false;
  const linkedIds = [
    record.teacherId,
    record.instructorId,
    record.assignedTeacherId,
    record.facultyId,
  ]
    .map(idOf)
    .filter(Boolean);
  if (linkedIds.length)
    return linkedIds.some(
      (id) => id === teacher.id || id === teacher.accountId,
    );
  const names = [record.instructor, record.teacherName]
    .map(normalized)
    .filter(Boolean);
  return Boolean(teacher.name && names.includes(normalized(teacher.name)));
}

export const selectTeacherIdentity = createSelector(
  [selectCurrentUser, selectFaculty],
  resolveTeacherIdentity,
);

export const selectAssignedTeacherClasses = createSelector(
  [selectTimetable, selectTeacherIdentity],
  (records, teacher) =>
    teacher
      ? records.filter((record) => classBelongsToTeacher(record, teacher))
      : [],
);

const list = (value) =>
  Array.isArray(value)
    ? value.map(idOf).filter(Boolean)
    : typeof value === "string"
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

export function studentBelongsToClass(student, course) {
  if (!student || !course) return false;
  const studentId = firstId(student.id, student._id);
  const classId = firstId(course.id, course._id);
  const classRoster = list(course.studentIds || course.enrolledStudentIds);
  if (classRoster.length) return classRoster.includes(studentId);

  const studentClassIds = list(
    student.classIds || student.assignedClassIds || student.scheduleIds,
  );
  if (studentClassIds.length) return studentClassIds.includes(classId);

  const courseId = firstId(course.courseId, course.subjectId);
  const studentCourseIds = list(student.courseIds || student.subjectIds);
  if (courseId && studentCourseIds.length)
    return studentCourseIds.includes(courseId);

  const studentProgram = normalized(student.program || student.gradeOrClass);
  const courseProgram = normalized(
    course.program || course.gradeOrClass || course.className,
  );
  const studentSectionId = firstId(student.sectionId);
  const courseSectionId = firstId(course.sectionId);
  const studentSection = normalized(student.section);
  const courseSection = normalized(course.section || course.classSection);
  const sectionMatches =
    (studentSectionId &&
      courseSectionId &&
      studentSectionId === courseSectionId) ||
    (studentSection && courseSection && studentSection === courseSection);
  if (!sectionMatches) return false;
  if (studentProgram && courseProgram && studentProgram !== courseProgram)
    return false;

  const subject = normalized(
    course.subject || course.periodName || course.title,
  );
  const enrolledSubjects = list(student.subjects || student.courses).map(
    normalized,
  );
  if (subject && enrolledSubjects.length && !enrolledSubjects.includes(subject))
    return false;
  const campusId = firstId(
    student.campusId,
    student.campus?.id,
    student.campus?._id,
  );
  const courseCampusId = firstId(
    course.campusId,
    course.campus?.id,
    course.campus?._id,
  );
  if (campusId && courseCampusId && campusId !== courseCampusId) return false;
  return true;
}

export function studentsForClass(students, course) {
  return students.filter((student) => studentBelongsToClass(student, course));
}

export const selectStudentsForAssignedClasses = createSelector(
  [selectStudents, selectAssignedTeacherClasses],
  (students, classes) => {
    const byId = new Map();
    for (const course of classes)
      for (const student of studentsForClass(students, course))
        byId.set(firstId(student.id, student._id), student);
    return [...byId.values()];
  },
);

export function teacherMayContactFaculty(teacher, classes, facultyId) {
  if (!teacher?.id || !facultyId) return false;
  return classes.some((course) => {
    const ids = [
      ...(Array.isArray(course.teacherIds) ? course.teacherIds : []),
      ...(Array.isArray(course.facultyIds) ? course.facultyIds : []),
      ...(Array.isArray(course.coTeachers) ? course.coTeachers : []),
      course.coTeacherId,
      course.assistantTeacherId,
    ].map(idOf);
    return ids.includes(facultyId) && facultyId !== teacher.id;
  });
}

export const teacherIdentityKey = (teacher) =>
  teacher?.id ? `faculty:${teacher.id}` : "";
export const studentIdentityKey = (studentId) =>
  studentId ? `student:${studentId}` : "";
