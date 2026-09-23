import mongoose from "mongoose";
import {
  normalizeTimeString,
  parseTimeToMinutes,
  WEEKDAYS,
} from "../utils/timetableTime.js";

export const INSTITUTION_TYPES = [
  "School",
  "College",
  "University",
  "Coaching",
];

const timetableSchema = new mongoose.Schema(
  {
    institutionType: {
      type: String,
      required: [true, "Institution type is required"],
      trim: true,
      enum: INSTITUTION_TYPES,
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    days: {
      type: [Number],
      required: [true, "Days are required"],
      validate: {
        validator: function (v) {
          return v && v.length > 0 && v.every(day => day >= 0 && day <= 7);
        },
        message: "A class must have at least one valid day selected (0-7)"
      }
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      trim: true,
    },
    isBreak: {
      type: Boolean,
      default: false,
    },
    breakTitle: {
      type: String,
      trim: true,
      default: "",
    },
    colorTag: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Pending", "Cancelled"],
      default: "Active",
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: [true, "Campus is required"],
      index: true,
    },
  },
  { timestamps: true },
);

timetableSchema.pre("validate", function validateTimetable() {
  const start = normalizeTimeString(this.startTime);
  const end = normalizeTimeString(this.endTime);
  if (!start || !end) {
    this.invalidate("startTime", "Invalid start or end time format.");
    return;
  }
  this.startTime = start;
  this.endTime = end;

  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (endMin <= startMin) {
    this.invalidate("endTime", "End time must be after start time.");
  }

  if (this.isBreak) {
    if (!this.breakTitle && !this.subjectId) {
      this.invalidate(
        "breakTitle",
        "Break slots require breakTitle or subjectId.",
      );
    }
  } else {
    const requiredFields = [
      ["gradeId", "Grade/Program is required for class slots."],
      ["sectionId", "Section is required for class slots."],
      ["subjectId", "Subject is required for class slots."],
      ["teacherId", "Teacher is required for class slots."],
      ["room", "Room is required for class slots."],
    ];
    for (const [field, message] of requiredFields) {
      const val = this[field];
      if (!val || (typeof val === "string" && !val.trim())) {
        this.invalidate(field, message);
      }
    }
  }
});

timetableSchema.index({ campusId: 1, institutionType: 1, days: 1 });
timetableSchema.index({ campusId: 1, days: 1, room: 1 });
timetableSchema.index({ campusId: 1, days: 1, teacherId: 1 });
timetableSchema.index({
  campusId: 1,
  days: 1,
  gradeId: 1,
  sectionId: 1,
});

const Timetable =
  mongoose.models.Timetable || mongoose.model("Timetable", timetableSchema);

export default Timetable;
