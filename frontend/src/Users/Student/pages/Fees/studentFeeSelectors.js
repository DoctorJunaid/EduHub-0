import { createSelector } from "@reduxjs/toolkit";
import { selectFees } from "@/store/Slices/feesSlice";
import { selectCurrentStudent } from "@/store/selectors/studentDashboard";
import { studentFeeView } from "@/store/feeReferenceData";

export const selectStudentFees = createSelector(
  [selectCurrentStudent, selectFees],
  (student, fees) =>
    studentFeeView(
      student,
      fees,
      import.meta.env.VITE_STUDENT_FEE_DEMO === "true",
    ),
);
