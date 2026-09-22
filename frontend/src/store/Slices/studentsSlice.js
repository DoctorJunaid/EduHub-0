import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance.js';

const initialsFor = (name) =>
  (name || '').trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();

export const fetchStudents = createAsyncThunk(
  'students/fetchAll',
  async (campusId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/campus-admin/students');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch students');
    }
  },
  {
    condition: (force, { getState }) => {
      if (force === true) return true;
      const { students } = getState();
      if (students?.status === 'loading') {
        return false;
      }
    },
  }
);

export const addStudent = createAsyncThunk('students/add', async (studentData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/campus-admin/students/new', studentData);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add student');
  }
});

export const updateStudent = createAsyncThunk('students/update', async (studentData, { rejectWithValue }) => {
  try {
    const id = studentData.id || studentData._id;
    const data = { ...studentData };
    delete data.id;
    delete data._id;
    const response = await axiosInstance.put(`/campus-admin/students/${id}`, data);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update student');
  }
});

export const deleteStudent = createAsyncThunk('students/delete', async (studentId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/campus-admin/students/${studentId}`);
    return studentId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete student');
  }
});

const studentsSlice = createSlice({
  name: 'students',
  initialState: { 
    records: [],
    status: 'idle',
    error: null
  },
  reducers: {
    studentAdded: (state, { payload }) => {
      state.records.push({
        ...payload,
        id: payload.id || Math.random().toString(),
        initials: payload.initials || initialsFor(payload.name || ''),
      });
    },
    studentUpdated: (state, { payload }) => {
      const student = state.records.find((record) => record.id === payload.id);
      if (student) {
        Object.assign(student, payload, {
          initials: payload.name ? initialsFor(payload.name) : student.initials,
        });
      }
    },
    studentDeleted: (state, { payload }) => {
      state.records = state.records.filter((student) => student.id !== payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchStudents.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchStudents.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        const list = Array.isArray(payload) ? payload : (payload?.students || payload?.data || []);
        // Map backend _id to id and generate initials if needed
        state.records = list.map(student => ({
          ...student,
          id: student._id || student.id,
          campus: student.campus || student.campusId?.name || '',
          initials: student.initials || initialsFor(student.name || 'Unknown Student')
        }));
      })
      .addCase(fetchStudents.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })
      // Add
      .addCase(addStudent.fulfilled, (state, { payload }) => {
        const newStudent = {
          ...payload,
          id: payload._id || payload.id,
          campus: payload.campus || payload.campusId?.name || '',
          initials: payload.initials || initialsFor(payload.name || 'Unknown Student')
        };
        state.records.push(newStudent);
      })
      // Update
      .addCase(updateStudent.fulfilled, (state, { payload }) => {
        const id = payload._id || payload.id;
        const index = state.records.findIndex(s => s.id === id);
        if (index !== -1) {
          state.records[index] = {
            ...state.records[index],
            ...payload,
            id,
            campus: payload.campus || payload.campusId?.name || state.records[index].campus || '',
            initials: payload.initials || initialsFor(payload.name || 'Unknown Student')
          };
        }
      })
      // Delete
      .addCase(deleteStudent.fulfilled, (state, { payload }) => {
        state.records = state.records.filter((student) => student.id !== payload && student._id !== payload);
      });
  },
});

export const { studentAdded, studentUpdated, studentDeleted } = studentsSlice.actions;
export const selectStudents = (state) => state.students.records;
export const selectStudentsStatus = (state) => state.students.status;
export default studentsSlice.reducer;
