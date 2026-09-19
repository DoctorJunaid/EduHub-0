import { createSelector, createSlice, createAsyncThunk, nanoid } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance.js';
import {
  resultKey,
  validateResult,
  joinResults,
} from '../../Admins/Campus Admin/Results/resultsData.js';
import { selectStudents } from './studentsSlice.js';
import { selectExams } from './examsSlice.js';

const normalizeResult = (item) => {
  const id = item._id || item.id || nanoid();
  const studentId =
    typeof item.studentId === 'object' && item.studentId !== null
      ? item.studentId._id || item.studentId.id
      : item.studentId;
  const score = Number(item.score ?? item.marksObtained ?? 0);
  const totalMarks = Number(item.totalMarks || 100);
  const academicYear = item.academicYear || '2025-2026';
  const semester = item.semester || item.term || 'Midterm Examination';
  const examId =
    item.examId || item.examName || `exam-${String(item.subject || 'sub').slice(0, 4)}`;
  const courseCode = item.courseCode || item.subject || 'General';
  const grade = item.grade !== undefined ? item.grade : (score / totalMarks >= 0.8 ? 'A' : 'B');
  const gpa = item.gpa !== undefined ? item.gpa : Number((score / totalMarks) * 4);
  const remarks = item.remarks !== undefined ? item.remarks : 'Satisfactory performance';

  return {
    ...item,
    id,
    _id: item._id || id,
    studentId: String(studentId || ''),
    score,
    marksObtained: score,
    totalMarks,
    academicYear,
    semester,
    term: semester,
    examId: String(examId),
    examName: item.examName || semester,
    courseCode,
    subject: courseCode,
    grade,
    gpa,
    remarks,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
};

export const fetchResults = createAsyncThunk(
  'results/fetchResults',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/campus-admin/performance', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exam results');
    }
  }
);

export const saveResult = createAsyncThunk(
  'results/saveResult',
  async (resultData, { rejectWithValue }) => {
    try {
      const payload = {
        ...resultData,
        marksObtained: Number(resultData.score ?? resultData.marksObtained ?? 0),
        totalMarks: Number(resultData.totalMarks || 100),
        examName: resultData.examName || resultData.semester || 'Midterm Examination',
        subject: resultData.subject || resultData.courseCode || 'General',
        term: resultData.term || resultData.semester || 'Midterm',
      };

      let response;
      if (payload._id || payload.id) {
        const id = payload._id || payload.id;
        delete payload._id;
        delete payload.id;
        response = await axiosInstance.put(`/campus-admin/performance/${id}`, payload);
      } else {
        response = await axiosInstance.post('/campus-admin/performance', payload);
      }
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save exam result');
    }
  }
);

export const deleteResult = createAsyncThunk(
  'results/deleteResult',
  async (resultId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/campus-admin/performance/${resultId}`);
      return resultId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete exam result');
    }
  }
);

const slice = createSlice({
  name: 'results',
  initialState: {
    records: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    resultSaved: {
      prepare: (values) => ({
        payload: normalizeResult({
          ...values,
          id: values.id || nanoid(),
          updatedAt: new Date().toISOString(),
        }),
      }),
      reducer: (state, { payload }) => {
        if (validateResult(payload)) return;
        const existing = state.records.find((record) => record.id === payload.id);
        const duplicate = state.records.find(
          (record) => resultKey(record) === resultKey(payload)
        );
        if (existing && duplicate && existing.id !== duplicate.id) return;
        const record = existing || duplicate;
        if (record) {
          Object.assign(record, payload, {
            id: record.id,
            createdAt: record.createdAt,
          });
        } else {
          state.records.push({ ...payload, createdAt: payload.updatedAt });
        }
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResults.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchResults.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        const list = Array.isArray(payload) ? payload : (payload?.data || []);
        state.records = list.map(normalizeResult);
      })
      .addCase(fetchResults.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })
      .addCase(saveResult.fulfilled, (state, { payload }) => {
        const normalized = normalizeResult(payload);
        const index = state.records.findIndex(
          (r) => r.id === normalized.id || r._id === normalized.id
        );
        if (index !== -1) {
          state.records[index] = { ...state.records[index], ...normalized };
        } else {
          state.records.push(normalized);
        }
      })
      .addCase(deleteResult.fulfilled, (state, { payload }) => {
        state.records = state.records.filter(
          (r) => r.id !== payload && r._id !== payload
        );
      });
  },
});

export const { resultSaved } = slice.actions;
export const selectResults = (state) => state.results.records;
export const selectResultsStatus = (state) => state.results.status;
export const selectJoinedResults = createSelector(
  [selectResults, selectStudents, selectExams],
  joinResults
);
export default slice.reducer;
