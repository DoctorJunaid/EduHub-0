import { dateKey } from "../lib/dates.js";
import { feeReferenceVouchers } from "./feeReferenceData.js";
import { seedRecord, isUntouchedSeed, isDemoRecord } from "./demoProvenance.js";

const prefix = "student-portal-demo";
const legacyDemoResult = (row) =>
  row.courseCode?.startsWith("DEMO-") &&
  row.remarks ===
    "Demo result for previewing academic reports. Replace with actual awarded marks.";
// Fill only missing data for the existing reference student. Real/saved records are never rewritten.
export function populateStudentDemo(state, now = new Date()) {
  const student = state.students.records.find(
    (row) =>
      row.id === "student-demo-1" &&
      row.email?.toLowerCase() === "ali.raza@nust.edu.pk",
  );
  if (!student) return state;
  const teacher = state.faculty.records[0];
  if (!teacher) return state;
  const subjects = [
    ...new Set(
      (student.subjects || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  if (!subjects.length) return state;
  const next = { ...state };
  const daysFrom = (offset) => {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    return dateKey(date);
  };
  const stamp = (offset) => `${daysFrom(offset)}T08:00:00.000Z`;
  const owned = (row) => row.studentId === student.id;
  const setRecords = (collection, records) => {
    next[collection] = { ...state[collection], records };
  };
  const fill = (collection, records, matches) => {
    const existing = next[collection].records;
    if (!existing.some(matches))
      setRecords(collection, [...existing, ...records]);
  };
  const sessions = subjects.map((subject, index) => {
    const existing = state.timetable.records.find(
      (row) =>
        row.subject === subject &&
        row.section === student.section &&
        row.program === student.program,
    );
    if (existing) return existing;
    return {
      id: `${prefix}-class-${index}`,
      subject,
      program: student.program,
      section: student.section,
      instructor: teacher.name,
      room: ["Lab 302", "Hall B", "AI Research Lab"][index % 3],
      days: [1, 2, 3, 4, 5],
      startTime: `${String(10 + index * 2).padStart(2, "0")}:00`,
      endTime: `${String(11 + index * 2).padStart(2, "0")}:00`,
      status: "Active",
      creditHours: 3,
      demo: true,
    };
  });
  const addedSessions = sessions.filter(
    (row) =>
      !state.timetable.records.some((existing) => existing.id === row.id),
  );
  // A supplemental demo class gives the first enrolled subject a current-day routine without rewriting its saved schedule.
  const weekday = now.getDay();
  if (
    weekday >= 1 &&
    weekday <= 5 &&
    !sessions.some((row) => row.days.includes(weekday))
  )
    addedSessions.push({
      ...sessions[0],
      id: `${prefix}-today`,
      days: [weekday],
      demo: true,
    });
  if (addedSessions.length)
    setRecords("timetable", [
      ...state.timetable.records,
      ...addedSessions.filter(
        (row) =>
          !state.timetable.records.some((existing) => existing.id === row.id),
      ),
    ]);
  const classIds = new Set(sessions.map((row) => row.id));
  const tasks = [
    "Responsive Dashboard Design & State Architecture",
    "Search Trees & Graph Traversal",
    "REST API Integration & JWT Auth Flow",
  ].map((title, index) => ({
    id: `${prefix}-assignment-${index}`,
    classId: sessions[index % sessions.length].id,
    title,
    dueDate: daysFrom(index === 2 ? -3 : index + 2),
    totalMarks: index === 2 ? 40 : 50,
    demo: true,
  }));
  fill("assignments", tasks, (row) => classIds.has(row.classId));
  const hasDemoTask = (index) =>
    next.assignments.records.some(
      (row) => row.id === tasks[index].id && row.demo,
    );
  const submissions = [0, 2].filter(hasDemoTask).map((index) => ({
    id: `${prefix}-submission-${index}`,
    assignmentId: tasks[index].id,
    studentId: student.id,
    notes:
      index === 0
        ? "Implemented the dashboard wireframe and responsive layout."
        : "Completed the API integration exercise.",
    status: index === 2 ? "Graded" : "Submitted",
    score: index === 2 ? 38 : null,
    feedback:
      index === 2 ? "Demo feedback: clear structure and good validation." : "",
    demo: true,
  }));
  fill("submissions", submissions, owned);
  fill(
    "studentAttendance",
    sessions.flatMap((session, index) =>
      [1, 2, 3, 4].map((offset) => ({
        id: `${prefix}-attendance-${index}-${offset}`,
        studentId: student.id,
        classId: session.id,
        date: (() => {
          let remaining = offset;
          const date = new Date(now);
          while (remaining > 0) {
            date.setDate(date.getDate() - 1);
            if (session.days.includes(date.getDay())) remaining -= 1;
          }
          return dateKey(date);
        })(),
        status: index === 1 && offset === 3 ? "Absent" : "Present",
        demo: true,
      })),
    ),
    owned,
  );
  fill(
    "diary",
    sessions.map((session, index) => ({
      id: `${prefix}-diary-${index}`,
      classId: session.id,
      title: [
        "Component State & Responsive Layouts",
        "Graph Traversal & Search Trees",
        "Problem Solving with Intelligent Agents",
      ][index % 3],
      date: daysFrom(index < 2 ? 0 : -1),
      recap: [
        "Reviewed component boundaries, state updates, and accessible layouts.",
        "Traced breadth-first and depth-first search with classroom examples.",
        "Compared search strategies and discussed their practical tradeoffs.",
      ][index % 3],
      homework:
        "Review the lecture examples and complete the practice exercises.",
      ...(hasDemoTask(index % 3) ? { assignmentId: tasks[index % 3].id } : {}),
      resources: "Review the instructor’s lecture notes and worked examples.",
      demo: true,
    })),
    (row) => classIds.has(row.classId),
  );
  const existingAwards = state.results.records.filter(owned);
  if (!existingAwards.some((row) => !row.demo && !legacyDemoResult(row))) {
    const demoExams = sessions.map((session, index) => ({
      id: `${prefix}-exam-${index}`,
      subject: session.subject,
      examType: "Final",
      department: teacher.department || "",
      section: student.section,
      date: daysFrom(-7),
      startTime: session.startTime,
      endTime: session.endTime,
      room: session.room,
      invigilator: teacher.name,
      totalMarks: 100,
      demo: true,
    }));
    fill("exams", demoExams, (row) => row.id.startsWith(`${prefix}-exam-`));
    if (!existingAwards.some((row) => row.demo))
      setRecords("results", [
        ...state.results.records.filter(
          (row) => !owned(row) || !legacyDemoResult(row),
        ),
        ...demoExams.map((exam, index) => ({
          id: `${prefix}-result-${index}`,
          studentId: student.id,
          examId: exam.id,
          academicYear: `${now.getFullYear()} - ${now.getFullYear() + 1}`,
          semester: student.semester,
          courseCode: "",
          score: [92, 88, 90][index % 3],
          totalMarks: 100,
          grade: index === 1 ? "A" : "A+",
          gpa: index === 1 ? 3.8 : 4,
          creditHours: 3,
          remarks: "Demo academic result for Student portal preview.",
          createdAt: stamp(-7),
          updatedAt: stamp(-7),
          demo: true,
        })),
      ]);
  }
  const eligibleForDemoCgpa = !existingAwards.some(
    (row) => !row.demo && !legacyDemoResult(row),
  );
  if (eligibleForDemoCgpa && student.cgpa == null)
    setRecords(
      "students",
      state.students.records.map((row) =>
        row.id === student.id
          ? {
              ...row,
              cgpa: 3.93,
              completedCredits: subjects.length * 3,
              academicStanding: "Good Standing",
              courseCredits: Object.fromEntries(
                subjects.map((subject) => [subject, 3]),
              ),
              academicSummaryDemo: true,
            }
          : row,
      ),
    );
  fill(
    "fees",
    feeReferenceVouchers.map((row) => ({
      ...row,
      id: `${prefix}-${row.id}`,
      studentId: student.id,
      paymentDate: row.dueDate,
      createdAt: stamp(-10),
      updatedAt: stamp(-10),
      demo: true,
    })),
    owned,
  );
  const peer = state.students.records.find(
    (row) => row.id !== student.id && row.campus === student.campus,
  );
  const peers = [
    {
      type: "faculty",
      person: teacher,
      body: "Hello! You can ask questions about the lecture exercises here.",
    },
    ...(peer
      ? [
          {
            type: "student",
            person: peer,
            body: "Hi! Shall we review the practice questions after class?",
          },
        ]
      : []),
  ];
  const self = `student:${student.id}`;
  const demoThreads = peers.map(({ type, person, body }, index) => {
    const id = `thread:${prefix}-${index}`,
      other = `${type}:${person.id}`;
    return {
      id,
      participantIds: [self, other],
      updatedAt: stamp(-index),
      messages: [
        {
          id: `${prefix}-message-${index}`,
          conversationId: id,
          senderId: other,
          receiverId: self,
          body,
          createdAt: stamp(-index),
        },
      ],
      demo: true,
    };
  });
  const ownThreads = state.messages.records.filter((row) =>
    row.participantIds?.includes(self),
  );
  if (!ownThreads.some((row) => !row.demo))
    setRecords("messages", [
      ...state.messages.records,
      ...demoThreads.filter(
        (row) =>
          !state.messages.records.some((existing) => existing.id === row.id),
      ),
    ]);
  // Capture only newly created seeds, never retroactively declare saved records untouched.
  for (const [collection, slice] of Object.entries(next)) {
    if (!slice?.records || slice === state[collection]) continue;
    const oldIds = new Set(state[collection].records.map((row) => row.id));
    next[collection] = {
      ...slice,
      records: slice.records.map((row) =>
        row.demo && !oldIds.has(row.id) ? seedRecord(row) : row,
      ),
    };
  }
  return next;
}

export function preferRealStudentData(state) {
  const student = state.students.records.find(
    (row) => row.id === "student-demo-1",
  );
  if (!student) return state;
  let next = state;
  const ownClasses = new Set(
    state.timetable.records
      .filter(
        (row) =>
          row.program === student.program && row.section === student.section,
      )
      .map((row) => row.id),
  );
  for (const collection of [
    "assignments",
    "diary",
    "results",
    "fees",
    "studentAttendance",
    "messages",
  ]) {
    const matches = (row) =>
      collection === "messages"
        ? row.participantIds?.includes(`student:${student.id}`)
        : ["assignments", "diary"].includes(collection)
          ? ownClasses.has(row.classId)
          : row.studentId === student.id;
    const records = state[collection].records;
    if (
      records.some(
        (row) =>
          matches(row) &&
          !isDemoRecord(row) &&
          !(collection === "results" && legacyDemoResult(row)),
      ) &&
      records.some((row) => matches(row) && isUntouchedSeed(row))
    ) {
      next = {
        ...next,
        [collection]: {
          ...state[collection],
          records: records.filter(
            (row) => !matches(row) || !isUntouchedSeed(row),
          ),
        },
      };
    }
  }
  return next;
}
