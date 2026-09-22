import { createSelector, createSlice, createAsyncThunk, nanoid } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance.js';
import { fetchActivityLogs } from './activityLogSlice.js';
import {
  createSelector,
  createSlice,
  createAsyncThunk,
  nanoid,
} from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance.js";
import {
  studentAttendanceKey,
  validStudentAttendance,
  recordedStudentRows,
} from "../../Admins/Campus Admin/Attendance/Students/studentAttendanceData.js";
import { selectStudents } from "./studentsSlice.js";
import { selectTimetable } from "./timetableSlice.js";

const normalizeAttendance = (item) => {
  const id = item._id || item.id || nanoid();
  const studentId =
    typeof item.studentId === "object" && item.studentId !== null
      ? item.studentId._id || item.studentId.id
      : item.studentId;
  const classId =
    typeof item.classId === "object" && item.classId !== null
      ? item.classId._id || item.classId.id
      : item.classId;
  const date =
    item.dateStr ||
    (item.date ? new Date(item.date).toISOString().split("T")[0] : "");

  const res = {
    ...item,
    id,
    studentId: String(studentId || ""),
    classId: String(classId || ""),
    date,
    status: item.status || "Present",
  };
  if (item._id) res._id = item._id;
  return res;
};

export const fetchStudentAttendance = createAsyncThunk(
  "studentAttendance/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        "/campus-admin/attendance/students",
        { params },
      );
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch student attendance",
      );
    }
  },
);

export const markStudentAttendance = createAsyncThunk(
  'studentAttendance/mark',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/campus-admin/attendance/students', payload);
      dispatch(fetchActivityLogs({ page: 1, limit: 8, append: false }));
  "studentAttendance/mark",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/campus-admin/attendance/students",
        payload,
      );
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to record student attendance",
      );
    }
  },
);

export const markBulkStudentAttendance = createAsyncThunk(
  'studentAttendance/markBulk',
  async ({ date, records }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/campus-admin/attendance/students/bulk', {
        date,
        records,
      });
      dispatch(fetchActivityLogs({ page: 1, limit: 8, append: false }));
  "studentAttendance/markBulk",
  async ({ date, records }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/campus-admin/attendance/students/bulk",
        {
          date,
          records,
        },
      );
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to record bulk student attendance",
      );
    }
  },
);

const slice = createSlice({
  name: "studentAttendance",
  initialState: {
    records: [],
    status: "idle",
    error: null,
  },
  reducers: {
    studentAttendanceLoaded: (state, { payload }) => {
      state.records = (Array.isArray(payload) ? payload : []).map(
        normalizeAttendance,
      );
      state.status = "succeeded";
      state.error = null;
    },
    studentAttendanceMarked: {
      prepare: ({ studentId, classId, date, status }) => ({
        payload: { id: nanoid(), studentId, classId, date, status },
      }),
      reducer: (state, { payload }) => {
        if (!validStudentAttendance(payload)) return;
        const key = studentAttendanceKey(payload);
        const existing = state.records.find(
          (record) => studentAttendanceKey(record) === key,
        );
        if (existing) existing.status = payload.status;
        else state.records.push(normalizeAttendance(payload));
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentAttendance.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStudentAttendance.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        const list = Array.isArray(payload) ? payload : payload?.data || [];
        state.records = list.map(normalizeAttendance);
      })
      .addCase(fetchStudentAttendance.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      })
      .addCase(markStudentAttendance.fulfilled, (state, { payload }) => {
        const normalized = normalizeAttendance(payload);
        const key = studentAttendanceKey(normalized);
        const index = state.records.findIndex(
          (record) => studentAttendanceKey(record) === key,
        );
        if (index !== -1) {
          state.records[index] = { ...state.records[index], ...normalized };
        } else {
          state.records.push(normalized);
        }
      })
      .addCase(markBulkStudentAttendance.fulfilled, (state, { payload }) => {
        const list = Array.isArray(payload) ? payload : payload?.data || [];
        for (const item of list) {
          const normalized = normalizeAttendance(item);
          const key = studentAttendanceKey(normalized);
          const index = state.records.findIndex(
            (record) => studentAttendanceKey(record) === key,
          );
          if (index !== -1) {
            state.records[index] = { ...state.records[index], ...normalized };
          } else {
            state.records.push(normalized);
          }
        }
      });
  },
});

export const { studentAttendanceLoaded, studentAttendanceMarked } =
  slice.actions;
export const selectStudentAttendance = (state) =>
  state.studentAttendance.records;
export const selectStudentAttendanceStatus = (state) =>
  state.studentAttendance.status;
export const selectStudentAttendanceHistory = createSelector(
  [selectStudentAttendance, selectStudents, selectTimetable],
  recordedStudentRows,
);
export default slice.reducer;
