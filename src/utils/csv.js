// Shared CSV helpers used by the bulk-import (EmployeeTab) and CSV export
// (EmployeeTab, PayrollTab) flows. Extracted into one module so the parsing
// logic exists in exactly one place and can be unit tested directly, instead
// of being copy-pasted per component.

// Minimal RFC4180-ish CSV parser (handles quoted fields containing commas,
// escaped quotes, and both \n and \r\n line endings).
export const parseCsvText = (text) => {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip — paired \n (if any) closes the row */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => !(r.length === 1 && r[0].trim() === ''));
};

// Quotes a CSV field only when it needs it (contains a comma, quote, or newline).
export const csvEscape = (val) => {
  const s = String(val ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Builds a CSV string from a header row and an array of row arrays.
export const toCsv = (headers, rows) => {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) lines.push(row.map(csvEscape).join(','));
  return lines.join('\n');
};

// Triggers a browser download of a CSV string.
export const downloadCsv = (csvText, filename) => {
  const blob = new Blob([csvText], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
