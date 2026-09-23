const TIME_24 = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const TIME_12 = /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i;

/**
 * Parses "08:00", "8:00 AM", etc. into minutes from midnight.
 * @param {string} value
 * @returns {number|null}
 */
export function parseTimeToMinutes(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();

  const match24 = trimmed.match(TIME_24);
  if (match24) {
    return Number(match24[1]) * 60 + Number(match24[2]);
  }

  const match12 = trimmed.match(TIME_12);
  if (match12) {
    let hour = Number(match12[1]) % 12;
    if (match12[3].toUpperCase() === "PM") hour += 12;
    return hour * 60 + Number(match12[2]);
  }

  return null;
}

/**
 * Normalizes stored times to 24h "HH:mm".
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeTimeString(value) {
  const minutes = parseTimeToMinutes(value);
  if (minutes === null || minutes < 0 || minutes >= 24 * 60) return null;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function timesOverlap(startA, endA, startB, endB) {
  const aStart = parseTimeToMinutes(startA);
  const aEnd = parseTimeToMinutes(endA);
  const bStart = parseTimeToMinutes(startB);
  const bEnd = parseTimeToMinutes(endB);
  if ([aStart, aEnd, bStart, bEnd].some((v) => v === null)) return false;
  if (aEnd <= aStart || bEnd <= bStart) return false;
  return aStart < bEnd && bStart < aEnd;
}

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
