import mongoose from "mongoose";

const teacherAttendanceSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    teacherProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherProfile",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
      // normalized to midnight (see pre-save below)
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "On Leave"],
      required: true,
    },
    checkInTime: { type: String, trim: true },   // "08:15 AM"
    checkOutTime: { type: String, trim: true },  // "03:30 PM"
    remarks: { type: String, trim: true, maxlength: 300 },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Normalize date to midnight to allow one record per day per teacher
teacherAttendanceSchema.pre("save", function (next) {
  if (this.date) {
    const d = new Date(this.date);
    d.setHours(0, 0, 0, 0);
    this.date = d;
  }
  next();
});

// Prevent duplicate attendance per (teacher, day)
teacherAttendanceSchema.index(
  { teacherProfileId: 1, date: 1 },
  { unique: true }
);

const TeacherAttendance =
  mongoose.models.TeacherAttendance ||
  mongoose.model("TeacherAttendance", teacherAttendanceSchema);

export default TeacherAttendance;