import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance.js";

export const fetchInstitutes = createAsyncThunk("institutes/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get("/super-admin/institutes");
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch institutes");
  }
});

export const addInstitute = createAsyncThunk("institutes/add", async (instituteData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post("/super-admin/institutes", instituteData, {
      headers: instituteData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to add institute");
  }
});

export const updateInstitute = createAsyncThunk("institutes/update", async (instituteData, { rejectWithValue }) => {
  try {
    let id, data;
    if (instituteData instanceof FormData) {
      id = instituteData.get("id");
      data = instituteData;
    } else {
      id = instituteData.id;
      data = { ...instituteData };
      delete data.id;
    }
    
    const response = await axiosInstance.put(`/super-admin/institutes/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to update institute");
  }
});

export const deleteInstitute = createAsyncThunk("institutes/delete", async (instituteId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/super-admin/institutes/${instituteId}`);
    return instituteId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete institute");
  }
});

const getCachedInstitutes = () => {
  try {
    const raw = localStorage.getItem("eduHub_institutes_cache");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCachedInstitutes = (records) => {
  try {
    localStorage.setItem("eduHub_institutes_cache", JSON.stringify(records));
  } catch {}
};

const initialCached = getCachedInstitutes();

const institutesSlice = createSlice({
  name: "institutes",
  initialState: {
    records: initialCached,
    status: initialCached.length > 0 ? "succeeded" : "idle",
    error: null,
  },
  reducers: {
    optimisticStatusChange: (state, { payload }) => {
      const { id, status } = payload;
      const target = state.records.find((i) => i.id === id || i._id === id);
      if (target) {
        target.status = status;
        saveCachedInstitutes(state.records);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstitutes.pending, (state) => {
        // Do not flip to loading if we already have cached records (SWR)
        if (state.records.length === 0) {
          state.status = "loading";
        }
      })
      .addCase(fetchInstitutes.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        const formatted = payload.map((inst) => ({
          ...inst,
          id: inst._id || inst.id,
        }));
        state.records = formatted;
        saveCachedInstitutes(formatted);
      })
      .addCase(fetchInstitutes.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      })
      .addCase(addInstitute.fulfilled, (state, { payload }) => {
        const item = { ...payload, id: payload._id || payload.id };
        state.records.unshift(item);
        saveCachedInstitutes(state.records);
      })
      .addCase(updateInstitute.fulfilled, (state, { payload }) => {
        const id = payload._id || payload.id;
        const index = state.records.findIndex((i) => i.id === id || i._id === id);
        if (index !== -1) {
          state.records[index] = { ...state.records[index], ...payload, id };
          saveCachedInstitutes(state.records);
        }
      })
      .addCase(deleteInstitute.fulfilled, (state, { payload }) => {
        state.records = state.records.filter(
          (inst) => inst.id !== payload && inst._id !== payload
        );
        saveCachedInstitutes(state.records);
      });
  },
});

export const { optimisticStatusChange } = institutesSlice.actions;
export const selectInstitutes = (state) => state.institutes.records;
export const selectInstitutesStatus = (state) => state.institutes.status;
export default institutesSlice.reducer;
