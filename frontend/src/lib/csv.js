export function toCsv(headers, rows) {
  const escape = (value) => {
    let text = String(value ?? '');
    // Treat user-entered spreadsheet formulas as text.
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
}
export function downloadCsv(filename, headers, rows) {
  const url = URL.createObjectURL(new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
