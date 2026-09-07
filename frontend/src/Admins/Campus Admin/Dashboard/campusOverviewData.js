// Frontend demonstration records transcribed from the approved reference image.
export const campusStudents = [
  { name: 'Ali Raza', initials: 'AR', roll: 'NUST-CS-2023-042', program: 'BS Computer Science', section: 'CS-4A', status: 'Active', guardian: 'Muhammad Raza', phone: '+92 300 9998877', tone: 'green' },
  { name: 'Zainab Bilal', initials: 'ZB', roll: 'NUST-CS-2023-088', program: 'BS Computer Science', section: 'CS-4B', status: 'Pending', guardian: 'Bilal Ahmed', phone: '+92 301 4443322', tone: 'blue' },
  { name: 'Usman Safdar', initials: 'US', roll: 'NUST-CS-2023-101', program: 'BS Software Engineering', section: 'SE-3A', status: 'Active', guardian: 'Safdar Ali', phone: '+92 333 5557733', tone: 'purple' },
  { name: 'Maryam Ahmed', initials: 'MA', roll: 'NUST-CS-2023-115', program: 'BS Computer Science', section: 'CS-2B', status: 'Active', guardian: 'Ahmed Khan', phone: '+92 321 8887766', tone: 'amber' },
];

export const campusClasses = [
  { subject: 'Advanced Web Design', section: 'CS-4A', days: 'Mon, Wed', time: '10:00 AM – 11:30 AM', room: 'Lab 302' },
  { subject: 'Data Structures & Algorithms', section: 'CS-3B', days: 'Tue, Thu', time: '02:00 PM – 03:30 PM', room: 'Hall B' },
  { subject: 'Artificial Intelligence', section: 'CS-4B', days: 'Fri', time: '11:00 AM – 01:00 PM', room: 'AI Research Lab' },
];

export function filterCampusStudents(students, { query, program, status }) {
  const search = query.trim().toLowerCase();
  return students.filter((student) =>
    (!program || student.program === program) &&
    (!status || student.status === status) &&
    (!search || `${student.name} ${student.roll}`.toLowerCase().includes(search)),
  );
}
