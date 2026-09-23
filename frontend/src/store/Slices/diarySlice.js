import { createSlice, nanoid } from "@reduxjs/toolkit";
import { validDate } from "../../lib/dates.js";

export function validDiaryEntry(entry) {
  return Boolean(
    entry &&
    ["id", "classId", "title"].every(
      (field) => typeof entry[field] === "string" && entry[field].trim(),
    ) &&
    validDate(entry.date) &&
    ["recap", "homework", "resources", "assignmentId"].every(
      (field) => entry[field] === undefined || typeof entry[field] === "string",
    ),
  );
}

export function validDiaryRecords(records) {
  return (
    Array.isArray(records) &&
    records.every(validDiaryEntry) &&
    new Set(records.map((entry) => entry.id)).size === records.length
  );
}

const slice = createSlice({
  name: "diary",
  initialState: { records: [] },
  reducers: {
    diaryLoaded: (state, { payload }) => {
      state.records = Array.isArray(payload) ? payload : [];
    },
    diarySaved: {
      prepare: (entry) => ({ payload: { ...entry, id: entry.id || nanoid() } }),
      reducer: (state, { payload }) => {
        if (!validDiaryEntry(payload)) return;
        const index = state.records.findIndex((entry) => entry.id === payload.id);
        if (index === -1) state.records.push(payload);
        else state.records[index] = payload;
      },
    },
    diaryDeleted: (state, { payload }) => {
      state.records = state.records.filter((entry) => entry.id !== payload);
    },
  },
});

export const { diaryLoaded, diarySaved, diaryDeleted } = slice.actions;
export default slice.reducer;

const empty = [];
export const selectDiary = (state) => state.diary?.records ?? empty;
