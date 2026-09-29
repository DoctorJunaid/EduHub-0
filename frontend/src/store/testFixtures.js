const clone = (records) =>
  records.map((record) => {
    const copy = { ...record };
    if (Array.isArray(record.days)) copy.days = [...record.days];
    return copy;
  });

const students = [
  {
    id: "student-demo-1",
    name: "Ali Raza",
    email: "ali.raza@nust.edu.pk",
    roll: "NUST-CS-2023-042",
    studentPhone: "03001234567",
    program: "BS Computer Science",
    section: "CS-4A",
    semester: "Fall 2025",
    subjects: "Advanced Web Design, Data Structures, AI",
    campus: "Main Campus",
    status: "Active",
    guardian: "Raza Khan",
    guardianPhone: "03007654321",
    initials: "AR",
  },
  {
    id: "student-demo-2",
    name: "Sara Khan",
    email: "sara.khan@nust.edu.pk",
    roll: "NUST-CS-2023-043",
    studentPhone: "03007654321",
    program: "BS Computer Science",
    section: "CS-3B",
    semester: "Fall 2025",
    subjects: "Data Structures & Algorithms",
    campus: "Main Campus",
    status: "Active",
    guardian: "Khan Ahmed",
    guardianPhone: "03001234567",
    initials: "SK",
  },
];

const faculty = [
  {
    id: "faculty-demo-1",
    name: "Dr. Usman Khan",
    email: "dr.usman@nu.edu.pk",
    designation: "Associate Professor",
    qualification: "Ph.D.",
    department: "Computer Science",
    phone: "03000000000",
    subjects: "Advanced Web Design",
    campus: "Main Campus",
    status: "Active",
    initials: "UK",
  },
];

const timetable = [
  {
    id: "schedule-1",
    subject: "Advanced Web Design",
    program: "BS Computer Science",
    section: "CS-4A",
    instructor: "Dr. Usman Khan",
    room: "Lab 302",
    days: [1],
    startTime: "10:00",
    endTime: "11:00",
    status: "Active",
  },
  {
    id: "schedule-2",
    subject: "Data Structures & Algorithms",
    program: "BS Computer Science",
    section: "CS-3B",
    instructor: "Dr. Usman Khan",
    room: "Hall B",
    days: [1],
    startTime: "11:00",
    endTime: "12:00",
    status: "Active",
  },
];

const exams = [
  {
    id: "exam-1",
    subject: "Advanced Web Design",
    examType: "Final",
    department: "Computer Science",
    section: "CS-4A",
    date: "2026-09-10",
    startTime: "10:00",
    endTime: "11:00",
    room: "Lab 302",
    invigilator: "Dr. Usman Khan",
    totalMarks: 100,
  },
];

export const studentFixtureState = () => ({
  students: { records: clone(students) },
  faculty: { records: clone(faculty) },
  timetable: { records: clone(timetable) },
  exams: { records: clone(exams) },
});

export const studentDemoReferenceState = () => ({
  students: { records: clone(students) },
  faculty: { records: clone(faculty) },
});

const campuses = [
  { id: "camp_1", instituteId: "nust-demo", name: "Main Campus", address: "Islamabad", status: "Active" },
  { id: "camp_2", instituteId: "nust-demo", name: "North Campus", address: "Rawalpindi", status: "Active" },
];

const institutionFaculty = [
  {
    id: "faculty-1", instituteId: "nust-demo", campusId: "camp_1", campus: "Main Campus", name: "Dr. Usman Khan", email: "usman@example.edu", designation: "Professor", qualification: "Ph.D.", department: "Computer Science", phone: "03000000000", subjects: "Computer Science", status: "Active", initials: "UK",
  },
];

const institutionStudents = [
  {
    id: "student-1", instituteId: "nust-demo", campusId: "camp_1", campus: "Main Campus", name: "Ali Raza", email: "ali@example.edu", roll: "CS-001", studentPhone: "03000000001", program: "Computer Science", section: "A", semester: "Fall 2026", subjects: "Mathematics", status: "Active", guardian: "Raza", guardianPhone: "03000000002", initials: "AR",
  },
  {
    id: "student-2", instituteId: "nust-demo", campusId: "camp_1", campus: "Main Campus", name: "Sara Khan", email: "sara@example.edu", roll: "CS-002", studentPhone: "03000000003", program: "Computer Science", section: "A", semester: "Fall 2026", subjects: "Mathematics", status: "Active", guardian: "Khan", guardianPhone: "03000000004", initials: "SK",
  },
];

const institutionTimetable = [1, 2, 3].map((day) => ({
  id: `schedule-${day}`, _id: `schedule-${day}`, subject: "Mathematics", program: "Computer Science", section: "A", instructor: "Dr. Usman Khan", room: `Room ${day}`, days: [day], startTime: "09:00", endTime: "10:00", status: "Active",
}));

const institutionExams = [{
  id: "exam-1", subject: "Mathematics", examType: "Midterm", department: "Computer Science", section: "A", date: "2026-09-13", startTime: "09:00", endTime: "10:00", room: "Hall A", invigilator: "Dr. Usman Khan", totalMarks: 100,
}];

export const institutionFixtureState = () => ({
  campuses: { records: clone(campuses) },
  faculty: { records: clone(institutionFaculty) },
  students: { records: clone(institutionStudents) },
  timetable: { records: clone(institutionTimetable) },
  exams: { records: clone(institutionExams) },
});
