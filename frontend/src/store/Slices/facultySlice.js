import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance.js";

const initialsFor = (name) =>
  (name || "").trim().replace(/^Dr\.\s*/i, "").split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();

export const fetchFaculty = createAsyncThunk("faculty/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get("/campus-admin/faculty");
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch faculty");
  }
});

export const addFaculty = createAsyncThunk("faculty/add", async (facultyData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post("/campus-admin/faculty/new", facultyData);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to add faculty");
  }
});

export const updateFaculty = createAsyncThunk('faculty/update', async (facultyData, { rejectWithValue }) => {
  try {
    const id = facultyData.id || facultyData._id;
    const data = { ...facultyData };
    delete data.id;
    delete data._id;
    const response = await axiosInstance.put(`/campus-admin/faculty/${id}`, data);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update faculty');
  }
});

export const deleteFaculty = createAsyncThunk('faculty/delete', async (facultyId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/campus-admin/faculty/${facultyId}`);
    return facultyId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete faculty');
  }
});

const facultySlice = createSlice({
  name: "faculty",
  initialState: {
    records: [],
    status: 'idle',
    error: null
  },
  reducers: {
    facultyAdded: (state, { payload }) => { state.records.push({ ...payload, id: payload.id || Math.random().toString() }); },
    facultyUpdated: (state, { payload }) => {
      const faculty = state.records.find((record) => record.id === payload.id);
      if (faculty) Object.assign(faculty, payload);
    },
    facultyDeleted: (state, { payload }) => {
      state.records = state.records.filter((faculty) => faculty.id !== payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFaculty.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchFaculty.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        const list = Array.isArray(payload) ? payload : (payload?.faculty || payload?.data || []);
        state.records = list.map(faculty => ({
          ...faculty,
          id: faculty._id || faculty.id,
          initials: faculty.initials || initialsFor(faculty.name || "Unknown Faculty")
        }));
      })
      .addCase(fetchFaculty.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })
      .addCase(addFaculty.fulfilled, (state, { payload }) => {
        const newFaculty = {
          ...payload,
          id: payload._id || payload.id,
          initials: payload.initials || initialsFor(payload.name || "Unknown")
        };
        state.records.push(newFaculty);
      })
      .addCase(updateFaculty.fulfilled, (state, { payload }) => {
        const index = state.records.findIndex(f => f.id === (payload._id || payload.id));
        if (index !== -1) {
          state.records[index] = {
            ...state.records[index],
            ...payload,
            id: payload._id || payload.id,
            initials: payload.initials || initialsFor(payload.name || "Unknown")
          };
        }
      })
      .addCase(deleteFaculty.fulfilled, (state, { payload }) => {
        state.records = state.records.filter((faculty) => faculty.id !== payload && faculty._id !== payload);
      });
  }
});

export const { facultyAdded, facultyUpdated, facultyDeleted } = facultySlice.actions;
export const selectFaculty = (state) => state.faculty.records;
export const selectFacultyStatus = (state) => state.faculty.status;
export default facultySlice.reducer;
