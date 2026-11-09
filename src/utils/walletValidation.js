const EVM_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Classifies a raw submitted value. Never throws, never rejects — the
// point is to flag likely-bad data for manager review (per spec: don't
// silently discard, don't auto-declare anything, keep the original).
// Common bad inputs this catches: accidental header rows ("wallet"),
// empty/whitespace-only cells, truncated or typo'd addresses, and values
// that are obviously something else entirely (a Discord username, a URL).
function classifyWalletAddress(raw) {
  const rawInput = raw == null ? '' : String(raw);
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return { normalized: '', chainFamily: null, isValidFormat: false, rawInput };
  }
  if (EVM_PATTERN.test(trimmed)) {
    return { normalized: trimmed, chainFamily: 'evm', isValidFormat: true, rawInput };
  }
  if (SOLANA_PATTERN.test(trimmed)) {
    return { normalized: trimmed, chainFamily: 'solana', isValidFormat: true, rawInput };
  }
  return { normalized: trimmed, chainFamily: null, isValidFormat: false, rawInput };
}

module.exports = { classifyWalletAddress };
