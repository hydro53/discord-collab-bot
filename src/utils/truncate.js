function truncateText(text, max = 1024) {
  if (!text) return '';
  const s = String(text);
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

function truncateLines(lines, maxChars = 1024) {
  if (!Array.isArray(lines)) return '';
  let result = '';
  for (const line of lines) {
    const next = result ? result + '\n' + line : line;
    if (next.length > maxChars) break;
    result = next;
  }
  return result || 'None';
}

module.exports = { truncateText, truncateLines };
