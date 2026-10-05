import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "ticket_created",
        "ticket_reply",
        "ticket_assigned",
        "ticket_status",
        "ticket_escalated",
        "ticket_sla",
        "broadcast",
        "system",
        "info",
        "warning",
        "success",
      ],
      default: "info",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical", "info", "warning"],
      default: "info",
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
