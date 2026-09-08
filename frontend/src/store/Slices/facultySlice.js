import { createSlice, nanoid } from "@reduxjs/toolkit";
import { facultyRecords } from "../../Admins/Campus Admin/Faculty/facultyData.js";

const initialsFor = (name) =>
  name
    .trim()
    .replace(/^Dr\.\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const facultySlice = createSlice({
  name: "faculty",
  initialState: {
    records: facultyRecords.map((record, index) => ({
      ...record,
      id: `faculty-demo-${index + 1}`,
      phone: "",
    })),
  },
  reducers: {
    facultyAdded: {
      prepare: (values) => ({
        payload: {
          ...values,
          id: nanoid(),
          initials: initialsFor(values.name),
        },
      }),
      reducer: (state, { payload }) => {
        state.records.push(payload);
      },
    },
    facultyUpdated: (state, { payload }) => {
      const record = state.records.find((item) => item.id === payload.id);
      if (record)
        Object.assign(record, payload, { initials: initialsFor(payload.name) });
    },
    facultyDeleted: (state, { payload }) => {
      state.records = state.records.filter((record) => record.id !== payload);
    },
  },
});

export const { facultyAdded, facultyUpdated, facultyDeleted } =
  facultySlice.actions;
export const selectFaculty = (state) => state.faculty.records;
export default facultySlice.reducer;
