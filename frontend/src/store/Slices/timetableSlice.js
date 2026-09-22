import { createSlice, createAsyncThunk, nanoid } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance.js";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const normalizeSchedule = (item) => {
  const id = item._id || item.id || nanoid();
  const instructor =
    item.instructor ||
    item.teacherName ||
    item.teacherId?.name ||
    "Assigned Teacher";
  const room = item.room || item.roomNumber || "";
  const program = item.className || item.gradeOrClass || item.program || "";
  const title = item.periodName || item.title || "Period 1";
  const dayNumbers = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const rawDays = item.days || (item.dayOfWeek ? [item.dayOfWeek] : []);
  const days = rawDays.map((day) =>
    typeof day === "string" ? (dayNumbers[day] ?? day) : day
  );
  const dayOfWeek =
    item.dayOfWeek ||
    (days.length > 0 && typeof days[0] === "number"
      ? WEEKDAYS[days[0] - 1] || "Monday"
      : "Monday");

  return {
    ...item,
    id,
    _id: item._id || id,
    instructor,
    teacherName: instructor,
    room,
    roomNumber: room,
    program,
    className: program,
    gradeOrClass: program,
    title,
    periodName: title,
    days,
    dayOfWeek,
    status: item.status || "Active",
  };
};

export const fetchSchedules = createAsyncThunk(
  "timetable/fetchSchedules",
  async (params = {}, { rejectWithValue }) => {
    try {
      let response;
      try {
        response = await axiosInstance.get("/campus-admin/timetables", { params });
      } catch (err) {
        if (err.response?.status === 404) {
          response = await axiosInstance.get("/campus-admin/schedules", { params });
        } else {
          throw err;
        }
      }
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch schedules"
      );
    }
  },
  {
    condition: (force, { getState }) => {
      if (force === true) return true;
      const { timetable } = getState();
      if (timetable?.status === "loading") {
        return false;
      }
    },
  }
);

export const fetchTimetable = fetchSchedules;

export const addSchedule = createAsyncThunk(
  "timetable/addSchedule",
  async (scheduleData, { rejectWithValue }) => {
    try {
      const payload = { ...scheduleData };
      if (!payload.dayOfWeek && Array.isArray(payload.days) && payload.days.length > 0) {
        const firstDay = payload.days[0];
        payload.dayOfWeek = typeof firstDay === "number" ? WEEKDAYS[firstDay - 1] : firstDay;
      }
      let response;
      try {
        response = await axiosInstance.post("/campus-admin/timetables", payload);
      } catch (err) {
        if (err.response?.status === 404) {
          response = await axiosInstance.post("/campus-admin/schedules", payload);
        } else {
          throw err;
        }
      }
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add schedule"
      );
    }
  }
);

export const scheduleClass = addSchedule;

export const updateSchedule = createAsyncThunk(
  "timetable/updateSchedule",
  async (scheduleData, { rejectWithValue }) => {
    try {
      const id = scheduleData._id || scheduleData.id;
      const payload = { ...scheduleData };
      delete payload.id;
      delete payload._id;
      if (!payload.dayOfWeek && Array.isArray(payload.days) && payload.days.length > 0) {
        const firstDay = payload.days[0];
        payload.dayOfWeek = typeof firstDay === "number" ? WEEKDAYS[firstDay - 1] : firstDay;
      }
      let response;
      try {
        response = await axiosInstance.put(`/campus-admin/timetables/${id}`, payload);
      } catch (err) {
        if (err.response?.status === 404) {
          response = await axiosInstance.put(`/campus-admin/schedules/${id}`, payload);
        } else {
          throw err;
        }
      }
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update schedule"
      );
    }
  }
);

export const updateScheduledClass = updateSchedule;

export const deleteSchedule = createAsyncThunk(
  "timetable/deleteSchedule",
  async (scheduleId, { rejectWithValue }) => {
    try {
      try {
        await axiosInstance.delete(`/campus-admin/timetables/${scheduleId}`);
      } catch (err) {
        if (err.response?.status === 404) {
          await axiosInstance.delete(`/campus-admin/schedules/${scheduleId}`);
        } else {
          throw err;
        }
      }
      return scheduleId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete schedule"
      );
    }
  }
);

export const deleteScheduledClass = deleteSchedule;

const slice = createSlice({
  name: "timetable",
  initialState: {
    records: [],
    status: "idle",
    error: null,
  },
  reducers: {
    schedulesLoaded: (state, { payload }) => {
      state.records = (Array.isArray(payload) ? payload : []).map(
        normalizeSchedule
      );
      state.status = "succeeded";
    },
    classScheduled: {
      prepare: (values) => ({ payload: normalizeSchedule(values) }),
      reducer: (state, { payload }) => {
        state.records.push(payload);
      },
    },
    classUpdated: (state, { payload }) => {
      const id = payload._id || payload.id;
      const index = state.records.findIndex(
        (item) => item.id === id || item._id === id
      );
      if (index !== -1) {
        state.records[index] = normalizeSchedule({
          ...state.records[index],
          ...payload,
        });
      }
    },
    classDeleted: (state, { payload }) => {
      state.records = state.records.filter(
        (item) => item.id !== payload && item._id !== payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchSchedules.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSchedules.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        const list = Array.isArray(payload) ? payload : payload?.data || [];
        state.records = list.map(normalizeSchedule);
      })
      .addCase(fetchSchedules.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      })
      // Add
      .addCase(addSchedule.fulfilled, (state, { payload }) => {
        state.records.push(normalizeSchedule(payload));
      })
      // Update
      .addCase(updateSchedule.fulfilled, (state, { payload }) => {
        const id = payload._id || payload.id;
        const index = state.records.findIndex(
          (item) => item.id === id || item._id === id
        );
        if (index !== -1) {
          state.records[index] = normalizeSchedule({
            ...state.records[index],
            ...payload,
          });
        }
      })
      // Delete
      .addCase(deleteSchedule.fulfilled, (state, { payload }) => {
        state.records = state.records.filter(
          (item) => item.id !== payload && item._id !== payload
        );
      });
  },
});

export const { schedulesLoaded, classScheduled, classUpdated, classDeleted } =
  slice.actions;
export const selectTimetable = (state) => state.timetable.records;
export const selectTimetableStatus = (state) => state.timetable.status;
export default slice.reducer;
