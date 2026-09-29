/**
 * Ticket Number Generator
 * Generates unique sequential ticket numbers in format TKT-YYYY-NNNN (e.g. TKT-2026-0001)
 * Uses atomic counter increments per year.
 */
import TicketCounter from "../models/ticketCounter.model.js";

export const generateTicketNumber = async () => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `TKT-${currentYear}-`;

  const counter = await TicketCounter.findOneAndUpdate(
    { year: currentYear },
    { $inc: { lastNumber: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const sequence = counter.lastNumber || 1;
  const paddedNumber = String(sequence).padStart(4, "0");
  return `${yearPrefix}${paddedNumber}`;
};

export default generateTicketNumber;
