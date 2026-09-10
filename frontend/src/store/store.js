import diaryReducer from './Slices/diarySlice.js';
import assignmentsReducer, { submissionsReducer } from './Slices/assignmentsSlice.js';
import broadcastsReducer from './Slices/broadcastsSlice.js';
import campusesReducer from './Slices/campusesSlice.js';
import authReducer from './Slices/authSlice.js';
import { configureStore } from "@reduxjs/toolkit";
import facultyReducer from "./Slices/facultySlice.js";
import studentsReducer from './Slices/studentsSlice.js';
import { loadDemoState, persistDemoState } from './persistence.js';
import timetableReducer from './Slices/timetableSlice.js';
import examsReducer from './Slices/examsSlice.js';
import attendanceReducer from './Slices/attendanceSlice.js';
import studentAttendanceReducer from './Slices/studentAttendanceSlice.js';
import resultsReducer from './Slices/resultsSlice.js';
import feesReducer from './Slices/feesSlice.js';
import messagesReducer from './Slices/messagesSlice.js';
import { resultSaved } from './Slices/resultsSlice.js';
import { makeDemoResults } from '../Admins/Campus Admin/Results/demoResults.js';

export const store = configureStore({ reducer: { diary: diaryReducer, assignments: assignmentsReducer, submissions: submissionsReducer, broadcasts: broadcastsReducer, campuses: campusesReducer, auth: authReducer, messages: messagesReducer, faculty: facultyReducer, students: studentsReducer, timetable: timetableReducer, exams: examsReducer, attendance: attendanceReducer, studentAttendance: studentAttendanceReducer, results: resultsReducer, fees: feesReducer }, preloadedState: loadDemoState() });
// Populate an empty results collection, including previously persisted empty state.
// Existing saved results and user edits remain intact.
if (!store.getState().results.records.length) {
  const state = store.getState();
  for (const result of makeDemoResults(state.students.records, state.exams.records)) store.dispatch(resultSaved(result));
}
persistDemoState(store);

