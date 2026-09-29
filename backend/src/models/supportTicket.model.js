/**
 * Support Ticket Model
 * Multi-tenant, ticket-based help desk support model for EduHub.
 */
import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      default: null,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBySnapshot: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedToSnapshot: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    category: {
      type: String,
      enum: [
        "Academic",
        "Attendance",
        "Fees & Payments",
        "Library",
        "Transport",
        "Discipline",
        "Payroll",
        "Technical Issue",
        "Platform Bug",
        "Feature Request",
        "Other",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["Urgent", "High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: [
        "Open",
        "In Progress",
        "Resolved",
        "Closed",
        "Escalated",
        "Cancelled",
      ],
      default: "Open",
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      minlength: [5, "Subject must be at least 5 characters"],
      maxlength: [100, "Subject cannot exceed 100 characters"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      trim: true,
    },
    attachments: {
      type: [
        {
          url: { type: String, required: true },
          name: { type: String, default: "" },
          size: { type: Number, default: 0 },
        },
      ],
      validate: [
        (val) => val.length <= 3,
        "Maximum of 3 attachments allowed per ticket",
      ],
      default: [],
    },
    escalationLevel: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
    },
    escalationHistory: [
      {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    firstResponseAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    satisfactionComment: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes declared strictly once without duplication
supportTicketSchema.index({ campusId: 1, status: 1 });
supportTicketSchema.index({ campusId: 1, createdBy: 1 });
supportTicketSchema.index({ campusId: 1, assignedTo: 1 });
supportTicketSchema.index({ lastActivityAt: -1 });

const SupportTicket =
  mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
