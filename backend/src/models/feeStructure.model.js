import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
  {
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
    gradeOrClass: {
      type: String,
      required: true,
      trim: true,
    },
    tuitionFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    labFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    sportsFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    examFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFeeFine: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

feeStructureSchema.index({ campusId: 1, gradeOrClass: 1 }, { unique: true });

const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);
export default FeeStructure;
