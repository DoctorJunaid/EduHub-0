// Demonstration display data for Faculty Directory and Attendance
export const facultyStatuses = ['Active', 'Pending', 'Inactive'];

export const facultyRecords = [
  {
    id: "fac-1",
    name: "Dr. Usman Khan",
    initials: "UK",
    email: "dr.usman@nust.edu.pk",
    designation: "Associate Professor",
    qualification: "Ph.D. Computer Science",
    department: "Computer Science",
    subjects: "Advanced Web Design, Data Structures",
    campus: "NUST Main Campus (H-12)",
    status: "Active",
  },
  {
    id: "fac-2",
    name: "Prof. Ayesha Malik",
    initials: "AM",
    email: "a.malik@nust.edu.pk",
    designation: "Professor & HOD",
    qualification: "Ph.D. Artificial Intelligence",
    department: "Computer Science",
    subjects: "Machine Learning, Neural Networks",
    campus: "NUST Main Campus (H-12)",
    status: "Active",
  },
  {
    id: "fac-3",
    name: "Dr. Tariq Mahmood",
    initials: "TM",
    email: "tariq.m@nust.edu.pk",
    designation: "Assistant Professor",
    qualification: "Ph.D. Software Engineering",
    department: "Software Engineering",
    subjects: "Software Architecture, Agile QA",
    campus: "NUST Main Campus (H-12)",
    status: "Active",
  },
  {
    id: "fac-4",
    name: "Engr. Bilal Siddiqui",
    initials: "BS",
    email: "bilal.s@nust.edu.pk",
    designation: "Lecturer",
    qualification: "M.S. Computer Science",
    department: "Computer Science",
    subjects: "Operating Systems, Database Systems",
    campus: "NUST Main Campus (H-12)",
    status: "Active",
  },
  {
    id: "fac-5",
    name: "Dr. Sana Javed",
    initials: "SJ",
    email: "sana.j@nust.edu.pk",
    designation: "Associate Professor",
    qualification: "Ph.D. Applied Mathematics",
    department: "Mathematics",
    subjects: "Linear Algebra, Discrete Structures",
    campus: "NUST Main Campus (H-12)",
    status: "Active",
  },
  {
    id: "fac-6",
    name: "Prof. Hamza Ali",
    initials: "HA",
    email: "hamza.ali@nust.edu.pk",
    designation: "Professor",
    qualification: "Ph.D. Electrical Engineering",
    department: "Electrical Engineering",
    subjects: "Digital Signal Processing, IoT",
    campus: "NUST Main Campus (H-12)",
    status: "Active",
  },
  {
    id: "fac-7",
    name: "Dr. Rabia Basri",
    initials: "RB",
    email: "rabia.b@nust.edu.pk",
    designation: "Assistant Professor",
    qualification: "Ph.D. Cyber Security",
    department: "Computer Science",
    subjects: "Network Security, Cryptography",
    campus: "NUST Main Campus (H-12)",
    status: "Pending",
  },
  {
    id: "fac-8",
    name: "Dr. Farhan Ahmed",
    initials: "FA",
    email: "farhan.a@nust.edu.pk",
    designation: "Associate Professor",
    qualification: "Ph.D. Data Science",
    department: "Software Engineering",
    subjects: "Big Data Analytics, Cloud Computing",
    campus: "NUST Main Campus (H-12)",
    status: "Active",
  },
];

export function filterFaculty(
  records,
  { search, department, designation, status },
) {
  const query = search.trim().toLowerCase();
  return records.filter(
    (teacher) =>
      (!query ||
        `${teacher.name} ${teacher.department} ${teacher.designation}`
          .toLowerCase()
          .includes(query)) &&
      (!department || teacher.department === department) &&
      (!designation || teacher.designation === designation) &&
      (!status || teacher.status === status),
  );
}
