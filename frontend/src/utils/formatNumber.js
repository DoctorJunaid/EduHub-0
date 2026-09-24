/**
 * Formats a number with comma separators (e.g. 1440 -> "1,440")
 * @param {number|string} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0";
  }
  return Number(value).toLocaleString("en-US");
}

export default formatNumber;
