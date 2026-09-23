import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    feeRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeRecord",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    amount: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    paymentDate: { 
      type: Date, 
      default: Date.now 
    },
    paymentMethod: { 
      type: String, 
      required: true,
      default: "Cash"
    },
    referenceNo: { 
      type: String, 
      default: "" 
    },
    receiptUrl: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED"],
      default: "PENDING",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    confirmationDate: {
      type: Date,
      default: null,
    },
    notes: { 
      type: String, 
      default: "" 
    },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ campusId: 1, feeRecordId: 1 });
paymentTransactionSchema.index({ campusId: 1, status: 1 });

const PaymentTransaction = mongoose.model("PaymentTransaction", paymentTransactionSchema);

export default PaymentTransaction;
