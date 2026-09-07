export const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const parseDate = (value) => new Date(`${value}T12:00:00`);
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDate(value).getTime()) && dateKey(parseDate(value)) === value;
}
export const longDate = (value) => parseDate(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
