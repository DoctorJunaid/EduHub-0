/**
 * Ticket Number Generator
 * Generates unique sequential ticket numbers in format TKT-YYYY-NNNN (e.g. TKT-2026-0001).
 */
import SupportTicket from "../models/supportTicket.model.js";

export const generateTicketNumber = async () => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `TKT-${currentYear}-`;

  // Find the highest ticket number for the current year
  const lastTicket = await SupportTicket.findOne({
    ticketNumber: new RegExp(`^${yearPrefix}`),
  })
    .sort({ ticketNumber: -1 })
    .select("ticketNumber")
    .lean();

  let nextSequence = 1;

  if (lastTicket && lastTicket.ticketNumber) {
    const parts = lastTicket.ticketNumber.split("-");
    if (parts.length === 3) {
      const parsedNum = parseInt(parts[2], 10);
      if (!isNaN(parsedNum)) {
        nextSequence = parsedNum + 1;
      }
    }
  }

  const paddedNumber = String(nextSequence).padStart(4, "0");
  return `${yearPrefix}${paddedNumber}`;
};

export default generateTicketNumber;
