import { configureStore } from "@reduxjs/toolkit";
import facultyReducer from "./Slices/facultySlice.js";
import studentsReducer from './Slices/studentsSlice.js';
import { loadDemoState, persistDemoState } from './persistence.js';
import timetableReducer from './Slices/timetableSlice.js';

export const store = configureStore({ reducer: { faculty: facultyReducer, students: studentsReducer, timetable: timetableReducer }, preloadedState: loadDemoState() });
persistDemoState(store);
