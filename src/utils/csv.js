// Small hand-rolled CSV parser (no extra npm dependency). Handles quoted
// fields with embedded commas/quotes, which covers the vast majority of
// CSVs exported from Google Sheets / Excel.

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).map(splitCsvLine);
  return { headers, rows };
}

function findColumnIndex(headers, candidates) {
  for (const candidate of candidates) {
    const idx = headers.indexOf(candidate);
    if (idx !== -1) return idx;
  }
  return -1;
}

module.exports = { parseCsv, findColumnIndex };
