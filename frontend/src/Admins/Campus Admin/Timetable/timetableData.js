export const scheduleStatuses = ["Active", "Pending"];

export const educationTypeOptions = [
  "School",
  "College",
  "University",
  "Coaching",
];

export { getMatrixConfig, getTemplateRecords } from "./timetableMatrix.js";

export const initialSchedules = [
  {
    id: "schedule-1",
    subject: "Advanced Web Design",
    section: "CS-4A",
    program: "BS Computer Science",
    instructor: "Dr. Usman Khan",
    room: "Lab 302",
    days: [1, 3],
    startTime: "10:00",
    endTime: "12:00",
    status: "Active",
  },
  {
    id: "schedule-2",
    subject: "Data Structures & Algorithms",
    section: "CS-3B",
    program: "BS Computer Science",
    instructor: "Dr. Usman Khan",
    room: "Hall B",
    days: [2, 4],
    startTime: "14:00",
    endTime: "15:30",
    status: "Pending",
  },
  {
    id: "schedule-3",
    subject: "Artificial Intelligence",
    section: "CS-4B",
    program: "BS Computer Science",
    instructor: "Dr. Usman Khan",
    room: "AI Research Lab",
    days: [5],
    startTime: "09:00",
    endTime: "12:00",
    status: "Active",
  },
];
