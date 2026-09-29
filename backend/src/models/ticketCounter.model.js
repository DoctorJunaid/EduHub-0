import mongoose from "mongoose";

const ticketCounterSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
    },
    lastNumber: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TicketCounter =
  mongoose.models.TicketCounter ||
  mongoose.model("TicketCounter", ticketCounterSchema);

export default TicketCounter;
