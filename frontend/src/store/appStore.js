import {
  populateStudentDemo,
  preferRealStudentData,
} from "./studentDemoData.js";
import diaryReducer from "./Slices/diarySlice.js";
import assignmentsReducer, {
  submissionsReducer,
} from "./Slices/assignmentsSlice.js";
import broadcastsReducer from "./Slices/broadcastsSlice.js";
import campusesReducer from "./Slices/campusesSlice.js";
import authReducer from "./Slices/authSlice.js";
import superAdminReducer from "./Slices/superAdminSlice.js";
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import facultyReducer from "./Slices/facultySlice.js";
import studentsReducer from "./Slices/studentsSlice.js";
import { loadDemoState, persistDemoState } from "./persistence.js";
import timetableReducer from "./Slices/timetableSlice.js";
import examsReducer from "./Slices/examsSlice.js";
import attendanceReducer from "./Slices/attendanceSlice.js";
import studentAttendanceReducer from "./Slices/studentAttendanceSlice.js";
import resultsReducer from "./Slices/resultsSlice.js";
import feesReducer from "./Slices/feesSlice.js";
import messagesReducer from "./Slices/messagesSlice.js";
import institutesReducer from "./Slices/institutesSlice.js";
import { resultSaved } from "./Slices/resultsSlice.js";
import { makeDemoResults } from "../Admins/Campus Admin/Results/demoResults.js";
import { preserveDemoEdits } from "./demoProvenance.js";

const reducers = combineReducers({
  demoLifecycle: (state = { initialized: true }) => state,
  diary: diaryReducer,
  assignments: assignmentsReducer,
  submissions: submissionsReducer,
  broadcasts: broadcastsReducer,
  campuses: campusesReducer,
  institutes: institutesReducer,
  superAdmin: superAdminReducer,
  auth: authReducer,
  messages: messagesReducer,
  faculty: facultyReducer,
  students: studentsReducer,
  timetable: timetableReducer,
  exams: examsReducer,
  attendance: attendanceReducer,
  studentAttendance: studentAttendanceReducer,
  results: resultsReducer,
  fees: feesReducer,
});
export function createAppStore({
  storage,
  demoEnabled = true,
  now = new Date(),
} = {}) {
  const loaded = loadDemoState(storage);
  let initial = reducers(loaded, { type: "@@INIT" });
  if (demoEnabled && !loaded.demoLifecycle?.initialized) {
    for (const result of makeDemoResults(
      initial.students.records,
      initial.exams.records,
      now.getFullYear(),
    ))
      initial = reducers(initial, resultSaved(result));
    initial = populateStudentDemo(initial, now);
  }
  const store = configureStore({
    reducer: (state, action) =>
      preferRealStudentData(preserveDemoEdits(state, reducers(state, action))),
    preloadedState: preferRealStudentData(initial),
  });
  persistDemoState(store, storage);
  return store;
}
