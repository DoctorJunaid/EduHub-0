import { initialSchedules } from '../Timetable/timetableData.js';
import { mondayOf, shiftDays } from '../../../lib/schedule.js';
import { facultyRecords } from '../Faculty/facultyData.js';

export const examTypes = ['Midterm', 'Final', 'Test'];
export const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const parseDate = (date) => new Date(`${date}T12:00:00`);
export const examFields = [
  ['subject', 'Subject'], ['examType', 'Exam Type'], ['department', 'Department'],
  ['section', 'Section / Class'], ['date', 'Date', 'date'], ['startTime', 'Start Time', 'time'],
  ['endTime', 'End Time', 'time'], ['room', 'Exam Hall / Room'], ['invigilator', 'Invigilator'], ['totalMarks', 'Total Marks', 'number'],
];
// Small demonstration dataset reusing the existing timetable and faculty records.
export const initialExams = initialSchedules.map((item, index) => ({
  id: `exam-${index + 1}`, subject: item.subject, section: item.section,
  department: facultyRecords.find((teacher) => teacher.name === item.instructor)?.department ?? '',
  examType: examTypes[index], date: dateKey(shiftDays(mondayOf(new Date()), index * 2)),
  startTime: item.startTime, endTime: item.endTime, room: item.room, invigilator: item.instructor, totalMarks: 100,
}));
export function validateExam(values) {
  if (examFields.some(([key]) => key !== 'department' && !String(values[key] ?? '').trim())) return 'Please complete all required fields.';
  if (!examTypes.includes(values.examType)) return 'Select an approved exam type.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || Number.isNaN(parseDate(values.date).getTime()) || dateKey(parseDate(values.date)) !== values.date) return 'Enter a valid date.';
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!time.test(values.startTime) || !time.test(values.endTime)) return 'Enter valid start and end times.';
  if (values.endTime <= values.startTime) return 'End Time must be after Start Time.';
  if (!Number.isFinite(Number(values.totalMarks)) || Number(values.totalMarks) <= 0) return 'Total Marks must be a positive number.';
  return '';
}
export function filterExams(records, { search = '', ...filters }) {
  const query = search.trim().toLowerCase();
  return records.filter((record) => (!query || [record.subject, record.room, record.invigilator].some((value) => value.toLowerCase().includes(query))) && Object.entries(filters).every(([key, value]) => !value || record[key] === value));
}
export const examsInWeek = (records, week) => records.filter((record) => record.date >= dateKey(week) && record.date <= dateKey(shiftDays(week, 6)));
