import {
  createSelector,
  createSlice,
  createAsyncThunk,
  nanoid,
} from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance.js";
import {
  joinVouchers,
  validateVoucher,
} from "../../Admins/Campus Admin/Fees/feeData.js";
import { validDate } from "../../lib/dates.js";
import { selectStudents } from "./studentsSlice.js";

const normalizeFee = (item) => {
  const id = item._id || item.id || nanoid();
  const studentObj =
    typeof item.studentId === "object" && item.studentId !== null
      ? item.studentId
      : typeof item.student === "object" && item.student !== null
        ? item.student
        : null;
  const studentId = studentObj
    ? studentObj._id || studentObj.id
    : item.studentId;
  const voucherNo =
    item.voucherNo ||
    item.challanNo ||
    `CH-${String(id).slice(-6).toUpperCase()}`;
  const feeCategory = item.feeCategory || item.feeType || "Tuition";
  const semester = item.semester || item.month || "Current Term";
  const amount = Number(item.amount || 0);
  const rawStatus = String(
    item.paymentStatus || item.status || "Pending",
  ).toLowerCase();
  const paymentStatus =
    rawStatus === "paid"
      ? "Paid"
      : rawStatus === "overdue"
        ? "Overdue"
        : "Pending";
  const dueDate = item.dueDate
    ? new Date(item.dueDate).toISOString().split("T")[0]
    : "";
  const paymentDate = item.paymentDate
    ? new Date(item.paymentDate).toISOString().split("T")[0]
    : "";

  const description = item.description || item.notes || "";
  const breakdown = Array.isArray(item.breakdown)
    ? item.breakdown.map((b) => ({
        title: String(b.title || ""),
        amount: Number(b.amount || 0),
      }))
    : [];

  const normalized = {
    ...item,
    id: String(id),
    _id: String(id),
    studentId: String(studentId || ""),
    voucherNo: String(voucherNo),
    challanNo: String(voucherNo),
    feeCategory: String(feeCategory),
    feeType: String(feeCategory),
    semester: String(semester),
    description: String(description),
    notes: String(description),
    breakdown,
    amount,
    paidAmount: Number(
      item.paidAmount || (paymentStatus === "Paid" ? amount : 0),
    ),
    paymentStatus,
    status: paymentStatus.toLowerCase(),
    dueDate,
    paymentDate,
    createdAt: item.createdAt
      ? new Date(item.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: item.updatedAt
      ? new Date(item.updatedAt).toISOString()
      : new Date().toISOString(),
  };

  if (studentObj) {
    normalized.student = {
      ...studentObj,
      id: String(studentObj._id || studentObj.id || studentId),
      name: studentObj.name || "Student",
      roll: studentObj.roll || String(studentId),
      initials: (studentObj.name || "Student")
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0] || "")
        .join("")
        .toUpperCase(),
    };
  }

  return normalized;
};

export const fetchFees = createAsyncThunk(
  "fees/fetchFees",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/campus-admin/fees", {
        params,
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch fee vouchers",
      );
    }
  },
);

export const addFeeVoucher = createAsyncThunk(
  "fees/addFeeVoucher",
  async (voucherData, { rejectWithValue }) => {
    try {
      const payload = {
        ...voucherData,
        feeType: voucherData.feeCategory || voucherData.feeType || "tuition",
        challanNo: voucherData.voucherNo || voucherData.challanNo,
        status: voucherData.paymentStatus || voucherData.status || "pending",
      };
      const response = await axiosInstance.post("/campus-admin/fees", payload);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create fee voucher",
      );
    }
  },
);

export const updateFeeVoucher = createAsyncThunk(
  "fees/updateFeeVoucher",
  async (voucherData, { rejectWithValue }) => {
    try {
      const id = voucherData._id || voucherData.id;
      const payload = {
        ...voucherData,
        feeType: voucherData.feeCategory || voucherData.feeType,
        status: voucherData.paymentStatus || voucherData.status,
      };
      delete payload.id;
      delete payload._id;
      const response = await axiosInstance.put(
        `/campus-admin/fees/${id}`,
        payload,
      );
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update fee voucher",
      );
    }
  },
);

export const deleteFeeVoucher = createAsyncThunk(
  "fees/deleteFeeVoucher",
  async (voucherId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/campus-admin/fees/${voucherId}`);
      return voucherId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete fee voucher",
      );
    }
  },
);

export const generateMonthlyFees = createAsyncThunk(
  "fees/generateMonthlyFees",
  async (options, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/campus-admin/fees/generate-monthly",
        options,
      );
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate monthly fees",
      );
    }
  },
);

export const fetchFeeStructures = createAsyncThunk(
  "fees/fetchFeeStructures",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/campus-admin/fees/structures");
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch fee structures",
      );
    }
  },
);

export const saveFeeStructure = createAsyncThunk(
  "fees/saveFeeStructure",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/campus-admin/fees/structures",
        data,
      );
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save fee structure",
      );
    }
  },
);

export const deleteFeeStructure = createAsyncThunk(
  "fees/deleteFeeStructure",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/campus-admin/fees/structures/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete fee structure",
      );
    }
  },
);

const slice = createSlice({
  name: "fees",
  initialState: {
    records: [],
    structures: [],
    status: "idle",
    structuresStatus: "idle",
    error: null,
  },
  reducers: {
    feesLoaded: (state, { payload }) => {
      state.records = (Array.isArray(payload) ? payload : []).map(normalizeFee);
      state.status = "succeeded";
      state.error = null;
    },
    voucherSaved: {
      prepare: (values) => ({
        payload: normalizeFee({
          ...values,
          id: values.id || nanoid(),
          updatedAt: new Date().toISOString(),
        }),
      }),
      reducer: (state, { payload }) => {
        if (validateVoucher(payload)) return;
        const index = state.records.findIndex(
          (item) => item.id === payload.id || item._id === payload.id,
        );
        if (index !== -1) {
          state.records[index] = { ...state.records[index], ...payload };
        } else {
          state.records.push(payload);
        }
      },
    },
    voucherMarkedPaid: {
      prepare: ({ id, paymentDate }) => ({
        payload: { id, paymentDate, updatedAt: new Date().toISOString() },
      }),
      reducer: (state, { payload }) => {
        if (!validDate(payload.paymentDate)) return;
        const record = state.records.find(
          (item) => item.id === payload.id || item._id === payload.id,
        );
        if (record && record.paymentStatus !== "Paid") {
          Object.assign(record, {
            paymentStatus: "Paid",
            status: "paid",
            paymentDate: payload.paymentDate,
            updatedAt: payload.updatedAt,
          });
        }
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFees.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFees.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        const list = Array.isArray(payload) ? payload : payload?.data || [];
        state.records = list.map(normalizeFee);
      })
      .addCase(fetchFees.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      })
      .addCase(addFeeVoucher.fulfilled, (state, { payload }) => {
        state.records.push(normalizeFee(payload));
      })
      .addCase(updateFeeVoucher.fulfilled, (state, { payload }) => {
        const id = payload._id || payload.id;
        const index = state.records.findIndex(
          (item) => item.id === id || item._id === id,
        );
        if (index !== -1) {
          state.records[index] = normalizeFee({
            ...state.records[index],
            ...payload,
          });
        }
      })
      .addCase(deleteFeeVoucher.fulfilled, (state, { payload }) => {
        state.records = state.records.filter(
          (item) => item.id !== payload && item._id !== payload,
        );
      })
      .addCase(generateMonthlyFees.fulfilled, (state, { payload }) => {
        if (payload?.records && Array.isArray(payload.records)) {
          const newNormalized = payload.records.map(normalizeFee);
          state.records = [...newNormalized, ...state.records];
        }
      })
      .addCase(fetchFeeStructures.fulfilled, (state, { payload }) => {
        state.structuresStatus = "succeeded";
        state.structures = Array.isArray(payload)
          ? payload
          : payload?.data || [];
      })
      .addCase(saveFeeStructure.fulfilled, (state, { payload }) => {
        const index = state.structures.findIndex(
          (s) =>
            s._id === payload._id || s.gradeOrClass === payload.gradeOrClass,
        );
        if (index !== -1) {
          state.structures[index] = payload;
        } else {
          state.structures.push(payload);
        }
      })
      .addCase(deleteFeeStructure.fulfilled, (state, { payload }) => {
        state.structures = state.structures.filter((s) => s._id !== payload);
      });
  },
});

export const { feesLoaded, voucherSaved, voucherMarkedPaid } = slice.actions;
export const selectFees = (state) => state.fees.records;
export const selectFeesStatus = (state) => state.fees.status;
export const selectFeeStructures = (state) => state.fees.structures || [];
export const selectJoinedFees = createSelector(
  [selectFees, selectStudents],
  joinVouchers,
);
export default slice.reducer;
