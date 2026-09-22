import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["Submitted", "Graded"],
      default: "Submitted",
    },
    score: { type: Number, default: null, min: 0 },
    feedback: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const assignmentSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSchedule",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate: { type: String, default: "" },
    totalMarks: { type: Number, default: null, min: 0 },
    publicationStatus: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Published",
    },
    submissions: [submissionSchema],
  },
  { timestamps: true },
);

const diarySchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSchedule",
      required: true,
      index: true,
    },
    date: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    recap: { type: String, default: "" },
    homework: { type: String, default: "" },
    resources: { type: String, default: "" },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentAssignment",
      default: null,
    },
    publicationStatus: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Published",
    },
  },
  { timestamps: true },
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const conversationSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    participantIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    messages: [messageSchema],
  },
  { timestamps: true },
);
conversationSchema.index({ campusId: 1, participantIds: 1 });

export const StudentAssignment =
  mongoose.models.StudentAssignment ||
  mongoose.model("StudentAssignment", assignmentSchema);
export const StudentDiary =
  mongoose.models.StudentDiary || mongoose.model("StudentDiary", diarySchema);
export const StudentConversation =
  mongoose.models.StudentConversation ||
  mongoose.model("StudentConversation", conversationSchema);
