import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    instituteName: {
      type: String,
      default: "EduHub Global Institute",
      trim: true,
    },
    instituteLogo: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    classProgram: {
      type: String,
      required: true,
      trim: true,
    },
    rollNo: {
      type: String,
      required: true,
      trim: true,
    },
    fatherName: {
      type: String,
      default: "",
      trim: true,
    },
    guardianPhone: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
      trim: true,
    },
    qrCodeData: {
      type: String,
      default: "",
      trim: true,
    },
    qrToken: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    status: {
      type: String,
      default: "Active",
      trim: true,
    },
  },
  { timestamps: true }
);

studentSchema.index({ campusId: 1, classProgram: 1, rollNo: 1 });
studentSchema.index({ userId: 1 }, { unique: true });

// Prevent re-compilation in development watch mode
const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
export { studentSchema };
