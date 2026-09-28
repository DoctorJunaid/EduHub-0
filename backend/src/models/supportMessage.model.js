/**
 * Support Message Model
 * Threaded replies and internal staff notes for Support Tickets.
 */
import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderSnapshot: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    message: {
      type: String,
      required: [true, "Message content is required"],
      minlength: [1, "Message cannot be empty"],
      maxlength: [5000, "Message cannot exceed 5000 characters"],
      trim: true,
    },
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },
    ],
    isInternal: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

supportMessageSchema.index({ ticketId: 1, createdAt: 1 });

const SupportMessage =
  mongoose.models.SupportMessage ||
  mongoose.model("SupportMessage", supportMessageSchema);

export default SupportMessage;
