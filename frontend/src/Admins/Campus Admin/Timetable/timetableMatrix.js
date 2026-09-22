import { weekdays as weekdayNames } from "../../../lib/schedule.js";

/** @typedef {{ id: string; start: string; end: string; isBreak?: boolean; label?: string }} TimeSlot */
/** @typedef {{ days: string[]; timeSlots: TimeSlot[]; entries: object[] }} MatrixConfig */

const allWeekdays = [1, 2, 3, 4, 5];

/**
 * Builds schedule records from a unified matrix schema (zero duplicate slot engines).
 * @param {string} institutionType
 * @param {MatrixConfig} config
 */
export function buildRecordsFromMatrix(institutionType, config) {
  const breakSlots = new Map(
    config.timeSlots
      .filter((slot) => slot.isBreak)
      .map((slot) => [slot.id, slot]),
  );

  const classEntries = config.entries.map((entry, index) => {
    const slot = config.timeSlots.find((s) => s.id === entry.slotId);
    const startTime = slot?.start ?? entry.startTime;
    const endTime = slot?.end ?? entry.endTime;
    return {
      id: `template-${institutionType.toLowerCase().replace(/[^a-z]+/g, "-")}-${index}`,
      subject: entry.subject,
      section: entry.section,
      program: institutionType,
      instructor: entry.instructor,
      room: entry.room,
      days: entry.days ?? allWeekdays,
      startTime,
      endTime,
      status: "Active",
      isBreak: false,
    };
  });

  const breakRecords = [...breakSlots.values()].map((slot, index) => ({
    id: `template-${institutionType.toLowerCase().replace(/[^a-z]+/g, "-")}-break-${index}`,
    subject: slot.label ?? "Break",
    section: "All sections",
    program: institutionType,
    instructor: "Campus schedule",
    room: "Break area",
    days: allWeekdays,
    startTime: slot.start,
    endTime: slot.end,
    status: "Active",
    isBreak: true,
  }));

  return [...classEntries, ...breakRecords];
}

/** @type {Record<string, MatrixConfig>} */
export const institutionMatrixConfigs = {
  School: {
    days: [...weekdayNames],
    timeSlots: [
      { id: "s1", start: "08:00", end: "08:30" },
      { id: "s2", start: "08:30", end: "09:20" },
      { id: "s3", start: "09:20", end: "10:10" },
      {
        id: "s-break-am",
        start: "10:10",
        end: "10:40",
        isBreak: true,
        label: "Morning Break",
      },
      { id: "s4", start: "10:40", end: "11:30" },
      { id: "s5", start: "11:30", end: "12:20" },
      {
        id: "s-break-lunch",
        start: "12:20",
        end: "12:55",
        isBreak: true,
        label: "Lunch & Prayer Break",
      },
      { id: "s6", start: "12:55", end: "13:45" },
    ],
    entries: [
      {
        slotId: "s1",
        subject: "Assembly & Homeroom",
        section: "Grade 8-A",
        instructor: "Ms. Ayesha Khan",
        room: "School grounds",
      },
      {
        slotId: "s2",
        subject: "English Language",
        section: "Grade 8-A",
        instructor: "Ms. Sana Ahmed",
        room: "Room 201",
      },
      {
        slotId: "s3",
        subject: "Mathematics",
        section: "Grade 8-A",
        instructor: "Mr. Bilal Raza",
        room: "Room 201",
      },
      {
        slotId: "s4",
        subject: "General Science",
        section: "Grade 8-A",
        instructor: "Dr. Hina Iqbal",
        room: "Science Lab",
      },
      {
        slotId: "s5",
        subject: "Pakistan Studies",
        section: "Grade 8-A",
        instructor: "Mr. Hamza Ali",
        room: "Room 201",
      },
      {
        slotId: "s6",
        subject: "Computer Studies",
        section: "Grade 8-A",
        instructor: "Mr. Usman Tariq",
        room: "IT Lab",
      },
    ],
  },
  Coaching: {
    days: [...weekdayNames],
    timeSlots: [
      { id: "c1", start: "16:00", end: "17:15" },
      {
        id: "c-break",
        start: "17:15",
        end: "17:45",
        isBreak: true,
        label: "Short Break",
      },
      { id: "c2", start: "17:45", end: "19:00" },
      { id: "c3", start: "19:00", end: "20:15" },
    ],
    entries: [
      {
        slotId: "c1",
        subject: "Mathematics (MDCAT)",
        section: "MDCAT Evening",
        instructor: "Dr. Farhan Malik",
        room: "Hall A",
      },
      {
        slotId: "c2",
        subject: "Physics (MDCAT)",
        section: "MDCAT Evening",
        instructor: "Mr. Saad Ahmed",
        room: "Hall A",
      },
      {
        slotId: "c3",
        subject: "Chemistry (MDCAT)",
        section: "MDCAT Evening",
        instructor: "Ms. Maham Khan",
        room: "Lab 2",
      },
    ],
  },
  College: {
    days: [...weekdayNames],
    timeSlots: [
      { id: "col1", start: "08:30", end: "09:45" },
      { id: "col2", start: "09:45", end: "11:00" },
      {
        id: "col-break",
        start: "11:00",
        end: "11:40",
        isBreak: true,
        label: "College Break",
      },
      { id: "col3", start: "11:40", end: "12:55" },
      { id: "col4", start: "12:55", end: "14:10" },
    ],
    entries: [
      {
        slotId: "col1",
        subject: "English Literature",
        section: "FA Part II",
        instructor: "Ms. Nadia Shah",
        room: "Room 12",
      },
      {
        slotId: "col2",
        subject: "Statistics",
        section: "ICS Part II",
        instructor: "Mr. Waqas Ahmed",
        room: "Room 21",
      },
      {
        slotId: "col3",
        subject: "Computer Science",
        section: "ICS Part II",
        instructor: "Mr. Junaid Hussain",
        room: "Computer Lab",
      },
      {
        slotId: "col4",
        subject: "Physics Practical",
        section: "ICS Part II",
        instructor: "Dr. Maryam Iqbal",
        room: "Physics Lab",
      },
    ],
  },
  University: {
    days: [...weekdayNames],
    timeSlots: [
      { id: "u1", start: "09:00", end: "10:15" },
      { id: "u2", start: "10:15", end: "11:30" },
      {
        id: "u-break-tea",
        start: "11:30",
        end: "12:00",
        isBreak: true,
        label: "Tea Break",
      },
      { id: "u3", start: "12:00", end: "13:15" },
      {
        id: "u-break-lunch",
        start: "13:15",
        end: "14:15",
        isBreak: true,
        label: "Prayer & Lunch Break",
      },
      { id: "u4", start: "14:15", end: "15:30" },
    ],
    entries: [
      {
        slotId: "u1",
        subject: "Software Engineering",
        section: "BSCS-5A",
        instructor: "Dr. Usman Khan",
        room: "Lab 302",
      },
      {
        slotId: "u2",
        subject: "Database Systems",
        section: "BSCS-5A",
        instructor: "Dr. Sara Nadeem",
        room: "Lab 302",
      },
      {
        slotId: "u3",
        subject: "Operating Systems",
        section: "BSCS-5A",
        instructor: "Mr. Ahmed Raza",
        room: "Lecture Hall B",
      },
      {
        slotId: "u4",
        subject: "Artificial Intelligence",
        section: "BSCS-5A",
        instructor: "Dr. Hiba Farooq",
        room: "AI Research Lab",
      },
    ],
  }
};

export function getMatrixConfig(educationType, includeSaturday = true) {
  const base = institutionMatrixConfigs[educationType] ?? institutionMatrixConfigs.College;
  const days = includeSaturday
    ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return {
    ...base,
    days,
  };
}

export function getTemplateRecords(educationType) {
  const config = getMatrixConfig(educationType, false);
  return buildRecordsFromMatrix(educationType, config);
}
