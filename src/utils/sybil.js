const NEW_WALLET_DAYS = parseInt(process.env.SYBIL_NEW_WALLET_DAYS || '7', 10);
const MIN_TX_COUNT = parseInt(process.env.SYBIL_MIN_TX_COUNT || '5', 10);
const CLUSTER_MIN_SIZE = parseInt(process.env.SYBIL_CLUSTER_MIN_SIZE || '3', 10);

// Per-wallet signals only. Never returns "Sybil" as a verdict — always
// specific, reviewable reasons, per the spec's requirement to show *why*.
function individualFlags(signals) {
  const reasons = [];
  if (signals.ageDays !== null && signals.ageDays < NEW_WALLET_DAYS) {
    reasons.push(`Newly active wallet (${signals.ageDays}d old)`);
  }
  if (signals.txCount !== null && signals.txCount < MIN_TX_COUNT) {
    reasons.push(`Low historical activity (${signals.txCount} txs)`);
  }
  return reasons;
}

// Cross-wallet signal: groups wallets in this scan by shared funding source.
// Only flags groups at/above CLUSTER_MIN_SIZE — a shared exchange withdrawal
// address funding 2 wallets isn't unusual, but funding 8+ winners is worth a look.
function buildFundingClusters(walletsWithSignals) {
  const bySource = new Map();
  for (const w of walletsWithSignals) {
    if (!w.signals?.fundingSource) continue;
    const key = w.signals.fundingSource.toLowerCase();
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key).push(w);
  }

  const clusters = [];
  for (const [fundingSource, members] of bySource.entries()) {
    if (members.length >= CLUSTER_MIN_SIZE) clusters.push({ fundingSource, members });
  }
  return clusters;
}

module.exports = { individualFlags, buildFundingClusters, NEW_WALLET_DAYS, MIN_TX_COUNT, CLUSTER_MIN_SIZE };
