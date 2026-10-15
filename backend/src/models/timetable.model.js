import mongoose from "mongoose";
import "./user.model.js";
import "./academic.model.js";
import "./campus.model.js";
import "./institute.model.js";
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
      default: "School",
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
    },
    classId: {
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
    program: {
      type: String,
      trim: true,
      default: "",
    },
    className: {
      type: String,
      trim: true,
      default: "",
    },
    section: {
      type: String,
      trim: true,
      default: "",
    },
    sectionName: {
      type: String,
      trim: true,
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    subjectName: {
      type: String,
      trim: true,
      default: "",
    },
    instructor: {
      type: String,
      trim: true,
      default: "",
    },
    teacherName: {
      type: String,
      trim: true,
      default: "",
    },
    targetAudience: {
      type: String,
      enum: ["both", "student", "teacher"],
      default: "both",
      trim: true,
    },
    visibleTo: {
      type: String,
      enum: ["both", "student", "teacher"],
      trim: true,
    },
    slotType: {
      type: String,
      enum: ["period", "break"],
      default: "period",
    },
    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      default: "Monday",
    },
    days: {
      type: [Number],
      required: [true, "Days are required"],
      validate: {
        validator: function (v) {
          return v && v.length > 0 && v.every(day => day >= 1 && day <= 7);
        },
        message: "A class must have at least one valid day selected (1-7)"
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
    room: {
      type: String,
      trim: true,
      default: "",
    },
    roomNumber: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
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

  // Synchronize targetAudience and visibleTo
  if (this.targetAudience && !this.visibleTo) {
    this.visibleTo = this.targetAudience;
  } else if (this.visibleTo && !this.targetAudience) {
    this.targetAudience = this.visibleTo;
  }
  if (!this.targetAudience) {
    this.targetAudience = "both";
    this.visibleTo = "both";
  }

  // Synchronize slotType and isBreak
  if (this.isBreak) {
    this.slotType = "break";
  } else {
    this.slotType = this.slotType || "period";
  }

  // Synchronize days and dayOfWeek
  if (Array.isArray(this.days) && this.days.length > 0) {
    const firstDay = this.days[0];
    if (typeof firstDay === "number" && firstDay >= 1 && firstDay <= 7) {
      this.dayOfWeek = WEEKDAYS[firstDay - 1];
    }
  } else if (this.dayOfWeek) {
    const dayIndex = WEEKDAYS.indexOf(this.dayOfWeek);
    if (dayIndex !== -1) {
      this.days = [dayIndex + 1];
    }
  }

  // Synchronize string and ID aliases
  if (this.program && !this.className) this.className = this.program;
  if (this.className && !this.program) this.program = this.className;

  if (this.section && !this.sectionName) this.sectionName = this.section;
  if (this.sectionName && !this.section) this.section = this.sectionName;

  if (this.subject && !this.subjectName) this.subjectName = this.subject;
  if (this.subjectName && !this.subject) this.subject = this.subjectName;

  if (this.instructor && !this.teacherName) this.teacherName = this.instructor;
  if (this.teacherName && !this.instructor) this.instructor = this.teacherName;

  if (this.gradeId && !this.classId) this.classId = this.gradeId;
  if (this.classId && !this.gradeId) this.gradeId = this.classId;

  if (this.room && !this.roomNumber) this.roomNumber = this.room;
  if (this.roomNumber && !this.room) this.room = this.roomNumber;

  if (this.targetAudience && !this.visibleTo) this.visibleTo = this.targetAudience;
  if (this.visibleTo && !this.targetAudience) this.targetAudience = this.visibleTo;
  if (this.targetAudience && this.visibleTo && this.targetAudience !== this.visibleTo) {
    this.visibleTo = this.targetAudience;
  }

  if (this.isBreak) {
    if (!this.breakTitle && !this.subjectId && !this.subject) {
      this.invalidate(
        "breakTitle",
        "Break slots require a break title or subject.",
      );
    }
  } else {
    if (!this.gradeId && (!this.program || !this.program.trim())) {
      this.invalidate("gradeId", "Class/Grade is required for class slots.");
    }
    if (!this.sectionId && (!this.section || !this.section.trim())) {
      this.invalidate("sectionId", "Section is required for class slots.");
    }
    if (!this.subjectId && (!this.subject || !this.subject.trim())) {
      this.invalidate("subjectId", "Subject is required for class slots.");
    }
    if (!this.teacherId && (!this.instructor || !this.instructor.trim())) {
      this.invalidate("teacherId", "Teacher is required for class slots.");
    }
  }
});

timetableSchema.index({ campusId: 1, institutionType: 1, days: 1 });
timetableSchema.index({ campusId: 1, days: 1, teacherId: 1 });
timetableSchema.index({
  campusId: 1,
  days: 1,
  gradeId: 1,
  sectionId: 1,
});
timetableSchema.index({ campusId: 1, targetAudience: 1 });

const Timetable =
  mongoose.models.Timetable || mongoose.model("Timetable", timetableSchema);

export default Timetable;
