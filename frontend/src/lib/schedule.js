export const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export const minutes = (time) => {
  if (!time || typeof time !== "string") return 0;
  const trimmed = time.trim();
  if (trimmed.includes("T")) {
    const utcTime = new Date(trimmed);
    if (!Number.isNaN(utcTime.getTime())) {
      return utcTime.getUTCHours() * 60 + utcTime.getUTCMinutes();
    }
  }
  const match12 = trimmed.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (match12) {
    let hour = Number(match12[1]) % 12;
    if (match12[3].toUpperCase() === "PM") hour += 12;
    return hour * 60 + Number(match12[2]);
  }
  const match24 = trimmed.match(/^(\d{1,2}):([0-5]\d)/);
  if (match24) {
    return Number(match24[1]) * 60 + Number(match24[2]);
  }
  return 0;
};
export function timeLabel(time) {
  if (!time || typeof time !== "string") return "";
  if (time.includes("T")) {
    const utcTime = new Date(time);
    if (!Number.isNaN(utcTime.getTime())) {
      const hour = utcTime.getUTCHours();
      return `${hour % 12 || 12}:${String(utcTime.getUTCMinutes()).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
    }
  }
  const match12 = time.trim().match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (match12) {
    return `${Number(match12[1])}:${match12[2]} ${match12[3].toUpperCase()}`;
  }
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr || 0);
  if (isNaN(hour)) return time;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 && hour < 24 ? "PM" : "AM"}`;
}
export const dayLabel = (days) => {
  if (!days) return "–";
  const list = Array.isArray(days) ? days : [days];
  if (!list.length) return "–";
  const abbrevs = list
    .slice()
    .sort((a, b) => Number(a) - Number(b))
    .map((day) => {
      if (typeof day === "number" && day >= 1 && day <= weekdays.length) {
        return weekdays[day - 1].slice(0, 3);
      }
      if (typeof day === "string") {
        const idx = weekdays.indexOf(day);
        if (idx !== -1) return weekdays[idx].slice(0, 3);
        const parsed = parseInt(day, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= weekdays.length) {
          return weekdays[parsed - 1].slice(0, 3);
        }
      }
      return null;
    })
    .filter(Boolean);
  if (!abbrevs.length) return "–";
  return abbrevs.join(" & ");
};
export function mondayOf(date) {
  const result = new Date(date);
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}
export function shiftDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
export function filterSchedules(records, filters) {
  return records.filter((record) =>
    Object.entries(filters).every(
      ([key, value]) => !value || record[key] === value,
    ),
  );
}
export function gridRange(records) {
  if (!records.length) return { start: 0, end: 60 };
  return {
    start: Math.min(...records.map((item) => minutes(item.startTime))),
    end: Math.max(...records.map((item) => minutes(item.endTime))),
  };
}
export function dayBlocks(records, day) {
  if (!Array.isArray(records)) return [];
  const sorted = records
    .filter((record) => record && Array.isArray(record.days) && record.days.includes(day))
    .sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
  const lanes = [];
  const blocks = sorted.map((record) => {
    let lane = lanes.findIndex((end) => end <= minutes(record.startTime));
    if (lane === -1) lane = lanes.length;
    lanes[lane] = minutes(record.endTime);
    return { record, lane };
  });
  return blocks.map((block) => ({
    ...block,
    laneCount: Math.max(1, lanes.length),
  }));
}
