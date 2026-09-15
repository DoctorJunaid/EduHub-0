import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance.js";

export const fetchGlobalStats = createAsyncThunk(
  "superAdmin/fetchGlobalStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/super-admin/stats");
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch stats");
    }
  }
);

const getCachedStats = () => {
  try {
    const raw = localStorage.getItem("eduHub_stats_cache");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialCachedStats = getCachedStats();

const superAdminSlice = createSlice({
  name: "superAdmin",
  initialState: {
    globalStats: initialCachedStats,
    status: initialCachedStats ? "succeeded" : "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlobalStats.pending, (state) => {
        if (!state.globalStats) {
          state.status = "loading";
        }
      })
      .addCase(fetchGlobalStats.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.globalStats = payload;
        try {
          localStorage.setItem("eduHub_stats_cache", JSON.stringify(payload));
        } catch {}
      })
      .addCase(fetchGlobalStats.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      });
  },
});

export const selectGlobalStats = (state) => state.superAdmin.globalStats;
export const selectSuperAdminStatus = (state) => state.superAdmin.status;
export default superAdminSlice.reducer;
