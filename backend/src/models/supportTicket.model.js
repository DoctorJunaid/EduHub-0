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
      index: true,
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
      index: true,
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
      index: true,
    },
    assignedToSnapshot: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    category: {
      type: String,
      enum: [
        "Technical Issue",
        "Academic",
        "Attendance",
        "Fees & Payments",
        "Library",
        "Transport",
        "Discipline",
        "Payroll",
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
      index: true,
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
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      trim: true,
    },
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },
    ],
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
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-throughput scoped filtering
supportTicketSchema.index({ campusId: 1, status: 1 });
supportTicketSchema.index({ campusId: 1, createdBy: 1 });
supportTicketSchema.index({ campusId: 1, assignedTo: 1 });
supportTicketSchema.index({ instituteId: 1, status: 1 });
supportTicketSchema.index({ lastActivityAt: -1 });

const SupportTicket =
  mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
