// Caps a list of lines and appends a "+N more" note if truncated. Used
// anywhere we render one line per community/wallet/etc., since campaigns
// in the spec's own examples run to 70+ communities — well past what
// fits safely in a Discord message (2000 chars) or even an embed
// description (4096 chars) once you account for line length.
function truncateLines(lines, max = 40) {
  if (lines.length <= max) return lines.join('\n');
  const shown = lines.slice(0, max).join('\n');
  return `${shown}\n\n...and ${lines.length - max} more.`;
}

// Caps a single block of free text before it goes into a Discord embed
// field (1024 char limit) or message content (2000 char limit). User-typed
// long-form fields (notes, additional info, template content) have no
// length cap at input time, so this is the safety net at display time.
function truncateText(text, max = 1000) {
  if (!text) return text;
  if (text.length <= max) return text;
  return `${text.slice(0, max - 20)}… (truncated)`;
}

module.exports = { truncateLines, truncateText };
