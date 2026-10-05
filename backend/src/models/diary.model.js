import mongoose from "mongoose";

const diarySchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    teacherName: {
      type: String,
      trim: true,
      default: "",
    },
    classId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
      default: "Class 10",
    },
    gradeOrClass: {
      type: String,
      trim: true,
      default: "Class 10",
    },
    section: {
      type: String,
      required: true,
      trim: true,
      default: "A",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      default: "General",
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    dateObj: {
      type: Date,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Lecture title or topic is required"],
      trim: true,
    },
    recap: {
      type: String,
      required: [true, "Lecture summary / recap is required"],
      trim: true,
    },
    homework: {
      type: String,
      trim: true,
      default: "",
    },
    resources: {
      type: String,
      trim: true,
      default: "",
    },
    attachments: {
      type: [String],
      default: [],
    },
    publicationStatus: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Published",
    },
  },
  { timestamps: true }
);

diarySchema.index({ campusId: 1, teacherId: 1, date: -1 });
diarySchema.index({ campusId: 1, className: 1, section: 1, date: -1 });
diarySchema.index({ title: "text", recap: "text", homework: "text", subject: "text" });

diarySchema.pre("save", function () {
  if (this.date && !this.dateObj) {
    try {
      this.dateObj = new Date(`${this.date}T00:00:00.000Z`);
    } catch {
      this.dateObj = new Date();
    }
  }
});

const Diary = mongoose.models.Diary || mongoose.model("Diary", diarySchema);

export default Diary;
