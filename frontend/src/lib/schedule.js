export const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];
export const minutes = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};
export function timeLabel(time) {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 && hour < 24 ? "PM" : "AM"}`;
}
export const dayLabel = (days) =>
  [...days]
    .sort()
    .map((day) => weekdays[day - 1].slice(0, 3))
    .join(" & ");
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
  return {
    start: Math.min(
      8 * 60,
      ...records.map((item) => Math.floor(minutes(item.startTime) / 60) * 60),
    ),
    end: Math.max(
      17 * 60,
      ...records.map((item) => Math.ceil(minutes(item.endTime) / 60) * 60),
    ),
  };
}
export function dayBlocks(records, day) {
  const sorted = records
    .filter((record) => record.days.includes(day))
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
