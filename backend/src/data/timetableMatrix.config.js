/**
 * Unified institute matrix definitions (days + time slots).
 * Used by GET /campus-admin/timetable/matrix/:institutionType
 */

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

/** @type {Record<string, { days: string[]; timeSlots: object[] }>} */
export const institutionMatrixConfigs = {
  Schools: {
    days: WEEKDAYS,
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
  },
  School: {
    days: WEEKDAYS,
    timeSlots: [],
  },
  Colleges: {
    days: WEEKDAYS,
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
  },
  College: {
    days: WEEKDAYS,
    timeSlots: [],
  },
  Universities: {
    days: WEEKDAYS,
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
  },
  University: {
    days: WEEKDAYS,
    timeSlots: [],
  },
  "Coaching Institutes": {
    days: WEEKDAYS,
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
  },
  Coaching: {
    days: WEEKDAYS,
    timeSlots: [],
  },
  "Medical/Custom": {
    days: WEEKDAYS,
    timeSlots: [
      { id: "m1", start: "08:00", end: "09:30" },
      { id: "m2", start: "09:30", end: "11:00" },
      {
        id: "m-break",
        start: "11:00",
        end: "11:30",
        isBreak: true,
        label: "Clinical Break",
      },
      { id: "m3", start: "11:30", end: "13:00" },
      { id: "m4", start: "14:00", end: "15:30" },
    ],
  },
};

// Alias singular keys to plural matrix configs
institutionMatrixConfigs.School.timeSlots =
  institutionMatrixConfigs.Schools.timeSlots;
institutionMatrixConfigs.College.timeSlots =
  institutionMatrixConfigs.Colleges.timeSlots;
institutionMatrixConfigs.University.timeSlots =
  institutionMatrixConfigs.Universities.timeSlots;
institutionMatrixConfigs.Coaching.timeSlots =
  institutionMatrixConfigs["Coaching Institutes"].timeSlots;

export const institutionTypeOptions = [
  "Schools",
  "Colleges",
  "Universities",
  "Coaching Institutes",
  "Medical/Custom",
];

export function getMatrixConfig(institutionType) {
  return (
    institutionMatrixConfigs[institutionType] ??
    institutionMatrixConfigs.Colleges
  );
}
