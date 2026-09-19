import mongoose from "mongoose";

const teacherAttendanceSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: [true, "Campus ID is required"],
      index: true,
    },
    teacherProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher profile ID is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          "Present",
          "Absent",
          "Late",
          "On Leave",
          "present",
          "absent",
          "late",
          "on leave",
        ],
        message: "Status must be Present, Absent, Late, or On Leave",
      },
      required: [true, "Status is required"],
    },
    checkInTime: {
      type: String,
      trim: true,
      default: "",
    },
    checkOutTime: {
      type: String,
      trim: true,
      default: "",
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [300, "Remarks cannot exceed 300 characters"],
      default: "",
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

teacherAttendanceSchema.virtual("teacherId").get(function () {
  return this.teacherProfileId;
}).set(function (val) {
  this.teacherProfileId = val;
});

// Pre-save hook to normalize date to midnight
teacherAttendanceSchema.pre("save", function (next) {
  if (this.date) {
    const d = new Date(this.date);
    d.setHours(0, 0, 0, 0);
    this.date = d;
  }
  if (typeof next === "function") next();
});

// Compound unique index on teacherProfileId + date
teacherAttendanceSchema.index(
  { teacherProfileId: 1, date: 1 },
  { unique: true }
);

// Compound index for querying campus attendance by date
teacherAttendanceSchema.index({ campusId: 1, date: 1 });

const TeacherAttendance =
  mongoose.models.TeacherAttendance ||
  mongoose.model("TeacherAttendance", teacherAttendanceSchema);

export default TeacherAttendance;