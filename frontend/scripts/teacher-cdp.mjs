const port = Number(process.env.CDP_PORT || 9223);
const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(
  (response) => response.json(),
);
const page = targets.find((target) => target.type === "page");
if (!page) throw new Error("No browser page is available through CDP.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const events = [];
let sequence = 0;

socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
    return;
  }
  events.push(message);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const evaluate = async (expression, awaitPromise = false) => {
  const response = await send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  });
  if (response.exceptionDetails) {
    throw new Error(
      response.exceptionDetails.exception?.description ||
        response.exceptionDetails.text,
    );
  }
  return response.result?.value;
};

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const waitFor = async (expression, message, timeout = 8000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      if (await evaluate(expression)) return;
    } catch {
      // A navigation may briefly replace the execution context or document.
    }
    await wait(100);
  }
  throw new Error(message);
};
const go = async (path, ready) => {
  await evaluate(`location.href = ${JSON.stringify(path)}`);
  await waitFor(ready, `${path} did not render.`, 20000);
};
const clickText = (selector, label) =>
  evaluate(`(() => {
  const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
    .find((node) => node.textContent.trim().includes(${JSON.stringify(label)}));
  if (!element) throw new Error(${JSON.stringify(`Could not find ${label}.`)});
  element.click();
  return true;
})()`);
const setValue = (selector, value) =>
  evaluate(`(() => {
  const element = document.querySelector(${JSON.stringify(selector)});
  if (!element) throw new Error(${JSON.stringify(`Could not find ${selector}.`)});
  const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype
    : element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)});
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  return true;
})()`);
const realClick = async (selector) => {
  const point = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) throw new Error(${JSON.stringify(`Could not find ${selector}.`)});
    element.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: point.x,
    y: point.y,
    button: "left",
    clickCount: 1,
  });
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: point.x,
    y: point.y,
    button: "left",
    clickCount: 1,
  });
};

await Promise.all([
  send("Runtime.enable"),
  send("Log.enable"),
  send("Page.enable"),
]);

const command = process.argv[2] || "snapshot";
if (command === "snapshot") {
  await wait(500);
  console.log(
    JSON.stringify(
      {
        url: await evaluate("location.href"),
        root: await evaluate(
          "document.querySelector('#root')?.innerText || ''",
        ),
        html: await evaluate(
          "document.querySelector('#root')?.innerHTML || ''",
        ),
        events: events.filter((event) =>
          [
            "Runtime.exceptionThrown",
            "Log.entryAdded",
            "Runtime.consoleAPICalled",
          ].includes(event.method),
        ),
      },
      null,
      2,
    ),
  );
}

if (command === "seed") {
  const teacher = {
    id: "faculty-demo-1",
    name: "Dr. Usman Khan",
    email: "dr.usman@nu.edu.pk",
    role: "teacher",
  };
  const faculty = [
    {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      designation: "Associate Professor",
      qualification: "Ph.D. Computer Science",
      department: "Computer Science",
      phone: "03000000000",
      subjects: "Advanced Web Design, Data Structures & Algorithms",
      campus: "NUST Main Campus (H-12)",
      status: "Active",
      initials: "UK",
    },
  ];
  const students = [
    {
      id: "student-demo-1",
      name: "Ali Raza",
      roll: "NUST-CS-2023-042",
      email: "ali.raza@nust.edu.pk",
      studentPhone: "03001234567",
      program: "BS Computer Science",
      section: "CS-4A",
      semester: "4th Semester",
      subjects: "Advanced Web Design, Data Structures & Algorithms",
      campus: "NUST Main Campus (H-12)",
      status: "Active",
      guardian: "Raza Khan",
      guardianPhone: "03007654321",
      initials: "AR",
    },
    {
      id: "student-demo-2",
      name: "Zainab Bilal",
      roll: "NUST-CS-2023-088",
      email: "zainab@nust.edu.pk",
      studentPhone: "03001234568",
      program: "BS Computer Science",
      section: "CS-4A",
      semester: "4th Semester",
      subjects: "Advanced Web Design, Data Structures & Algorithms",
      campus: "NUST Main Campus (H-12)",
      status: "Active",
      guardian: "Bilal Ahmed",
      guardianPhone: "03007654322",
      initials: "ZB",
    },
  ];
  const timetable = [
    {
      id: "class-awd",
      subject: "Advanced Web Design",
      program: "BS Computer Science",
      section: "CS-4A",
      instructor: teacher.name,
      teacherId: teacher.id,
      room: "Lab 302",
      days: [1, 3],
      startTime: "10:00",
      endTime: "11:30",
      status: "Active",
      studentIds: students.map(({ id }) => id),
    },
    {
      id: "class-dsa",
      subject: "Data Structures & Algorithms",
      program: "BS Computer Science",
      section: "CS-4A",
      instructor: teacher.name,
      teacherId: teacher.id,
      room: "Hall B",
      days: [2, 4],
      startTime: "13:00",
      endTime: "14:30",
      status: "Active",
      studentIds: students.map(({ id }) => id),
    },
  ];
  const assignments = [
    {
      id: "assignment-existing",
      classId: "class-awd",
      title: "Existing Assignment",
      dueDate: "2026-10-01",
      totalMarks: 50,
      description: "Existing workflow record",
      teacherId: teacher.id,
      teacherName: teacher.name,
      subject: "Advanced Web Design",
      section: "CS-4A",
    },
  ];
  const submissions = [
    {
      id: "submission-existing",
      assignmentId: "assignment-existing",
      studentId: "student-demo-1",
      studentName: "Ali Raza",
      notes: "Existing submitted work",
      status: "Submitted",
      score: null,
      feedback: "",
      submittedAt: "2026-09-20T08:00:00.000Z",
    },
  ];
  const exams = [
    {
      id: "exam-awd",
      classId: "class-awd",
      subject: "Advanced Web Design",
      examType: "Final",
      department: "Computer Science",
      section: "CS-4A",
      date: "2026-09-30",
      startTime: "10:00",
      endTime: "12:00",
      room: "Lab 302",
      invigilator: teacher.name,
      totalMarks: 100,
    },
  ];
  const values = {
    eduhub_auth: { version: 1, user: teacher },
    eduhub_faculty: { version: 1, records: faculty },
    eduhub_students: { version: 1, records: students },
    eduhub_timetable: { version: 1, records: timetable },
    eduhub_assignments: { version: 1, records: assignments },
    eduhub_submissions: { version: 1, records: submissions },
    eduhub_exams: { version: 1, records: exams },
    eduhub_diary: { version: 1, records: [] },
    eduhub_student_attendance: { version: 1, records: [] },
    eduhub_results: { version: 1, records: [] },
    eduhub_messages: { version: 1, records: [] },
    eduhub_demo_lifecycle: { version: 1, initialized: true },
  };
  await evaluate(
    `(() => { const values = ${JSON.stringify(values)}; for (const [key, value] of Object.entries(values)) localStorage.setItem(key, JSON.stringify(value)); location.href = '/teacher'; return true; })()`,
  );
  await waitFor(
    "document.querySelector('.teacher-dashboard') !== null",
    "Teacher dashboard did not render.",
    20000,
  );
  console.log(
    JSON.stringify(
      {
        url: await evaluate("location.href"),
        text: await evaluate("document.querySelector('#root').innerText"),
      },
      null,
      2,
    ),
  );
}

if (command === "assignments") {
  const createdTitle = "Browser Verified Assignment";
  const editedTitle = "Browser Verified Assignment Updated";
  await go(
    "/teacher/assignments",
    "document.querySelector('.teacher-assignments') !== null",
  );
  const createButton = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')]
      .find((node) => node.textContent.trim().includes('Create Assignment'));
    window.__createAssignmentEvents = [];
    for (const type of ['pointerdown', 'mousedown', 'mouseup', 'click'])
      button?.addEventListener(type, () => window.__createAssignmentEvents.push(type));
    return button ? { disabled: button.disabled, type: button.type } : null;
  })()`);
  if (!createButton || createButton.disabled)
    throw new Error("Create Assignment is missing or unexpectedly disabled.");
  await realClick(".teacher-assignments-toolbar .teacher-primary-action");
  await waitFor(
    "document.querySelector('[role=dialog] form') !== null",
    "Create Assignment dialog did not open.",
  );
  await wait(300);
  await setValue("[role=dialog] input[name=title]", createdTitle);
  await setValue("[role=dialog] input[name=dueDate]", "2026-10-15");
  await setValue("[role=dialog] input[name=totalMarks]", "40");
  await setValue(
    "[role=dialog] textarea[name=description]",
    "Created by the browser workflow check.",
  );
  await realClick("[role=dialog] button[type=submit]");
  await waitFor(
    `document.body.innerText.includes(${JSON.stringify(createdTitle)}) && !document.querySelector('[role=dialog]')`,
    "Created assignment did not render or dialog did not close.",
  );
  const createdId = await evaluate(
    `JSON.parse(localStorage.getItem('eduhub_assignments')).records.find((row) => row.title === ${JSON.stringify(createdTitle)})?.id || ''`,
  );
  if (!createdId) throw new Error("Created assignment was not persisted.");
  const physicalEvents = await evaluate("window.__createAssignmentEvents");

  await evaluate("location.reload()");
  await waitFor(
    `document.body.innerText.includes(${JSON.stringify(createdTitle)})`,
    "Created assignment did not survive reload.",
    20000,
  );
  await evaluate(
    `document.querySelector(${JSON.stringify(`[aria-label="Edit ${createdTitle}"]`)})?.click()`,
  );
  await waitFor(
    "document.querySelector('[role=dialog] input[name=title]') !== null",
    "Edit Assignment dialog did not open.",
  );
  await setValue("[role=dialog] input[name=title]", editedTitle);
  await evaluate(
    "document.querySelector('[role=dialog] form').requestSubmit()",
  );
  await waitFor(
    `document.body.innerText.includes(${JSON.stringify(editedTitle)}) && !document.querySelector('[role=dialog]')`,
    "Edited assignment did not update.",
  );
  const editedRecord = await evaluate(
    `JSON.parse(localStorage.getItem('eduhub_assignments')).records.find((row) => row.id === ${JSON.stringify(createdId)})`,
  );
  if (editedRecord?.title !== editedTitle)
    throw new Error("Edit did not update the original persisted assignment.");

  await clickText(".teacher-assignment-card-select", "Existing Assignment");
  await waitFor(
    "[...document.querySelectorAll('button')].some((node) => node.textContent.trim() === 'Grade Now')",
    "Submission grading action did not render.",
  );
  await clickText("button", "Grade Now");
  await waitFor(
    "document.querySelector('[role=dialog] input[name=score]') !== null",
    "Grade dialog did not open.",
  );
  await setValue("[role=dialog] input[name=score]", "42");
  await setValue(
    "[role=dialog] textarea[name=feedback]",
    "Browser verified feedback",
  );
  await evaluate(
    "document.querySelector('[role=dialog] form').requestSubmit()",
  );
  await waitFor(
    "document.body.innerText.includes('42 / 50') && !document.querySelector('[role=dialog]')",
    "Saved grade did not render.",
  );
  await evaluate("location.reload()");
  await waitFor(
    "document.body.innerText.includes('42 / 50')",
    "Saved grade did not survive reload.",
    20000,
  );
  await evaluate(
    "document.querySelector('[aria-label=\"Delete Existing Assignment\"]').click()",
  );
  await wait(250);
  if (await evaluate("document.querySelector('[role=alertdialog]') !== null"))
    throw new Error(
      "An assignment with submissions opened a destructive delete confirmation.",
    );
  if (
    !(await evaluate(
      "JSON.parse(localStorage.getItem('eduhub_assignments')).records.some((row) => row.id === 'assignment-existing')",
    ))
  )
    throw new Error("Protected assignment was deleted.");
  await evaluate(
    `document.querySelector(${JSON.stringify(`[aria-label="Delete ${editedTitle}"]`)})?.click()`,
  );
  await waitFor(
    "document.querySelector('[role=alertdialog]') !== null",
    "Delete confirmation did not open for an assignment without submissions.",
  );
  await clickText("[role=alertdialog] button", "Delete Assignment");
  await waitFor(
    `!document.body.innerText.includes(${JSON.stringify(editedTitle)})`,
    "Confirmed assignment deletion did not update the list.",
  );
  if (
    await evaluate(
      `JSON.parse(localStorage.getItem('eduhub_assignments')).records.some((row) => row.id === ${JSON.stringify(createdId)})`,
    )
  )
    throw new Error("Confirmed assignment deletion was not persisted.");
  console.log(
    JSON.stringify(
      {
        createButton,
        physicalEvents,
        createdId,
        editedTitle: editedRecord.title,
        persistedGrade: await evaluate(
          "JSON.parse(localStorage.getItem('eduhub_submissions')).records.find((row) => row.id === 'submission-existing')",
        ),
        runtimeErrors: events.filter(
          (event) =>
            event.method === "Runtime.exceptionThrown" ||
            (event.method === "Log.entryAdded" &&
              event.params.entry.level === "error" &&
              event.params.entry.source !== "network"),
        ),
      },
      null,
      2,
    ),
  );
}

if (command === "create-trace") {
  await go(
    "/teacher/assignments",
    "document.querySelector('.teacher-assignments') !== null",
  );
  await evaluate(`(() => {
    window.__assignmentTrace = [];
    document.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button')) window.__assignmentTrace.push('pointer:' + event.target.closest('button').textContent.trim());
    }, true);
    document.addEventListener('click', (event) => {
      if (event.target.closest('button')) window.__assignmentTrace.push('click:' + event.target.closest('button').textContent.trim());
    }, true);
    document.addEventListener('submit', () => window.__assignmentTrace.push('submit'), true);
    document.addEventListener('invalid', (event) => window.__assignmentTrace.push('invalid:' + event.target.name), true);
  })()`);
  const before = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent.includes('Create Assignment'));
    const rect = button.getBoundingClientRect();
    return { disabled: button.disabled, type: button.type, pointerEvents: getComputedStyle(button).pointerEvents, topElement: document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.outerHTML.slice(0, 180) };
  })()`);
  await realClick(".teacher-assignments-toolbar .teacher-primary-action");
  await waitFor("document.querySelector('[role=dialog] form') !== null", "Create dialog did not open.");
  await wait(300);
  await setValue("[role=dialog] input[name=title]", "Create Trace Assignment");
  await setValue("[role=dialog] input[name=dueDate]", "2026-10-15");
  await setValue("[role=dialog] input[name=totalMarks]", "40");
  await setValue("[role=dialog] textarea[name=description]", "Create trace description");
  const formBefore = await evaluate(`(() => {
    const form = document.querySelector('[role=dialog] form');
    const button = form.querySelector('button[type=submit]');
    button.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = button.getBoundingClientRect();
    const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { valid: form.checkValidity(), values: Object.fromEntries(new FormData(form)), dialog: Boolean(form), submit: { rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }, pointerEvents: getComputedStyle(button).pointerEvents, topElement: top?.outerHTML.slice(0, 220), viewport: { width: innerWidth, height: innerHeight } } };
  })()`);
  await realClick("[role=dialog] button[type=submit]");
  await wait(750);
  console.log(JSON.stringify({
    before,
    formBefore,
    events: await evaluate("window.__assignmentTrace"),
    after: await evaluate(`({ dialog: Boolean(document.querySelector('[role=dialog]')), assignments: JSON.parse(localStorage.getItem('eduhub_assignments')).records, text: document.querySelector('.teacher-assignment-cards').innerText, toasts: document.querySelector('[data-rht-toaster]').innerText })`),
  }, null, 2));
}

if (command === "attendance") {
  await go(
    "/teacher/attendance?classId=class-awd",
    "document.querySelector('.teacher-attendance') !== null",
  );
  await clickText("button", "Mark All Absent");
  await waitFor(
    "[...document.querySelectorAll('.teacher-attendance tbody tr')].every((row) => row.innerText.includes('Absent'))",
    "Bulk Absent did not update every row.",
  );
  await clickText("button", "Mark All Present");
  await waitFor(
    "[...document.querySelectorAll('.teacher-attendance tbody tr')].every((row) => row.innerText.includes('Present'))",
    "Bulk Present did not update every row.",
  );
  await evaluate(
    "[...document.querySelectorAll('.teacher-attendance tbody tr')][0].querySelectorAll('button')[2].click()",
  );
  await waitFor(
    "[...document.querySelectorAll('.teacher-attendance tbody tr')][0].innerText.includes('Late')",
    "Individual Late did not update the intended row.",
  );
  await evaluate(
    "[...document.querySelectorAll('.teacher-attendance tbody tr')][1].querySelectorAll('button')[1].click()",
  );
  await waitFor(
    "[...document.querySelectorAll('.teacher-attendance tbody tr')][1].innerText.includes('Absent')",
    "Individual Absent did not update the intended row.",
  );
  await clickText("button", "Save Attendance");
  await waitFor(
    "JSON.parse(localStorage.getItem('eduhub_student_attendance')).records.length === 2",
    "Attendance did not persist.",
  );
  await evaluate("location.reload()");
  await waitFor(
    "document.querySelectorAll('.teacher-attendance-status').length === 2",
    "Attendance did not render after reload.",
    20000,
  );
  await evaluate(
    "[...document.querySelectorAll('.teacher-attendance tbody tr')][0].querySelectorAll('button')[0].click()",
  );
  await clickText("button", "Save Attendance");
  await waitFor(
    "JSON.parse(localStorage.getItem('eduhub_student_attendance')).records[0].status === 'Present'",
    "Edited attendance did not persist.",
  );
  const persisted = await evaluate(
    "JSON.parse(localStorage.getItem('eduhub_student_attendance')).records",
  );
  if (persisted.filter((row) => row.classId === "class-awd").length !== 2)
    throw new Error("Attendance saved duplicates or missing rows.");
  console.log(
    JSON.stringify(
      {
        persisted,
        runtimeErrors: events.filter(
          (event) => event.method === "Runtime.exceptionThrown",
        ),
      },
      null,
      2,
    ),
  );
}

if (command === "diary") {
  const title = "Browser Verified Diary";
  const edited = "Browser Verified Diary Updated";
  await go(
    "/teacher/diary?classId=class-awd",
    "document.querySelector('.teacher-diary') !== null",
  );
  await clickText("button", "New Diary Entry");
  await waitFor(
    "document.querySelector('[role=dialog] form') !== null",
    "New Diary dialog did not open.",
  );
  await setValue("[role=dialog] input[name=title]", title);
  await setValue(
    "[role=dialog] textarea[name=recap]",
    "Browser verified lecture summary.",
  );
  await setValue(
    "[role=dialog] textarea[name=homework]",
    "Browser verified homework.",
  );
  await evaluate(
    "document.querySelector('[role=dialog] form').requestSubmit()",
  );
  await waitFor(
    `document.body.innerText.includes(${JSON.stringify(title)}) && !document.querySelector('[role=dialog]')`,
    "Diary entry did not save.",
  );
  const entryId = await evaluate(
    `JSON.parse(localStorage.getItem('eduhub_diary')).records.find((row) => row.title === ${JSON.stringify(title)})?.id || ''`,
  );
  if (!entryId) throw new Error("Diary entry was not persisted.");
  await realClick(`[aria-label="Actions for ${title}"]`);
  await waitFor(
    "[...document.querySelectorAll('[role=menuitem]')].some((item) => item.textContent.includes('Edit Entry'))",
    "Diary actions menu did not open.",
  );
  await clickText("[role=menuitem]", "Edit Entry");
  await waitFor(
    "document.querySelector('[role=dialog] input[name=title]') !== null",
    "Edit Diary dialog did not open.",
  );
  await setValue("[role=dialog] input[name=title]", edited);
  await evaluate(
    "document.querySelector('[role=dialog] form').requestSubmit()",
  );
  await waitFor(
    `document.body.innerText.includes(${JSON.stringify(edited)})`,
    "Edited diary entry did not render.",
  );
  await evaluate("location.reload()");
  await waitFor(
    `document.body.innerText.includes(${JSON.stringify(edited)})`,
    "Edited diary entry did not survive reload.",
    20000,
  );
  const persisted = await evaluate(
    `JSON.parse(localStorage.getItem('eduhub_diary')).records.find((row) => row.id === ${JSON.stringify(entryId)})`,
  );
  await realClick(`[aria-label="Actions for ${edited}"]`);
  await waitFor(
    "[...document.querySelectorAll('[role=menuitem]')].some((item) => item.textContent.includes('Delete Entry'))",
    "Diary delete action did not open.",
  );
  await clickText("[role=menuitem]", "Delete Entry");
  await waitFor(
    "document.querySelector('[role=alertdialog]') !== null",
    "Diary delete confirmation did not open.",
  );
  await clickText("[role=alertdialog] button", "Delete Entry");
  await waitFor(
    `!document.body.innerText.includes(${JSON.stringify(edited)})`,
    "Diary delete did not update the list.",
  );
  if (
    await evaluate(
      `JSON.parse(localStorage.getItem('eduhub_diary')).records.some((row) => row.id === ${JSON.stringify(entryId)})`,
    )
  )
    throw new Error("Diary deletion was not persisted.");
  console.log(
    JSON.stringify(
      { entryId, editedRecord: persisted, deleted: true },
      null,
      2,
    ),
  );
}

if (command === "gradebook") {
  await go(
    "/teacher/gradebook",
    "document.querySelector('.teacher-gradebook') !== null",
  );
  await clickText("button", "Add Marks");
  await waitFor(
    "document.querySelector('[role=dialog] form') !== null",
    "Add Marks dialog did not open.",
  );
  await setValue("[role=dialog] input[name=academicYear]", "2026-2027");
  await setValue("[role=dialog] input[name=semester]", "Fall 2026");
  await setValue("[role=dialog] input[name=score]", "91");
  await setValue(
    "[role=dialog] textarea[name=remarks]",
    "Browser verified result",
  );
  await evaluate(
    "document.querySelector('[role=dialog] form').requestSubmit()",
  );
  await waitFor(
    "document.body.innerText.includes('91 / 100') && !document.querySelector('[role=dialog]')",
    "Marks did not save or render.",
  );
  const resultId = await evaluate(
    "JSON.parse(localStorage.getItem('eduhub_results')).records.find((row) => row.score === 91)?.id || ''",
  );
  if (!resultId) throw new Error("Marks were not persisted.");
  await clickText("button", "Edit Marks");
  await waitFor(
    "document.querySelector('[role=dialog] input[name=score]') !== null",
    "Edit Marks dialog did not open.",
  );
  await setValue("[role=dialog] input[name=score]", "94");
  await evaluate(
    "document.querySelector('[role=dialog] form').requestSubmit()",
  );
  await waitFor(
    "document.body.innerText.includes('94 / 100')",
    "Edited marks did not render.",
  );
  await evaluate("location.reload()");
  await waitFor(
    "document.body.innerText.includes('94 / 100')",
    "Edited marks did not survive reload.",
    20000,
  );
  console.log(
    JSON.stringify(
      {
        resultId,
        persisted: await evaluate(
          `JSON.parse(localStorage.getItem('eduhub_results')).records.find((row) => row.id === ${JSON.stringify(resultId)})`,
        ),
      },
      null,
      2,
    ),
  );
}

if (command === "messages") {
  const body = "Browser verified teacher message";
  await go(
    "/teacher/messages",
    "document.querySelector('.teacher-messages') !== null",
  );
  await waitFor(
    "document.querySelector('.teacher-conversation-item') !== null",
    "No authorized Teacher conversation is available.",
  );
  await evaluate(
    "document.querySelector('.teacher-conversation-item').click()",
  );
  await setValue("textarea[aria-label=Message]", body);
  await waitFor(
    "!document.querySelector('button[aria-label=\"Send message\"]').disabled",
    "Message Send did not enable.",
  );
  await evaluate(
    "document.querySelector('button[aria-label=\"Send message\"]').click()",
  );
  await waitFor(
    `document.body.innerText.includes(${JSON.stringify(body)}) && document.querySelector('textarea[aria-label=Message]').value === ''`,
    "Message did not send and clear the composer.",
  );
  await evaluate("location.reload()");
  await waitFor(
    `document.body.innerText.includes(${JSON.stringify(body)})`,
    "Message did not survive reload.",
    20000,
  );
  console.log(
    JSON.stringify(
      {
        persisted: await evaluate(
          `JSON.parse(localStorage.getItem('eduhub_messages')).records.find((row) => row.messages?.some((message) => message.body === ${JSON.stringify(body)}))`,
        ),
      },
      null,
      2,
    ),
  );
}

if (command === "classes") {
  await go(
    "/teacher/classes",
    "document.querySelector('.teacher-classes') !== null",
  );
  const rowCount = () =>
    evaluate("document.querySelectorAll('.teacher-classes tbody tr').length");
  if ((await rowCount()) !== 2)
    throw new Error("Assigned classes did not render.");
  await setValue(
    'input[placeholder="Search classes or subjects..."]',
    "Data Structures",
  );
  await waitFor(
    "document.querySelectorAll('.teacher-classes tbody tr').length === 1",
    "Class search did not filter.",
  );
  await setValue(".teacher-class-select select", "Advanced Web Design");
  await waitFor(
    "document.querySelectorAll('.teacher-classes tbody tr').length === 0",
    "Class search and subject filter did not compose.",
  );
  await setValue('input[placeholder="Search classes or subjects..."]', "");
  await waitFor(
    "document.querySelectorAll('.teacher-classes tbody tr').length === 1",
    "Clearing class search did not restore the subject match.",
  );
  await setValue(".teacher-class-select select", "");
  await setValue(".teacher-class-select:nth-of-type(3) select", "Hall B");
  await waitFor(
    "document.querySelectorAll('.teacher-classes tbody tr').length === 1 && document.body.innerText.includes('Data Structures')",
    "Room filter did not select the matching class.",
  );
  await setValue(".teacher-class-select:nth-of-type(4) select", "1");
  await waitFor(
    "document.querySelectorAll('.teacher-classes tbody tr').length === 0",
    "Day and room filters did not compose.",
  );
  await setValue(".teacher-class-select:nth-of-type(4) select", "2");
  await waitFor(
    "document.querySelectorAll('.teacher-classes tbody tr').length === 1",
    "Day filter did not restore the matching class.",
  );
  await setValue(".teacher-class-select:nth-of-type(3) select", "");
  await realClick(".teacher-classes tbody [data-slot=dropdown-menu-trigger]");
  await waitFor(
    "[...document.querySelectorAll('[role=menuitem]')].some((item) => item.textContent.includes('Take Attendance'))",
    "Class actions menu did not open.",
  );
  await clickText("[role=menuitem]", "Take Attendance");
  await waitFor(
    "location.pathname === '/teacher/attendance' && new URLSearchParams(location.search).get('classId') === 'class-dsa'",
    "Class Attendance action lost its class context.",
  );
  console.log(
    JSON.stringify(
      {
        filteredAndComposed: true,
        contextUrl: await evaluate("location.pathname + location.search"),
      },
      null,
      2,
    ),
  );
}

if (command === "navigation") {
  await go("/teacher", "document.querySelector('.teacher-dashboard') !== null");
  const metrics = await evaluate(
    "[...document.querySelectorAll('.teacher-metric strong')].map((node) => node.textContent.trim())",
  );
  if (metrics[0] !== "2")
    throw new Error(
      "Dashboard assigned course metric does not match rendered classes.",
    );
  if (
    !(await evaluate("document.body.innerText.includes('Existing Assignment')"))
  )
    throw new Error("Dashboard did not join the assignment title.");
  await evaluate(
    "document.querySelector('a[href=\"/teacher/assignments?submissionId=submission-existing\"]').click()",
  );
  await waitFor(
    "location.pathname === '/teacher/assignments' && document.querySelector('[role=dialog] input[name=score]') !== null",
    "Dashboard Evaluate did not open the exact submission.",
    20000,
  );
  await clickText("[role=dialog] button", "Cancel");
  await go("/teacher", "document.querySelector('.teacher-dashboard') !== null");
  await evaluate(
    "document.querySelector('a[href=\"/teacher/diary?classId=class-awd\"]').click()",
  );
  await waitFor(
    "location.pathname === '/teacher/diary' && new URLSearchParams(location.search).get('classId') === 'class-awd' && [...document.querySelectorAll('button')].some((node) => node.textContent.includes('New Diary Entry'))",
    "Dashboard Diary action lost class context.",
    20000,
  );
  await clickText("button", "New Diary Entry");
  await waitFor(
    "document.querySelector('[role=dialog] select[name=classId]').value === 'class-awd'",
    "Diary did not consume Dashboard class context.",
  );
  console.log(
    JSON.stringify(
      { metrics, evaluateContext: true, diaryContext: true },
      null,
      2,
    ),
  );
}

if (command === "responsive") {
  await go(
    "/teacher/assignments",
    "document.querySelector('.teacher-assignments') !== null",
  );
  for (const [width, height] of [
    [1600, 900],
    [1366, 768],
    [768, 1024],
    [390, 844],
  ]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    await clickText("button", "Create Assignment");
    await waitFor(
      "document.querySelector('[role=dialog]') !== null",
      "Responsive assignment dialog did not open.",
    );
    await wait(300);
    const bounds = await evaluate(
      "(() => { const r=document.querySelector('[role=dialog]').getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,viewportWidth:innerWidth,viewportHeight:innerHeight}; })()",
    );
    if (
      bounds.left < 0 ||
      bounds.top < 0 ||
      bounds.right > width ||
      bounds.bottom > height
    )
      throw new Error(
        `Dialog is outside ${width}x${height}: ${JSON.stringify(bounds)}`,
      );
    await clickText("[role=dialog] button", "Cancel");
  }
  await send("Emulation.clearDeviceMetricsOverride");
  console.log(
    JSON.stringify(
      {
        viewports: ["1600x900", "1366x768", "768x1024", "390x844"],
        dialogsWithinViewport: true,
      },
      null,
      2,
    ),
  );
}

if (command === "disabled-button") {
  await evaluate(`(() => {
    localStorage.setItem('eduhub_timetable', JSON.stringify({ version: 1, records: [] }));
    location.href = '/teacher/assignments';
  })()`);
  await waitFor(
    "document.querySelector('.teacher-assignments-toolbar button')?.disabled === true",
    "Create Assignment did not become disabled without assigned classes.",
    20000,
  );
  const before = await evaluate(`(() => {
    const button = document.querySelector('.teacher-assignments-toolbar button');
    window.__disabledCreateClicks = 0;
    button.addEventListener('click', () => window.__disabledCreateClicks++);
    return { disabled: button.disabled, pointerEvents: getComputedStyle(button).pointerEvents };
  })()`);
  await realClick(".teacher-assignments-toolbar button");
  await wait(250);
  const after = await evaluate(`({ clicks: window.__disabledCreateClicks, dialog: Boolean(document.querySelector('[role=dialog]')) })`);
  if (!before.disabled || after.clicks || after.dialog)
    throw new Error(`Disabled Button accepted interaction: ${JSON.stringify({ before, after })}`);
  console.log(JSON.stringify({ before, after }, null, 2));
}

if (command === "attendance-future") {
  await go(
    "/teacher/attendance?classId=class-awd",
    "document.querySelector('.teacher-attendance input[type=date]') !== null",
  );
  const max = await evaluate("document.querySelector('.teacher-attendance input[type=date]').max");
  const future = await evaluate(`(() => { const date = new Date(${JSON.stringify(max)} + 'T12:00:00'); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10); })()`);
  await setValue(".teacher-attendance input[type=date]", future);
  await waitFor(
    "[...document.querySelectorAll('button')].find((node) => node.textContent.includes('Save Attendance'))?.disabled === true",
    "Future attendance did not disable Save Attendance.",
  );
  const result = await evaluate(`(() => { const input=document.querySelector('.teacher-attendance input[type=date]'); const button=[...document.querySelectorAll('button')].find((node) => node.textContent.includes('Save Attendance')); return { value: input.value, max: input.max, nativeValid: input.checkValidity(), saveDisabled: button.disabled }; })()`);
  console.log(JSON.stringify(result, null, 2));
}

if (command === "messages-mobile") {
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await go(
    "/teacher/messages",
    "document.querySelector('.teacher-conversation-item') !== null",
  );
  await realClick(".teacher-conversation-item");
  await waitFor(
    "document.querySelector('.teacher-messages-workspace')?.classList.contains('mobile-detail-open')",
    "Mobile conversation detail did not open.",
  );
  await realClick(".teacher-message-back");
  await waitFor(
    "!document.querySelector('.teacher-messages-workspace')?.classList.contains('mobile-detail-open')",
    "Mobile back action did not return to the conversation list.",
  );
  await send("Emulation.clearDeviceMetricsOverride");
  console.log(JSON.stringify({ mobileDetail: true, mobileBack: true }, null, 2));
}

if (command === "salary") {
  await go(
    "/my-salary",
    "document.querySelector('.salary-profiles-page .salary-edit-btn') !== null",
  );
  const profileEmpty = await evaluate("document.querySelector('.salary-profiles-page').innerText.includes('No Salary Profile Found')");
  await realClick(".salary-edit-btn");
  await waitFor(
    "location.pathname === '/my-payslips' && document.querySelector('.teacher-payslips input[type=month]') !== null",
    "View My Payslips did not navigate to the payslip history.",
    20000,
  );
  await setValue(".teacher-payslips input[type=month]", "2026-09");
  await wait(1000);
  console.log(JSON.stringify({
    profileEmpty,
    route: await evaluate("location.pathname"),
    month: await evaluate("document.querySelector('.teacher-payslips input[type=month]').value"),
    emptyState: await evaluate("document.querySelector('.teacher-payslips').innerText.includes('No payslips found')"),
    payslipRows: await evaluate("document.querySelectorAll('.teacher-payslips tbody tr').length"),
  }, null, 2));
}

socket.close();
