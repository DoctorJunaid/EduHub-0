import { createSelector, createSlice, createAsyncThunk, nanoid } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance.js';
import { examsInWeek } from '../../Admins/Campus Admin/Exams/examData.js';
import { mondayOf } from '../../lib/schedule.js';

const normalizeExam = (item) => {
  const id = item._id || item.id || nanoid();
  const date =
    item.date ||
    (item.examDate ? new Date(item.examDate).toISOString().split('T')[0] : '');
  const room = item.room || item.roomNumber || 'Hall A';
  const invigilator =
    item.invigilator || item.teacherName || item.teacherId?.name || 'Assigned Invigilator';
  const department =
    item.department || item.className || item.gradeOrClass || 'Academic Wing';

  return {
    ...item,
    id,
    _id: item._id || id,
    date,
    examDate: item.examDate || date,
    room,
    roomNumber: room,
    invigilator,
    department,
    status: item.status || 'Scheduled',
  };
};

export const fetchExams = createAsyncThunk(
  'exams/fetchExams',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/campus-admin/exams', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exams');
    }
  },
  {
    condition: (force, { getState }) => {
      if (force === true) return true;
      const { exams } = getState();
      if (exams?.status === 'loading') {
        return false;
      }
    },
  }
);

export const addExam = createAsyncThunk(
  'exams/addExam',
  async (examData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/campus-admin/exams', examData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add exam');
    }
  }
);

export const updateExam = createAsyncThunk(
  'exams/updateExam',
  async (examData, { rejectWithValue }) => {
    try {
      const id = examData._id || examData.id;
      const payload = { ...examData };
      delete payload.id;
      delete payload._id;
      const response = await axiosInstance.put(`/campus-admin/exams/${id}`, payload);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update exam');
    }
  }
);

export const deleteExam = createAsyncThunk(
  'exams/deleteExam',
  async (examId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/campus-admin/exams/${examId}`);
      return examId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete exam');
    }
  }
);

const slice = createSlice({
  name: 'exams',
  initialState: {
    records: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    examAdded: {
      prepare: (values) => ({ payload: normalizeExam(values) }),
      reducer: (state, { payload }) => {
        state.records.push(payload);
      },
    },
    examUpdated: (state, { payload }) => {
      const index = state.records.findIndex(
        (item) => item.id === payload.id || item._id === payload.id
      );
      if (index !== -1) {
        state.records[index] = normalizeExam({
          ...state.records[index],
          ...payload,
        });
      }
    },
    examDeleted: (state, { payload }) => {
      state.records = state.records.filter(
        (item) => item.id !== payload && item._id !== payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExams.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchExams.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        const list = Array.isArray(payload) ? payload : (payload?.data || []);
        state.records = list.map(normalizeExam);
      })
      .addCase(fetchExams.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })
      .addCase(addExam.fulfilled, (state, { payload }) => {
        state.records.push(normalizeExam(payload));
      })
      .addCase(updateExam.fulfilled, (state, { payload }) => {
        const id = payload._id || payload.id;
        const index = state.records.findIndex(
          (item) => item.id === id || item._id === id
        );
        if (index !== -1) {
          state.records[index] = normalizeExam({
            ...state.records[index],
            ...payload,
          });
        }
      })
      .addCase(deleteExam.fulfilled, (state, { payload }) => {
        state.records = state.records.filter(
          (item) => item.id !== payload && item._id !== payload
        );
      });
  },
});

export const { examAdded, examUpdated, examDeleted } = slice.actions;
export const selectExams = (state) => state.exams.records;
export const selectExamsStatus = (state) => state.exams.status;

export const selectExamStats = createSelector(
  [selectExams, (_state, today) => today],
  (records, today) => ({
    total: records.length,
    midterms: records.filter((item) => item.examType === 'Midterm').length,
    finals: records.filter((item) => item.examType === 'Final').length,
    week: examsInWeek(records, mondayOf(new Date(`${today}T12:00:00`))).length,
  })
);

export default slice.reducer;
